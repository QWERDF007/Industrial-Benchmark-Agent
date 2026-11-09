from typing import Annotated, List, Literal, Optional
from uuid import UUID

from pydantic import Field, PlainSerializer, field_validator, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText, NormalizedBBox, AuditFinding, RegionImage, RegionOrigin, VisualEvidence
from iad_core.advisory.output_validation import repairable_output_error
from iad_core.evidence.sources import SampleContent
from iad_core.knowledge.instructions import FrozenMiningPrompt

KnowledgeKind = Literal["normal", "defect"]
KNOWLEDGE_JOB_TYPES = ("KNOWLEDGE", "NORMAL_KNOWLEDGE", "DEFECT_KNOWLEDGE")
DiscoveryStatus = Literal['已形成知识', '证据不足', '不可观察', '不适用']


class KnowledgeCriterion(AnalysisModel):
    title: str = Field(min_length=1)
    subject: str = Field(min_length=1)
    location: str
    criterion: str = Field(min_length=1)
    allowed_variations: List[str]
    limitations: List[str]
    status: Literal["supported", "provisional", "conflicted"] = Field(description="supported：本轮实际证据支持该可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值")

    @property
    def identity(self) -> tuple[str, str, str]:
        return tuple(value.strip().casefold() for value in (self.subject, self.location, self.criterion))

class LearnedCheck(KnowledgeCriterion):
    support_evidence_ids: List[str]
    counter_evidence_ids: List[str]

    @model_validator(mode="after")
    def supported_has_evidence(self):
        if self.status == "supported" and not self.support_evidence_ids:
            raise repairable_output_error('knowledge_support_evidence', 'Supported knowledge requires visual support')
        return self


class KnowledgeSuspect(AnalysisModel):
    evidence_id: str
    bbox_1000: NormalizedBBox
    description: str
    normal_explanation: str


class CheckRevision(AnalysisModel):
    previous_check_id: str = Field(min_length=1, description="仅引用本次明确冻结父版本checks中的旧条目ID；没有父版本时revisions为空")
    current_check_titles: List[str] = Field(description="同一判据对应的当前检查项；拆分可多项，退役为空。仅改措辞或允许变化保持一对一")
    reason: str = Field(min_length=1)


class KnowledgeCorrection(AnalysisModel):
    check_id: str = Field(min_length=1, description="冻结基准版本中的检查项ID")
    instruction: NonBlankText = Field(description="待视觉核验的人工修订建议，不是已证实事实")


class KnowledgeTextRetraction(AnalysisModel):
    check_id: Optional[NonBlankText] = Field(description='冻结父版本的检查项ID；整体限制填null')
    field: Literal['limitations', 'allowed_variations']
    text: NonBlankText = Field(description='逐字引用要撤回的父版本表述；替代表述写入本轮相应字段')
    reason: NonBlankText
    evidence_ids: List[str] = Field(min_length=1, description='支持撤回理由的本轮实际原图证据')


class ObservedPart(AnalysisModel):
    name: NonBlankText
    location: str
    evidence_ids: List[str] = Field(min_length=1)


class ObservedArea(AnalysisModel):
    direction_id: Optional[str] = Field(default=None, description='用户选中的方向编号；模型自主发现的新方向填null，不能冒用未选择的方向')
    direction: NonBlankText = Field(description='本轮观察标题；所选方向身份以direction_id为准，自主发现方向填写新标题')
    status: DiscoveryStatus = Field(description='提取阶段的候选状态，最终结合实际判据引用确认；仅本次checks包含对应判据且有实际图像证据时可填已形成知识，沿用历史观察不等于本轮形成新判据')
    reason: NonBlankText
    evidence_ids: List[str]


class DiscoveryArea(ObservedArea):
    status: DiscoveryStatus = Field(description='最终状态；仅关联本次checks的实际判据且有图像证据时可填已形成知识。没有对应本次判据时保留观察，状态为证据不足、不可观察或不适用，不得用无关判据填充引用')
    subjects: List[str] = Field(description='引用parts内实际可见部件名称；不适用时可为空')
    check_titles: List[str] = Field(description='引用本次checks实际标题；不是预设旧条目的完整性证明')

    @model_validator(mode='after')
    def learned_has_support(self):
        if self.status == '已形成知识' and (not self.check_titles or not self.evidence_ids):
            raise ValueError('形成知识的观察方向必须关联判据和实际图像证据')
        return self


