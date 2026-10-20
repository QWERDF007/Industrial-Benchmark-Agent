import json
from pathlib import Path
from typing import Tuple
from uuid import NAMESPACE_URL, uuid5

from iad_core.storage.database import Database
from iad_core.storage.models import ReviewDecisionRecord, ReviewSession
from iad_core.storage.repositories import ReviewRepository


def import_authoritative_state(
    db_path: str = "data/benchmark.db",
    authoritative_dir: str = "data/authoritative",
) -> Tuple[int, int]:
    root = Path(authoritative_dir)
    decisions_path, sessions_path = root / "review_decisions.jsonl", root / "review_sessions.jsonl"
    if not decisions_path.exists():
        raise FileNotFoundError(f"Authoritative review decisions file not found: {decisions_path}")
    db = Database(db_path)
    repo = ReviewRepository(db)
    sessions_count = decisions_count = 0
    with db.connection() as conn:
        conn.execute("BEGIN IMMEDIATE")
        if sessions_path.exists():
            for line in sessions_path.read_text(encoding="utf-8").splitlines():
                if line.strip():
                    repo.save_session(ReviewSession.model_validate_json(line), connection=conn)
                    sessions_count += 1
        for line in decisions_path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            value = json.loads(line)
            if not value.get('decision_id'):
                value['decision_id'] = str(uuid5(NAMESPACE_URL, 'iad:review-import:' + json.dumps(value, sort_keys=True, ensure_ascii=False)))
            repo.append_decision(ReviewDecisionRecord.model_validate(value), connection=conn)
            decisions_count += 1
    return sessions_count, decisions_count
