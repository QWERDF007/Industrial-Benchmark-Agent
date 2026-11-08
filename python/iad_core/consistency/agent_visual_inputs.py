import json
from dataclasses import dataclass
from typing import TYPE_CHECKING

from pydantic import model_validator

from iad_core.advisory.output_validation import repairable_output_error
from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_review_models import AnchorVisualRequest, AnchorVisualResult, AnchorVisualStart
from iad_core.consistency.group_analysis_inputs import GroupAnalysisInputs
from iad_core.evidence.images import PreparedImage
from iad_core.workbench.prompt_text import RESPONSE_FORMAT_INSTRUCTION
from iad_core.workbench.vision import GenerationRequest, VlmClient

if TYPE_CHECKING:
    from iad_core.workbench.runtime import WorkbenchRuntime


@dataclass(frozen=True)
class AnchorVisualInput:
    request: AnchorVisualRequest
    prompt: str
    images: list[PreparedImage]
    response_type: type[AnchorVisualResult]

    @classmethod
    def prepare(cls, runtime: 'WorkbenchRuntime', run_id: str, anchor_id: str, request: AnchorVisualStart, checkpoint) -> 'AnchorVisualInput':
        prepared = ConsistencyAgentEvidence(runtime).prepare(run_id, anchor_id, request.candidate_ids,
            checkpoint=checkpoint, windows=request.windows)
        snapshot = ConsistencyAgentJobs(runtime).snapshot(run_id)
        media = {image.evidence.evidence_id for image in prepared.images}
        required = {identity: {entry['evidence_id'] for source in prepared.facts['sources'].values()
            if source['sample_id'] in (anchor_id, identity) for entry in source['visual_inputs']}
            for identity in request.candidate_ids}
        prepared.facts['required_media_ids'] = {identity: sorted(identities) for identity, identities in required.items()}
        prompt = (snapshot.visual_instruction + '\n本场审核要求：' + snapshot.instruction + '\n本次问题：' + request.question
            + '\n冻结视觉输入：' + json.dumps(prepared.facts, ensure_ascii=False) + '\n' + RESPONSE_FORMAT_INSTRUCTION)
        captured = AnchorVisualRequest(**request.model_dump(), anchor_id=anchor_id, facts=prepared.facts,
            media=[image.evidence for image in prepared.images], input_fingerprint=GroupAnalysisInputs.input_fingerprint(prompt, prepared.images))

        @model_validator(mode='after')
        def validate_observations(result):
            if (len(result.observations) != len(request.candidate_ids)
                    or {item.candidate_id for item in result.observations} != set(request.candidate_ids)):
                raise repairable_output_error('visual_candidate_coverage', '视觉观察必须恰好覆盖本页全部候选')
            for item in result.observations:
                cited = set(item.media_ids)
                if not required[item.candidate_id] <= cited or not cited <= media:
                    raise repairable_output_error('visual_media_references',
                        '视觉观察须引用本次实际发送的两侧原图和适用局部；候选' + item.candidate_id
                        + '缺少：' + json.dumps(sorted(required[item.candidate_id] - cited))
                        + '；无效引用：' + json.dumps(sorted(cited - media)))
            return result

        response_type = type('AnchorVisualResult', (AnchorVisualResult,), {'validate_observations': validate_observations})
        return cls(captured, prompt, prepared.images, response_type)

    def plan(self, client: VlmClient) -> GenerationRequest[AnchorVisualResult]:
        return client.plan(self.response_type, self.prompt, self.images, client.resolve_model())
