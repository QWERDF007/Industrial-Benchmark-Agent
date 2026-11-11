from typing import Annotated, Literal
from uuid import UUID

from pydantic import Field, RootModel, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText, VisualEvidence, VisualView
from iad_core.exploration.models import DirectionContent, FrozenExplorationPrompt, ExplorationReportReview
from iad_core.evidence.registrations import RegistrationMediaPage
from iad_core.knowledge.instructions import MiningDirection
from iad_core.knowledge.instructions import FrozenMiningPrompt, MiningDirectionSource, SubmittedMiningPrompt
from iad_core.knowledge.models import KnowledgeSupportAssessment, KnowledgeSupportPolicy, LearnedCheck, KnowledgeCheckRemoval, KnowledgeCheckReview, KnowledgeCheckSummary, KnowledgeEvidence
from iad_core.workbench.analysis_manifest import AnalysisManifest, AnalysisModule, AnalysisPlan, AnalysisRegistration, AnalysisRound
from iad_core.workbench.analysis_sources import CandidateRole
from iad_core.workbench.analysis_requests import SelectedDatasets
from iad_core.workbench.analysis_sampling import SamplingGroup
from iad_core.workbench.model_profile import FrozenModelRole
from iad_core.workbench.module_settings import ExplorationSettingsValues, KnowledgeSettingsValues
from iad_core.workbench.calls import ModelCallError
from iad_core.analysis.argument_models import AnalysisArgumentEdit, AnalysisEntrySelection, ArgumentRole
from iad_core.analysis.finalization_state import AnalysisFinalizationProgress
from iad_core.analysis.observation_models import AnalysisDirectionObservation, AnalysisSampleObservation, AnalysisObservationRecord
from iad_core.exploration.observation_models import ExplorationBatchArchive


class AnalysisRolePrompts(AnalysisModel):
    system_prompt: NonBlankText | None
    user_prompt: NonBlankText


class ExplorationAgentStart(SelectedDatasets):
    submission_id: UUID
    analysis_kind: Literal['exploration'] = 'exploration'
    normal_images: list[str] = Field(default_factory=list)
    defect_images: list[str] = Field(default_factory=list)
    prompt: FrozenExplorationPrompt
    system_prompt: NonBlankText | None = None
    observer_prompt: AnalysisRolePrompts | None = None

    @model_validator(mode='after')
    def selected_images(self):
        if not self.normal_images and not self.defect_images:
            raise ValueError('至少选择一张真实候选图像')
        return self


class KnowledgeAgentStart(SelectedDatasets):
    submission_id: UUID
    analysis_kind: Literal['knowledge'] = 'knowledge'
    mining_prompt: SubmittedMiningPrompt
    system_prompt: NonBlankText | None = None

    @model_validator(mode='after')
    def selected_directions(self):
        if not any(direction.enabled for direction in self.mining_prompt.directions):
            raise ValueError('请至少选择一个有效检查方向')
        return self


class AnalysisAgentStart(RootModel[Annotated[ExplorationAgentStart | KnowledgeAgentStart,
        Field(discriminator='analysis_kind')]]):
    pass


class AnalysisScope(AnalysisModel):
    dataset_ids: list[str] = Field(min_length=1)


class AnalysisAgentConfiguration(AnalysisModel):
    module: AnalysisModule
    settings_revision: int
    settings: ExplorationSettingsValues | KnowledgeSettingsValues

    @model_validator(mode='before')
    @classmethod
    def module_settings(cls, value):
        if isinstance(value, dict):
            value = dict(value)
            schema = KnowledgeSettingsValues if value.get('module') == 'knowledge' else ExplorationSettingsValues
            value['settings'] = schema.model_validate(value['settings'])
        return value


class FrozenAnalysisDirection(AnalysisModel):
    ref: str
    source: MiningDirectionSource
    source_title: str
    source_instruction: str
    title: NonBlankText
    instruction: NonBlankText
    source_summary: str = ''
    source_limitations: list[str] = Field(default_factory=list)
    source_dataset_ids: list[str] = Field(default_factory=list)
    source_evidence_ids: list[str] = Field(default_factory=list)
    source_counter_evidence_ids: list[str] = Field(default_factory=list)


