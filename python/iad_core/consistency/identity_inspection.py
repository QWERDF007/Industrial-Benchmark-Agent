import hashlib
import json
from typing import Literal

from pydantic import Field, create_model, field_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.advisory.output_validation import repairable_output_error
from iad_core.consistency.identity_inputs import IdentityInputs
from iad_core.consistency.identity_regions import IdentityRegionCheck, UnmappedRegionCheck
from iad_core.consistency.references import ReferenceAliases
from iad_core.evidence.images import EvidenceImages, PreparedImage, PreparedImageBundle
from iad_core.evidence.retained import RetainedImages
from iad_core.storage.models import sample_uuid
from iad_core.workbench.calls import ModelCalls


class IdentityFinding(AnalysisModel):
    main_description: NonBlankText = Field(description='一句话写出主图此处决定性的可见细节。')
    candidate_description: NonBlankText = Field(description='一句话写候选对应细节；相同时简短说明相同，不复述主图。')
    relation: Literal['transformed_same_content', 'content_different', 'unverified']


class UnmappedFinding(AnalysisModel):
    observation: NonBlankText = Field(description='只描述实际提供的局部及无法对应的原因。')


class IdentityDecision(AnalysisModel):
    overview: IdentityFinding
    summary: NonBlankText = Field(description='两侧共用的一两句判断，以“两图”或“一侧、另一侧”说明差别，不使用主图、候选或左右图称呼。')
    limitations: list[NonBlankText] = Field(default_factory=list,
        description='两侧共用的具体限制，不使用主图、候选或左右图称呼。')

    @field_validator('summary', 'limitations')
    @classmethod
    def shared_perspective(cls, value):
        texts = [value] if isinstance(value, str) else value
        if any(side in text for text in texts for side in ('主图', '候选', '左图', '右图')):
            raise repairable_output_error('identity_shared_perspective',
                '共用说明须用“两图”或“一侧、另一侧”，不能使用主图、候选、左图或右图称呼；保留具体视觉事实。')
        return value

    @property
    def findings(self):
        return [self.overview, *[getattr(self.regions, name) for name in type(self.regions).model_fields
            if isinstance(getattr(self.regions, name), IdentityFinding)]]

    @property
    def relation(self):
        relations = {finding.relation for finding in self.findings}
        return ('content_different' if 'content_different' in relations else
            'unverified' if 'unverified' in relations else 'transformed_same_content')

    @property
    def reason(self):
        return self.summary


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
        regions = [{'window_index': index, 'ref': 'r' + str(index), 'region_pair_id': pair.region_pair_id, 'mapping': pair.mapping,
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
        references = ReferenceAliases({
            **dict(zip(required, ('main_image', 'candidate_image'))),
            **{identity: 'a' + str(index) for index, identity in enumerate(annotation_ids.values())},
            **{pair.region_pair_id: 'r' + str(index) for index, pair in enumerate(frozen.region_pairs)},
            **{media.evidence_id: 'r' + str(index) + '_' + side for index, pair in enumerate(frozen.region_pairs)
                for side, media in (('main', pair.main_media), ('candidate', pair.candidate_media)) if media is not None}})
        wire_bundles = [PreparedImageBundle(references.public[bundle.evidence_id],
            references.translate(bundle.context), bundle.images) for bundle in bundles]
        region_type = create_model('IdentityRegions', __base__=AnalysisModel, **{
            'r' + str(index): (IdentityFinding if pair.mapping == 'registered' else UnmappedFinding, ...)
            for index, pair in enumerate(frozen.region_pairs)})
        response_type = create_model('IdentityDecision', __base__=IdentityDecision, regions=(region_type, ...))
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
                plan = self.client.plan(response_type, prompts['gate_user'], wire_bundles, self.client.resolve_model(),
                    context=references.translate(context), system_prompt=prompts['gate_system'])
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
        relation = ('unverified' if decision.relation != 'content_different' and (
            context['unmapped_regions'] or frozen.geometry.candidate_to_main is None) else decision.relation)
        with self.runtime.db.connection() as connection:
            call_ids = [row[0] for row in connection.execute('''SELECT call_id FROM model_calls WHERE run_id=?
                AND json_extract(summary_json,'$.request_id')=? AND json_extract(summary_json,'$.operation')='generate'
                AND json_extract(summary_json,'$.error') IS NULL ORDER BY rowid''',
                (run_id, 'identity-' + candidate_id + '-' + str(revision) + '-' + request_id))]
        visual_relations = {'transformed_same_content': 'same', 'content_different': 'different', 'unverified': 'unverified'}
        return {'relation': relation, 'reason': decision.reason,
            'limitations': list(dict.fromkeys([*decision.limitations,
                *[pair.limitation for pair in frozen.region_pairs if pair.limitation]])),
            'observation_call_ids': call_ids, 'geometry': frozen.geometry, 'media': list({view.evidence.evidence_id: view.evidence
                for bundle in bundles for view in bundle.images}.values()), 'source': 'vision',
            'region_pairs': frozen.region_pairs,
            'required_region_pair_ids': [pair.region_pair_id for pair in frozen.region_pairs],
            'overview_relation': visual_relations[decision.overview.relation],
            'region_checks': [IdentityRegionCheck(region_pair_id=pair.region_pair_id,
                main_media_id=pair.main_media.evidence_id, candidate_media_id=pair.candidate_media.evidence_id,
                **(finding := getattr(decision.regions, 'r' + str(index))).model_dump(exclude={'relation'}),
                visual_relation=visual_relations[finding.relation])
                for index, pair in enumerate(frozen.region_pairs) if pair.mapping == 'registered'],
            'unmapped_region_checks': [UnmappedRegionCheck(region_pair_id=pair.region_pair_id,
                media_ids=[media.evidence_id for media in (pair.main_media, pair.candidate_media) if media is not None],
                observation=getattr(decision.regions, 'r' + str(index)).observation)
                for index, pair in enumerate(frozen.region_pairs) if pair.mapping != 'registered']}
