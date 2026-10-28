import os
import json
import sqlite3
import yaml
from typing import Dict, Any, List

OUTPUT_DIR = "data/authoritative"


def export_authoritative_state(db_path: str = "data/benchmark.db"):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 1. Export review_decisions.jsonl
    cursor.execute("""
        SELECT sample_id, decision, reviewer, reason_code, comment,
               evidence_version, review_session_id, started_at, submitted_at,
               review_duration_ms, created_at, updated_at
        FROM review_decisions
        ORDER BY id ASC
    """)
    rows = cursor.fetchall()
    decisions = [dict(r) for r in rows]

    decisions_path = os.path.join(OUTPUT_DIR, "review_decisions.jsonl")
    with open(decisions_path, "w", encoding="utf-8") as f:
        for d in decisions:
            f.write(json.dumps(d, ensure_ascii=False) + "\n")
    print(f"Exported {len(decisions)} review decisions to {decisions_path}")

    # 2. Export review_sessions.jsonl
    sessions: Dict[str, Dict[str, Any]] = {}
    for d in decisions:
        sess_id = d.get("review_session_id") or "legacy_session"
        if sess_id not in sessions:
            sessions[sess_id] = {
                "session_id": sess_id,
                "task_id": "kuangjiao_inspection_01",
                "reviewer": d.get("reviewer", "reviewer_1"),
                "started_at": d.get("started_at"),
                "submitted_at": d.get("submitted_at"),
                "total_reviewed": 0,
                "created_at": d.get("created_at"),
            }
        s = sessions[sess_id]
        s["total_reviewed"] += 1
        if d.get("started_at") and (not s["started_at"] or d["started_at"] < s["started_at"]):
            s["started_at"] = d["started_at"]
        if d.get("submitted_at") and (not s["submitted_at"] or d["submitted_at"] > s["submitted_at"]):
            s["submitted_at"] = d["submitted_at"]

    sessions_path = os.path.join(OUTPUT_DIR, "review_sessions.jsonl")
    with open(sessions_path, "w", encoding="utf-8") as f:
        for s in sessions.values():
            f.write(json.dumps(s, ensure_ascii=False) + "\n")
    print(f"Exported {len(sessions)} review sessions to {sessions_path}")

    # 3. Export metadata_semantics.yaml
    semantics = {
        "kuangjiao_inspection_01": {
            "batch_id": "production_date",
            "physical_sample_id": "physical_unit_id",
            "capture_sequence_id": "capture_sequence_id",
            "physical_sample_scope": "batch",
            "description": "Kuangjiao inspection task metadata semantics: batch_id represents physical production date."
        }
    }
    semantics_path = os.path.join(OUTPUT_DIR, "metadata_semantics.yaml")
    with open(semantics_path, "w", encoding="utf-8") as f:
        yaml.dump(semantics, f, allow_unicode=True, sort_keys=False)
    print(f"Exported metadata semantics to {semantics_path}")

    # 4. Export asset rebuild inventory (R004)
    inventory_content = """# Rebuildable vs Authoritative Asset Inventory

## Authoritative Assets (Must NEVER be deleted or mutated)
1. Raw Dataset Images and Sidecars: `data/ExportImage_*`
2. Human Review Decisions: `data/authoritative/review_decisions.jsonl`
3. Human Review Sessions: `data/authoritative/review_sessions.jsonl`
4. Metadata Semantics: `data/authoritative/metadata_semantics.yaml`
5. Verified Ground Truth Calibration: `runs/near_duplicate/calibration/pairs.json`

## Derived / Rebuildable Assets (Safe to regenerate)
1. SQLite Feature Records (`feature_records`)
2. CPU FAISS Corpus Indexes (location and lifecycle: `python/iad_core/feature/index.py`)
3. Near-Duplicate Candidates and Components (`runs/near_duplicate/...`)
4. Candidate Mining Outputs (`runs/candidate_mining/...`)
5. Gold Records and Conflicts (`gold_records`, `gold.jsonl`, `conflicts.json`)
6. Group Split Assignments (`split_assignments`, `train.jsonl`, `val.jsonl`, `test.jsonl`)
7. Benchmark Build Records (`benchmark_builds`)
8. Evaluation Predictions and Reports (`runs/evaluation/...`)
"""
    inventory_path = os.path.join(OUTPUT_DIR, "asset_rebuild_inventory.md")
    with open(inventory_path, "w", encoding="utf-8") as f:
        f.write(inventory_content)
    print(f"Exported inventory to {inventory_path}")

    conn.close()


if __name__ == "__main__":
    export_authoritative_state()