class KnowledgeCheckEvidencePage(AnalysisModel):
    version_id: str
    dataset_id: str
    check: KnowledgeCheckSummary
    directions: list[FrozenAnalysisDirection]
    support_evidence_ids: list[str]
    counter_evidence_ids: list[str]
    total: int
    page: int
    page_size: int
    items: list[KnowledgeEvidence]


class AnalysisWorkflowSnapshot(AnalysisAgentConfiguration):
    schema_version: Literal[1, 2] = 1
    manifest: AnalysisManifest
    plan: AnalysisPlan
    agent: FrozenModelRole
    instruction: NonBlankText
    system_prompt: NonBlankText | None = None
    observer_prompt: AnalysisRolePrompts | None = None
    finalization_instruction: NonBlankText | None = None
    exploration_prompt: FrozenExplorationPrompt | None = None
    mining_prompt: FrozenMiningPrompt | None = None
    selected_directions: list[FrozenAnalysisDirection] = Field(default_factory=list)
    support_policy: KnowledgeSupportPolicy
    input_organization: Literal['registration-tools', 'exploration-batch-v2'] = 'registration-tools'
    exploration_review_policy: Literal['comparative-v1'] | None = None
    execution_mode: Literal['serial', 'dsh-subagents'] = 'serial'


class ProposedAnalysisDirection(DirectionContent, AnalysisEntrySelection):
    direction_id: NonBlankText
    dataset_ids: list[str] = Field(min_length=1)
    counter_evidence_ids: list[str] = Field(default_factory=list)


class AnalysisDirection(ProposedAnalysisDirection):
    predecessor_direction_ids: list[str] = Field(default_factory=list)


class ProposedAnalysisCheck(LearnedCheck, AnalysisEntrySelection):
    check_id: NonBlankText
    direction_refs: list[str] = Field(min_length=1, description='只引用当前selected_directions中的完整ref。')
    dataset_ids: list[str] = Field(min_length=1, description='仅列当前条目实际有证据的子数据集。')


class AnalysisKnowledgeCheck(ProposedAnalysisCheck, KnowledgeSupportAssessment):
    predecessor_check_ids: list[str] = Field(default_factory=list)


class AnalysisClaimRevision(AnalysisModel):
    claim_revision: int
    revision: int
    reason: str | None
    content: ProposedAnalysisDirection | ProposedAnalysisCheck


class AnalysisClaimHistory(AnalysisModel):
    job_id: str
    entry_id: str
    revision: int
    total: int
    offset: int
    next_offset: int | None
    items: list[AnalysisClaimRevision]


class AnalysisCatalog(AnalysisModel):
    summary: str = ''
    directions: list[AnalysisDirection] = Field(default_factory=list)
    checks: list[AnalysisKnowledgeCheck] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    unresolved_questions: list[str] = Field(default_factory=list)

    @property
    def entry_ids(self) -> list[str]:
        return [item.direction_id for item in self.directions] + [item.check_id for item in self.checks]


class AnalysisCatalogCounts(AnalysisModel):
    directions: int
    checks: int


class AnalysisCatalogQuery(AnalysisModel):
    section: Literal['directions','checks']
    ids: list[NonBlankText] = Field(default_factory=list)
    offset: int = Field(default=0,ge=0,strict=True)
    limit: int = Field(default=20,ge=1,le=100,strict=True)


class AnalysisCatalogPage(AnalysisModel):
    job_id: str
    revision: int
    section: Literal['directions','checks']
    total: int
    offset: int
    next_offset: int | None
    items: list[AnalysisDirection | AnalysisKnowledgeCheck]


class AnalysisWorkflowState(AnalysisModel):
    job_id: str
    session_id: str
    session_created: bool
    revision: int
    catalog: AnalysisCatalog


class AnalysisSessionLocation(AnalysisModel):
    job_id: str
    submitted_at: str
    module: AnalysisModule
    round_id: int | None = None


class AnalysisObservationQuery(AnalysisModel):
    entry_id: NonBlankText | None = None
    evidence_role: ArgumentRole | None = None
    sample_id: NonBlankText | None = None
    direction_ref: NonBlankText | None = None
    round_id: int | None = Field(default=None,ge=1,strict=True)
    page: int = Field(default=1,ge=1)
    page_size: int = Field(default=10,ge=1,le=50)

    @model_validator(mode='after')
    def role_requires_claim(self):
        if self.evidence_role is not None and self.entry_id is None:
            raise ValueError('按论据角色查询需指定稳定entry_id')
        return self


