from typing import List, Literal, Optional

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel, RegionProposal, VisualEvidence

KnowledgeKind = Literal["normal", "defect"]


class LearnedCheck(AnalysisModel):
    title: str = Field(min_length=1)
    subject: str = Field(min_length=1)
    location: str
    criterion: str = Field(min_length=1)
    allowed_variations: List[str]
    support_evidence_ids: List[str] = Field(min_length=1)
    counter_evidence_ids: List[str]
    limitations: List[str]
    status: Literal["supported", "provisional", "conflicted"]


class KnowledgeSuspect(AnalysisModel):
    evidence_id: str
    bbox_1000: List[int] = Field(min_length=4, max_length=4)
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


class KnowledgeCheck(LearnedCheck):
    check_id: str


class KnowledgeSource(AnalysisModel):
    sample_id: str
    sha256: str
    annotations_sha256: str
    review_sha256: str
    qualification: Literal["human_pass", "human_hard_normal", "manual_selection", "raw_pass", "initial_unannotated"]


class KnowledgeEvidence(AnalysisModel):
    sample_id: str
    image: VisualEvidence


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
    created_at: str
