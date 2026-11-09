from typing import Annotated, Literal
from uuid import UUID

from pydantic import Field, RootModel, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText, VisualEvidence
from iad_core.exploration.models import DirectionContent, FrozenExplorationPrompt
from iad_core.knowledge.instructions import MiningDirection
from iad_core.knowledge.instructions import FrozenMiningPrompt, MiningDirectionSource, SubmittedMiningPrompt
from iad_core.knowledge.models import EvidenceSupportedCheck, KnowledgeSupportPolicy, LearnedCheck, KnowledgeCheckRemoval, KnowledgeCheckReview, KnowledgeCheckSummary, KnowledgeEvidence
from iad_core.workbench.analysis_manifest import AnalysisManifest, AnalysisModule, AnalysisPlan, AnalysisRegistration, AnalysisRound
from iad_core.workbench.analysis_requests import SelectedDatasets
from iad_core.workbench.analysis_sampling import SamplingGroup
from iad_core.workbench.model_profile import FrozenModelRole
from iad_core.workbench.module_settings import ExplorationSettingsValues, KnowledgeSettingsValues
from iad_core.workbench.calls import ModelCallError


class ExplorationAgentStart(SelectedDatasets):
    submission_id: UUID
    analysis_kind: Literal['exploration'] = 'exploration'
    normal_images: list[str] = Field(default_factory=list)
    defect_images: list[str] = Field(default_factory=list)
    prompt: FrozenExplorationPrompt
    system_prompt: NonBlankText | None = None

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
    schema_version: Literal[1] = 1
    manifest: AnalysisManifest
    plan: AnalysisPlan
    agent: FrozenModelRole
    instruction: NonBlankText
    system_prompt: NonBlankText | None = None
    exploration_prompt: FrozenExplorationPrompt | None = None
    mining_prompt: FrozenMiningPrompt | None = None
    selected_directions: list[FrozenAnalysisDirection] = Field(default_factory=list)
    support_policy: KnowledgeSupportPolicy


class ProposedAnalysisDirection(DirectionContent):
    direction_id: NonBlankText
    dataset_ids: list[str] = Field(min_length=1)
    counter_evidence_ids: list[str] = Field(default_factory=list)


class AnalysisDirection(ProposedAnalysisDirection):
    predecessor_direction_ids: list[str] = Field(default_factory=list)


class ProposedAnalysisCheck(LearnedCheck):
    check_id: NonBlankText
    direction_refs: list[str] = Field(min_length=1)
    dataset_ids: list[str] = Field(min_length=1)


class AnalysisKnowledgeCheck(ProposedAnalysisCheck, EvidenceSupportedCheck):
    independent_source_count: int = Field(ge=0)
    predecessor_check_ids: list[str] = Field(default_factory=list)


class AnalysisCatalog(AnalysisModel):
    summary: str = ''
    directions: list[AnalysisDirection] = Field(default_factory=list)
    checks: list[AnalysisKnowledgeCheck] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    unresolved_questions: list[str] = Field(default_factory=list)


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


class AnalysisDirectionObservation(AnalysisModel):
    direction_ref: NonBlankText
    status: Literal['applicable', 'not_applicable', 'uncertain']
    reason: NonBlankText


class AnalysisSampleObservation(AnalysisModel):
    dataset_id: NonBlankText
    sample_id: NonBlankText
    description: NonBlankText
    evidence_ids: list[str]
    directions: list[AnalysisDirectionObservation] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    report_preparation_error: bool = False


class AnalysisObservationRecord(AnalysisSampleObservation):
    observation_id: str
    round_id: int
    revision: int


class AnalysisObservationQuery(AnalysisModel):
    sample_id: NonBlankText | None = None
    direction_ref: NonBlankText | None = None
    round_id: int | None = Field(default=None,ge=1,strict=True)
    page: int = Field(default=1,ge=1)
    page_size: int = Field(default=10,ge=1,le=50)


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


class AnalysisCommit(AnalysisModel):
    commit_key: NonBlankText
    base_revision: int = Field(ge=0, strict=True)
    round_id: int = Field(ge=1, strict=True)
    observations: list[AnalysisSampleObservation] = Field(
        description='本次新增或补充的实际逐图观察，可分次提交；无需重复输出已保存的观察。')
    summary: str
    limitations: list[str]
    unresolved_questions: list[str]
    merges: list[AnalysisCatalogMerge] = Field(default_factory=list)


CATALOG_EDITS_DESCRIPTION = ('JSON数组，不是包含JSON的字符串。只提交新增或修改的完整条目，'
    '未变条目由服务端保留，无目录变化时传[]。条目仅引用关键代表原图，不累加全部已看图像。')


class ExplorationCommit(AnalysisCommit):
    directions: list[ProposedAnalysisDirection] = Field(description=CATALOG_EDITS_DESCRIPTION)


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


class AnalysisRecordCoverage(AnalysisModel):
    dataset_id: str
    sample_id: str
    state: Literal['completed', 'failed', 'unprocessed']
    required_media: list[VisualEvidence]
    supplemental_media: list[VisualEvidence] = Field(default_factory=list)
    observed_evidence_ids: list[str]
    source_error: str | None

    @property
    def media(self) -> list[VisualEvidence]:
        return [*self.required_media,*self.supplemental_media]


class AnalysisCoverage(AnalysisModel):
    total: int
    completed: int
    failed: int
    unprocessed: int
    prepared_visuals: int
    observed_visuals: int
    whole_images_observed: int
    records: list[AnalysisRecordCoverage]


class AnalysisAgentContext(AnalysisWorkflowState):
    round: AnalysisRound | None
    registrations: list[AnalysisRegistration]
    selected_directions: list[FrozenAnalysisDirection]
    completed_sample_ids: list[str]
    failed_sample_ids: list[str]
    accepted_observations: list[AnalysisObservationRecord]
    media_progress: list[AnalysisRecordCoverage]
    catalog_counts: AnalysisCatalogCounts


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
    model_call_ids: list[str] | None = None
    session_id: str | None = None
    parent_version_id: str | None = None
    manual_edit: KnowledgeCheckRemoval | None = None
    inherited_reviews: dict[str, KnowledgeCheckReview] = Field(default_factory=dict)


class AnalysisEvidenceView(AnalysisModel):
    evidence_id: str
    sample_id: str
    dataset_id: str
    filename: str
    candidate_role: Literal['normal', 'defect'] | None
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


class AnalysisSourceCatalog(AnalysisModel):
    items: list[AnalysisSource]


class AnalysisResults(AnalysisModel):
    publication: AnalysisPublicationView | None = None


class PublishedDirectionChoice(MiningDirection):
    summary: str
    limitations: list[str]


class PublishedDirectionCatalog(AnalysisModel):
    directions: list[PublishedDirectionChoice]
