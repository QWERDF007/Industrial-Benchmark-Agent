from typing import Literal

from pydantic import Field, FiniteFloat

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.annotation_models import AnnotationComparison
from iad_core.consistency.errors import ConsistencyErrorCode
from iad_core.consistency.models import (ConsistencyCoverage, Count, CoverageCount, Identifier,
    ImageQuery, Mode, PixelComparison, Relation)
from iad_core.storage.models import QualityStatus
from iad_core.duplicate.verification_models import NearVerification, RegionPixelStatistics, Registration


class RetrievalOrigin(AnalysisModel):
    branch: Literal['exact', 'visual']
    rank: int = Field(ge=1)
    score: FiniteFloat | None = None
    profile_id: Identifier | None = None


class RetrievalMember(AnalysisModel):
    sample_id: Identifier
    dataset_id: Identifier
    quality_status: QualityStatus
    relation: Relation
    pixel: PixelComparison
    near: NearVerification | None = None
    local: RegionPixelStatistics | None = None
    registration: Registration | None = None
    annotation: AnnotationComparison | None = None
    error_code: ConsistencyErrorCode | None = None
    reason: str | None = None


class RetrievalGroup(AnalysisModel):
    content_group_id: Identifier
    origins: list[RetrievalOrigin]
    member_count: Count
    conflict_count: Count
    members: list[RetrievalMember]
    next_member_cursor: Identifier | None = None


class RetrievalBranchPage(AnalysisModel):
    status: Literal['READY', 'PARTIAL', 'NOT_READY', 'UNSUPPORTED', 'NOT_REQUESTED']
    corpus_coverage: CoverageCount
    groups: list[RetrievalGroup] = Field(default_factory=list)
    group_count: Count = 0
    member_count: Count = 0
    next_cursor: Identifier | None = None
    error_code: ConsistencyErrorCode | None = None
    reason: str | None = None


class RetrievalPage(AnalysisModel):
    query: ImageQuery
    scope_id: Identifier
    mode: Mode
    profile_id: Identifier | None = None
    exact: RetrievalBranchPage
    visual: RetrievalBranchPage
    coverage: ConsistencyCoverage
    group_count: Count
    member_count: Count
    visual_k: Count
    retrieval_completeness: Literal['EXACT_SCOPE', 'TOP_K', 'PARTIAL']


class RetrievalCursor(AnalysisModel):
    revision: Identifier
    branch: Literal['exact', 'visual']
    group_offset: Count
    member_offset: Count = 0


class RetrievalPaging(AnalysisModel):
    group_page_size: int = Field(default=20, ge=1, le=200)
    member_page_size: int = Field(default=24, ge=1, le=200)
