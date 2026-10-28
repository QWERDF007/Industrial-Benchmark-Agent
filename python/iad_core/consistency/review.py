from datetime import datetime, timezone
from uuid import uuid4, uuid5

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.repository import ConsistencyRepository
from iad_core.consistency.review_models import ConsistencyDecision, ConsistencyReviewContext, ConsistencyReviewSubmission, CorrectionVerification, CorrectionCheck
from iad_core.consistency.review_repository import ConsistencyDecisionRepository
from iad_core.consistency.region_proposals import RegionPlan
from iad_core.consistency.review_states import ReviewStates
from iad_core.storage.review_repository import ReviewRepository
from iad_core.consistency.service import ConsistencyService
from iad_core.evidence.current_sources import CurrentSource
from iad_core.storage.database import Database
from iad_core.workbench.review import HumanReview, ReviewSubmission


class ConsistencyReview:
    def __init__(self, db: Database):
        self.db = db
        self.repository = ConsistencyDecisionRepository(db)

    def context(self, evidence_id: str) -> ConsistencyReviewContext:
        bundle = ConsistencyService(self.db).evidence(evidence_id)
        with self.db.connection() as connection:
            connection.execute('BEGIN')
            decisions = self.repository.history(evidence_id, connection)
            corrections = self.repository.corrections(evidence_id, connection)
            events = {identity: event for decision in decisions for identity in decision.review_decision_ids
                if (event := ReviewRepository(self.db).get_event(identity, connection)) is not None}
        statuses = ReviewStates.project(bundle, decisions, corrections, events)
        return ConsistencyReviewContext(evidence_id=evidence_id, result_id=bundle.result.result_id,
            source_states=bundle.source_states, differences=statuses, decisions=decisions, corrections=corrections, review_events=list(events.values()))

    def submit(self, request: ConsistencyReviewSubmission) -> ConsistencyDecision:
        request = ConsistencyReviewSubmission.model_validate(request)
        with self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            existing = self.repository.request(request, connection)
            if existing:
                return existing
            saved = ConsistencyRepository(self.db).get(request.evidence_id)
            if saved.result.result_id != request.result_id:
                raise ConsistencyError('INVALID_SCOPE', 'Result does not belong to this evidence')
            differences = {item.difference_id for item in saved.result.annotation.differences}
            if not set(request.difference_ids).issubset(differences):
                raise ConsistencyError('INVALID_SCOPE', 'Difference references are outside this evidence')
            reviews = []
            if request.action.kind in ('SET_EFFECTIVE_QUALITY', 'PROPOSE_REGION_CHANGE'):
                sources = {source.sample.sample_id: source for source in (saved.sources.left, saved.sources.right)}
                for source in sources.values():
                    if CurrentSource.capture(self.db, source.sample.sample_id, connection).state(source) != 'CURRENT':
                        raise ConsistencyError('SOURCE_UNAVAILABLE', '来源或人工裁决已变化，请重新比较后提交')
            if request.action.kind == 'PROPOSE_REGION_CHANGE':
                RegionPlan.build(request, saved)
            if request.action.kind == 'SET_EFFECTIVE_QUALITY':
                if any(target.sample_id not in sources for target in request.action.targets):
                    raise ConsistencyError('INVALID_SCOPE', 'Quality targets must be explicit members of this evidence')
                for target in request.action.targets:
                    source = sources[target.sample_id]
                    review = HumanReview(self.db).submit(ReviewSubmission(
                        submission_id=uuid5(request.client_request_id, target.sample_id),
                        dataset_id=source.sample.dataset_id, sample_id=target.sample_id,
                        reviewer=request.reviewer, decision=target.quality,
                        comment=request.comment, reason_code='CONSISTENCY_REVIEW'), connection=connection)
                    reviews.append(review['decision_id'])
            record = ConsistencyDecision(decision_id='consistency_decision_' + uuid4().hex, request=request,
                review_decision_ids=reviews, submitted_at=datetime.now(timezone.utc))
            self.repository.save(record, connection)
            return record

    def verify(self, request: CorrectionVerification) -> CorrectionCheck:
        request = CorrectionVerification.model_validate(request)
        with self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            existing = self.repository.verification(request, connection)
            if existing:
                return existing
            decision = self.repository.get(request.decision_id, connection)
            original = ConsistencyRepository(self.db).get(decision.request.evidence_id)
            current = ConsistencyRepository(self.db).get(request.evidence_id)
            plans = RegionPlan.build(decision.request, original)
            old_sources = {source.sample.sample_id: source for source in (original.sources.left, original.sources.right)}
            new_sources = {source.sample.sample_id: source for source in (current.sources.left, current.sources.right)}
            if old_sources.keys() != new_sources.keys():
                raise ConsistencyError('INVALID_SCOPE', 'Verification must compare the same frozen sample references')
            for source in new_sources.values():
                if CurrentSource.capture(self.db, source.sample.sample_id, connection).state(source) != 'CURRENT':
                    raise ConsistencyError('SOURCE_UNAVAILABLE', '修正验证需要当前扫描的比较证据')
            rescanned = all(new_sources[plan.sample_id].scan_ref != old_sources[plan.sample_id].scan_ref for plan in plans)
            same_images = all(source.source_sha256 == old_sources[identity].source_sha256 for identity, source in new_sources.items())
            same_policy = all(source.annotations.policy == old_sources[identity].annotations.policy for identity, source in new_sources.items())
            verified = (rescanned and same_images and same_policy and current.result.verification.relation == 'EXACT'
                and current.result.annotation.status == 'COMPLETE'
                and not any(diff.type != 'POLICY_UNCONFIRMED' for diff in current.result.annotation.differences)
                and all(plan.applied(current) for plan in plans))
            check = CorrectionCheck(check_id='correction_' + uuid4().hex, request=request,
                correction_state='VERIFIED' if verified else 'AWAITING_RESCAN', checked_at=datetime.now(timezone.utc),
                reason='重扫后原图、规范、建议内容及重新比较均已核实' if verified else '尚无满足原图、规范、建议内容及一致性检查的重扫结果')
            self.repository.save_verification(check, connection)
            return check
