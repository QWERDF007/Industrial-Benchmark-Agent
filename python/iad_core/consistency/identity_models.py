from typing import Literal

from pydantic import Field, computed_field, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText, VisualEvidence
from iad_core.consistency.models import Digest, Identifier
from iad_core.consistency.annotation_issues import MainAnnotationIssue
from iad_core.duplicate.verification_models import Registration
from iad_core.consistency.task_types import ConsistencyTaskType
from iad_core.consistency.identity_regions import IdentityRegionPair, IdentityRegionCheck


ContentRelation = Literal['pixel_identical', 'transformed_same_content', 'content_different', 'unverified']


class CandidateIdentityRecord(AnalysisModel):
    gate_id: Identifier
    candidate_id: Identifier
    fingerprint: Digest
    execution_status: Literal['pending', 'completed', 'failed']
    revision: int = Field(default=0, ge=0)
    relation: ContentRelation | None
    reason: NonBlankText
    limitations: list[NonBlankText] = Field(default_factory=list)
    media: list[VisualEvidence] = Field(default_factory=list)
    geometry: Registration | None = None
    error_code: str | None = None
    gate_status: Literal['eligible', 'rejected', 'unverified'] | None = None
    source: Literal['program', 'vision'] | None = None
    region_pairs: list[IdentityRegionPair] = Field(default_factory=list)
    required_region_pair_ids: list[str] = Field(default_factory=list)
    region_checks: list[IdentityRegionCheck] = Field(default_factory=list)
    overview_relation: Literal['same', 'different', 'unverified'] | None = None

    @model_validator(mode='after')
    def validate_execution(self):
        if self.execution_status == 'completed' and (self.relation is None or len(self.media) < 2 or self.error_code):
            raise ValueError('成功的资格验证必须有内容关系和实际双侧图证，不能携带执行错误')
        if self.execution_status == 'failed' and (self.relation is not None or not self.error_code):
            raise ValueError('执行失败不能伪造内容关系，必须保留错误码')
        if self.execution_status == 'pending' and (self.relation is not None or self.error_code):
            raise ValueError('待核验的候选不能携带内容结论或执行错误')
        expected = (None if self.execution_status != 'completed' else {
            'pixel_identical': 'eligible', 'transformed_same_content': 'eligible',
            'content_different': 'rejected', 'unverified': 'unverified'}[self.relation])
        if self.gate_status is not None and self.gate_status != expected:
            raise ValueError('候选资格必须由实际执行状态与内容关系派生')
        self.gate_status = expected
        if self.source == 'vision' and self.execution_status == 'completed':
            checked = {check.region_pair_id for check in self.region_checks}
            if len(checked) != len(self.region_checks) or len(set(self.required_region_pair_ids)) != len(self.required_region_pair_ids):
                raise ValueError('关注区域不得重复')
            if not checked <= set(self.required_region_pair_ids):
                raise ValueError('区域判断超出本次必需观察范围')
            if expected == 'eligible' and (checked != set(self.required_region_pair_ids)
                    or self.overview_relation != 'same' or any(check.visual_relation != 'same' for check in self.region_checks)
                    or any(pair.mapping != 'registered' for pair in self.region_pairs)):
                raise ValueError('合格候选必须可靠核实全部必需关注区域')
            if expected == 'rejected' and self.overview_relation != 'different' and not any(
                    check.visual_relation == 'different' for check in self.region_checks):
                raise ValueError('拒绝候选需要明确的实际内容差异证据')
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
    task_type: ConsistencyTaskType | None = None
    candidate_record_ids: list[int] = Field(default_factory=list)
    execution_status: Literal['completed', 'partial', 'failed'] | None = None
    result: Literal['passed', 'discrepancy', 'needs_review', 'incomplete'] | None = None
    pass_reason: Literal['no_retrieved_candidate', 'no_eligible_candidate', 'no_valid_candidate', 'all_eligible_consistent'] | None = None
    candidate_stats: CandidateStats | None = None
    candidate_gate_ids: list[str] = Field(default_factory=list)
    issues: list[MainAnnotationIssue] = Field(default_factory=list)
