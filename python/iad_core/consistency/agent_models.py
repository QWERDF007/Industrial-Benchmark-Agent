from typing import Annotated, Literal
from uuid import UUID

from pydantic import ConfigDict, Field

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.consistency.candidate_selection import AnchorCandidates
from iad_core.consistency.group_analysis_prompts import DEFAULT_CONSISTENCY_PROMPT
from iad_core.consistency.group_analysis_models import GroupAnalysisDraft, GroupPairAssessment
from iad_core.consistency.agent_review_models import AnchorVisualPlan
from iad_core.consistency.identity_models import IdentityResultFields
from iad_core.consistency.conflict_categories import ConflictCategory
from iad_core.consistency.models import (CandidateLimit, ConsistencyRetrievalSettings, Digest,
    ConsistencyScopesSnapshot, CorpusScope, Count, Identifier, ScopeSelector)
from iad_core.consistency.policy import AnnotationPolicy
from iad_core.feature.profiles import ImageEncoderConfig
from iad_core.workbench.analysis_requests import SelectedDatasets
from iad_core.workbench.job_models import JobFailure
from iad_core.workbench.model_profile import FrozenModelRole, ModelLimits
from iad_core.workbench.module_settings import ConsistencySettingsValues, JobConcurrency, ModuleModelReference


class ConsistencyAgentStart(SelectedDatasets, ConsistencyRetrievalSettings):
    submission_id: UUID = Field(description='本次新建检查的稳定提交ID；重传使用同一ID，主动新建使用新ID')
    analysis_kind: Literal['consistency'] = 'consistency'
    instruction: NonBlankText = DEFAULT_CONSISTENCY_PROMPT
    system_prompt: NonBlankText | None = None
    subjects: ScopeSelector | None = None
    corpus_scope: CorpusScope | None = None


class ConsistencyCheckReference(AnalysisModel):
    run_id: Identifier


class ConsistencyAnchorReference(ConsistencyCheckReference):
    anchor_id: Identifier


class ConsistencyCheckResultsQuery(ConsistencyCheckReference):
    page: CandidateLimit = 1
    page_size: CandidateLimit = Field(default=18, le=1000)


class ExactCandidatePolicy(AnalysisModel):
    mode: Literal['exact'] = 'exact'
    min_similarity: None = None
    max_exact_candidates: CandidateLimit
    max_similar_candidates: None = None


class CombinedCandidatePolicy(ConsistencyRetrievalSettings):
    mode: Literal['combined'] = 'combined'


FrozenCandidatePolicy = Annotated[ExactCandidatePolicy | CombinedCandidatePolicy, Field(discriminator='mode')]


class ConsistencyModelRoles(AnalysisModel):
    agent: FrozenModelRole = Field(default_factory=FrozenModelRole)
    vision: FrozenModelRole = Field(default_factory=FrozenModelRole)


class ConsistencyCheckConfiguration(AnalysisModel):
    settings_revision: Count
    settings: ConsistencySettingsValues
    model_limits: ModelLimits


class ConsistencyCheckSnapshot(AnalysisModel):
    model_config = ConfigDict(extra='allow', frozen=True)

    schema_version: Literal[1] = 1
    settings_revision: Count
    concurrency: JobConcurrency = 1
    retrieval: FrozenCandidatePolicy
    scopes: ConsistencyScopesSnapshot
    model: ModuleModelReference | None
    model_limits: ModelLimits
    roles: ConsistencyModelRoles = Field(default_factory=ConsistencyModelRoles)
    image_encoder: ImageEncoderConfig | None
    policies: dict[str, AnnotationPolicy]
    instruction: NonBlankText
    system_prompt: NonBlankText | None = None
    prompt_version: Identifier = 'consistency-anchor-v6'
    pixel_profile: Literal['raw-decoded-v1'] = 'raw-decoded-v1'
    model_call_logging: Literal['native-v1'] | None = None
    phase_logging: Literal['timeline-v1'] | None = None
    review_pipeline: Literal['identity-v4'] | None = None
    prompts: dict[str, NonBlankText] = Field(default_factory=dict)
    dataset_formats: dict[str, Literal['labelme', 'folder_classification']] = Field(default_factory=dict)


class NoCandidateResult(IdentityResultFields):
    schema_version: Literal[1, '4.0'] = 1
    verdict: Literal['EQUIVALENT'] = 'EQUIVALENT'
    reason: Literal['NO_CANDIDATES'] = 'NO_CANDIDATES'
    conclusion: Literal['通过（无候选）'] = '通过（无候选）'
    categories: list[ConflictCategory] = Field(default_factory=list, max_length=0)
    assessments: list[GroupPairAssessment] = Field(default_factory=list, max_length=0)


class NoEligibleResult(NoCandidateResult):
    schema_version: Literal['4.0'] = '4.0'
    reason: Literal['NO_ELIGIBLE_CANDIDATES'] = 'NO_ELIGIBLE_CANDIDATES'
    conclusion: Literal['通过（无有效候选）'] = '通过（无有效候选）'


class ModelReviewedResult(GroupAnalysisDraft, IdentityResultFields):
    schema_version: Literal[1, '4.0'] = 1
    reason: Literal['MODEL_REVIEWED'] = 'MODEL_REVIEWED'
    fingerprint: Digest
    observation_ids: dict[Identifier, list[Identifier]]


AnchorResult = Annotated[NoCandidateResult | NoEligibleResult | ModelReviewedResult, Field(discriminator='reason')]
AnchorState = Literal['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'INTERRUPTED']


class ConsistencyAnchorRun(AnalysisModel):
    job_id: Identifier
    anchor_id: Identifier
    ordinal: Count
    session_id: Identifier
    session_created: bool
    attempt: CandidateLimit = 1
    state: AnchorState
    phase: Identifier
    trace_state: Literal['OPEN', 'PENDING', 'CLOSED'] = 'OPEN'
    trace_error: str | None = None
    candidates: AnchorCandidates | None = None
    visual_plan: AnchorVisualPlan | None = None
    result: AnchorResult | None = None


class AnchorTraceEvent(AnalysisModel):
    schema_version: Literal[1] = 1
    job_id: Identifier
    anchor_id: Identifier
    session_id: Identifier
    attempt: CandidateLimit
    state: AnchorState
    result: AnchorResult | None
    errors: list[JobFailure]
