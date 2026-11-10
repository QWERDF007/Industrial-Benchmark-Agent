from typing import Literal
from pydantic import AwareDatetime, Field, FiniteFloat, computed_field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.agent_models import AnchorResult, AnchorState
from iad_core.consistency.agent_review_models import AnchorAssessmentRecord, AnchorObservation, AnchorVisualPlan, AnchorVisualRequest
from iad_core.consistency.candidate_selection import AnchorCandidates, SelectedCandidate
from iad_core.consistency.annotations import AnnotationSet
from iad_core.consistency.group_models import GalleryImage
from iad_core.consistency.conflict_categories import ConflictCategory
from iad_core.consistency.models import CandidateLimit, Count, FrozenSample, Identifier, ModelAssessmentVerdict, ReviewMode, SimilarityThreshold
from iad_core.consistency.review_models import ReviewDisposition
from iad_core.workbench.job_models import JobFailure, JobStatus
from iad_core.workbench.calls import ModelCallSummary
from iad_core.consistency.identity_models import IdentityResultFields, CandidateIdentityRecord
from iad_core.consistency.candidate_records import CandidatePhaseRecord


DiagnosticRecording = Literal['COMPLETE', 'UNAVAILABLE']


class AnchorCandidatePreview(SelectedCandidate):
    image: GalleryImage
    annotations: AnnotationSet


class AnchorCandidatePage(AnalysisModel):
    job_id: Identifier
    anchor_id: Identifier
    items: list[AnchorCandidatePreview]


class AnchorResultSummary(AnalysisModel):
    outcome: IdentityResultFields | None = None
    dataset_format: Literal['labelme', 'folder_classification'] | None = None
    schema_version: Literal[1] = 1
    job_id: Identifier
    anchor_id: Identifier
    session_id: Identifier
    state: AnchorState
    phase: Identifier
    attempt: CandidateLimit
    mode: ReviewMode
    min_similarity: SimilarityThreshold | None
    max_exact_candidates: CandidateLimit
    max_similar_candidates: CandidateLimit | None
    selected_exact: Count | None
    selected_similar: Count | None
    verdict: ModelAssessmentVerdict | None
    reason: Identifier
    categories: list[ConflictCategory]
    conclusion: str | None
    original_categories: list[ConflictCategory]
    original_conclusion: ConflictCategory | None
    program_conclusion: str
    model_conclusion: ConflictCategory | Literal['无冲突'] | None
    result_ref: Identifier


class AnchorImageItem(AnalysisModel):
    sample: FrozenSample
    summary: AnchorResultSummary
    image: GalleryImage | None
    review_state: ReviewDisposition


class AnchorImagePage(AnalysisModel):
    job_id: Identifier
    total: Count
    items: list[AnchorImageItem]


class AnchorEvidenceReference(AnalysisModel):
    candidate_id: Identifier
    evidence_id: Identifier
    result_id: Identifier
    detail_ref: Identifier


class AnchorResultDetail(AnchorResultSummary):
    candidate_records: list[CandidatePhaseRecord] = Field(default_factory=list)
    gates: list[CandidateIdentityRecord] = Field(default_factory=list)
    captured_evidence: list[AnchorEvidenceReference] = Field(default_factory=list)
    session_created: bool
    trace_state: Literal['OPEN', 'PENDING', 'CLOSED']
    trace_error: str | None
    snapshot_ref: Identifier
    trace_ref: Identifier | None
    diagnostics_ref: Identifier
    candidates: AnchorCandidates | None
    visual_plan: AnchorVisualPlan | None
    result: AnchorResult | None
    requests: list[AnchorVisualRequest]
    observations: list[AnchorObservation]
    assessments: list[AnchorAssessmentRecord]
    evidence: list[AnchorEvidenceReference]
    errors: list[JobFailure]
    error_history: list[JobFailure]