class AnalysisObservationPage(AnalysisModel):
    version_id: str
    selected_directions: list[FrozenAnalysisDirection]
    total: int
    page: int
    page_size: int
    items: list[AnalysisObservationRecord]


class AnalysisObservationHistoryPage(AnalysisModel):
    job_id: str
    revision: int
    total: int
    page: int
    page_size: int
    items: list[AnalysisObservationRecord]


class AnalysisCatalogMerge(AnalysisModel):
    target_id: NonBlankText
    source_ids: list[str] = Field(min_length=1)
    reason: NonBlankText


class AnalysisCitationCorrection(AnalysisModel):
    entry_id: NonBlankText
    evidence_id: NonBlankText
    whole_image_id: NonBlankText


class AnalysisCatalogUpdate(AnalysisModel):
    commit_key: NonBlankText = Field(description='本次提交的幂等键；仅相同内容重传复用，修改内容须更换。')
    base_revision: int = Field(ge=0, strict=True,
        description='观察阶段取最新上下文或提交回执的revision；定稿阶段始终取定稿上下文锁定的base_revision。')
    summary: str = Field(description='截至本次提交的整个作业摘要，不写轮次或本批新增。')
    limitations: list[str] = Field(description='整个作业仍有效的实际限制。')
    unresolved_questions: list[str] = Field(description='整个作业仍待核对的问题。')
    merges: list[AnalysisCatalogMerge] = Field(default_factory=list)
    arguments: list[AnalysisArgumentEdit] = Field(default_factory=list,
        description='明确关联条目主张与本场实际观察；新增、解释或移出适用范围都附理由。未提交的历史关系继续保留。')
    citation_corrections: list[AnalysisCitationCorrection] = Field(default_factory=list,
        description='按校验回执显式纠正目录引用，只填条目ID、旧证据ID和同来源完整原图ID；同步更新该条目支持、反例及正文，不重写未变的条目内容。')


class AnalysisCommit(AnalysisCatalogUpdate):
    round_id: int = Field(ge=1, strict=True, description='当前上下文给出的轮次，不能自行推进。')
    observations: list[AnalysisSampleObservation] = Field(
        description='本次新增或补充的实际逐图观察，可分次提交；无需重复输出已保存的观察。')


CATALOG_EDITS_DESCRIPTION = ('JSON数组，不是包含JSON的字符串。只提交新增或修改的完整条目，'
    '未变条目由服务端保留，无目录变化时传[]。支持和反例是完整论据，遗漏不撤销；'
    'arguments说明每项作用，key_evidence另选最多4张展示原图。'
    '正文图像引用写成[工具返回的完整原图evidence_id]，不缩写，不引用裁图。')


class ExplorationCommit(AnalysisCommit):
    directions: list[ProposedAnalysisDirection] = Field(description=CATALOG_EDITS_DESCRIPTION)
    report_reviews: list[ExplorationReportReview] = Field(default_factory=list,
        description='主Agent一次复核当前波全部报告，按各报告round.round_id填写。每份报告的discovery_decisions逐项处理全部候选：new新建、merge兼容归并、reject说明实际依据；无候选时填空数组。')


class KnowledgeCommit(AnalysisCommit):
    checks: list[ProposedAnalysisCheck] = Field(description=CATALOG_EDITS_DESCRIPTION)


class AnalysisCommitReceipt(AnalysisModel):
    commit_key: str
    revision: int
    round_id: int
    observation_ids: list[str]
    completed_delta: int
    failed_delta: int
    round_complete: bool


class AnalysisSourceProgress(AnalysisModel):
    dataset_id: str
    sample_id: str
    state: Literal['completed', 'failed', 'unprocessed']
    observed_evidence_ids: list[str]
    delivered_offsets: list[int] = Field(default_factory=list)
    source_error: str | None


class AnalysisMediaProgress(AnalysisSourceProgress):
    evidence_id: str | None
    required_media: list[VisualView]
    supplemental_media: list[VisualView]


