from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
from sqlite3 import Connection
from contextlib import nullcontext

from pydantic import BaseModel, ConfigDict, Field, field_validator

from iad_core.storage.database import Database
from iad_core.dataset.registry import DatasetRegistry
from iad_core.storage.models import ReviewSession, ReviewDecisionRecord, ReviewDecisionEnum, ReviewHistoryRecord
from iad_core.storage.review_repository import ReviewRepository


class ReviewSubmission(BaseModel):
    model_config = ConfigDict(extra="forbid")
    submission_id: UUID
    dataset_id: str
    sample_id: str
    reviewer: str = Field(min_length=1)
    decision: ReviewDecisionEnum
    reason_code: Optional[str] = None
    comment: Optional[str] = None
    duration_ms: int = Field(0, ge=0)
    started_at: Optional[str] = None

    @field_validator("reviewer")
    @classmethod
    def reviewer_name(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Reviewer name is required")
        return value.strip()


class ReviewHistoryQuery(BaseModel):
    model_config = ConfigDict(extra="forbid")
    dataset_id: str
    page: int = Field(1, ge=1)
    page_size: int = Field(24, ge=1, le=200)
    search: str = ""


class ReviewHistoryPage(BaseModel):
    items: list[ReviewHistoryRecord]
    total: int
    page: int
    page_size: int


class HumanReview:
    def __init__(self, db: Database):
        self.db = db
        self.repo = ReviewRepository(db)

    def history(self, query: ReviewHistoryQuery) -> ReviewHistoryPage:
        DatasetRegistry(self.db).get(query.dataset_id)
        items, total = self.repo.history_page(query.dataset_id, (query.page - 1) * query.page_size, query.page_size, query.search)
        return ReviewHistoryPage(items=items, total=total, page=query.page, page_size=query.page_size)

    def submit(self, request: ReviewSubmission, *, connection: Connection | None = None) -> dict:
        with nullcontext(connection) if connection is not None else self.db.connection() as conn:
            if not conn.in_transaction:
                conn.execute("BEGIN IMMEDIATE")
            sample = conn.execute("SELECT task_id,dataset_id FROM samples WHERE sample_id=?", (request.sample_id,)).fetchone()
            if not sample:
                raise LookupError("Sample not found")
            if sample["dataset_id"] != request.dataset_id:
                raise ValueError("Sample does not belong to the selected dataset")
            existing = conn.execute("SELECT * FROM review_decisions WHERE decision_id=?", (str(request.submission_id),)).fetchone()
            submitted_at = existing["submitted_at"] if existing else datetime.now(timezone.utc).isoformat()
            record = ReviewDecisionRecord(
                decision_id=str(request.submission_id), sample_id=request.sample_id,
                reviewer=request.reviewer, decision=request.decision.value,
                reason_code=request.reason_code, comment=request.comment,
                review_session_id="review_" + request.submission_id.hex,
                started_at=request.started_at, submitted_at=submitted_at, review_duration_ms=request.duration_ms,
            )
            saved = self.repo.append_decision(record, connection=conn)
            if not existing:
                self.repo.save_session(ReviewSession(
                    session_id=saved.review_session_id, task_id=sample["task_id"], dataset_id=sample["dataset_id"],
                    reviewer=saved.reviewer, started_at=request.started_at or submitted_at,
                    submitted_at=submitted_at, total_reviewed=1,
                ), connection=conn)
            return saved.model_dump()
