from iad_core.consistency.evidence_models import FrozenEvidence
from iad_core.consistency.review_models import ConsistencyDecision, CorrectionCheck, DifferenceReview
from iad_core.storage.models import ReviewDecisionRecord


class ReviewStates:
    @staticmethod
    def project(evidence: FrozenEvidence, decisions: list[ConsistencyDecision], corrections: list[CorrectionCheck],
                reviews: dict[str, ReviewDecisionRecord]) -> list[DifferenceReview]:
        differences = {difference.difference_id: difference for difference in evidence.result.annotation.differences}
        statuses = {identity: DifferenceReview(difference_id=identity, review_state='OPEN', correction_state='NOT_REQUIRED') for identity in differences}
        for decision in decisions:
            kind = decision.request.action.kind
            resolved_quality = False
            if kind == 'SET_EFFECTIVE_QUALITY':
                qualities = {source.sample.sample_id: source.review.decision if source.review else source.sample.quality_status
                    for source in (evidence.sources.left, evidence.sources.right)}
                for identity in decision.review_decision_ids:
                    event = reviews.get(identity)
                    if event:
                        qualities[event.sample_id] = event.decision
                binary = {'PASS': 'normal', 'HARD_NORMAL': 'normal', 'FAIL': 'anomaly'}
                labels = [binary.get(value) for value in qualities.values()]
                resolved_quality = all(labels) and len(set(labels)) == 1
            for identity in decision.request.difference_ids:
                if kind == 'SET_EFFECTIVE_QUALITY' and differences[identity].type != 'QUALITY_LABEL':
                    continue
                if kind == 'NEEDS_CONTEXT':
                    statuses[identity].review_state = 'NEEDS_CONTEXT'
                    statuses[identity].decision_id = decision.decision_id
                    continue
                statuses[identity] = DifferenceReview(difference_id=identity, decision_id=decision.decision_id,
                    correction_decision_id=decision.decision_id if kind == 'PROPOSE_REGION_CHANGE' else None,
                    review_state='OPEN' if kind == 'PROPOSE_REGION_CHANGE' or (kind == 'SET_EFFECTIVE_QUALITY' and not resolved_quality) else 'RESOLVED',
                    correction_state='PROPOSED' if kind in ('CONFIRM_DIFFERENCE', 'PROPOSE_REGION_CHANGE') else 'NOT_REQUIRED')
        for check in corrections:
            for status in statuses.values():
                if status.correction_decision_id == check.request.decision_id:
                    status.correction_state = check.correction_state
                    if check.correction_state == 'VERIFIED' and status.decision_id == check.request.decision_id:
                        status.review_state = 'RESOLVED'
        return list(statuses.values())
