import json
import numpy as np
from dataclasses import dataclass
from typing import TYPE_CHECKING

from pydantic import model_validator

from iad_core.advisory.output_validation import repairable_output_error
from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.identity_geometry import ImageCorrespondence
from iad_core.consistency.position import PositionComparison
from iad_core.consistency.agent_review_models import AnchorVisualRequest, AnchorVisualResult, AnchorVisualStart
from iad_core.consistency.group_analysis_inputs import GroupAnalysisInputs
from iad_core.evidence.images import PreparedImageBundle
from iad_core.workbench.vision import GenerationRequest, VlmClient

if TYPE_CHECKING:
    from iad_core.workbench.runtime import WorkbenchRuntime


@dataclass(frozen=True)
class AnchorVisualInput:
    request: AnchorVisualRequest
    prompt: str
    context: dict
    images: list[PreparedImageBundle]
    response_type: type[AnchorVisualResult]
    system_prompt: str | None

    @classmethod
    def prepare(cls, runtime: 'WorkbenchRuntime', run_id: str, anchor_id: str, request: AnchorVisualStart, checkpoint) -> 'AnchorVisualInput':
        prepared = ConsistencyAgentEvidence(runtime).prepare(run_id, anchor_id, request.candidate_ids,
            checkpoint=checkpoint)
        snapshot = ConsistencyAgentJobs(runtime).snapshot(run_id)
        from iad_core.consistency.identity import CandidateIdentity
        gates = {gate.candidate_id: gate for gate in CandidateIdentity(runtime).read(run_id, anchor_id).gates}
        for identity, candidate in prepared.facts['candidates'].items():
            gate = gates[identity]
            candidate['identity'] = {'relation': gate.relation,
                'geometry': gate.geometry.model_dump(mode='json', exclude_none=True) if gate.geometry else None}
            candidate['gate'] = {'status':'eligible', 'revision':gate.revision,
                'verified_region_pair_ids':[check.region_pair_id for check in gate.region_checks if check.visual_relation == 'same']}
            matrix = np.eye(3) if gate.relation == 'pixel_identical' else np.asarray(gate.geometry.candidate_to_main)
            mapping = ImageCorrespondence(matrix, gate.geometry)
            source = next(source for source in prepared.facts['sources'].values() if source['sample_id'] == identity)
            candidate['mapped_annotations'] = {annotation['annotation_id']: mapping.project(annotation['bbox']).tolist()
                for annotation in source['annotations'] if annotation.get('bbox')}
            main_source = next(source for source in prepared.facts['sources'].values() if source['sample_id'] == anchor_id)
            main_boxes = {annotation['annotation_id']:annotation['bbox'] for annotation in main_source['annotations'] if annotation.get('bbox')}
            mapped = {identity:[min(point[0] for point in points),min(point[1] for point in points),
                max(point[0] for point in points),max(point[1] for point in points)]
                for identity,points in candidate['mapped_annotations'].items()}
            candidate['position_policy'] = snapshot.position_tolerance.model_dump(mode='json')
            candidate['position_comparisons'] = [item.model_dump(mode='json') for item in PositionComparison.compare_annotations(
                main_boxes,mapped,policy=snapshot.position_tolerance,
                uncertainty_px=0 if gate.relation == 'pixel_identical' else gate.geometry.reprojection_error_px)]
        for source in prepared.facts['sources'].values():
            source.pop('quality_status', None)
            source.pop('quality_source', None)
            source['annotation_geometry'] = {annotation['annotation_id']: {
                'width': annotation['bbox'][2] - annotation['bbox'][0],
                'height': annotation['bbox'][3] - annotation['bbox'][1],
                'area': (annotation['bbox'][2] - annotation['bbox'][0]) * (annotation['bbox'][3] - annotation['bbox'][1]),
                'center': [(annotation['bbox'][0] + annotation['bbox'][2]) / 2, (annotation['bbox'][1] + annotation['bbox'][3]) / 2],
                'visible_bbox': [max(0, annotation['bbox'][0]), max(0, annotation['bbox'][1]),
                    min(source['original_size'][0], annotation['bbox'][2]), min(source['original_size'][1], annotation['bbox'][3])],
                'out_of_frame': annotation['bbox'][0] < 0 or annotation['bbox'][1] < 0
                    or annotation['bbox'][2] > source['original_size'][0] or annotation['bbox'][3] > source['original_size'][1]}
                for annotation in source['annotations'] if annotation.get('bbox')}
        views = {image.evidence.evidence_id: image for image in prepared.images}
        bundles = []
        references = {}
        for source in prepared.facts['sources'].values():
            images = tuple(views[identity] for identity in dict.fromkeys(view['evidence_id'] for view in source['visual_inputs']))
            original = next(image for image in images if image.evidence.is_whole_image)
            references[source['sample_id']] = original.evidence.evidence_id
            for view in source['visual_inputs']:
                del view['evidence_id']
            source['evidence_id'] = original.evidence.evidence_id
            bundles.append(PreparedImageBundle(original.evidence.evidence_id, source, images))
        required = {identity: {references[anchor_id], references[identity]} for identity in request.candidate_ids}
        prepared.facts['required_image_ids'] = {identity: sorted(identities) for identity, identities in required.items()}
        prompt = snapshot.instruction
        context = {'facts': prepared.facts}
        if request.question != prompt:
            context['question'] = request.question
        sent_images = [image for bundle in bundles for image in bundle.images]
        captured = AnchorVisualRequest(**request.model_dump(), anchor_id=anchor_id, facts=prepared.facts,
            media=[image.evidence for image in sent_images], input_fingerprint=GroupAnalysisInputs.input_fingerprint(json.dumps(
                {'instruction': prompt, 'context': context, **({'system_prompt':snapshot.system_prompt} if snapshot.system_prompt else {})},
                ensure_ascii=False), sent_images))

        @model_validator(mode='after')
        def validate_observations(result):
            if (len(result.observations) != len(request.candidate_ids)
                    or {item.candidate_id for item in result.observations} != set(request.candidate_ids)):
                raise repairable_output_error('visual_candidate_coverage', '视觉观察必须恰好覆盖本页全部候选')
            for item in result.observations:
                cited = set(item.media_ids)
                if len(item.media_ids) != 2 or cited != required[item.candidate_id]:
                    raise repairable_output_error('visual_image_references',
                        '视觉观察须恰好引用本次实际发送的两侧原图ID各一次，原始标注和全部局部视图属于对应原图；候选' + item.candidate_id
                        + '缺少：' + json.dumps(sorted(required[item.candidate_id] - cited))
                        + '；无效引用：' + json.dumps(sorted(cited - required[item.candidate_id])))
                if item.gate_dispute is not None:
                    gate = gates[item.candidate_id]
                    if gate.relation == 'pixel_identical' or not set(item.gate_dispute.region_pair_ids) <= set(gate.required_region_pair_ids):
                        raise repairable_output_error('visual_gate_dispute', '资格争议须引用真实关注区域，不能撤销程序确认的像素一致事实。')
            return result

        response_type = type('AnchorVisualResult', (AnchorVisualResult,), {'validate_observations': validate_observations})
        return cls(captured, prompt, context, bundles, response_type, snapshot.system_prompt)

    def plan(self, client: VlmClient) -> GenerationRequest[AnchorVisualResult]:
        return client.plan(self.response_type, self.prompt, self.images, client.resolve_model(), context=self.context,
            system_prompt=self.system_prompt)
