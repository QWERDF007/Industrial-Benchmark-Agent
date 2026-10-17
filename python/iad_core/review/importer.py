import os
import json
import sqlite3
from typing import Dict, Any, Tuple


def import_authoritative_state(
    db_path: str = "data/benchmark.db",
    authoritative_dir: str = "data/authoritative",
) -> Tuple[int, int]:
    """
    R005: v2 Authoritative State Importer.
    Imports review_sessions.jsonl and review_decisions.jsonl into SQLite v2 tables.
    Returns (imported_sessions_count, imported_decisions_count).
    """
    sessions_path = os.path.join(authoritative_dir, "review_sessions.jsonl")
    decisions_path = os.path.join(authoritative_dir, "review_decisions.jsonl")

    if not os.path.exists(decisions_path):
        raise FileNotFoundError(f"Authoritative review decisions file not found: {decisions_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("BEGIN TRANSACTION")

    # 1. Import sessions
    sessions_count = 0
    if os.path.exists(sessions_path):
        with open(sessions_path, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                s = json.loads(line)
                cursor.execute("""
                    INSERT INTO review_sessions (
                        session_id, task_id, reviewer, started_at, submitted_at, total_reviewed
                    ) VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(session_id) DO UPDATE SET
                        started_at = excluded.started_at,
                        submitted_at = excluded.submitted_at,
                        total_reviewed = excluded.total_reviewed
                """, (
                    s["session_id"],
                    s.get("task_id", "kuangjiao_inspection_01"),
                    s["reviewer"],
                    s.get("started_at"),
                    s.get("submitted_at"),
                    s.get("total_reviewed", 0),
                ))
                sessions_count += 1

    # 2. Import decisions
    decisions_count = 0
    with open(decisions_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            d = json.loads(line)
            cursor.execute("""
                INSERT INTO review_decisions (
                    sample_id, decision, reviewer, reason_code, comment,
                    evidence_version, review_session_id, started_at, submitted_at,
                    review_duration_ms
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            """, (
                d["sample_id"],
                d["decision"],
                d.get("reviewer", "reviewer_1"),
                d.get("reason_code"),
                d.get("comment"),
                d.get("evidence_version", "v2"),
                d.get("review_session_id"),
                d.get("started_at"),
                d.get("submitted_at"),
                d.get("review_duration_ms", 0),
            ))
            decisions_count += 1

    conn.commit()
    conn.close()

    return sessions_count, decisions_count
