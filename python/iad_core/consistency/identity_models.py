from typing import Literal

from pydantic import Field, computed_field, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText, VisualEvidence
from iad_core.consistency.models import Digest, Identifier
from iad_core.consistency.annotation_issues import MainAnnotationIssue
from iad_core.duplicate.verification_models import Registration


ContentRelation = Literal['pixel_identical', 'transformed_same_content', 'content_different', 'unverified']


class CandidateIdentityRecord(AnalysisModel):
    gate_id: Identifier
    candidate_id: Identifier
    fingerprint: Digest
    execution_status: Literal['completed', 'failed']
    relation: ContentRelation | None
    reason: NonBlankText
    limitations: list[NonBlankText] = Field(default_factory=list)
    media: list[VisualEvidence] = Field(default_factory=list)
    geometry: Registration | None = None
    error_code: str | None = None
    gate_status: Literal['eligible', 'rejected', 'unverified'] | None = None

    @model_validator(mode='after')
    def validate_execution(self):
        if self.execution_status == 'completed' and (self.relation is None or len(self.media) < 2 or self.error_code):
            raise ValueError('成功的资格验证必须有内容关系和实际双侧图证，不能携带执行错误')
        if self.execution_status == 'failed' and (self.relation is not None or not self.error_code):
            raise ValueError('执行失败不能伪造内容关系，必须保留错误码')
        expected = (None if self.execution_status != 'completed' else {
            'pixel_identical': 'eligible', 'transformed_same_content': 'eligible',
            'content_different': 'rejected', 'unverified': 'unverified'}[self.relation])
        if self.gate_status is not None and self.gate_status != expected:
            raise ValueError('候选资格必须由实际执行状态与内容关系派生')
        self.gate_status = expected
        return self


class AnchorIdentityState(AnalysisModel):
    fingerprint: Digest
    retrieved: int = Field(ge=0)
    gates: list[CandidateIdentityRecord]

    @computed_field
    @property
    def eligible_ids(self) -> list[str]:
        return [gate.candidate_id for gate in self.gates if gate.gate_status == 'eligible']

    @computed_field
    @property
    def completed(self) -> bool:
        return len(self.gates) == self.retrieved and all(gate.execution_status == 'completed' for gate in self.gates)


class CandidateStats(AnalysisModel):
    retrieved: int = Field(ge=0)
    eligible: int = Field(ge=0)
    rejected: int = Field(ge=0)
    unverified: int = Field(ge=0)
    assessed: int = Field(ge=0)
    consistent: int = Field(ge=0)
    discrepancy: int = Field(ge=0)
    undetermined: int = Field(ge=0)
    failed: int = Field(default=0, ge=0)
    pending: int = Field(default=0, ge=0)


class IdentityResultFields(AnalysisModel):
    execution_status: Literal['completed', 'partial', 'failed'] | None = None
    result: Literal['passed', 'discrepancy', 'needs_review', 'incomplete'] | None = None
    pass_reason: Literal['no_retrieved_candidate', 'no_eligible_candidate', 'all_eligible_consistent'] | None = None
    candidate_stats: CandidateStats | None = None
    candidate_gate_ids: list[str] = Field(default_factory=list)
    issues: list[MainAnnotationIssue] = Field(default_factory=list)
