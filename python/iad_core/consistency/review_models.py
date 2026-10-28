from typing import Annotated, Literal
from uuid import UUID

from pydantic import AwareDatetime, Field, FiniteFloat, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.consistency.evidence_models import EvidenceSourceStates
from iad_core.consistency.models import Identifier
from iad_core.storage.models import ReviewDecisionRecord


class ConfirmDifference(AnalysisModel):
    kind: Literal['CONFIRM_DIFFERENCE']


class ExpectedPolicyDifference(AnalysisModel):
    kind: Literal['EXPECTED_POLICY_DIFFERENCE']


class NeedsContext(AnalysisModel):
    kind: Literal['NEEDS_CONTEXT']


class QualityTarget(AnalysisModel):
    sample_id: Identifier
    quality: Literal['PASS', 'FAIL', 'HARD_NORMAL', 'UNCERTAIN']


class SetEffectiveQuality(AnalysisModel):
    kind: Literal['SET_EFFECTIVE_QUALITY']
    targets: list[QualityTarget] = Field(min_length=1, max_length=2)

    @model_validator(mode='after')
    def distinct_targets(self):
        if len({target.sample_id for target in self.targets}) != len(self.targets):
            raise ValueError('Quality targets must be distinct')
        return self


class BoxProposal(AnalysisModel):
    kind: Literal['bbox']
    coordinates: tuple[FiniteFloat, FiniteFloat, FiniteFloat, FiniteFloat]

    @model_validator(mode='after')
    def positive_area(self):
        x1, y1, x2, y2 = self.coordinates
        if not (0 <= x1 < x2 and 0 <= y1 < y2):
            raise ValueError('Proposed box must have positive area and nonnegative coordinates')
        return self


class PolygonProposal(AnalysisModel):
    kind: Literal['polygon']
    points: list[tuple[FiniteFloat, FiniteFloat]] = Field(min_length=3, max_length=10000)

ProposedGeometry = Annotated[BoxProposal | PolygonProposal, Field(discriminator='kind')]


class AddRegion(AnalysisModel):
    operation: Literal['add']
    sample_id: Identifier
    category: Identifier
    geometry: ProposedGeometry


class RemoveRegion(AnalysisModel):
    operation: Literal['remove']
    sample_id: Identifier
    annotation_id: Identifier


class RelabelRegion(RemoveRegion):
    operation: Literal['relabel']
    category: Identifier


class ReshapeRegion(RemoveRegion):
    operation: Literal['reshape']
    geometry: ProposedGeometry


RegionChange = Annotated[AddRegion | RemoveRegion | RelabelRegion | ReshapeRegion, Field(discriminator='operation')]


class ProposeRegionChange(AnalysisModel):
    kind: Literal['PROPOSE_REGION_CHANGE']
    changes: list[RegionChange] = Field(min_length=1, max_length=100)


ReviewAction = Annotated[ConfirmDifference | ExpectedPolicyDifference | NeedsContext | SetEffectiveQuality | ProposeRegionChange, Field(discriminator='kind')]


class ConsistencyReviewSubmission(AnalysisModel):
    client_request_id: UUID
    evidence_id: Identifier
    result_id: Identifier
    difference_ids: list[Identifier] = Field(min_length=1, max_length=100)
    reviewer: NonBlankText
    comment: NonBlankText
    action: ReviewAction

    @model_validator(mode='after')
    def distinct_differences(self):
        if len(set(self.difference_ids)) != len(self.difference_ids):
            raise ValueError('Difference references must be distinct')
        return self


class ConsistencyDecision(AnalysisModel):
    decision_id: Identifier
    request: ConsistencyReviewSubmission
    review_decision_ids: list[Identifier]
    submitted_at: AwareDatetime


ReviewState = Literal['OPEN', 'NEEDS_CONTEXT', 'RESOLVED']
CorrectionState = Literal['NOT_REQUIRED', 'PROPOSED', 'AWAITING_RESCAN', 'VERIFIED']


class DifferenceReview(AnalysisModel):
    difference_id: Identifier
    review_state: ReviewState
    correction_state: CorrectionState
    decision_id: Identifier | None = None
    correction_decision_id: Identifier | None = None


class ConsistencyReviewContext(AnalysisModel):
    evidence_id: Identifier
    result_id: Identifier
    source_states: EvidenceSourceStates
    differences: list[DifferenceReview]
    decisions: list[ConsistencyDecision]
    review_events: list[ReviewDecisionRecord]
    corrections: list['CorrectionCheck'] = Field(default_factory=list)


class CorrectionVerification(AnalysisModel):
    client_request_id: UUID
    decision_id: Identifier
    evidence_id: Identifier
    reviewer: NonBlankText


class CorrectionCheck(AnalysisModel):
    check_id: Identifier
    request: CorrectionVerification
    correction_state: Literal['AWAITING_RESCAN', 'VERIFIED']
    reason: str
    checked_at: AwareDatetime
