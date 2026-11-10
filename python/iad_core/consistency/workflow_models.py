from typing import Literal

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.consistency.agent_review_models import AnchorAssessmentDecision
from iad_core.consistency.models import Digest, Identifier


class WorkflowContextQuery(AnalysisModel):
    candidate_id: Identifier | None = None


class AnomalyWorkflowObserve(AnalysisModel):
    phase: Literal['gate']
    request_id: Identifier
    fingerprint: Digest
    candidate_ids: list[Identifier] = Field(min_length=1)
    gate_revisions: dict[str, int]


class BboxWorkflowObserve(AnomalyWorkflowObserve):
    phase: Literal['gate', 'audit']
    question: NonBlankText | None = None


class AnomalyWorkflowAssess(AnalysisModel):
    phase: Literal['gate', 'audit']
    request_id: Identifier
    fingerprint: Digest
    candidate_id: Identifier
    expected_revision: int = Field(ge=0)
    action: Literal['commit', 'recheck'] = 'commit'
    observation_ids: list[Identifier] = Field(default_factory=list)


class BboxWorkflowAssess(AnomalyWorkflowAssess):
    assessment: AnchorAssessmentDecision | None = Field(default=None,
        description='仅phase=audit提交当前候选的标注审核。phase=gate必须省略或传null，只用observation_ids引用已保存的身份观察，由程序保存资格结论，不提交标注问题。')

    @model_validator(mode='before')
    @classmethod
    def validate_phase(cls, value):
        if isinstance(value, dict):
            if value.get('phase') == 'gate' and value.get('assessment') is not None:
                raise ValueError('phase=gate不提交assessment；请省略或传null，仅引用实际身份观察observation_ids，不生成标注问题')
            if value.get('phase') == 'audit' and value.get('assessment') is None:
                raise ValueError('phase=audit必须提交当前合格候选的标注审核assessment')
        return value


class WorkflowSubmit(AnalysisModel):
    request_id: Identifier
    fingerprint: Digest
    assessment_ids: list[int] = Field(default_factory=list)
