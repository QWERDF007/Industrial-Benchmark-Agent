from typing import Literal

from pydantic import Field, computed_field, model_validator
from pydantic.json_schema import SkipJsonSchema

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.workbench.job_models import JobStatus
from iad_core.consistency.annotation_issues import ISSUE_CATEGORIES, IssueType, ISSUE_TYPES_BY_FORMAT as AUDIT_ISSUE_TYPES_BY_FORMAT
from iad_core.consistency.conflict_categories import CONFLICT_CATEGORY_LABELS, CONFLICT_CATEGORY_DESCRIPTIONS
from iad_core.advisory.analysis import VisualEvidence
from iad_core.workbench.analysis_manifest import AnalysisRegistration
from iad_core.audit.delegation_models import AuditResultReference, AuditReviewRequest

AUDIT_ISSUE_LABELS = {kind:CONFLICT_CATEGORY_LABELS[category] for kind,category in ISSUE_CATEGORIES.items()}
AUDIT_ASSESSMENT_LABELS = {'supported':'支持为疑点','unsupported':'不支持为疑点','insufficient':'证据不足'}
AUDIT_CONSISTENCY_LABELS = {'NO_CANDIDATES':'无候选','NO_ELIGIBLE_CANDIDATES':'无有效候选',
    'MODEL_REVIEWED:EQUIVALENT':'标注一致','MODEL_REVIEWED:MATERIAL':'标注冲突','MODEL_REVIEWED:UNCERTAIN':'待核实'}
AUDIT_CONSISTENCY_DESCRIPTIONS = {
    'NO_CANDIDATES':'检索没有找到可作对照的其他图像。',
    'NO_ELIGIBLE_CANDIDATES':'找到了候选图，但内容不同，或看不清是否拍的是相同内容，因此没有进入标注比较。',
    'MODEL_REVIEWED:EQUIVALENT':'已有内容相同的对照图，比较后，双方标注的类别、数量和覆盖关系相符。',
    'MODEL_REVIEWED:MATERIAL':'已有内容相同的对照图，比较后发现至少一处标注不同，具体差别按下面的类型归类。',
    'MODEL_REVIEWED:UNCERTAIN':'已有内容相同的对照图，但部分标注关系还需要复看，例如目标的边缘看不清。',
}
AUDIT_ISSUE_DESCRIPTIONS = {kind:CONFLICT_CATEGORY_DESCRIPTIONS[category] for kind,category in ISSUE_CATEGORIES.items()}
AUDIT_ISSUE_DESCRIPTIONS['image_label_mismatch'] = '内容相同的两张图，整图标签不同，例如一张记为OK，另一张记为NG。'
AUDIT_CAPABILITY_LABELS = {'representative_test_set':'代表性测试集','ordinary_normal':'普通正常','hard_normal':'困难良品',
    'near_ok_ng_pair':'相似异标签对','tiny_defect':'微小异常','low_contrast_defect':'低对比异常','structural_relation':'结构关系',
    'missing_component':'缺失','misalignment':'错位','multi_object':'多件与多实例','in_domain':'原域','unseen_batch':'未见批次','lighting_shift':'光照变化'}
AUDIT_COVERAGE_LABELS = {'observed':'已观察到','candidate':'能力候选','not_observed':'未观察到','not_applicable':'不适用'}
AUDIT_DISCOVERY_STATUS_LABELS = {'pending':'待验证','supported':'有支持','disputed':'存在分歧','withdrawn':'已撤回'}
AUDIT_PURPOSE_LABELS = {'exploration':'视觉探索','training_experiment':'训练实验','debug':'内部调试','image_evaluation':'图像级评测',
    'bbox_evaluation':'矩形框定位评测','pixel_evaluation':'像素区域评测','formal_benchmark':'正式评测基准'}
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
    upstream_issue_types: dict[str, AuditCount] = Field(default_factory=dict)
    program_issue_types: dict[IssueType, int] | None = None
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
    role: Literal['representative','counter'] = Field(default='representative',description='representative为典型证据原图；counter为用于解释判断边界的已观察对照原图。')
    reason: NonBlankText = Field(description='用日常用语指出这张原图中该看哪里、看什么。有对照关系的图将role设为counter。')


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
    unresolved_question: str = Field(default='', description='需要新图像或对照才能回答的具体问题；没有则为空字符串。')
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
    reason: NonBlankText = Field(description='该能力实际出现的视觉困难，或尚缺的具体场景。')
    evidence_refs: list[AuditResultReference]
    representatives: list[AuditRepresentative] = Field(default_factory=list)
    missing_conditions: list[str] = Field(default_factory=list, description='仅列该能力特有的使用条件，共同条件留在报告用途章节。')

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
    reason: NonBlankText = Field(description='本用途能开展的具体工作，或需先完成的具体准备，用一句话说明。')


