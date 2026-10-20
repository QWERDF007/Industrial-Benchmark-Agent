import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

from iad_core.storage.database import Database
from iad_core.storage.models import ReviewSession, ReviewDecisionRecord, ReviewDecisionEnum
from iad_core.storage.repositories import ReviewRepository, SampleRepository, TaskRepository


class ReviewSubmission(BaseModel):
    model_config = ConfigDict(extra="forbid")
    session_id: str
    sample_id: str
    decision: ReviewDecisionEnum
    reason_code: Optional[str] = None
    comment: Optional[str] = None
    duration_ms: int = Field(0, ge=0)
    started_at: Optional[str] = None


class HumanReview:
    def __init__(self, db: Database):
        self.db = db
        self.repo = ReviewRepository(db)

    def start(self, task_id: str, reviewer: str, dataset_id: Optional[str] = None) -> dict:
        if not reviewer.strip():
            raise ValueError("Reviewer name is required")
        if not TaskRepository(self.db).get(task_id):
            raise LookupError("Inspection task not found")
        if dataset_id:
            from iad_core.dataset.registry import DatasetRegistry
            DatasetRegistry(self.db).resolve(dataset_id=dataset_id, task_id=task_id)
        session = ReviewSession(session_id="review_" + uuid.uuid4().hex, task_id=task_id,
                                reviewer=reviewer.strip(), dataset_id=dataset_id,
                                started_at=datetime.now(timezone.utc).isoformat())
        self.repo.save_session(session)
        return session.model_dump()

    def submit(self, request: ReviewSubmission) -> dict:
        session = self.repo.get_session(request.session_id)
        if not session:
            raise LookupError("Review session not found")
        if session.submitted_at:
            raise ValueError("Review session has already been closed")
        sample = SampleRepository(self.db).get(request.sample_id)
        if not sample:
            raise LookupError("Sample not found")
        if sample.task_id != session.task_id or (session.dataset_id and sample.dataset_id != session.dataset_id):
            raise ValueError("Sample does not belong to this review session")
        record = ReviewDecisionRecord(
            sample_id=request.sample_id, reviewer=session.reviewer, decision=request.decision.value,
            reason_code=request.reason_code, comment=request.comment, review_session_id=session.session_id,
            started_at=request.started_at, submitted_at=datetime.now(timezone.utc).isoformat(),
            review_duration_ms=request.duration_ms,
        )
        self.repo.save_decision(record)
        session.total_reviewed = len(self.repo.list_decisions_by_session(session.session_id))
        self.repo.save_session(session)
        return record.model_dump()

    def finish(self, session_id: str) -> dict:
        session = self.repo.get_session(session_id)
        if not session:
            raise LookupError("Review session not found")
        session.submitted_at = datetime.now(timezone.utc).isoformat()
        session.total_reviewed = len(self.repo.list_decisions_by_session(session_id))
        self.repo.save_session(session)
        return session.model_dump()
