from typing import List, Literal, Optional

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel, AuditFinding, RegionImage, RegionOrigin, RegionProposal, VisualEvidence
from iad_core.evidence.sources import SampleContent

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
    status: Literal["supported", "provisional", "conflicted"] = Field(description="supported：本轮实际证据支持该可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值")

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


class CheckRevision(AnalysisModel):
    previous_check_id: str = Field(min_length=1)
    current_check_titles: List[str] = Field(description="同一判据对应的当前检查项；拆分可多项，退役为空。仅改措辞或允许变化保持一对一")
    reason: str = Field(min_length=1)


class KnowledgeCorrection(AnalysisModel):
    check_id: str = Field(min_length=1, description="冻结基准版本中的检查项ID")
    instruction: str = Field(min_length=1, pattern=r'\S', description="待视觉核验的人工修订建议，不是已证实事实")


class KnowledgeDraft(AnalysisModel):
    summary: str
    checks: List[LearnedCheck]
    suspects: List[KnowledgeSuspect]
    limitations: List[str]
    revisions: List[CheckRevision] = Field(default_factory=list)

    @model_validator(mode="after")
    def unique_check_titles(self):
        titles = [check.title for check in self.checks]
        if len(titles) != len(set(titles)):
            raise ValueError("Knowledge check titles must identify one criterion")
        return self


class KnowledgeCheck(LearnedCheck):
    check_id: str
    predecessor_check_ids: List[str] = Field(default_factory=list)
    finding_ids: List[str] = Field(default_factory=list)
    normal_check_ids: List[str] = Field(default_factory=list)

    def criterion_context(self) -> dict[str, object]:
        return self.model_dump(exclude={'support_evidence_ids', 'counter_evidence_ids',
            'finding_ids', 'normal_check_ids', 'predecessor_check_ids'})


class KnowledgeSource(SampleContent):
    review_sha256: str
    audit_suggestion_ids: List[str] = Field(default_factory=list)
    qualification: Literal["human_pass", "human_hard_normal", "manual_selection", "raw_pass", "initial_unannotated",
                           "human_fail", "raw_fail", "annotated_candidate", "normal_suspect", "audit_suspect"]


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
    origin_suggestion_id: Optional[str] = None
    audit_finding: Optional[AuditFinding] = None
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

    def is_current_candidate(self, source_sha256: str, audit_suggestion_ids: List[str]) -> bool:
        return (self.judgment.status != 'refuted' and bool(self.regions)
                and self.regions[0].image.source_sha256 == source_sha256
                and (not self.origin_suggestion_id or self.origin_suggestion_id in audit_suggestion_ids))


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
    revisions: List[CheckRevision] = Field(default_factory=list)
    corrections: List[KnowledgeCorrection] = Field(default_factory=list)
    removed_source_ids: List[str] = Field(default_factory=list)
    suspects: List[KnowledgeSuspect]
    limitations: List[str]
    sources: List[KnowledgeSource]
    evidence: List[KnowledgeEvidence]
    mining_steps: List[KnowledgeStep]
    findings: List[KnowledgeFinding] = Field(default_factory=list)
    verification_steps: List[VerificationStep] = Field(default_factory=list)
    created_at: str


class KnowledgeVersion(AnalysisModel):
    version_id: str
    dataset_id: str
    kind: KnowledgeKind
    parent_version_id: Optional[str]
    normal_version_id: Optional[str]
    model_name: str
    created_at: str
    source_count: int
    check_count: int


class KnowledgeSourceChange(AnalysisModel):
    sample_id: str
    reasons: List[Literal['image', 'annotations', 'review', 'audit_candidates', 'qualification', 'unavailable']]


class KnowledgeFreshness(AnalysisModel):
    status: Literal['current', 'changed', 'unverified']
    checked_at: str
    current_version_id: Optional[str]
    current_normal_version_id: Optional[str]
    source_changes: List[KnowledgeSourceChange]
    additional_source_ids: List[str]
    generation_changed: Optional[bool]
    normal_version_changed: bool
    normal_sources_changed: bool


class KnowledgeQuery(AnalysisModel):
    knowledge: Optional[KnowledgeSnapshot]
    versions: List[KnowledgeVersion]
    freshness: Optional[KnowledgeFreshness]
    eligible_source_count: int = Field(ge=0)
    unavailable_source_count: int = Field(ge=0)


class KnowledgeSourceQuery(AnalysisModel):
    dataset_id: str
    kind: KnowledgeKind
    normal_version_id: Optional[str] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=200, description="每页1..200，默认10；仅取本次已确认图组所需引用，不预先枚举全库")
    search: str = ""


class KnowledgeSourceItem(AnalysisModel):
    sample_id: str
    relative_path: str
    qualification: str


class KnowledgeSourcePage(AnalysisModel):
    dataset_id: str
    kind: KnowledgeKind
    normal_version_id: Optional[str]
    total: int = Field(ge=0)
    unavailable_source_count: int = Field(ge=0)
    page: int
    page_size: int
    items: List[KnowledgeSourceItem]
