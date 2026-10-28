import sqlite3
from contextlib import nullcontext
from typing import Any, Dict, List, Optional

from iad_core.storage.database import Database
from iad_core.storage.models import ReviewDecisionRecord, ReviewHistoryRecord, ReviewSession


class ReviewRepository:
    """Human review persistence. Agent tools may read, never append decisions."""
    def __init__(self, db: Database):
        self.db = db

    def save_session(self, session: ReviewSession, connection: Optional[sqlite3.Connection] = None) -> None:
        with nullcontext(connection) if connection is not None else self.db.connection() as conn:
            conn.execute(
                """
                INSERT INTO review_sessions (
                    session_id, task_id, reviewer, started_at, submitted_at, total_reviewed, dataset_id, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(session_id) DO UPDATE SET
                    reviewer = excluded.reviewer,
                    started_at = excluded.started_at,
                    submitted_at = excluded.submitted_at,
                    total_reviewed = excluded.total_reviewed,
                    dataset_id = excluded.dataset_id,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (
                    session.session_id,
                    session.task_id,
                    session.reviewer,
                    session.started_at,
                    session.submitted_at,
                    session.total_reviewed,
                    session.dataset_id,
                ),
            )

    def get_session(self, session_id: str) -> Optional[ReviewSession]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM review_sessions WHERE session_id = ?", (session_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return ReviewSession(
                session_id=row["session_id"],
                task_id=row["task_id"],
                reviewer=row["reviewer"],
                started_at=row["started_at"],
                submitted_at=row["submitted_at"],
                total_reviewed=row["total_reviewed"],
                dataset_id=row["dataset_id"],
            )

    def list_sessions(self, task_id: str) -> List[ReviewSession]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM review_sessions WHERE task_id = ? ORDER BY id DESC",
                (task_id,),
            )
            return [
                ReviewSession(
                    session_id=r["session_id"],
                    task_id=r["task_id"],
                    reviewer=r["reviewer"],
                    started_at=r["started_at"],
                    submitted_at=r["submitted_at"],
                    total_reviewed=r["total_reviewed"],
                    dataset_id=r["dataset_id"],
                )
                for r in cursor.fetchall()
            ]

    def append_decision(self, decision: ReviewDecisionRecord, connection: Optional[sqlite3.Connection] = None) -> ReviewDecisionRecord:
        with nullcontext(connection) if connection is not None else self.db.connection() as conn:
            if not conn.in_transaction:
                conn.execute("BEGIN IMMEDIATE")
            row = conn.execute("SELECT * FROM review_decisions WHERE decision_id=?", (decision.decision_id,)).fetchone()
            if row:
                existing = ReviewDecisionRecord.model_validate(dict(row))
                if existing != decision:
                    raise ValueError("Decision ID already belongs to different review content")
                return existing
            values = decision.model_dump()
            conn.execute(f"INSERT INTO review_decisions ({','.join(values)}) VALUES ({','.join('?' for _ in values)})", tuple(values.values()))
            return decision

    def get_decision(self, sample_id: str, reviewer: Optional[str] = None, connection: Optional[sqlite3.Connection] = None) -> Optional[ReviewDecisionRecord]:
        with nullcontext(connection) if connection is not None else self.db.connection() as conn:
            row = conn.execute("""SELECT * FROM current_review_decisions WHERE sample_id=?"""
                + (" AND reviewer=?" if reviewer else "")
                + " ORDER BY COALESCE(submitted_at,updated_at) DESC,id DESC LIMIT 1",
                (sample_id,reviewer) if reviewer else (sample_id,)).fetchone()
            return ReviewDecisionRecord.model_validate(dict(row)) if row else None

    def get_event(self, decision_id: str, connection: Optional[sqlite3.Connection] = None) -> Optional[ReviewDecisionRecord]:
        with nullcontext(connection) if connection is not None else self.db.connection() as conn:
            row = conn.execute('SELECT * FROM review_decisions WHERE decision_id=?', (decision_id,)).fetchone()
            return ReviewDecisionRecord.model_validate(dict(row)) if row else None

    def list_decisions(self, task_id: Optional[str] = None, *, connection: Optional[sqlite3.Connection] = None) -> List[ReviewDecisionRecord]:
        with nullcontext(connection) if connection is not None else self.db.connection() as conn:
            rows = conn.execute("SELECT d.* FROM current_review_decisions d"
                + (" JOIN samples s ON d.sample_id=s.sample_id WHERE s.task_id=?" if task_id else "")
                + " ORDER BY d.id ASC", (task_id,) if task_id else ()).fetchall()
            return [ReviewDecisionRecord.model_validate(dict(row)) for row in rows]

    def list_history(self, sample_id: Optional[str] = None, *, task_id: Optional[str] = None) -> List[ReviewDecisionRecord]:
        if (sample_id is None) == (task_id is None):
            raise ValueError("Specify a sample or task for review history")
        with self.db.connection() as conn:
            return [ReviewDecisionRecord.model_validate(dict(row)) for row in conn.execute(
                "SELECT d.* FROM review_decisions d"
                + (" JOIN samples s ON d.sample_id=s.sample_id WHERE s.task_id=?" if task_id is not None else " WHERE d.sample_id=?")
                + " ORDER BY COALESCE(d.submitted_at,d.updated_at) DESC,d.id DESC", (task_id if task_id is not None else sample_id,))]

    def count_decisions(self, task_id: Optional[str] = None) -> int:
        with self.db.connection() as conn:
            return conn.execute("SELECT COUNT(*) FROM current_review_decisions d"
                + (" JOIN samples s ON d.sample_id=s.sample_id WHERE s.task_id=?" if task_id else ""), (task_id,) if task_id else ()).fetchone()[0]

    def history_page(self, dataset_id: str, offset: int, limit: int, search: str) -> tuple[List[ReviewHistoryRecord], int]:
        scope = " FROM review_decisions d JOIN samples s ON d.sample_id=s.sample_id WHERE s.dataset_id=?"
        params = [dataset_id]
        if search:
            scope += " AND (instr(lower(s.relative_path),lower(?))>0 OR instr(lower(d.reviewer),lower(?))>0 OR instr(lower(COALESCE(d.comment,'')),lower(?))>0)"
            params.extend([search] * 3)
        with self.db.connection() as conn:
            conn.execute("BEGIN")
            total = conn.execute("SELECT COUNT(*)" + scope, params).fetchone()[0]
            rows = conn.execute("SELECT d.*,s.relative_path" + scope
                + " ORDER BY COALESCE(d.submitted_at,d.updated_at) DESC,d.id DESC LIMIT ? OFFSET ?", [*params, limit, offset])
            return [ReviewHistoryRecord.model_validate(dict(row)) for row in rows], total

    def list_decisions_by_task(self, task_id: str) -> List[ReviewDecisionRecord]:
        return self.list_decisions(task_id)

    def list_decisions_by_session(self, session_id: str) -> List[ReviewDecisionRecord]:
        with self.db.connection() as conn:
            return [ReviewDecisionRecord.model_validate(dict(row)) for row in conn.execute(
                "SELECT * FROM review_decisions WHERE review_session_id=? ORDER BY id ASC", (session_id,))]

    def get_stats(self, task_id: str) -> Dict[str, Any]:
        counts = self.count_by_decision(task_id)
        return {"task_id": task_id, "total_decisions": sum(counts.values()), "decision_counts": counts}

    def count_by_decision(self, task_id: str) -> Dict[str, int]:
        with self.db.connection() as conn:
            return {row[0]: row[1] for row in conn.execute("""SELECT d.decision,COUNT(*)
                FROM current_review_decisions d JOIN samples s ON d.sample_id=s.sample_id
                WHERE s.task_id=? GROUP BY d.decision""", (task_id,))}

    def get(self, sample_id: str, reviewer: str = "default") -> Optional[ReviewDecisionRecord]:
        return self.get_decision(sample_id, reviewer)
