from typing import Annotated, Literal
from dataclasses import dataclass

from pydantic import AwareDatetime, Field, RootModel, model_validator

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.models import ConsistencyCoverage, ConsistencyScopesSnapshot, ConsistencyStart, Count, Identifier, ImageIndexPrepare
from iad_core.feature.profiles import ImageEncoderConfig
from iad_core.workbench.job_models import JobSnapshot, JobStatus
from iad_core.consistency.errors import ConsistencyErrorCode


class BatchStep(AnalysisModel):
    dataset_id: Identifier
    task_id: Identifier
    sample_ids: list[Identifier] = Field(min_length=1)
    kind: Literal['IMAGE_INDEX','DATA_CONSISTENCY']


@dataclass(frozen=True)
class SamplePartition:
    completed: set[str]
    failed: set[str]
    unprocessed: set[str]
    unsupported: set[str]


class BatchPlan(AnalysisModel):
    batch_id: Identifier
    request: ConsistencyStart | ImageIndexPrepare
    fingerprint: Identifier
    kind: Literal['index','consistency']
    scopes: ConsistencyScopesSnapshot
    encoder: ImageEncoderConfig | None = None
    selected_ids: list[Identifier]
    inherited_completed_ids: list[Identifier] = Field(default_factory=list)
    steps: list[BatchStep]
    created_at: AwareDatetime
    root_batch_id: Identifier
    parent_batch_id: Identifier | None = None

    def partition(self,children: list[JobSnapshot]) -> SamplePartition:
        kind='IMAGE_INDEX' if self.kind=='index' else 'DATA_CONSISTENCY'
        selected=set(self.selected_ids)
        completed=(set(self.inherited_completed_ids) | {identity for child in children if child.job_type==kind for identity in child.completed_sample_ids}) & selected
        failed={identity for child in children if child.job_type==kind for identity in child.failed_sample_ids} & selected-completed
        unsupported={error.sample_id for child in children if child.job_type==kind for error in child.errors if error.code=='UNSUPPORTED_IMAGE'} & failed
        return SamplePartition(completed,failed,selected-completed-failed,unsupported)


class BatchFailure(AnalysisModel):
    code: ConsistencyErrorCode
    message: str


class ConsistencyBatch(AnalysisModel):
    batch_id: Identifier
    root_batch_id: Identifier
    parent_batch_id: Identifier | None
    kind: Literal['index','consistency']
    scopes: ConsistencyScopesSnapshot
    status: JobStatus
    cancel_requested: bool
    error: BatchFailure | None = None
    total: Count
    completed: Count
    failed: Count
    unprocessed: Count
    pair_count: Count
    children: list[JobSnapshot]
    created_at: AwareDatetime

    @model_validator(mode='after')
    def partition(self):
        if self.completed+self.failed+self.unprocessed!=self.total:raise ValueError('Batch progress must partition its frozen subjects')
        return self


class Started(AnalysisModel):
    kind: Literal['started'] = 'started'
    batch_id: Identifier
    status: JobStatus


class NoWork(AnalysisModel):
    kind: Literal['no_work'] = 'no_work'
    reason: str
    coverage: ConsistencyCoverage


StartResult = Annotated[Started | NoWork,Field(discriminator='kind')]


class StartResultResponse(RootModel[StartResult]):pass


class ConsistencyBatchReference(AnalysisModel):
    batch_id: Identifier


class ConsistencyBatchRetry(ConsistencyBatchReference):
    request_id: Identifier
    sample_ids: list[Identifier] | None = Field(default=None,min_length=1)


class ConsistencyBatchList(AnalysisModel):
    items: list[ConsistencyBatch]


class BatchResultReference(AnalysisModel):
    sample_a: Identifier
    sample_b: Identifier
    result_id: Identifier
    evidence_id: Identifier
