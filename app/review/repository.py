import sqlite3
from typing import Optional, List, Dict, Any, Set
from app.storage.database import Database
from app.review.schemas import ReviewDecisionRecord


class ReviewDecisionRepository:
    """
    Repository for storing and querying human review decisions.
    Strictly isolated: does NOT mutate samples.quality_status.
    """

    def __init__(self, db: Database):
        self.db = db

    def upsert(self, rec: ReviewDecisionRecord):
        with self.db.connection() as conn:
            conn.execute(
                """
                INSERT INTO review_decisions (
                    sample_id, decision, reviewer, reason_code, comment,
                    evidence_version, review_session_id, started_at, submitted_at,
                    review_duration_ms, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(sample_id, reviewer) DO UPDATE SET
                    decision = excluded.decision,
                    reason_code = excluded.reason_code,
                    comment = excluded.comment,
                    evidence_version = excluded.evidence_version,
                    review_session_id = excluded.review_session_id,
                    started_at = excluded.started_at,
                    submitted_at = excluded.submitted_at,
                    review_duration_ms = excluded.review_duration_ms,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (
                    rec.sample_id,
                    rec.decision,
                    rec.reviewer,
                    rec.reason_code,
                    rec.comment,
                    rec.evidence_version,
                    rec.review_session_id,
                    rec.started_at,
                    rec.submitted_at,
                    rec.review_duration_ms,
                ),
            )

    def get(self, sample_id: str, reviewer: str = "default") -> Optional[ReviewDecisionRecord]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, sample_id, decision, reviewer, reason_code, comment,
                       evidence_version, review_session_id, started_at, submitted_at,
                       review_duration_ms, created_at, updated_at
                FROM review_decisions
                WHERE sample_id = ? AND reviewer = ?
                """,
                (sample_id, reviewer),
            )
            row = cursor.fetchone()
            if not row:
                return None
            return ReviewDecisionRecord(
                id=row["id"],
                sample_id=row["sample_id"],
                decision=row["decision"],
                reviewer=row["reviewer"],
                reason_code=row["reason_code"],
                comment=row["comment"],
                evidence_version=row["evidence_version"],
                review_session_id=row["review_session_id"] if "review_session_id" in row.keys() else None,
                started_at=str(row["started_at"]) if ("started_at" in row.keys() and row["started_at"]) else None,
                submitted_at=str(row["submitted_at"]) if ("submitted_at" in row.keys() and row["submitted_at"]) else None,
                review_duration_ms=row["review_duration_ms"],
                created_at=str(row["created_at"]) if row["created_at"] else None,
                updated_at=str(row["updated_at"]) if row["updated_at"] else None,
            )

    def list_by_task(self, task_id: str, reviewer: Optional[str] = None) -> List[ReviewDecisionRecord]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            if reviewer:
                cursor.execute(
                    """
                    SELECT r.* FROM review_decisions r
                    JOIN samples s ON r.sample_id = s.sample_id
                    WHERE s.task_id = ? AND r.reviewer = ?
                    ORDER BY r.updated_at DESC
                    """,
                    (task_id, reviewer),
                )
            else:
                cursor.execute(
                    """
                    SELECT r.* FROM review_decisions r
                    JOIN samples s ON r.sample_id = s.sample_id
                    WHERE s.task_id = ?
                    ORDER BY r.updated_at DESC
                    """,
                    (task_id,),
                )
            rows = cursor.fetchall()
            return [
                ReviewDecisionRecord(
                    id=r["id"],
                    sample_id=r["sample_id"],
                    decision=r["decision"],
                    reviewer=r["reviewer"],
                    reason_code=r["reason_code"],
                    comment=r["comment"],
                    evidence_version=r["evidence_version"],
                    review_session_id=r["review_session_id"] if "review_session_id" in r.keys() else None,
                    started_at=str(r["started_at"]) if ("started_at" in r.keys() and r["started_at"]) else None,
                    submitted_at=str(r["submitted_at"]) if ("submitted_at" in r.keys() and r["submitted_at"]) else None,
                    review_duration_ms=r["review_duration_ms"],
                    created_at=str(r["created_at"]) if r["created_at"] else None,
                    updated_at=str(r["updated_at"]) if r["updated_at"] else None,
                )
                for r in rows
            ]

    def count_by_decision(self, task_id: str, reviewer: Optional[str] = None) -> Dict[str, int]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            if reviewer:
                cursor.execute(
                    """
                    SELECT r.decision, COUNT(*) FROM review_decisions r
                    JOIN samples s ON r.sample_id = s.sample_id
                    WHERE s.task_id = ? AND r.reviewer = ?
                    GROUP BY r.decision
                    """,
                    (task_id, reviewer),
                )
            else:
                cursor.execute(
                    """
                    SELECT r.decision, COUNT(*) FROM review_decisions r
                    JOIN samples s ON r.sample_id = s.sample_id
                    WHERE s.task_id = ?
                    GROUP BY r.decision
                    """,
                    (task_id,),
                )
            return {row[0]: row[1] for row in cursor.fetchall()}

    def get_reviewed_sample_ids(self, task_id: str, reviewer: Optional[str] = None) -> Set[str]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            if reviewer:
                cursor.execute(
                    """
                    SELECT r.sample_id FROM review_decisions r
                    JOIN samples s ON r.sample_id = s.sample_id
                    WHERE s.task_id = ? AND r.reviewer = ?
                    """,
                    (task_id, reviewer),
                )
            else:
                cursor.execute(
                    """
                    SELECT r.sample_id FROM review_decisions r
                    JOIN samples s ON r.sample_id = s.sample_id
                    WHERE s.task_id = ?
                    """,
                    (task_id,),
                )
            return {row[0] for row in cursor.fetchall()}
