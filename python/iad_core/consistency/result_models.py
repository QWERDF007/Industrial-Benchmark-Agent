from typing import Annotated,Literal

from pydantic import AwareDatetime,Field,computed_field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.evidence_models import ConsistencyResult,EvidenceSourceStates
from iad_core.consistency.models import AllRegisteredScope,ConsistencyScopesSnapshot,ConsistencyScopesSummary,CorpusScope,Count,CoverageCount,DifferenceType,Identifier,Mode,Relation,ScopeSelector
from iad_core.consistency.review_models import ReviewState, CorrectionState
from iad_core.gold.readiness import GoldAvailability

FactState=Literal['CURRENT','HISTORICAL','UNKNOWN']
ExecutionCompleteness=Literal['EXACT_SCOPE','TOP_K','PARTIAL','INDEX_ONLY']


class BatchSelection(AnalysisModel):
    kind: Literal['batch'] = 'batch'
    batch_id: Identifier


class ScopeSelection(AnalysisModel):
    kind: Literal['scope'] = 'scope'
    subjects: ScopeSelector
    corpus_scope: CorpusScope = Field(default_factory=AllRegisteredScope)
    facts: FactState = 'CURRENT'
    mode: Mode = 'exact'
    profile_id: Identifier | None = None


ResultSelection=Annotated[BatchSelection | ScopeSelection,Field(discriminator='kind')]


class ConsistencyQuery(AnalysisModel):
    selection: ResultSelection
    annotation_differences_only: bool = False
    relation: Relation | None = None
    confirmed_conflict: bool | None = None
    difference_type: DifferenceType | None = None
    review_state: ReviewState | None = None
    correction_state: CorrectionState | None = None
    cursor: str | None = Field(default=None,max_length=2048)
    page_size: int = Field(default=50,ge=1,le=100,strict=True)


class ResultSummary(AnalysisModel):
    sample_a: Identifier
    sample_b: Identifier
    result: ConsistencyResult
    checked_at: AwareDatetime
    facts_state: FactState
    source_states: EvidenceSourceStates
    evidence_available: bool


class FactCounts(AnalysisModel):
    current: Count = 0
    historical: Count = 0
    unknown: Count = 0


class ResultSnapshot(AnalysisModel):
    query_id: Identifier
    query_hash: Identifier
    request: ConsistencyQuery
    scopes: ConsistencyScopesSnapshot
    observed_at: AwareDatetime
    expires_at: AwareDatetime
    facts: FactCounts
    total: Count
    execution: CoverageCount
    corpus: CoverageCount
    mode: Mode | None
    profile_id: Identifier | None
    retrieval_completeness: ExecutionCompleteness
    statistics: 'ReportStatistics'
    gold: GoldAvailability


class ResultPage(AnalysisModel):
    query_id: Identifier
    scopes: ConsistencyScopesSummary
    observed_at: AwareDatetime
    facts: FactCounts
    items: list[ResultSummary]
    total: Count
    next_cursor: Identifier | None = None
    execution: CoverageCount
    corpus: CoverageCount
    mode: Mode | None
    profile_id: Identifier | None
    retrieval_completeness: ExecutionCompleteness


class ResultCursor(AnalysisModel):
    query_id: Identifier
    query_hash: Identifier
    after: Count


class FactStatistics(AnalysisModel):
    pairs: Count = 0
    strict_groups: Count = 0
    strict_members: Count = 0
    confirmed_quality_conflicts: Count = 0
    regional_differences: Count = 0
    policy_unknown: Count = 0
    differences: Count = 0
    invalid_annotation_pairs: Count = 0
    unavailable_evidence_pairs: Count = 0
    pending_review: Count = 0
    pending_correction: Count = 0


class ReportStatistics(AnalysisModel):
    current: FactStatistics = Field(default_factory=FactStatistics)
    historical: FactStatistics = Field(default_factory=FactStatistics)
    unknown: FactStatistics = Field(default_factory=FactStatistics)


class ConsistencyReport(AnalysisModel):
    page: ResultPage
    statistics: ReportStatistics
    pending_review: Count
    pending_correction: Count
    gold: GoldAvailability

    @computed_field
    @property
    def gold_excluded(self) -> Count | None:
        if self.gold.excluded is None or self.gold.conflicts is None:
            return None
        return self.gold.excluded + self.gold.conflicts
