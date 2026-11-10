import hashlib
import json
from typing import Literal

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.advisory.output_validation import repairable_output_error
from iad_core.consistency.identity_inputs import IdentityInputs
from iad_core.consistency.identity_regions import IdentityRegionCheck
from iad_core.evidence.images import EvidenceImages, PreparedImage, PreparedImageBundle
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
    region_pair_id: str
    main_media_id: str
    candidate_media_id: str


class IdentityDecision(AnalysisModel):
    overview: IdentityFinding
    windows: list[IdentityWindowFinding] = Field(default_factory=list)
    media_ids: list[str] = Field(min_length=2, max_length=2)
    limitations: list[NonBlankText] = Field(default_factory=list)

    @property
    def findings(self):
        return [self.overview, *self.windows]

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

    def inspect(self, run_id, anchor_id, candidate_id, sources, checkpoint, *, prompts, revision=0, request_id='verify'):
        retained, images = RetainedImages(self.runtime.db), EvidenceImages(self.runtime.db.db_path)
        samples = [source.sample.model_copy(update={'sample_id': sample_uuid(source.sample.sample_id),
            'image_path': retained.path(source.image), 'relative_path': 'main' if index == 0 else 'candidate'})
            for index, source in enumerate(sources)]
        frozen = IdentityInputs(self.runtime.db).freeze(run_id, anchor_id, candidate_id, sources, samples, prompts)
        roots = [images.capture(sample, 'overview', 'coverage', full_resolution=True) for sample in samples]
        required = [root.evidence.evidence_id for root in roots]
        annotation_ids = {annotation.annotation_id: 'ann_' + hashlib.sha256(annotation.annotation_id.encode()).hexdigest()
            for source in sources for annotation in source.annotations.annotations}
        regions = [{'window_index': index, 'region_pair_id': pair.region_pair_id, 'mapping': pair.mapping,
            'source_annotations': [{**origin.model_dump(mode='json'), 'annotation_id': annotation_ids[origin.annotation_id]}
                for origin in pair.source_annotations],
            'main_window': pair.main_window, 'candidate_window': pair.candidate_window,
            'main_media_id': pair.main_media.evidence_id if pair.main_media else None,
            'candidate_media_id': pair.candidate_media.evidence_id if pair.candidate_media else None,
            'limitation': pair.limitation} for index, pair in enumerate(frozen.region_pairs)]
        context = {'scope': 'joint', 'required_image_ids': required,
            'geometry': frozen.geometry.model_dump(mode='json', exclude_none=True),
            'annotations': {side: [{**annotation.model_dump(mode='json', include={
                'annotation_type', 'raw_label', 'bbox', 'is_ignored'}), 'annotation_id': annotation_ids[annotation.annotation_id]}
                for annotation in source.annotations.annotations] for side, source in zip(('main', 'candidate'), sources)},
            'required_region_pair_ids': [pair.region_pair_id for pair in frozen.region_pairs],
            'windows': [region for region in regions if region['mapping'] == 'registered'],
            'unmapped_regions': [region for region in regions if region['mapping'] != 'registered'],
            'examples': prompts['gate_examples']}
        if sources[0].annotations.dataset_format != 'labelme':
            context.pop('annotations')
        bundles = [PreparedImageBundle(root.evidence.evidence_id,
            {'side': side, 'original_size': [sample.width, sample.height]}, (root,))
            for side, sample, root in zip(('main', 'candidate'), samples, roots)]
        for index, pair in enumerate(frozen.region_pairs):
            for side, media in enumerate((pair.main_media, pair.candidate_media)):
                if media is not None:
                    bundles.append(PreparedImageBundle(roots[side].evidence.evidence_id,
                        {'side': ('main', 'candidate')[side], 'window_index': index, 'region_pair_id': pair.region_pair_id,
                            'original_size': [samples[side].width, samples[side].height]},
                        (PreparedImage(media, images.path(media)),)))
        expected_indices = [region['window_index'] for region in context['windows']]

        @model_validator(mode='after')
        def validate_decision(value):
            if len(set(value.media_ids)) != 2 or set(value.media_ids) != set(required):
                raise repairable_output_error('identity_media', '必须引用本次实际发送的两侧原图身份各一次。')
            if sorted(finding.window_index for finding in value.windows) != expected_indices:
                raise repairable_output_error('identity_windows', '必须在同一回答中报告全部实际成对局部的观察，不得因整图已发现不同而遗漏局部。')
            for finding in value.windows:
                pair = frozen.region_pairs[finding.window_index]
                if (finding.region_pair_id != pair.region_pair_id or finding.main_media_id != pair.main_media.evidence_id
                        or finding.candidate_media_id != pair.candidate_media.evidence_id):
                    raise repairable_output_error('identity_region_media', '必须引用当前区域对及实际送达的双侧局部媒体。')
            if value.relation == 'transformed_same_content' and frozen.geometry.candidate_to_main is None:
                raise repairable_output_error('identity_geometry', '没有可信几何映射，不得声称变换后同内容；证据不足时返回unverified。')
            return value

        response_type = type('IdentityDecision', (IdentityDecision,), {'validate_decision': validate_decision})
        fingerprint = hashlib.sha256(json.dumps([prompts, context,
            [view.evidence.model_dump(mode='json') for bundle in bundles for view in bundle.images]], sort_keys=True).encode()).hexdigest()
        checkpoint()
        with self.runtime.db.connection() as connection:
            saved = connection.execute('''SELECT fingerprint,record_json FROM consistency_gate_observations
                WHERE job_id=? AND anchor_id=? AND candidate_id=? AND gate_revision=? AND request_id=? AND page_index=0''',
                (run_id, anchor_id, candidate_id, revision, request_id)).fetchone()
        if saved:
            if saved['fingerprint'] != fingerprint:
                raise ValueError('候选验证与已冻结的完整图组输入不一致')
            decision = response_type.model_validate_json(saved['record_json'])
        else:
            with ModelCalls(self.runtime.db).bind(run_id, checkpoint, role='vision',
                    request_id='identity-' + candidate_id + '-' + str(revision) + '-' + request_id, sample_id=anchor_id):
                plan = self.client.plan(response_type, prompts['gate_user'], bundles, self.client.resolve_model(),
                    context=context, system_prompt=prompts['gate_system'])
                decision = self.client.generate(plan)
            checkpoint()
            with self.runtime.db.connection() as connection:
                connection.execute('''INSERT INTO consistency_gate_observations(
                    job_id,anchor_id,candidate_id,gate_revision,request_id,page_index,fingerprint,record_json)
                    VALUES(?,?,?,?,?,0,?,?) ON CONFLICT DO NOTHING''',
                    (run_id, anchor_id, candidate_id, revision, request_id, fingerprint, decision.model_dump_json()))
                decision = response_type.model_validate_json(connection.execute('''SELECT record_json FROM consistency_gate_observations
                    WHERE job_id=? AND anchor_id=? AND candidate_id=? AND gate_revision=? AND request_id=? AND page_index=0''',
                    (run_id, anchor_id, candidate_id, revision, request_id)).fetchone()[0])
        relation = ('unverified' if decision.relation != 'content_different' and context['unmapped_regions'] else decision.relation)
        visual_relations = {'transformed_same_content': 'same', 'content_different': 'different', 'unverified': 'unverified'}
        return {'relation': relation, 'reason': decision.reason,
            'limitations': list(dict.fromkeys([*decision.limitations,
                *[pair.limitation for pair in frozen.region_pairs if pair.limitation]])),
            'geometry': frozen.geometry, 'media': list({view.evidence.evidence_id: view.evidence
                for bundle in bundles for view in bundle.images}.values()), 'source': 'vision',
            'region_pairs': frozen.region_pairs,
            'required_region_pair_ids': [pair.region_pair_id for pair in frozen.region_pairs],
            'overview_relation': visual_relations[decision.overview.relation],
            'region_checks': [IdentityRegionCheck(**finding.model_dump(exclude={'window_index', 'relation'}),
                visual_relation=visual_relations[finding.relation]) for finding in decision.windows]}
