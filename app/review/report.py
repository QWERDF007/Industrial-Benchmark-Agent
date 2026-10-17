import os
import json
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

from app.storage.database import Database
from app.review.repository import ReviewDecisionRepository
from app.review.service import ReviewQueueService

logger = logging.getLogger("iad_benchmark.review.report")


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
    repo = ReviewDecisionRepository(database)
    records = repo.list_by_task(task_id)

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
    repo = ReviewDecisionRepository(database)
    records = repo.list_by_task(task_id)

    out_dir = output_dir or os.path.join("runs", "review", task_id)
    os.makedirs(out_dir, exist_ok=True)
    report_path = os.path.join(out_dir, "review_report.md")

    # Aggregate reason codes
    reason_counts: Dict[str, int] = {}
    for r in records:
        rc = r.reason_code or "none"
        reason_counts[rc] = reason_counts.get(rc, 0) + 1

    # Filter Hard Normal records
    hard_normals = [r for r in records if r.decision == "HARD_NORMAL"]

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
        pct = (cnt / total_reviewed) * 100.0 if stats.reviewed_count > 0 else 0.0
        desc = descriptions.get(dec, "")
        lines.append(f"| `{dec}` | {cnt:,} | {pct:.1f}% | {desc} |")

    lines.extend([
        "",
        "## 2. Reason Codes Breakdown",
        "",
        "| Reason Code | Count | Percentage |",
        "|---|---:|---:|",
    ])

    for rc, cnt in sorted(reason_counts.items(), key=lambda x: -x[1]):
        pct = (cnt / total_reviewed) * 100.0 if stats.reviewed_count > 0 else 0.0
        lines.append(f"| `{rc}` | {cnt:,} | {pct:.1f}% |")

    lines.extend([
        "",
        "## 3. Verified Hard Normal Samples (Top Samples)",
        "",
        "| Sample ID | Reason Code | Reviewer | Duration (ms) | Comment |",
        "|---|---|---|---:|---|",
    ])

    for hn in hard_normals[:50]:
        comment_str = hn.comment or "-"
        lines.append(
            f"| `{hn.sample_id}` | `{hn.reason_code or '-'}` | {hn.reviewer} | {hn.review_duration_ms} | {comment_str} |"
        )

    if not hard_normals:
        lines.append("| - | No HARD_NORMAL decisions recorded yet | - | - | - |")

    lines.append("")

    report_content = "\n".join(lines)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_content)

    logger.info(f"Generated review report at {report_path}")
    return report_path
