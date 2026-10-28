from typing import Literal

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.annotation_models import AnnotationDifference
from iad_core.consistency.evidence_models import EvidenceMedia,EvidenceSourceStates
from iad_core.consistency.models import CorpusScope,Count,Identifier,SampleImageQuery
from iad_core.consistency.policy import AnnotationPolicy
from iad_core.consistency.result_models import FactState
from iad_core.duplicate.verification_models import VerificationResult
from iad_core.storage.models import ReviewDecisionRecord,Sample
from iad_core.consistency.review_models import ConsistencyReviewContext


class ConsistencyReturnLocation(AnalysisModel):
    pageId: Literal['industrial-consistency'] = 'industrial-consistency'
    tab: Literal['conflicts','search','groups','jobs'] | None = None
    scope: CorpusScope | None = None
    query: SampleImageQuery | None = None
    batchId: Identifier | None = None
    resultId: Identifier | None = None
    evidenceId: Identifier | None = None
    facts: FactState | None = None
    groupId: Identifier | None = None
    memberId: Identifier | None = None
    differenceId: Identifier | None = None
    returnPage: Identifier | None = None
    sessionId: Identifier | None = None
    groupPage: int | None = Field(default=None,ge=1,strict=True)
    memberPage: int | None = Field(default=None,ge=1,strict=True)


class ConsistencyContextRequest(AnalysisModel):
    evidence_id: Identifier
    result_id: Identifier
    difference_ids: list[Identifier] = Field(default_factory=list,max_length=100)
    return_location: ConsistencyReturnLocation | None = None
    cursor: str | None = Field(default=None,max_length=2048)
    difference_page_size: int = Field(default=3,ge=1,le=10,strict=True)
    max_images: int = Field(default=8,ge=1,le=16,strict=True)
    max_image_bytes: int = Field(default=12*1024*1024,ge=1024,le=64*1024*1024,strict=True)
    max_text_bytes: int = Field(default=32768,ge=2048,le=128*1024,strict=True)


class ContextSource(AnalysisModel):
    sample: Sample
    review: ReviewDecisionRecord | None
    policy: AnnotationPolicy
    annotation_count: Count
    issues: list[str]


class ContextMedia(AnalysisModel):
    descriptor: EvidenceMedia
    sides: list[Literal['left','right']]
    byte_count: Count
    sha256: Identifier


class ConsistencyContext(AnalysisModel):
    evidence_id: Identifier
    result_id: Identifier
    source_states: EvidenceSourceStates
    review_context: ConsistencyReviewContext
    sources: dict[Literal['left','right'],ContextSource]
    verification: VerificationResult
    differences: list[AnnotationDifference]
    total_differences: Count
    requested_differences: Count
    unselected_differences: Count
    remaining_differences: Count
    next_cursor: Identifier | None
    media: list[ContextMedia]
    return_location: ConsistencyReturnLocation
    normalization_note: str


class ContextCursor(AnalysisModel):
    request_hash: Identifier
    after: Count
