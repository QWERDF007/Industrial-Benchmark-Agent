from typing import Literal

from pydantic import Field, computed_field, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.workbench.job_models import JobStatus
from iad_core.consistency.annotation_issues import ISSUE_CATEGORIES, IssueType, ISSUE_TYPES_BY_FORMAT as AUDIT_ISSUE_TYPES_BY_FORMAT
from iad_core.consistency.conflict_categories import CONFLICT_CATEGORY_LABELS
from iad_core.advisory.analysis import VisualEvidence
from iad_core.workbench.analysis_manifest import AnalysisRegistration
from iad_core.audit.delegation_models import AuditResultReference, AuditReviewRequest
from iad_core.analysis.prompt_models import AnalysisRolePrompts
from iad_core.audit.prompt_text import MASTER_AUDIT_SYSTEM_PROMPT, DEFAULT_AUDIT_BATCH_PROMPT, DEFAULT_AUDIT_REPORT_PROMPT

AUDIT_ISSUE_LABELS = {kind:CONFLICT_CATEGORY_LABELS[category] for kind,category in ISSUE_CATEGORIES.items()}
AUDIT_ASSESSMENT_LABELS = {'supported':'支持为疑点','unsupported':'不支持为疑点','insufficient':'证据不足'}
AUDIT_CONSISTENCY_LABELS = {'NO_CANDIDATES':'无候选','NO_ELIGIBLE_CANDIDATES':'无有效候选',
    'MODEL_REVIEWED:MATERIAL':'存在标注差异','MODEL_REVIEWED:EQUIVALENT':'标注一致','MODEL_REVIEWED:UNCERTAIN':'待核实'}
AUDIT_CAPABILITY_LABELS = {'representative_test_set':'代表性测试集','ordinary_normal':'普通正常','hard_normal':'困难良品',
    'near_ok_ng_pair':'相似异标签对','tiny_defect':'微小异常','low_contrast_defect':'低对比异常','structural_relation':'结构关系',
    'missing_component':'缺失','misalignment':'错位','multi_object':'多件与多实例','in_domain':'原域','unseen_batch':'未见批次','lighting_shift':'光照变化'}
AUDIT_COVERAGE_LABELS = {'observed':'已观察到','candidate':'能力候选','not_observed':'未观察到','not_applicable':'不适用'}
AUDIT_DISCOVERY_STATUS_LABELS = {'pending':'待验证','supported':'有支持','disputed':'存在分歧','withdrawn':'已撤回'}
AUDIT_PURPOSE_LABELS = {'exploration':'视觉探索','training_experiment':'训练实验','debug':'内部调试','image_evaluation':'图像级评测',
    'bbox_evaluation':'框级评测','pixel_evaluation':'像素级评测','formal_benchmark':'正式 Benchmark'}
AUDIT_USABILITY_LABELS = {'usable':'可用','candidate':'可作候选','not_ready':'条件不足','not_evaluated':'未评价'}
AUDIT_READINESS_LABELS = {'ready':'就绪','partial':'部分条件满足','not_ready':'条件不足','not_evaluated':'未评价'}


class AuditCount(AnalysisModel):
    image_count: int
    occurrences: int


class AuditStatistics(AnalysisModel):
    total_images: int
    completed_images: int
    normal_images: int
    suspect_images: int
    incomplete_images: int
    completion_rate: float | None
    suspect_rate_among_completed: float | None
    issue_occurrences: int
    issue_types: dict[str, AuditCount]
    datasets: dict[str, dict[str, int]]
    consistency_cross: dict[str, dict[str, int]]
    consistency_assessments: dict[str, int]
    knowledge_assessments: dict[str, dict[str, int]]
    observation_images: int = 0
    observation_occurrences: int = 0


class AuditRecordQuery(AnalysisModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=30, ge=1, le=100)
    sample_id: str | None = None
    issue_type: str | None = None
    consistency_assessment: Literal['supported','unsupported','insufficient'] | None = None
    knowledge_id: str | None = None
    state: Literal['normal','suspect','incomplete'] | None = None


class AuditRepresentative(AnalysisModel):
    sample_id: NonBlankText
    role: Literal['representative','counter'] = Field(default='representative',description='representative为典型证据原图；counter为已观察的判断边界对照原图，不代表人工确认的正常真值。')
    reason: NonBlankText = Field(description='用一句话说明该原图对发现或规律的证据作用，不写逐图详情分析。')