class AnalysisRecordCoverage(AnalysisSourceProgress):
    required_media: list[VisualEvidence]
    supplemental_media: list[VisualEvidence] = Field(default_factory=list)

    @property
    def media(self) -> list[VisualEvidence]:
        return [*self.required_media,*self.supplemental_media]

    def model_context(self) -> AnalysisMediaProgress:
        original = next((image.evidence_id for image in self.media if image.is_whole_image), None)
        return AnalysisMediaProgress(**self.model_dump(include=set(AnalysisSourceProgress.model_fields)), evidence_id=original,
            required_media=[VisualView(**image.model_dump(exclude={'evidence_id'})) for image in self.required_media],
            supplemental_media=[VisualView(**image.model_dump(exclude={'evidence_id'})) for image in self.supplemental_media])


class AnalysisCoverageSummary(AnalysisModel):
    total: int
    completed: int
    failed: int
    unprocessed: int
    prepared_visuals: int
    observed_visuals: int
    whole_images_observed: int


class AnalysisCoverage(AnalysisCoverageSummary):
    records: list[AnalysisRecordCoverage]


class AnalysisAgentContext(AnalysisWorkflowState):
    round: AnalysisRound | None
    registrations: list[AnalysisRegistration]
    selected_directions: list[FrozenAnalysisDirection]
    completed_sample_ids: list[str]
    failed_sample_ids: list[str]
    accepted_observations: list[AnalysisObservationRecord]
    media_progress: list[AnalysisMediaProgress]
    catalog_counts: AnalysisCatalogCounts


class ExplorationBatchMaterials(AnalysisModel):
    context: AnalysisAgentContext
    registrations: list[RegistrationMediaPage]


class AnalysisPublication(AnalysisModel):
    version_id: str
    job_id: str
    module: AnalysisModule
    revision: int
    execution_status: str
    execution_error: ModelCallError | None = None
    created_at: str
    catalog: AnalysisCatalog
    coverage: AnalysisCoverage
    finalization: AnalysisFinalizationProgress | None = None
    model_call_ids: list[str] | None = None
    session_id: str | None = None
    parent_version_id: str | None = None
    manual_edit: KnowledgeCheckRemoval | None = None
    inherited_reviews: dict[str, KnowledgeCheckReview] = Field(default_factory=dict)
    delegations: list[ExplorationBatchArchive] = Field(default_factory=list)

    def display_evidence_ids(self, entry: AnalysisDirection | AnalysisKnowledgeCheck,
                             evidence_role: Literal['support', 'counter'] | None = None) -> list[str]:
        if entry.key_evidence is not None:
            return [item.evidence_id for item in entry.key_evidence
                if evidence_role is None or ('counter' if item.role == 'counter' else 'support') == evidence_role]
        if self.finalization is not None:
            return []
        support_ids = entry.evidence_ids if isinstance(entry, AnalysisDirection) else entry.support_evidence_ids
        return (support_ids if evidence_role == 'support' else entry.counter_evidence_ids
            if evidence_role == 'counter' else [*support_ids, *entry.counter_evidence_ids])


class AnalysisEvidenceView(AnalysisModel):
    evidence_id: str
    sample_id: str
    dataset_id: str
    filename: str
    candidate_role: CandidateRole | None
    sampling_group: SamplingGroup
    image: VisualEvidence
    observed: bool


class AnalysisPublicationView(AnalysisPublication):
    evidence: list[AnalysisEvidenceView]
    selected_directions: list[FrozenAnalysisDirection]
    removed_direction_ids: list[str] = Field(default_factory=list)


class AnalysisSampleEvidence(AnalysisModel):
    version_id: str
    module: AnalysisModule
    registration: AnalysisRegistration
    items: list[AnalysisEvidenceView]


class AnalysisSource(AnalysisModel):
    sample_id: str
    dataset_id: str
    relative_path: str
    candidate_role: CandidateRole | None
    annotation_categories: list[str]


class AnalysisSourceCatalog(AnalysisModel):
    items: list[AnalysisSource]


class AnalysisResults(AnalysisModel):
    publication: AnalysisPublicationView | None = None


class AnalysisJobPrompts(AnalysisModel):
    main: AnalysisRolePrompts
    observer: AnalysisRolePrompts | None = None


class PublishedDirectionChoice(MiningDirection):
    summary: str
    limitations: list[str]


class PublishedDirectionCatalog(AnalysisModel):
    directions: list[PublishedDirectionChoice]
