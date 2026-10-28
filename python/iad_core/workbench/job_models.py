from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, computed_field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.storage.models import sample_uuid
from iad_core.workbench.calls import ModelCallSummary
from iad_core.knowledge.instructions import FrozenMiningPrompt
from iad_core.workbench.model_profile import ModelProfileSnapshot
from iad_core.exploration.models import FrozenExplorationPrompt, ExplorationStart
from iad_core.feature.profiles import EmbeddingProfile

JobStatus = Literal['PENDING', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED', 'INTERRUPTED']


class JobObservationProgress(AnalysisModel):
    planned_sources: int = Field(ge=0)
    observed_sources: int = Field(ge=0)
    complete_sources: int = Field(ge=0)
    planned_visuals: int = Field(ge=0)
    observed_visuals: int = Field(ge=0)
    published_sources: int = Field(ge=0)


JobKind = Literal['MODEL_AUDIT', 'NORMAL_KNOWLEDGE', 'DEFECT_KNOWLEDGE', 'DIRECTION_EXPLORATION', 'IMAGE_INDEX', 'DATA_CONSISTENCY']


class JobRetry(BaseModel):
    model_config = ConfigDict(extra='forbid')
    run_id: str
    sample_ids: Optional[list[str]] = None


class JobSample(AnalysisModel):
    sample_id: str
    relative_path: Optional[str] = None

    @computed_field
    @property
    def sample_uuid(self) -> str:
        return sample_uuid(self.sample_id)


class JobFailure(JobSample):
    message: str
    code: Optional[str] = None


class RetrySample(JobSample):
    state: Literal['failed', 'unprocessed']


class JobRetryOptions(AnalysisModel):
    run_id: str
    root_run_id: str
    selection_mode: Literal['subset', 'all_sources']
    active_run_id: Optional[str]
    samples: list[RetrySample]


class JobSnapshot(AnalysisModel):
    model_config = ConfigDict(extra='allow')

    run_id: str
    task_id: str
    dataset_id: str
    job_type: JobKind
    origin_session_id: Optional[str] = None
    root_run_id: str
    parent_run_id: Optional[str] = None
    status: JobStatus
    observation_progress: Optional[JobObservationProgress] = None
    cancel_requested: bool = False
    sample_ids: list[str]
    completed_sample_ids: list[str]
    failed_sample_ids: list[str]
    completed: int = Field(ge=0)
    failed: int = Field(ge=0)
    total_samples: int = Field(ge=1)
    unprocessed: int = Field(ge=0)
    progress: float = Field(ge=0, le=1)
    message: str
    submitted_at: str
    started_at: Optional[str]
    finished_at: Optional[str]
    deleted_at: Optional[str] = None
    model_name: Optional[str] = None
    model_profile: Optional[ModelProfileSnapshot] = None
    embedding_profile: Optional[EmbeddingProfile] = None
    current_sample: Optional[JobSample] = None
    phase: Optional[str] = None
    phase_started_at: Optional[str] = None
    prepared_sources: int = Field(default=0, ge=0)
    queue_position: Optional[int] = Field(default=None, ge=1)
    normal_version_id: Optional[str] = None
    defect_version_id: Optional[str] = None
    kind: Optional[Literal['normal', 'defect']] = None
    knowledge_version_id: Optional[str] = None
    exploration_version_id: Optional[str] = None
    exploration_prompt: Optional[FrozenExplorationPrompt] = None
    exploration_request: Optional[ExplorationStart] = None
    mining_prompt: Optional[FrozenMiningPrompt] = None
    inspected_regions: Optional[int] = None
    planned_regions: Optional[int] = None
    completed_batches: Optional[int] = None
    total_batches: Optional[int] = None
    errors: list[JobFailure]
    model_calls: list[ModelCallSummary]
