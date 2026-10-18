import json
import sqlite3
from datetime import datetime
from typing import List, Optional

from iad_core.storage.database import Database
from iad_core.advisory.schemas import (
    AuditSuggestion,
    ConclusionStatus,
    RecommendedAction,
    ObservationItem,
    HypothesisItem,
    EvidenceRefItem,
)


class AuditSuggestionRepository:
    """
    Repository for storing and querying non-authoritative AuditSuggestions (S08, RP-14).
    """
    def __init__(self, db: Database):
        self.db = db

    def save(self, suggestion: AuditSuggestion) -> AuditSuggestion:
        now = suggestion.created_at or (datetime.utcnow().isoformat() + "Z")
        suggestion.created_at = now

        obs_json = json.dumps([o.model_dump() for o in suggestion.observations], ensure_ascii=False)
        hyp_json = json.dumps([h.model_dump() for h in suggestion.hypotheses], ensure_ascii=False)
        refs_json = json.dumps([r.model_dump() for r in suggestion.evidence_refs], ensure_ascii=False)
        mods_json = json.dumps(suggestion.input_modalities_used, ensure_ascii=False)

        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO audit_suggestions (
                    suggestion_id, task_id, sample_id, session_id, model_route,
                    observations_json, hypotheses_json, evidence_refs_json,
                    conclusion_status, recommended_action, input_modalities_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(suggestion_id) DO UPDATE SET
                    observations_json = excluded.observations_json,
                    hypotheses_json = excluded.hypotheses_json,
                    evidence_refs_json = excluded.evidence_refs_json,
                    conclusion_status = excluded.conclusion_status,
                    recommended_action = excluded.recommended_action,
                    input_modalities_json = excluded.input_modalities_json,
                    created_at = excluded.created_at
                """,
                (
                    suggestion.suggestion_id,
                    suggestion.task_id,
                    suggestion.sample_id,
                    suggestion.session_id,
                    suggestion.model_route,
                    obs_json,
                    hyp_json,
                    refs_json,
                    suggestion.conclusion_status.value if isinstance(suggestion.conclusion_status, ConclusionStatus) else str(suggestion.conclusion_status),
                    suggestion.recommended_action.value if isinstance(suggestion.recommended_action, RecommendedAction) else str(suggestion.recommended_action),
                    mods_json,
                    now,
                ),
            )
        return suggestion

    def _row_to_suggestion(self, row: sqlite3.Row) -> AuditSuggestion:
        obs_raw = json.loads(row["observations_json"]) if row["observations_json"] else []
        hyp_raw = json.loads(row["hypotheses_json"]) if row["hypotheses_json"] else []
        refs_raw = json.loads(row["evidence_refs_json"]) if row["evidence_refs_json"] else []
        mods_raw = json.loads(row["input_modalities_json"]) if row["input_modalities_json"] else []

        return AuditSuggestion(
            suggestion_id=row["suggestion_id"],
            task_id=row["task_id"],
            sample_id=row["sample_id"],
            session_id=row["session_id"],
            model_route=row["model_route"],
            observations=[ObservationItem(**o) for o in obs_raw],
            hypotheses=[HypothesisItem(**h) for h in hyp_raw],
            conclusion_status=ConclusionStatus(row["conclusion_status"]),
            recommended_action=RecommendedAction(row["recommended_action"]),
            evidence_refs=[EvidenceRefItem(**r) for r in refs_raw],
            input_modalities_used=mods_raw,
            created_at=row["created_at"],
        )

    def get(self, suggestion_id: str) -> Optional[AuditSuggestion]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM audit_suggestions WHERE suggestion_id = ?", (suggestion_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return self._row_to_suggestion(row)

    def list_by_task(self, task_id: str) -> List[AuditSuggestion]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM audit_suggestions WHERE task_id = ? ORDER BY created_at DESC",
                (task_id,),
            )
            rows = cursor.fetchall()
            return [self._row_to_suggestion(r) for r in rows]

    def list_by_sample(self, sample_id: str) -> List[AuditSuggestion]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM audit_suggestions WHERE sample_id = ? ORDER BY created_at DESC",
                (sample_id,),
            )
            rows = cursor.fetchall()
            return [self._row_to_suggestion(r) for r in rows]

    def list_by_session(self, session_id: str) -> List[AuditSuggestion]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM audit_suggestions WHERE session_id = ? ORDER BY created_at DESC",
                (session_id,),
            )
            rows = cursor.fetchall()
            return [self._row_to_suggestion(r) for r in rows]