class AuditReportImage(AnalysisModel):
    sample_id: str
    role: Literal['representative','counter']
    caption: str
    reason: str
    image: VisualEvidence
    source: AnalysisRegistration

    @model_validator(mode='after')
    def original_only(self):
        if not self.image.is_whole_image or self.image.representation != 'raw':
            raise ValueError('报告证据只接受完整原图')
        return self


DiscoveryStatus = Literal['pending', 'supported', 'disputed', 'withdrawn']


class AuditDiscoveryBody(AnalysisModel):
    group_id: NonBlankText
    kind: Literal['quality_issue', 'visual_pattern', 'judgment_boundary']
    dimension: Literal['annotation_quality', 'visual_coverage', 'evaluation_difficulty']
    status: DiscoveryStatus
    title: NonBlankText
    description: NonBlankText
    visual_signature: str
    annotation_relation: str
    scope: NonBlankText
    key_difference: str = ''
    unresolved_question: str = ''
    next_batch_focus: str = ''


class AuditDiscovery(AuditDiscoveryBody):
    support_refs: list[AuditResultReference] = Field(min_length=1)
    counter_refs: list[AuditResultReference] = Field(default_factory=list)
    representatives: list[AuditRepresentative] = Field(default_factory=list)

    @computed_field
    @property
    def affected_image_count(self) -> int:
        return len({ref.sample_id for ref in [*self.support_refs,*self.counter_refs]})


class AuditBatchCommit(AnalysisModel):
    commit_key: NonBlankText
    batch_number: int = Field(ge=1)
    base_revision: int = Field(ge=0)
    discoveries: list[AuditDiscovery]
    review_requests: list[AuditReviewRequest] = Field(default_factory=list)


class AuditEvidenceChange(AnalysisModel):
    group_id: NonBlankText
    action: Literal['add', 'remove', 'keep']
    role: Literal['support', 'counter']
    reference: AuditResultReference
    reason: NonBlankText


class AuditRepresentativeChange(AnalysisModel):
    group_id: NonBlankText
    representatives: list[AuditRepresentative]


class AuditBatchDelta(AnalysisModel):
    commit_key: NonBlankText
    batch_number: int = Field(ge=1)
    base_revision: int = Field(ge=0)
    discoveries: list[AuditDiscoveryBody] = Field(description='只提交新增或正文变化的完整发现。未变传[]；支持、反例和精选分别提交。')
    evidence_changes: list[AuditEvidenceChange] = Field(default_factory=list,
        description='只提交引用变化。改变主张或范围时，以keep、remove或角色迁移逐项复核全部旧引用并说明理由。')
    representative_changes: list[AuditRepresentativeChange] = Field(default_factory=list,
        description='仅提交精选变化的条目，省略保留既有选择。数量按信息价值决定，不重复堆图。')
    review_requests: list[AuditReviewRequest] = Field(default_factory=list)


class AuditDiscoveryIndex(AnalysisModel):
    group_id: str
    title: str
    status: DiscoveryStatus
    next_batch_focus: str
    support_image_count: int
    counter_image_count: int
    representatives: list[AuditRepresentative]

    @classmethod
    def capture(cls, discovery: AuditDiscovery):
        return cls(group_id=discovery.group_id, title=discovery.title, status=discovery.status,
            next_batch_focus=discovery.next_batch_focus,
            support_image_count=len({ref.sample_id for ref in discovery.support_refs}),
            counter_image_count=len({ref.sample_id for ref in discovery.counter_refs}), representatives=discovery.representatives)


class AuditDiscoveryQuery(AnalysisModel):
    group_id: NonBlankText
    revision: int | None = Field(default=None, ge=1)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=30, ge=1, le=100)
    role: Literal['support', 'counter'] | None = None


class AuditGlobalState(AnalysisModel):
    revision: int
    discoveries: list[AuditDiscovery]


CapabilityTag = Literal['representative_test_set','ordinary_normal','hard_normal','near_ok_ng_pair','tiny_defect',
    'low_contrast_defect','structural_relation','missing_component','misalignment','multi_object','in_domain','unseen_batch','lighting_shift']
AuditPurpose = Literal['exploration','training_experiment','debug','image_evaluation','bbox_evaluation','pixel_evaluation','formal_benchmark']
AUDIT_PURPOSES = ('exploration','training_experiment','debug','image_evaluation','bbox_evaluation','pixel_evaluation','formal_benchmark')


