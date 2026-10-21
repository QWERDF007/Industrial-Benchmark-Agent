from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, computed_field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.storage.models import sample_uuid
from iad_core.workbench.calls import ModelCallSummary

JobStatus = Literal['PENDING', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED', 'INTERRUPTED']


class JobObservationProgress(AnalysisModel):
    planned_sources: int = Field(ge=0)
    observed_sources: int = Field(ge=0)
    complete_sources: int = Field(ge=0)
    planned_visuals: int = Field(ge=0)
    observed_visuals: int = Field(ge=0)
    published_sources: int = Field(ge=0)


JobKind = Literal['MODEL_AUDIT', 'NORMAL_KNOWLEDGE', 'DEFECT_KNOWLEDGE']


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
    started_at: Optional[str]
    finished_at: Optional[str]
    model_name: str
    current_sample: Optional[JobSample] = None
    phase: Optional[str] = None
    normal_version_id: Optional[str] = None
    defect_version_id: Optional[str] = None
    kind: Optional[Literal['normal', 'defect']] = None
    knowledge_version_id: Optional[str] = None
    inspected_regions: Optional[int] = None
    planned_regions: Optional[int] = None
    completed_batches: Optional[int] = None
    total_batches: Optional[int] = None
    errors: list[JobFailure]
    model_calls: list[ModelCallSummary]
