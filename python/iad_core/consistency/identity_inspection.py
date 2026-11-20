import hashlib
import json
from dataclasses import dataclass
from collections import defaultdict
from collections.abc import Iterator
from typing import ClassVar, Literal

from pydantic import Field, create_model, field_validator, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.advisory.output_validation import repairable_output_error
from iad_core.consistency.identity_inputs import IdentityInputs, IdentityInputPlan
from iad_core.consistency.identity_regions import IdentityRegionCheck, UnmappedRegionCheck, IdentityDisputeCheck
from iad_core.consistency.identity_disputes import IdentityDispute, IdentityDisputes
from iad_core.consistency.identity_geometry import ImageCorrespondence
import numpy as np
from iad_core.consistency.identity_models import PAIR_REVIEW_BATCH_SIZE, candidate_pair_key
from iad_core.consistency.references import ReferenceAliases
from iad_core.evidence.images import EvidenceImages, PreparedImage, PreparedImageBundle
from iad_core.evidence.retained import RetainedImages
from iad_core.evidence.model_inputs import ModelImageInputs
from iad_core.storage.models import sample_uuid
from iad_core.workbench.calls import ModelCalls


IdentityRelation = Literal['same', 'different', 'unverified']
REGION_RELATIONS: dict[str, IdentityRelation] = {'S': 'same', 'D': 'different', 'U': 'unverified'}


class UnmappedFinding(AnalysisModel):
    observation: NonBlankText = Field(description='只描述实际提供的局部及无法对应的原因。')


class IdentityRegionDetail(AnalysisModel):
    refs: list[NonBlankText] = Field(min_length=1)
    observation: NonBlankText


class DisputeDecision(AnalysisModel):
    ref: NonBlankText
    visual_relation: IdentityRelation
    observation: NonBlankText = Field(description='针对该条争议说明实际对应位置及可见差别，不能只复述原标注局部相同。')


class IdentityDecision(AnalysisModel):
    region_refs: ClassVar[tuple[str, ...]] = ()
    dispute_refs: ClassVar[tuple[str, ...]] = ()
    overview_observation: NonBlankText = Field(description='先独立对照两张完整原图的全部可见内容，包括标注局部以外的位置；依据当前图像的实际内容，记录具体对应或不同之处，不能只复述局部相同。用一两句对称表述可见事实。')
    details: list[IdentityRegionDetail] = Field(default_factory=list,
        description='先记录全部windows中实际可见的形状、线条或纹理，再判断是否相同；S也须有具体对应细节。同一事实只写一次，refs列出适用区域；没有windows时填空列表。')
    unmapped_regions: AnalysisModel
    limitations: list[NonBlankText] = Field(default_factory=list,
        description='两侧共用的具体限制，不使用主图、候选或左右图称呼。')
    disputes: list[DisputeDecision] = Field(default_factory=list,
        description='逐条核对输入disputes中的具体争议，恰好覆盖全部ref。依据实际图像独立判断，不直接采纳争议描述。')
    regions: str = Field(description='根据已记录的局部事实，按输入 windows 顺序逐区填写：S为相同，D为不同，U为无法确认；每区一个字符，不加分隔符。')
    overview: IdentityRelation
    summary: NonBlankText = Field(description='根据全部观察用一句直白中文给判断及决定性依据；有差异写清位置和变化；两侧共用，用“两图”或“一侧、另一侧”。')

    @field_validator('overview_observation', 'summary', 'limitations')
    @classmethod
    def shared_perspective(cls, value):
        texts = [value] if isinstance(value, str) else value
        if any(side in text for text in texts for side in ('主图', '候选', '左图', '右图')):
            raise repairable_output_error('identity_shared_perspective',
                '共用说明须用“两图”或“一侧、另一侧”，不能使用主图、候选、左图或右图称呼；保留具体视觉事实。')
        return value

    @property
    def findings(self):
        return [self.overview, *self.region_relations.values(), *[item.visual_relation for item in self.disputes]]

    @property
    def region_relations(self) -> dict[str, IdentityRelation]:
        return dict(zip(self.region_refs, (REGION_RELATIONS[value] for value in self.regions)))

    @model_validator(mode='after')
    def validate_details(self):
        if len(self.disputes) != len(self.dispute_refs) or {item.ref for item in self.disputes} != set(self.dispute_refs):
            raise repairable_output_error('identity_dispute_coverage', '须逐条回应当前全部内容争议，ref不可遗漏或重复。')
        self.shared_perspective([item.observation for item in self.disputes])
        regions = set(self.region_refs)
        details = self.region_details
        if not set(details) <= regions:
            raise repairable_output_error('identity_unknown_region',
                'details.refs 只能使用 windows 中已配准区域的编号；无法配准的区域仅填 unmapped_regions。'
                + ('当前没有 windows，details 必须为空列表。' if not regions else '允许的编号：' + '、'.join(self.region_refs)))
        missing = [name for name in self.region_refs if name not in details]
        if missing:
            raise repairable_output_error('identity_region_detail',
                '每个局部都须记录实际可见细节，判断相同也要说明哪些形状、线条或纹理对应；不能只重复“相同”：' + '、'.join(missing))
        self.shared_perspective(list(details.values()))
        return self

    @property
    def region_details(self) -> dict[str, str]:
        observations = defaultdict(list)
        for detail in self.details:
            for ref in detail.refs:
                observations[ref].append(detail.observation)
        return {ref: '；'.join(dict.fromkeys(facts)) for ref, facts in observations.items()}

    @property
    def relation(self):
        relations = set(self.findings)
        return ('content_different' if 'different' in relations else
            'unverified' if 'unverified' in relations else 'transformed_same_content')

    @property
    def reason(self):
        return self.summary