class AuditCapability(AnalysisModel):
    tag: CapabilityTag
    coverage_status: Literal['observed','candidate','not_observed','not_applicable']
    reason: NonBlankText
    evidence_refs: list[AuditResultReference]
    representatives: list[AuditRepresentative] = Field(default_factory=list)
    missing_conditions: list[str] = Field(default_factory=list)

    @model_validator(mode='after')
    def observed_evidence(self):
        if self.coverage_status in ('observed','candidate') and not self.evidence_refs:
            raise ValueError('能力观察和候选必须引用实际图级记录')
        return self


class AuditReportedCapability(AuditCapability):
    readiness_status: Literal['ready','partial','not_ready','not_evaluated']
    readiness_track: str | None


class AuditUsabilityAssessment(AnalysisModel):
    purpose: AuditPurpose
    status: Literal['usable','candidate','not_ready','not_evaluated']
    reason: NonBlankText


class AuditEvidenceAnalysis(AnalysisModel):
    analysis: NonBlankText = Field(description='围绕现象、共性、差异与判断边界的综合分析，不写逐图详情。')
    evidence_refs: list[AuditResultReference] = Field(description='支撑本项分析的当前有效图级记录。没有相关材料时为空并在正文说明。')
    representatives: list[AuditRepresentative] = Field(default_factory=list,
        description='主Agent已实际观察的精选完整原图，数量按信息价值决定，不强行凑图。')


class AuditCoverageTopic(AuditEvidenceAnalysis):
    title: NonBlankText = Field(description='根据本作业实际观察命名，不加序号，不照搬固定的覆盖主题。')
    evidence_refs: list[AuditResultReference] = Field(min_length=1)


class AuditConsistencyAnalysis(AuditEvidenceAnalysis):
    issue_type: IssueType = Field(description='沿用本数据格式的现有差异类型，每类单独分析，不合并多标少标或拆分合并。')


class AuditReportCommit(AnalysisModel):
    commit_key: NonBlankText
    discovery_ids: list[NonBlankText]
    conclusion: NonBlankText
    consistency_analysis: NonBlankText
    knowledge_analysis: str = ''
    coverage_analysis: NonBlankText
    coverage_topics: list[AuditCoverageTopic] = Field(default_factory=list,
        description='本作业有真实图证的覆盖画像主题，标题、条数、正文及选图由实际作业决定。')
    consistency_analyses: list[AuditConsistencyAnalysis] = Field(default_factory=list,
        description='本格式每个适用差异类型各一项；零疑点也如实分析，不将无候选、无有效候选、一致作为类型。')
    independence_analysis: NonBlankText
    capabilities: list[AuditCapability]
    usability: list[AuditUsabilityAssessment]
    review_priorities: list[str]
    limitations: list[str]

    @model_validator(mode='after')
    def complete_purposes(self):
        purposes = [item.purpose for item in self.usability]
        if len(purposes)!=len(AUDIT_PURPOSES) or set(purposes)!=set(AUDIT_PURPOSES):
            raise ValueError('分别评价探索、训练实验、调试、图级、框级、像素级和正式基准用途')
        if len({item.tag for item in self.capabilities})!=len(self.capabilities):
            raise ValueError('能力标签不能重复')
        if len({item.issue_type for item in self.consistency_analyses}) != len(self.consistency_analyses):
            raise ValueError('一致性分类分析不能重复')
        return self


class AuditReportPrompts(AnalysisModel):
    master_prompt: AnalysisRolePrompts = Field(default_factory=lambda:AnalysisRolePrompts(
        system_prompt=MASTER_AUDIT_SYSTEM_PROMPT,user_prompt=DEFAULT_AUDIT_BATCH_PROMPT))
    report_instruction: NonBlankText = DEFAULT_AUDIT_REPORT_PROMPT


class AuditReportSession(AnalysisModel):
    job_id: str
    session_id: str
    session_created: bool
    state: JobStatus
    result: AuditReportCommit | None
    error: str | None
    revision: int = 0
    discoveries: list[AuditDiscovery] = Field(default_factory=list)
    prompts: AuditReportPrompts | None = None


class AuditReportEvidenceQuery(AnalysisModel):
    sample_id: NonBlankText
    evidence_id: NonBlankText
