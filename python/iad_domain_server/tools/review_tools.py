import os
import json
import logging
from typing import Optional, Dict, Any

from iad_core.storage.database import Database
from iad_core.storage.repositories import ReviewRepository
from iad_domain_server.contracts import ToolResult, ToolStatus, MutationType, ArtifactRef

logger = logging.getLogger("iad_domain_server.tools.review")


def review_status(
    task_id: str,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Inspect Human Review status and progress (R306).
    STRICT SECURITY INVARIANT:
    This tool is READ-ONLY. No review writing or mutation is permitted via Agent MCP tools.
    """
    db = Database(db_path)
    review_repo = ReviewRepository(db)

    stats = review_repo.get_stats(task_id)
    total_decisions = stats.get("total_decisions", 0)
    decision_counts = stats.get("decision_counts", {})
    hn_count = decision_counts.get("HARD_NORMAL", 0)
    pass_count = decision_counts.get("PASS", 0)
    fail_count = decision_counts.get("FAIL", 0)

    # Check pending candidate count if candidate mining was run
    candidates_path = os.path.join("runs", "candidate_mining", task_id, "candidates.json")
    pending_count = 0
    total_mined = 0
    if os.path.exists(candidates_path):
        try:
            with open(candidates_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                candidates = data if isinstance(data, list) else data.get("candidates", [])
                total_mined = len(candidates)
                decisions = review_repo.list_decisions_by_task(task_id)
                decided_ids = {d.sample_id for d in decisions}
                pending_count = sum(1 for c in candidates if c["sample_id"] not in decided_ids)
        except Exception as e:
            logger.warning(f"Failed to read candidates file: {e}")


    # Check status
    if total_decisions == 0 and pending_count > 0:
        status = ToolStatus.REVIEW_REQUIRED
        summary = (
            f"Review queue for '{task_id}' has {pending_count} pending candidates and 0 human decisions. "
            "Human review is required before building benchmark gold."
        )
        warnings = ["No human review decisions recorded yet. Agent cannot proceed to benchmark_build without review."]
        next_actions = ["Human operator must review candidate queue in Harness Web UI."]
    elif pending_count > 0:
        status = ToolStatus.PARTIAL
        summary = (
            f"Review in progress for '{task_id}': {total_decisions} decisions recorded "
            f"(PASS: {pass_count}, HARD_NORMAL: {hn_count}, FAIL: {fail_count}), {pending_count} candidates pending."
        )
        warnings = [f"{pending_count} candidates remain unreviewed in the queue."]
        next_actions = ["Proceed to benchmark_preview or wait for additional human reviews."]
    else:
        status = ToolStatus.OK
        summary = (
            f"Review status for '{task_id}': {total_decisions} decisions recorded "
            f"(PASS: {pass_count}, HARD_NORMAL: {hn_count}, FAIL: {fail_count}). All mined candidates reviewed."
        )
        warnings = []
        next_actions = ["Call benchmark_build to construct benchmark assets."]

    artifacts = []
    export_json = os.path.join("runs", "review", task_id, "review_decisions.jsonl")
    if os.path.exists(export_json):
        artifacts.append(
            ArtifactRef(
                artifact_id=f"review_decisions_{task_id}",
                artifact_type="review_decisions_jsonl",
                uri=f"iad://task/{task_id}/review/decisions.jsonl",
                path=os.path.abspath(export_json),
                summary="Exported human review decisions in JSONL",
            )
        )

    return ToolResult(
        status=status,
        summary=summary,
        metrics={
            "total_decisions": total_decisions,
            "decision_distribution": decision_counts,
            "hard_normal_count": hn_count,
            "pass_count": pass_count,
            "fail_count": fail_count,
            "pending_candidates_count": pending_count,
            "total_mined_candidates": total_mined,
        },
        artifacts=artifacts,
        warnings=warnings,
        next_actions=next_actions,
        mutation=MutationType.NONE,
    )
