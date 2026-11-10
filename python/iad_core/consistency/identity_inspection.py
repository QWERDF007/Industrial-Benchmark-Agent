import hashlib
import json
from typing import Literal

import numpy as np
from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.advisory.output_validation import repairable_output_error
from iad_core.consistency.identity_geometry import ImageCorrespondence
from iad_core.consistency.identity_inputs import IdentityInputs, IdentityInputPage
from iad_core.evidence.images import EvidenceImages, PreparedImageBundle
from iad_core.evidence.retained import RetainedImages
from iad_core.storage.models import sample_uuid
from iad_core.workbench.calls import ModelCalls


class IdentityFinding(AnalysisModel):
    main_description: NonBlankText
    candidate_description: NonBlankText
    relation: Literal['transformed_same_content', 'content_different', 'unverified']
    reason: NonBlankText


class IdentityWindowFinding(IdentityFinding):
    window_index: int = Field(ge=0)


class IdentityDecision(AnalysisModel):
    overview: IdentityFinding | None = None
    windows: list[IdentityWindowFinding] = Field(default_factory=list)
    media_ids: list[str] = Field(min_length=2, max_length=2)
    limitations: list[NonBlankText] = Field(default_factory=list)

    @property
    def findings(self):
        return [*([self.overview] if self.overview else []), *self.windows]

    @property
    def relation(self):
        relations = {finding.relation for finding in self.findings}
        return ('content_different' if 'content_different' in relations else
            'unverified' if 'unverified' in relations else 'transformed_same_content')

    @property
    def reason(self):
        return '\n'.join(dict.fromkeys(finding.reason for finding in self.findings))