class AuditEvidenceAnalysis(AnalysisModel):
    analysis: NonBlankText = Field(description='围绕现象、共性、差异与判断边界的综合分析，不写逐图详情。')
    evidence_refs: list[AuditResultReference] = Field(description='支撑本项分析的当前有效图级记录。没有相关材料时为空并在正文说明。')
    representatives: list[AuditRepresentative] = Field(default_factory=list,
        description='精选3至8张主Agent已实际观察、能共同解释本段分析的完整原图；对照图设为counter。')
    related_case_ids: list[NonBlankText] = Field(default_factory=list,
        description='按与本段分析的关系和重要程度关联案例，在本段就地复用其原图。')


class AuditCoverageTopic(AuditEvidenceAnalysis):
    title: NonBlankText = Field(description='根据本作业实际观察命名，不加序号，不照搬固定的覆盖主题。')
    evidence_refs: list[AuditResultReference] = Field(min_length=1)


class AuditConsistencyAnalysis(AuditEvidenceAnalysis):
    issue_type: IssueType = Field(description='沿用本数据格式的现有差异类型，每类单独分析，不合并多标少标或拆分合并。')
    title: str = ''
    description: str = Field(default='', description='简短说明该类冲突的实际可见现象。')
    audit_result: str = Field(default='', description='结合当前图证说明本次保留或排除该疑点的具体理由。')


class AuditConsistencyScope(AnalysisModel):
    source_status: Literal['NO_CANDIDATES','NO_ELIGIBLE_CANDIDATES','MODEL_REVIEWED:EQUIVALENT','MODEL_REVIEWED:MATERIAL','MODEL_REVIEWED:UNCERTAIN']
    analysis: NonBlankText = Field(description='只讲这组能否找到可比较的图、相同内容的标注是否一致及具体差异；用日常语言说明。')
    evidence_refs: list[AuditResultReference] = Field(default_factory=list,
        description='每张精选原图都须关联其当前有效图级版本；通常kind为image，sample_id与representatives中的原图一致。')
    representatives: list[AuditRepresentative] = Field(default_factory=list,
        description='从该范围精选3至8张主Agent已实际查看的完整原图；用于比较的图指定counter。')

    @model_validator(mode='after')
    def referenced_originals(self):
        if {item.sample_id for item in self.representatives}-{ref.sample_id for ref in self.evidence_refs}:
            raise ValueError('范围分析的每张精选原图都须在evidence_refs中关联当前有效图级版本')
        return self


class AuditKnowledgeAnalysis(AnalysisModel):
    check_id: NonBlankText
    description: NonBlankText = Field(description='用自然语言概括该知识关注的可见现象和检查动作。')
    applicability: NonBlankText = Field(description='说明本次哪些可见场景适用，哪些不适用。')
    analysis: NonBlankText = Field(description='依据本次实际图像说明观察、对照及与知识的关系。')
    audit_impact: NonBlankText = Field(description='该知识帮助辨认或区分的具体可见现象及其对本次判断的影响。')
    evidence_refs: list[AuditResultReference]
    representatives: list[AuditRepresentative] = Field(default_factory=list)


class AuditReportCase(AnalysisModel):
    case_id: NonBlankText
    title: NonBlankText
    home_section: SkipJsonSchema[Literal['consistency', 'quality', 'coverage', 'independence', 'capability'] | None] = Field(default=None, exclude=True)
    observation: NonBlankText = Field(description='用日常用语指出图里看哪里、看到了什么、标注圈住了什么。')
    comparison: str = Field(default='', description='直接说明图中哪些地方相同或不同，以及为什么这样判断。')
    significance: NonBlankText = Field(description='这些图可以用来检查模型的什么表现，或接下来具体应做什么。')
    evidence_refs: list[AuditResultReference] = Field(min_length=1,
        description='引用具体标注疑点时使用finding及其索引；普通图像比较使用observation、feature或image。')
    representatives: list[AuditRepresentative] = Field(min_length=1)


class AuditCapabilityPoint(AnalysisModel):
    title: NonBlankText
    observation_and_comparison: NonBlankText
    evaluation_value: NonBlankText
    case_ids: list[NonBlankText] = Field(min_length=1,
        description='支撑本能力小点的报告案例，须有主Agent实际观察的完整原图。')


