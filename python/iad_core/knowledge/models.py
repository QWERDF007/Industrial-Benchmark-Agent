from typing import List, Literal, Optional

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel, RegionImage, RegionOrigin, RegionProposal, VisualEvidence

KnowledgeKind = Literal["normal", "defect"]


class LearnedCheck(AnalysisModel):
    title: str = Field(min_length=1)
    subject: str = Field(min_length=1)
    location: str
    criterion: str = Field(min_length=1)
    allowed_variations: List[str]
    support_evidence_ids: List[str]
    counter_evidence_ids: List[str]
    limitations: List[str]
    status: Literal["supported", "provisional", "conflicted"]

    @model_validator(mode="after")
    def supported_has_evidence(self):
        if self.status == "supported" and not self.support_evidence_ids:
            raise ValueError("Supported knowledge requires visual support")
        return self


class KnowledgeSuspect(AnalysisModel):
    evidence_id: str
    bbox_1000: List[int] = Field(min_length=4, max_length=4, description="相对evidence_id对应图像的归一化坐标0..1000")
    description: str
    normal_explanation: str

    @model_validator(mode="after")
    def valid_region(self):
        RegionProposal(bbox_1000=self.bbox_1000, reason=self.description)
        return self


class KnowledgeDraft(AnalysisModel):
    summary: str
    checks: List[LearnedCheck]
    suspects: List[KnowledgeSuspect]
    limitations: List[str]

    @model_validator(mode="after")
    def unique_check_titles(self):
        titles = [check.title for check in self.checks]
        if len(titles) != len(set(titles)):
            raise ValueError("Knowledge check titles must identify one criterion")
        return self


class KnowledgeCheck(LearnedCheck):
    check_id: str
    finding_ids: List[str] = Field(default_factory=list)
    normal_check_ids: List[str] = Field(default_factory=list)


class KnowledgeSource(AnalysisModel):
    sample_id: str
    sha256: str
    annotations_sha256: str
    review_sha256: str
    qualification: Literal["human_pass", "human_hard_normal", "manual_selection", "raw_pass", "initial_unannotated",
                           "human_fail", "annotated_candidate", "normal_suspect"]


class KnowledgeEvidence(AnalysisModel):
    sample_id: str
    image: VisualEvidence


class KnowledgeStep(AnalysisModel):
    step_id: str
    image_evidence_ids: List[str]
    child_step_ids: List[str]
    result: KnowledgeDraft


class FindingTarget(AnalysisModel):
    finding_id: str
    sample_id: str
    bbox: List[int]
    proposal: Optional[KnowledgeSuspect] = None
    origins: List[RegionOrigin] = Field(default_factory=list)
    origin_finding_id: Optional[str] = None
    regions: List[RegionImage]


class KnowledgeJudgment(AnalysisModel):
    finding_id: str
    status: Literal["supported", "refuted", "insufficient"]
    affected_check_titles: List[str]
    description: str
    normal_explanation: str
    limitations: List[str]
    evidence_ids: List[str] = Field(min_length=1)
    conflicts: List[str] = Field(description="仅填写尚未消解的证据判断矛盾；目标偏离正常规则本身不是判断矛盾")


class KnowledgeVerification(AnalysisModel):
    findings: List[KnowledgeJudgment]


class VerificationStep(AnalysisModel):
    step_id: str
    input_evidence_ids: List[str]
    child_step_ids: List[str]
    result: KnowledgeVerification


class KnowledgeFinding(FindingTarget):
    judgment: KnowledgeJudgment
    affected_check_ids: List[str] = Field(default_factory=list)


class KnowledgeSnapshot(AnalysisModel):
    version_id: str
    dataset_id: str
    kind: KnowledgeKind
    parent_version_id: Optional[str]
    normal_version_id: Optional[str]
    model_name: str
    generation_version: str
    signature: str
    summary: str
    checks: List[KnowledgeCheck]
    suspects: List[KnowledgeSuspect]
    limitations: List[str]
    sources: List[KnowledgeSource]
    evidence: List[KnowledgeEvidence]
    mining_steps: List[KnowledgeStep]
    findings: List[KnowledgeFinding] = Field(default_factory=list)
    verification_steps: List[VerificationStep] = Field(default_factory=list)
    created_at: str
