from typing import Annotated
from uuid import UUID

from pydantic import AwareDatetime, Field

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.consistency.models import CandidateLimit, Digest, Identifier
from iad_core.consistency.review_models import ConfirmDifference, NeedsContext, RejectDifference, ReviewDisposition


GroupReviewAction = Annotated[ConfirmDifference | RejectDifference | NeedsContext, Field(discriminator='kind')]
GROUP_REVIEW_DISPOSITIONS: dict[str, ReviewDisposition] = {
    'CONFIRM_DIFFERENCE': 'confirmed', 'REJECT_DIFFERENCE': 'rejected', 'NEEDS_CONTEXT': 'pending',
}


class GroupReviewSubmission(AnalysisModel):
    client_request_id: UUID
    result_fingerprint: Digest
    reviewer: NonBlankText
    comment: NonBlankText
    action: GroupReviewAction


class GroupReviewReference(AnalysisModel):
    candidate_id: Identifier
    assessment_id: CandidateLimit
    evidence_id: Identifier
    result_id: Identifier
    difference_ids: list[Identifier]


class GroupReviewDecision(AnalysisModel):
    decision_id: Identifier
    job_id: Identifier
    anchor_id: Identifier
    request: GroupReviewSubmission
    references: list[GroupReviewReference]
    submitted_at: AwareDatetime


class GroupReviewContext(AnalysisModel):
    job_id: Identifier
    anchor_id: Identifier
    result_fingerprint: Digest
    references: list[GroupReviewReference]
    disposition: ReviewDisposition
    decisions: list[GroupReviewDecision]