class ObservedDiscovery(AnalysisModel):
    parts: List[ObservedPart]
    areas: List[ObservedArea]

    @model_validator(mode='after')
    def unique_parts(self):
        names = [part.name for part in self.parts]
        if len(names) != len(set(names)):
            raise ValueError('可见部件名称必须唯一')
        return self


class KnowledgeDiscovery(ObservedDiscovery):
    areas: List[DiscoveryArea]


class KnowledgeDraftContent(AnalysisModel):
    summary: str
    checks: List[LearnedCheck]
    suspects: List[KnowledgeSuspect]
    limitations: List[str]
    revisions: List[CheckRevision] = Field(default_factory=list)
    text_retractions: List[KnowledgeTextRetraction] = Field(default_factory=list)

    @model_validator(mode="after")
    def unique_check_titles(self):
        titles = [check.title for check in self.checks]
        if len(titles) != len(set(titles)):
            raise ValueError("Knowledge check titles must identify one criterion")
        return self


class KnowledgeLearning(KnowledgeDraftContent):
    discovery: Optional[ObservedDiscovery] = Field(default=None, description='实际可见部件与逐方向观察，不包含部件或判据的交叉引用')


class KnowledgeDraft(KnowledgeDraftContent):
    discovery: Optional[KnowledgeDiscovery] = Field(default=None, description='逐部件观察与各挖掘方向的实际结果；未返回时明确未记录，不能据此宣称观察完整')

    @model_validator(mode='after')
    def valid_discovery_references(self):
        titles = [check.title for check in self.checks]
        if self.discovery:
            parts = [item.name for item in self.discovery.parts]
            for area in self.discovery.areas:
                unknown_parts = set(area.subjects) - set(parts)
                unknown_checks = set(area.check_titles) - set(titles)
                if unknown_parts or unknown_checks:
                    raise ValueError(f'观察方向「{area.direction}」引用未知部件：{sorted(unknown_parts)}；未知判据：{sorted(unknown_checks)}')
        return self


class EvidenceSupportedCheck(LearnedCheck):
    support_limitations: List[str] = Field(default_factory=list)


class KnowledgeCheck(EvidenceSupportedCheck):
    recheck_sample_ids: List[str] = Field(default_factory=list)
    conflict_ids: List[str] = Field(default_factory=list)
    check_id: str
    predecessor_check_ids: List[str] = Field(default_factory=list)
    finding_ids: List[str] = Field(default_factory=list)
    normal_check_ids: List[str] = Field(default_factory=list)

    def criterion_context(self) -> dict[str, object]:
        return dict(self.model_dump(exclude={'support_evidence_ids', 'counter_evidence_ids', 'recheck_sample_ids',
            'finding_ids', 'normal_check_ids', 'predecessor_check_ids'}), pending_recheck_source_count=len(self.recheck_sample_ids))


class KnowledgeSourceMetadata(SampleContent):
    review_sha256: str
    audit_suggestion_ids: List[str] = Field(default_factory=list)
    qualification: Literal["human_pass", "human_hard_normal", "manual_selection", "raw_pass", "initial_unannotated",
                           "human_fail", "human_uncertain", "human_skip", "raw_fail", "annotated_candidate", "normal_suspect", "audit_suspect"]


class KnowledgeSource(KnowledgeSourceMetadata):
    pixel_sha256: Optional[str] = Field(default=None, pattern="^[a-f0-9]{64}$")


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


class KnowledgeObservationContent(AnalysisModel):
    status: Literal['supports', 'contradicts', 'unobservable']
    description: str = Field(min_length=1)
    position_analysis: str
    illumination_analysis: str
    normal_explanation: str
    evidence_ids: List[str] = Field(min_length=1)
    suspects: List[KnowledgeSuspect]


class KnowledgeObservation(KnowledgeObservationContent):
    check_id: str
    sample_id: str