class IdentityInspection:
    def __init__(self, runtime, client):
        self.runtime, self.client = runtime, client

    def inspect(self, run_id, anchor_id, candidate_id, sources, checkpoint, *, prompts, step=False):
        retained, images = RetainedImages(self.runtime.db), EvidenceImages(self.runtime.db.db_path)
        samples = [source.sample.model_copy(update={'sample_id': sample_uuid(source.sample.sample_id),
            'image_path': retained.path(source.image), 'relative_path': 'main' if index == 0 else 'candidate'})
            for index, source in enumerate(sources)]
        frozen = IdentityInputs(self.runtime.db).freeze(run_id, anchor_id, candidate_id, sources, samples, prompts)
        geometry = ImageCorrespondence(np.asarray(frozen.geometry.candidate_to_main) if frozen.geometry.candidate_to_main else None,
            frozen.geometry)
        geometry_facts = geometry.facts.model_dump(mode='json', exclude_none=True)
        roots = [images.capture(sample, 'overview', 'coverage', max_side=1280) for sample in samples]
        required = [root.evidence.evidence_id for root in roots]

        def prepare(page):
            indices = page.windows
            bundles = [PreparedImageBundle(root.evidence.evidence_id,
                {'side': side, 'original_size': [sample.width, sample.height]}, (root,))
                for side, sample, root in zip(('main', 'candidate'), samples, roots)] if page.scope == 'overview' else []
            for index in indices:
                for side, box in enumerate(frozen.windows[index]):
                    views = []
                    for tile in images.tiles(samples[side], box, 0):
                        views.append(images.capture(samples[side], 'roi', 'coverage', tile, min_side=224))
                    bundles.append(PreparedImageBundle(roots[side].evidence.evidence_id,
                        {'side': ('main', 'candidate')[side], 'window_index': index,
                            'original_size': [samples[side].width, samples[side].height],
                            'rendering': 'nearest_neighbor_integer_magnification_when_small'}, tuple(views)))
            context = {'scope': page.scope, 'required_image_ids': required, 'geometry': geometry_facts,
                'windows': [{'window_index': index, 'main_window': frozen.windows[index][0],
                    'candidate_window': frozen.windows[index][1]} for index in indices],
                'window_mapping': 'registered' if geometry.matrix is not None else 'relative_attention_only',
                'examples': prompts['gate_examples']}

            @model_validator(mode='after')
            def validate_decision(value):
                if len(set(value.media_ids)) != 2 or set(value.media_ids) != set(required):
                    raise repairable_output_error('identity_media', '必须引用本次实际发送的两侧原图身份各一次。')
                if sorted(finding.window_index for finding in value.windows) != sorted(indices):
                    raise repairable_output_error('identity_windows', '必须对本页全部实际局部窗口各报告一次观察，不得遗漏或重复。')
                if (value.overview is not None) != (page.scope == 'overview'):
                    raise repairable_output_error('identity_scope', '整图页只报告overview，局部页只报告windows；局部页没有发送整图，不得推断全局。')
                if value.relation == 'transformed_same_content' and geometry.matrix is None:
                    raise repairable_output_error('identity_geometry', '没有可信几何映射，不得声称变换后同内容；证据不足时返回unverified。')
                return value

            response_type = type('IdentityDecision', (IdentityDecision,), {'validate_decision': validate_decision})
            return response_type, context, bundles

        plans = {}
        if frozen.pages is None:
            local_indices = sorted(range(len(frozen.windows)), key=lambda index:
                max((box[2] - box[0]) * (box[3] - box[1]) for box in frozen.windows[index]))
            pages = [IdentityInputPage(scope='overview', windows=[]),
                *[IdentityInputPage(scope='local', windows=[index]) for index in local_indices]]
            for index, page in enumerate(pages):
                checkpoint()
                response_type, context, bundles = prepare(page)
                with ModelCalls(self.runtime.db).bind(run_id, checkpoint, role='vision',
                        request_id='identity-plan-' + candidate_id, sample_id=anchor_id):
                    plans[index] = self.client.plan(response_type, prompts['gate_user'], bundles, self.client.resolve_model(),
                        context=context, system_prompt=prompts['gate_system'])
            frozen.pages = pages
            with self.runtime.db.connection() as connection:
                connection.execute('UPDATE consistency_identity_inputs SET plan_json=? WHERE job_id=? AND anchor_id=? AND candidate_id=?',
                    (frozen.model_dump_json(), run_id, anchor_id, candidate_id))
        decisions, delivered = [], {root.evidence.evidence_id: root.evidence for root in roots}
        generated = False
        for index, page in enumerate(frozen.pages):
            checkpoint()
            response_type, context, bundles = prepare(page)
            request_id = 'identity-' + candidate_id + '-' + str(index)
            fingerprint = hashlib.sha256(json.dumps([prompts, context,
                [view.evidence.model_dump(mode='json') for bundle in bundles for view in bundle.images]], sort_keys=True).encode()).hexdigest()
            with self.runtime.db.connection() as connection:
                saved = connection.execute('''SELECT fingerprint,record_json FROM consistency_identity_views
                    WHERE job_id=? AND anchor_id=? AND candidate_id=? AND page_index=?''',
                    (run_id, anchor_id, candidate_id, index)).fetchone()
            if saved:
                if saved['fingerprint'] != fingerprint:
                    raise ValueError('候选验证页与已冻结的实际输入不一致')
                decision = response_type.model_validate_json(saved['record_json'])
            else:
                if step and generated:
                    return None
                with ModelCalls(self.runtime.db).bind(run_id, checkpoint, role='vision', request_id=request_id, sample_id=anchor_id):
                    plan = plans.get(index) or self.client.plan(response_type, prompts['gate_user'], bundles, self.client.resolve_model(),
                        context=context, system_prompt=prompts['gate_system'])
                    decision = self.client.generate(plan)
                checkpoint()
                with self.runtime.db.connection() as connection:
                    connection.execute('''INSERT INTO consistency_identity_views(job_id,anchor_id,candidate_id,page_index,fingerprint,record_json)
                        VALUES(?,?,?,?,?,?)''', (run_id, anchor_id, candidate_id, index, fingerprint, decision.model_dump_json()))
                generated = True
            decisions.append(decision)
            for bundle in bundles:
                delivered.update({view.evidence.evidence_id: view.evidence for view in bundle.images})
            if decision.relation == 'content_different':
                break
        relations = {decision.relation for decision in decisions}
        relation = ('content_different' if 'content_different' in relations else
            'unverified' if 'unverified' in relations else 'transformed_same_content')
        return {'relation': relation, 'reason': '\n'.join(dict.fromkeys(value.reason for value in decisions)),
            'limitations': list(dict.fromkeys(text for value in decisions for text in value.limitations)),
            'geometry': geometry.facts, 'media': list(delivered.values())}