class AuditCapabilityTopic(AnalysisModel):
    title: NonBlankText
    summary: NonBlankText
    capability_tags: list[CapabilityTag] = Field(default_factory=list)
    points: list[AuditCapabilityPoint] = Field(min_length=1)
    missing_conditions: list[str] = Field(default_factory=list)


class AuditReportCommit(AnalysisModel):
    commit_key: NonBlankText
    discovery_ids: list[NonBlankText]
    conclusion: NonBlankText = Field(description='概括当前用途及最重要的视觉发现；图像数、疑点数和来源状态由页面另行展示。')
    consistency_analysis: NonBlankText = Field(description='用一两句直白的话回答可对照图像的标注是否一致，结合程序统计与模型复核统计解释差别。具体图像细节放在对应的小节。')
    knowledge_analysis: str = Field(default='', description='简述知识帮助看到了什么，可留空；各条具体应用在knowledge_analyses展开。')
    coverage_analysis: NonBlankText = Field(description='概括实际可见形态、背景、结构关系及尚缺场景。')
    coverage_topics: list[AuditCoverageTopic] = Field(default_factory=list,
        description='本作业有真实图证的覆盖画像主题，标题、条数、正文及选图由实际作业决定。')
    consistency_analyses: list[AuditConsistencyAnalysis] = Field(default_factory=list,
        description='按上下文applicable_issue_types的每个适用差异类型各一项；零疑点也如实分析，无候选、无有效候选、一致在范围分析中展开。')
    consistency_scopes: list[AuditConsistencyScope] = Field(default_factory=list,
        description='分别解释无候选、无有效候选、标注一致等来源范围。')
    knowledge_analyses: list[AuditKnowledgeAnalysis] = Field(default_factory=list,
        description='逐项覆盖全部所选知识，说明内容、适用性、图证对照及实际作用。')
    independence_analysis: NonBlankText = Field(description='依据真实重复和来源登记说明样本结构，以及尚缺哪些具体登记。')
    capabilities: list[AuditCapability]
    usability: list[AuditUsabilityAssessment]
    review_priorities: list[str] = Field(description='本轮真实保留疑点的复看位置和动作；没有则为空。')
    limitations: list[str] = Field(description='需补充的图像、参考标注、来源登记或划分成果及对应准备动作，同一条件集中说明一次。')
    report_cases: list[AuditReportCase] = Field(default_factory=list,
        description='各分析点关联的图像依据；相同案例供多个分析点复用，页面在对应正文旁直接展示精选原图。')
    capability_topics: list[AuditCapabilityTopic] = Field(default_factory=list,
        description='由实际视觉困难形成的能力专题，每个小点引用有原图的案例；无图证项在缺口中说明。')

    @model_validator(mode='after')
    def complete_purposes(self):
        purposes = [item.purpose for item in self.usability]
        if len(purposes)!=len(AUDIT_PURPOSES) or set(purposes)!=set(AUDIT_PURPOSES):
            raise ValueError('分别评价探索、训练实验、调试、图级、框级、像素级和正式基准用途')
        if len({item.tag for item in self.capabilities})!=len(self.capabilities):
            raise ValueError('能力标签不能重复')
        if len({item.issue_type for item in self.consistency_analyses}) != len(self.consistency_analyses):
            raise ValueError('一致性分类分析不能重复')
        if len({item.source_status for item in self.consistency_scopes}) != len(self.consistency_scopes):
            raise ValueError('一致性范围分析不能重复')
        if len({item.check_id for item in self.knowledge_analyses}) != len(self.knowledge_analyses):
            raise ValueError('知识分析不能重复')
        case_ids = {item.case_id for item in self.report_cases}
        if len(case_ids) != len(self.report_cases):
            raise ValueError('报告案例编号不能重复')
        links = [item.related_case_ids for item in [*self.coverage_topics, *self.consistency_analyses]]
        links.extend(point.case_ids for topic in self.capability_topics for point in topic.points)
        if any(set(identities) - case_ids for identities in links):
            raise ValueError('报告分析只能引用本次提交中存在的案例')
        return self


class AuditReportSession(AnalysisModel):
    job_id: str
    session_id: str
    session_created: bool
    state: JobStatus
    result: AuditReportCommit | None
    error: str | None
    revision: int = 0
    discoveries: list[AuditDiscovery] = Field(default_factory=list)


class AuditReportEvidenceQuery(AnalysisModel):
    sample_id: NonBlankText
    evidence_id: NonBlankText