class KnowledgeObservations(AnalysisModel):
    observations: List[KnowledgeObservation]


class KnowledgeObservationStep(AnalysisModel):
    step_id: str
    version_id: str
    purpose: Literal['current', 'comparison', 'revision'] = 'current'
    checks: List[KnowledgeCheck] = Field(default_factory=list)
    input_evidence_ids: List[str]
    result: KnowledgeObservations


class KnowledgeRecheckDecision(AnalysisModel):
    submission_id: str
    status: Literal['resolved', 'unresolved', 'insufficient']
    description: str = Field(min_length=1)
    evidence_ids: List[str] = Field(min_length=1)
    limitations: List[str]


class KnowledgeRecheckResult(AnalysisModel):
    decisions: List[KnowledgeRecheckDecision]


class KnowledgeConflict(AnalysisModel):
    conflict_id: str
    category: Literal['observation', 'retirement_proposal'] = 'observation'
    origin_version_id: str
    resolution: Optional[KnowledgeRecheckDecision] = None
    check_ids: List[str]
    sample_id: str
    source_sha256: str
    bbox: Optional[List[int]]
    observation_step_ids: List[str]
    new_evidence_ids: List[str]
    comparison_evidence_ids: List[str]
    description: str
    normal_explanation: str
    limitations: List[str]


class KnowledgeSupportPolicy(AnalysisModel):
    min_source_groups: Optional[int] = Field(default=None, ge=2)


class KnowledgeCheckRemoval(AnalysisModel):
    submission_id: Annotated[UUID, PlainSerializer(str, return_type=str)]
    check_id: str = Field(min_length=1)


class KnowledgeSnapshot(AnalysisModel):
    version_id: str
    dataset_id: str
    kind: Optional[KnowledgeKind] = None
    parent_version_id: Optional[str]
    normal_version_id: Optional[str] = None
    normal_reference_version_id: Optional[str] = None
    model_name: str
    generation_version: str
    signature: str
    summary: str
    checks: List[KnowledgeCheck]
    revisions: List[CheckRevision] = Field(default_factory=list)
    text_retractions: List[KnowledgeTextRetraction] = Field(default_factory=list)
    corrections: List[KnowledgeCorrection] = Field(default_factory=list)
    comparison_sources: List[KnowledgeSource] = Field(default_factory=list)
    suspects: List[KnowledgeSuspect]
    limitations: List[str]
    sources: List[KnowledgeSource]
    evidence: List[KnowledgeEvidence]
    mining_steps: List[KnowledgeStep]
    observation_steps: List[KnowledgeObservationStep] = Field(default_factory=list)
    conflicts: List[KnowledgeConflict] = Field(default_factory=list)
    review_applications: List[KnowledgeRecheckDecision] = Field(default_factory=list)
    findings: List[KnowledgeFinding] = Field(default_factory=list)
    verification_steps: List[VerificationStep] = Field(default_factory=list)
    support_policy: Optional[KnowledgeSupportPolicy] = None
    support_groups: Optional[dict[str, str]] = None
    scope_run_id: Optional[str] = None
    observed_source_ids: Optional[List[str]] = None
    knowledge_preset: Optional[List[str]] = None
    manual_edit: Optional[KnowledgeCheckRemoval] = None
    mining_prompt: Optional[FrozenMiningPrompt] = None
    created_at: str

    @property
    def recheck_sample_ids(self) -> set[str]:
        return {sid for check in self.checks for sid in check.recheck_sample_ids}


class KnowledgeVersionQuery(AnalysisModel):
    dataset_id: str


class KnowledgeVersion(AnalysisModel):
    version_id: str
    dataset_id: str
    source_run_id: str | None = None
    kind: Optional[KnowledgeKind] = None
    parent_version_id: Optional[str]
    normal_version_id: Optional[str] = None
    model_name: str
    created_at: str
    source_count: int
    check_count: int
    supported_check_count: int = Field(default=0, ge=0)
    manually_edited: bool = False