class ModelRoleDiagnostics(AnalysisModel):
    recording: DiagnosticRecording
    recorded_requests: Count
    requests: Count | None
    generation_requests: Count | None
    tokenization_requests: Count | None
    failed_requests: Count | None
    in_flight_requests: Count | None
    unknown_outcomes: Count | None
    usage_missing: Count
    input_tokens: Count | None = Field(description='生成请求完整输入计数，包含缓存；任一调用不可得时为null')
    output_tokens: Count | None
    total_tokens: Count | None
    cost: FiniteFloat | None = Field(default=None, description='来源未提供实际费用时为null，不以单价估算替代')

    @classmethod
    def capture(cls, calls: list[ModelCallSummary], *, complete: bool) -> 'ModelRoleDiagnostics':
        generated = [call for call in calls if call.operation == 'generate']
        tokens = []
        for call in generated:
            usage = call.usage or {}
            if call.source == 'native_llm':
                output, total = usage.get('outputTokens'), usage.get('totalTokens')
                input_count = total - output if total is not None and output is not None else None
            else:
                input_count = usage.get('input_tokens', usage.get('prompt_tokens'))
                output = usage.get('output_tokens', usage.get('completion_tokens'))
                total = usage.get('total_tokens')
            tokens.append((input_count, output, total))
        totals = [sum(values) if complete and all(value is not None for value in values) else None
            for values in zip(*tokens)] if tokens else ([0, 0, 0] if complete else [None, None, None])
        return cls(recording='COMPLETE' if complete else 'UNAVAILABLE', recorded_requests=len(calls),
            requests=len(calls) if complete else None,
            generation_requests=len(generated) if complete else None,
            tokenization_requests=sum(call.operation == 'tokenize' for call in calls) if complete else None,
            failed_requests=sum(bool(call.error and call.error.type != 'WorkerInterrupted') or
                call.http_status is not None and call.http_status >= 400 for call in calls) if complete else None,
            in_flight_requests=sum(call.finished_at is None for call in calls) if complete else None,
            unknown_outcomes=sum(bool(call.error and call.error.type == 'WorkerInterrupted') for call in calls) if complete else None,
            usage_missing=sum(call.usage is None for call in generated),
            input_tokens=totals[0], output_tokens=totals[1], total_tokens=totals[2])


class ModelRolesDiagnostics(AnalysisModel):
    agent: ModelRoleDiagnostics
    vision: ModelRoleDiagnostics


class AnchorPhaseTiming(AnalysisModel):
    attempt: CandidateLimit
    phase: Identifier
    state: AnchorState
    started_at: AwareDatetime
    ended_at: AwareDatetime | None

    @computed_field(description='仅可靠结束时间对应的阶段耗时；运行中或中断点未知时为null。')
    @property
    def duration_seconds(self) -> float | None:
        return (self.ended_at - self.started_at).total_seconds() if self.ended_at is not None else None


class AnchorDiagnostics(AnalysisModel):
    schema_version: Literal[1] = 1
    job_id: Identifier
    anchor_id: Identifier
    session_id: Identifier
    attempt: CandidateLimit
    state: AnchorState
    phase: Identifier
    phase_recording: DiagnosticRecording
    phases: list[AnchorPhaseTiming]
    roles: ModelRolesDiagnostics
    calls: list[ModelCallSummary]


class ConsistencyCheckReport(AnalysisModel):
    schema_version: Literal[1] = 1
    job_id: Identifier
    status: JobStatus
    total: Count
    completed: Count
    no_candidates: Count
    original_conflicts: Count
    states: dict[AnchorState, Count]
    verdicts: dict[ModelAssessmentVerdict, Count]
    original_categories: dict[ConflictCategory, Count]
    model_categories: dict[str, Count]
    agreement: dict[Literal['一致', '不一致'], Count]


class AnchorResultPage(AnalysisModel):
    job_id: Identifier
    total: Count
    items: list[AnchorResultSummary]