@dataclass(frozen=True)
class PreparedIdentityObservation:
    anchor_id: str
    candidate_id: str
    revision: int
    request_id: str
    prompts: dict[str, str]
    frozen: IdentityInputPlan
    context: dict
    bundles: tuple[PreparedImageBundle, ...]
    response_type: type[IdentityDecision]
    fingerprint: str
    references: ReferenceAliases
    disputes: tuple[IdentityDispute, ...]

    @property
    def pair_key(self) -> str:
        return candidate_pair_key(self.anchor_id, self.candidate_id)

    def record(self, decision: IdentityDecision, call_ids: list[str]) -> dict:
        details = decision.region_details
        dispute_decisions = {item.ref: item for item in decision.disputes}
        relation = ('unverified' if decision.relation != 'content_different' and (
            self.context['unmapped_regions'] or self.frozen.geometry.candidate_to_main is None) else decision.relation)
        return {'relation': relation, 'reason': decision.reason,
            'limitations': list(dict.fromkeys([*decision.limitations,
                *[pair.limitation for pair in self.frozen.region_pairs if pair.limitation]])),
            'observation_call_ids': call_ids, 'geometry': self.frozen.geometry, 'media': list({view.evidence.evidence_id: view.evidence
                for bundle in self.bundles for view in bundle.images}.values()), 'source': 'vision',
            'region_pairs': self.frozen.region_pairs,
            'required_region_pair_ids': [pair.region_pair_id for pair in self.frozen.region_pairs],
            'overview_observation': decision.overview_observation,
            'overview_relation': decision.overview,
            'dispute_checks': [IdentityDisputeCheck(observation_id=dispute.observation_id,
                visual_relation=dispute_decisions['d'+str(index)].visual_relation,
                observation=dispute_decisions['d'+str(index)].observation,
                media_ids=self.references.translate(self.context['disputes'][index]['media_ids'], internal=True))
                for index, dispute in enumerate(self.disputes)],
            'region_checks': [IdentityRegionCheck(region_pair_id=pair.region_pair_id,
                main_media_id=pair.main_media.evidence_id, candidate_media_id=pair.candidate_media.evidence_id,
                observation=details.get('r' + str(index)),
                visual_relation=decision.region_relations['r' + str(index)])
                for index, pair in enumerate(self.frozen.region_pairs) if pair.mapping == 'registered'],
            'unmapped_region_checks': [UnmappedRegionCheck(region_pair_id=pair.region_pair_id,
                media_ids=[media.evidence_id for media in (pair.main_media, pair.candidate_media) if media is not None],
                observation=getattr(decision.unmapped_regions, 'r' + str(index)).observation)
                for index, pair in enumerate(self.frozen.region_pairs) if pair.mapping != 'registered']}