class KnowledgeVersionCatalog(AnalysisModel):
    dataset_id: str
    current_version_id: Optional[str]
    versions: List[KnowledgeVersion]


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
    recheck_from_version: Optional[str] = Field(default=None, description="仅查询所选版本中判据修订后尚待视觉重核验的历史合格来源")
    include_observed: bool = Field(default=False, description="明确重核验选图时包含已观察的合格来源；不扩大冻结范围，不启动作业")
    scope_run_id: Optional[str] = None
    dataset_id: str
    kind: Optional[KnowledgeKind] = None
    normal_version_id: Optional[str] = None
    uncovered_from_version: Optional[str] = Field(default=None, description="仅查询指定版本语义链尚未观察的新来源；已变更旧来源单列待重核验")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=200, description="每页1..200，默认10；仅取本次已确认图组所需引用，不预先枚举全库")
    search: str = ""


class KnowledgeSourceItem(AnalysisModel):
    sample_id: str
    relative_path: str
    qualification: str


class KnowledgeCoverage(AnalysisModel):
    recheck: int = Field(default=0, ge=0)
    version_id: Optional[str]
    total: int = Field(ge=0)
    observed: int = Field(ge=0)
    pending_review: int = Field(ge=0)
    stale: int = Field(ge=0)
    remaining: int = Field(ge=0)


class KnowledgeSourcePage(AnalysisModel):
    dataset_id: str
    kind: Optional[KnowledgeKind] = None
    normal_version_id: Optional[str] = None
    total: int = Field(ge=0)
    unavailable_source_count: int = Field(ge=0)
    page: int
    page_size: int
    items: List[KnowledgeSourceItem]
    coverage: Optional[KnowledgeCoverage] = None


class KnowledgeDetailQuery(AnalysisModel):
    version_id: str = Field(min_length=1)
    check_id: Optional[str] = None
    evidence_role: Optional[Literal['support', 'counter']] = None
    section: Literal['checks', 'discovery', 'evidence'] = 'checks'
    evidence_ids: List[str] = Field(default_factory=list)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=50)
    search: str = ''
    review_status: Literal['all', 'pending', 'confirmed', 'rejected', 'conflict'] = 'all'

    @field_validator('evidence_ids', mode='before')
    @classmethod
    def parse_evidence_ids(cls, value):
        if isinstance(value, str):
            import json
            return json.loads(value)
        return value

    @model_validator(mode='after')
    def distinct_sections(self):
        if self.section != 'checks' and self.check_id is not None:
            raise ValueError('非判据查询不能同时指定判据')
        if self.section != 'evidence' and self.evidence_ids:
            raise ValueError('具体图像引用仅用于证据查询')
        if self.evidence_role is not None and (self.check_id is None or self.section != 'checks'):
            raise ValueError('证据类型查询必须指定知识判据')
        return self


class KnowledgeDiscoveryPage(AnalysisModel):
    version_id: str
    dataset_id: str
    kind: Optional[KnowledgeKind] = None
    recorded: bool
    parts: List[ObservedPart]
    total: int
    page: int
    page_size: int
    items: List[DiscoveryArea]


class KnowledgeCheckReview(AnalysisModel):
    status: Literal['pending', 'confirmed', 'rejected'] = 'pending'
    note: str = ''
    revision: int = Field(default=0, ge=0)
    created_at: Optional[str] = None


class KnowledgeCheckReviewSubmission(AnalysisModel):
    version_id: str
    check_id: str
    submission_id: UUID
    expected_revision: int = Field(ge=0)
    status: Literal['pending', 'confirmed', 'rejected']
    note: str = ''


class KnowledgeCheckSummary(KnowledgeCriterion):
    review: KnowledgeCheckReview = Field(default_factory=KnowledgeCheckReview)
    pending_recheck_source_count: int = Field(ge=0)
    check_id: str
    support_count: int
    counter_count: int
    conflict_ids: List[str]
    support_limitations: List[str]

class KnowledgeCheckPage(AnalysisModel):
    version_id: str
    dataset_id: str
    kind: Optional[KnowledgeKind] = None
    total: int
    page: int
    page_size: int
    items: List[KnowledgeCheckSummary]


class KnowledgeEvidencePage(AnalysisModel):
    version_id: str
    total: int
    page: int
    page_size: int
    items: List[KnowledgeEvidence]
