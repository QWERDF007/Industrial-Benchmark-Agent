import os
import json
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

from iad_core.storage.database import Database
from iad_core.storage.repositories import ReviewRepository
from iad_core.review.service import ReviewQueueService

logger = logging.getLogger("iad_core.review.report")


def export_review_decisions(
    task_id: str,
    db: Optional[Database] = None,
    db_path: str = "data/benchmark.db",
    output_dir: Optional[str] = None,
) -> str:
    """
    Export all review decisions for a task to review_export.json.
    """
    database = db or Database(db_path)
    repo = ReviewRepository(database)
    records = repo.list_history(task_id=task_id)

    out_dir = output_dir or os.path.join("runs", "review", task_id)
    os.makedirs(out_dir, exist_ok=True)
    export_path = os.path.join(out_dir, "review_export.json")

    data = [r.model_dump() for r in records]
    with open(export_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    logger.info(f"Exported {len(records)} review decisions to {export_path}")
    return export_path


def generate_review_report(
    task_id: str,
    db: Optional[Database] = None,
    db_path: str = "data/benchmark.db",
    output_dir: Optional[str] = None,
    candidates_json_path: Optional[str] = None,
) -> str:
    """
    Generate markdown review report (review_report.md) for a task.
    """
    database = db or Database(db_path)
    service = ReviewQueueService(
        task_id=task_id,
        db=database,
        candidates_json_path=candidates_json_path,
    )
    stats = service.get_stats()
    repo = ReviewRepository(database)
    records = repo.list_decisions(task_id)

    out_dir = output_dir or os.path.join("runs", "review", task_id)
    os.makedirs(out_dir, exist_ok=True)
    report_path = os.path.join(out_dir, "review_report.md")

    reason_counts: Dict[str, int] = {}
    for r in records:
        rc = r.reason_code or "none"
        reason_counts[rc] = reason_counts.get(rc, 0) + 1

    lines = [
        f"# Human Review Audit Report: {task_id}",
        "",
        f"- Generated At: `{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}`",
        f"- Task: `{task_id}`",
        f"- Total Candidates: **{stats.total_candidates:,}**",
        f"- Total Reviewed: **{stats.reviewed_count:,}**",
        f"- Pending: **{stats.pending_count:,}**",
        f"- Skipped: **{stats.skipped_count:,}**",
        f"- Candidate Yield (HARD_NORMAL + FAIL / Reviewed): **{stats.candidate_yield:.2%}**",
        f"- Average Review Duration: **{stats.avg_duration_ms / 1000.0:.2f} s / sample**",
        "",
        "## 1. Decision Distribution",
        "",
        "| Decision | Count | Percentage | Description |",
        "|---|---:|---:|---|",
    ]

    total_reviewed = max(1, stats.reviewed_count)
    descriptions = {
        "PASS": "Standard normal (良品)",
        "HARD_NORMAL": "Hard normal candidate verified as normal (高难良品)",
        "FAIL": "Defect confirmed (质量异常/缺陷)",
        "UNCERTAIN": "Insufficient evidence (存疑待定)",
        "SKIP": "Excluded / corrupted data (跳过)",
    }

    for dec in ["PASS", "HARD_NORMAL", "FAIL", "UNCERTAIN", "SKIP"]:
        cnt = stats.decisions.get(dec, 0)
        pct = cnt / total_reviewed
        desc = descriptions.get(dec, "")
        lines.append(f"| **`{dec}`** | {cnt:,} | {pct:.2%} | {desc} |")

    lines.extend([
        "",
        "## 2. Reason Codes Breakdown",
        "",
        "| Reason Code | Count |",
        "|---|---:|",
    ])

    for rc, cnt in sorted(reason_counts.items(), key=lambda x: x[1], reverse=True):
        lines.append(f"| `{rc}` | {cnt} |")

    content = "\n".join(lines) + "\n"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(content)

    return report_path