class IdentityInspection:
    def __init__(self, runtime, client):
        self.runtime, self.client = runtime, client
        self._response_types: dict[tuple[tuple[bool, ...], int], type[IdentityDecision]] = {}

    def prepare(self, run_id, anchor_id, candidate_id, sources, checkpoint, *, prompts, revision=0, request_id='verify'):

        retained, images = RetainedImages(self.runtime.db), EvidenceImages(self.runtime.db.db_path)
        samples = [source.sample.model_copy(update={'sample_id': sample_uuid(source.sample.sample_id),
            'image_path': retained.path(source.image), 'relative_path': 'main' if index == 0 else 'candidate'})
            for index, source in enumerate(sources)]
        frozen = IdentityInputs(self.runtime.db).freeze(run_id, anchor_id, candidate_id, sources, prompts)
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
                'annotation_type', 'raw_label', 'bbox', 'polygon', 'is_ignored'}), 'annotation_id': annotation_ids[annotation.annotation_id]}
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
        from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
        max_side = ConsistencyAgentJobs(self.runtime).snapshot(run_id).whole_image_max_side
        dispute_inputs = IdentityDisputes(self.runtime.db)
        disputes = dispute_inputs.read(run_id, anchor_id, candidate_id)
        disputes = dispute_inputs.locate(run_id, anchor_id, candidate_id, disputes, roots, self.client, checkpoint,
            revision=revision, request_id=request_id, max_side=max_side)
        extra_media = {}
        correspondence = ImageCorrespondence(np.asarray(frozen.geometry.candidate_to_main)
            if frozen.geometry.candidate_to_main is not None else None, frozen.geometry)
        if disputes:
            context['disputes'] = []
            context['dispute_instruction'] = ('逐条核对争议实际位置及对应图证。reason中主图指source_side，候选指另一侧。'
                '依据实际像素独立判断，在disputes中回应每条ref；争议说明本身不证明两图不同。')
        for index, dispute in enumerate(disputes):
            media_ids = list(required)
            dispute_inputs.validate_windows(dispute.windows,
                {anchor_id: roots[0].evidence.original_size, candidate_id: roots[1].evidence.original_size})
            for window in dispute.windows:
                side = 0 if window.sample_id == anchor_id else 1
                width, height = roots[side].evidence.original_size
                x1, y1, x2, y2 = window.bbox
                box = [max(0, x1-window.padding), max(0, y1-window.padding),
                    min(width, x2+window.padding), min(height, y2+window.padding)]
                windows = [(side, box)]
                if correspondence.matrix is not None:
                    mapped = correspondence.map_bounds(box, roots[side].evidence.original_size,
                        roots[1-side].evidence.original_size, to_main=side == 1)
                    if mapped[0] < mapped[2] and mapped[1] < mapped[3]:
                        windows.append((1-side, mapped))
                for position, bounds in windows:
                    view = images.capture(samples[position], 'roi', 'coverage', bounds, full_resolution=True)
                    media_ids.append(view.evidence.evidence_id)
                    if view.evidence.evidence_id not in extra_media:
                        extra_media[view.evidence.evidence_id] = 'dispute_image_'+str(len(extra_media))
                        bundles.append(PreparedImageBundle(roots[position].evidence.evidence_id,
                            {'side': ('main', 'candidate')[position], 'dispute_ref': 'd'+str(index),
                                'original_size': roots[position].evidence.original_size}, (view,)))
            context['disputes'].append({'ref': 'd'+str(index), 'source_side':
                'main' if dispute.anchor_id == anchor_id else 'candidate', 'reason': dispute.reason,
                'region_pair_ids': dispute.region_pair_ids, 'windows': [window.model_dump(mode='json') for window in dispute.windows],
                'media_ids': list(dict.fromkeys(media_ids))})
        references = ReferenceAliases({
            anchor_id: 'main', candidate_id: 'candidate', **extra_media,
            **dict(zip(required, ('main_image', 'candidate_image'))),
            **{identity: 'a' + str(index) for index, identity in enumerate(annotation_ids.values())},
            **{pair.region_pair_id: 'r' + str(index) for index, pair in enumerate(frozen.region_pairs)},
            **{media.evidence_id: 'r' + str(index) + '_' + side for index, pair in enumerate(frozen.region_pairs)
                for side, media in (('main', pair.main_media), ('candidate', pair.candidate_media)) if media is not None}})
        model_inputs = ModelImageInputs(self.runtime.db.db_path)
        wire_bundles = []
        for bundle in bundles:
            views = bundle.images
            if max_side is not None:
                side = 0 if bundle.context['side']=='main' else 1
                annotations = [annotation.model_copy(update={
                    'annotation_id':references.public[annotation_ids[annotation.annotation_id]]})
                    for annotation in sources[side].annotations.annotations]
                views = tuple(view.with_source(samples[side],sources[side].annotations.dataset_format,annotations
                    ).for_model(model_inputs,max_side) for view in views)
            wire_bundles.extend(PreparedImageBundle(references.public[view.evidence.evidence_id],
                references.translate(bundle.context), (view,)) for view in views)
        wire_bundles = list({bundle.evidence_id: bundle for bundle in wire_bundles}.values())
        layout = tuple(pair.mapping == 'registered' for pair in frozen.region_pairs)
        schema_key = (layout, len(disputes))
        if schema_key not in self._response_types:
            dispute_refs = tuple('d'+str(index) for index in range(len(disputes)))
            dispute_type = create_model('DisputeDecision', __base__=DisputeDecision,
                ref=(Literal[dispute_refs], ...)) if disputes else DisputeDecision
            unmapped_type = create_model('UnmappedRegions', __base__=AnalysisModel, **{
                'r' + str(index): (UnmappedFinding, ...) for index, registered in enumerate(layout)
                if not registered})
            detail_refs = tuple('r'+str(index) for index, registered in enumerate(layout) if registered)
            detail_type = create_model('IdentityRegionDetail', __base__=IdentityRegionDetail,
                refs=(list[Literal[detail_refs]], Field(min_length=1))) if detail_refs else IdentityRegionDetail
            response_type = create_model('IdentityDecision', __base__=IdentityDecision,
                regions=(str, Field(min_length=len(detail_refs), max_length=len(detail_refs),
                    pattern='^[' + ''.join(REGION_RELATIONS) + ']{' + str(len(detail_refs)) + '}$',
                    description=IdentityDecision.model_fields['regions'].description)),
                unmapped_regions=(unmapped_type, ...),
                details=(list[detail_type], Field(default_factory=list, max_length=None if detail_refs else 0,
                    description=IdentityDecision.model_fields['details'].description)),
                disputes=(list[dispute_type], Field(default_factory=list, min_length=len(disputes), max_length=len(disputes),
                    description=IdentityDecision.model_fields['disputes'].description)))
            response_type.region_refs = detail_refs
            response_type.dispute_refs = dispute_refs
            self._response_types[schema_key] = response_type
        response_type = self._response_types[schema_key]
        fingerprint = hashlib.sha256(json.dumps([prompts, context,
            [view.evidence.model_dump(mode='json') for bundle in bundles for view in bundle.images]], sort_keys=True).encode()).hexdigest()
        if max_side is not None:
            fingerprint = hashlib.sha256(json.dumps([fingerprint,max_side,
                [(view.model_context(),view.model_input.model_dump(exclude={'path'}))
                    for bundle in wire_bundles for view in bundle.images]],sort_keys=True).encode()).hexdigest()
        return PreparedIdentityObservation(anchor_id, candidate_id, revision, request_id, prompts, frozen,
            references.translate(context), tuple(wire_bundles), response_type, fingerprint, references, tuple(disputes))

    def run(self, run_id: str, prepared: list[PreparedIdentityObservation], checkpoint) -> Iterator[tuple[PreparedIdentityObservation, dict]]:
        if not prepared or len(prepared) > PAIR_REVIEW_BATCH_SIZE:
            raise ValueError(f'内容核对每个请求处理一至{PAIR_REVIEW_BATCH_SIZE}对图像')
        results, pending = {}, []
        with self.runtime.db.connection() as connection:
            for item in prepared:
                saved = connection.execute("""SELECT fingerprint,record_json,call_ids_json FROM consistency_gate_observations
                    WHERE job_id=? AND anchor_id=? AND candidate_id=? AND gate_revision=? AND request_id=? AND page_index=0""",
                    (run_id, item.anchor_id, item.candidate_id, item.revision, item.request_id)).fetchone()
                if saved:
                    if saved['fingerprint'] != item.fingerprint:
                        raise ValueError('候选验证与已保存的完整图组输入不一致')
                    results[item.pair_key] = item.record(item.response_type.model_validate_json(saved['record_json']),
                        json.loads(saved['call_ids_json']))
                else:
                    pending.append(item)
        for item in prepared:
            if item.pair_key in results:
                yield item, results[item.pair_key]
        for item, decision, call_ids in self.generate(run_id, pending, checkpoint) if pending else []:
            checkpoint()
            with self.runtime.db.connection() as connection:
                connection.execute("""INSERT INTO consistency_gate_observations(
                    job_id,anchor_id,candidate_id,gate_revision,request_id,page_index,fingerprint,record_json,call_ids_json)
                    VALUES(?,?,?,?,?,0,?,?,?) ON CONFLICT DO NOTHING""",
                    (run_id, item.anchor_id, item.candidate_id, item.revision, item.request_id,
                        item.fingerprint, decision.model_dump_json(), json.dumps(call_ids)))
            yield item, item.record(decision, call_ids)

    def generate(self, run_id: str, prepared: list[PreparedIdentityObservation], checkpoint):
        for item in prepared:
            checkpoint()
            request_id = 'identity-' + hashlib.sha256(json.dumps([
                (item.anchor_id, item.candidate_id, item.revision, item.request_id, item.fingerprint)]).encode()).hexdigest()
            with ModelCalls(self.runtime.db).bind(run_id, checkpoint, role='vision',
                    request_id=request_id, sample_id=item.anchor_id, pair_keys=[item.pair_key]):
                plan = self.client.plan(item.response_type, item.prompts['gate_user'], list(item.bundles),
                    self.client.resolve_model(), context=item.context, system_prompt=item.prompts['gate_system'])
                decision = self.client.generate(plan)
            with self.runtime.db.connection() as connection:
                call_ids = [row[0] for row in connection.execute("""SELECT call_id FROM model_calls WHERE run_id=?
                    AND json_extract(summary_json,'$.request_id')=? AND json_extract(summary_json,'$.operation')='generate'
                    AND json_extract(summary_json,'$.error') IS NULL ORDER BY rowid""", (run_id, request_id))]
            yield item, decision, call_ids
