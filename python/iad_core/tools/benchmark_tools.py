import os
import json
import logging
from typing import Optional, Dict, Any, List

from iad_core.storage.database import Database
from iad_core.storage.repositories import BenchmarkRepository, GoldRepository, ReviewRepository, SampleRepository
from iad_core.benchmark.builder import (
    run_benchmark_pipeline,
    preview_benchmark_pipeline,
    load_verified_duplicates,
    generate_build_id,
)
from iad_core.task.config import load_config
from iad_core.gold.builder import build_gold
from iad_core.split.group import build_split_groups
from iad_core.split.builder import build_group_split
from iad_core.split.leakage import check_leakage
from iad_core.contracts import ToolResult, ToolStatus, MutationType, ArtifactRef

logger = logging.getLogger("iad_core.tools.benchmark")


def benchmark_preview(
    task_id: str,
    config_path: Optional[str] = None,
    seed: int = 42,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Preview Gold adjudication and atomic group split sharing unified Core domain logic (NV-12, NS-09).
    Does NOT persist to SQLite or write formal build assets to disk.
    """
    try:
        prev = preview_benchmark_pipeline(
            task_id=task_id,
            config_path=config_path,
            seed=seed,
            db_path=db_path,
        )
    except Exception as e:
        logger.error(f"Benchmark preview failed: {e}", exc_info=True)
        return ToolResult(
            status=ToolStatus.ERROR,
            summary=f"Benchmark preview failed: {str(e)}",
            warnings=[str(e)],
            next_actions=["Verify config_path and ensure task data exists."],
        )

    status = ToolStatus.REVIEW_REQUIRED if prev.status == "REVIEW_REQUIRED" else ToolStatus.OK
    summary = (
        f"Benchmark Preview for '{task_id}': {prev.normal + prev.anomaly} Confirmed Gold "
        f"({prev.normal} Normal/HardNormal, {prev.anomaly} Anomaly, {prev.hard_normal} Hard Normal), "
        f"Split -> Train: {prev.projected_train}, Val: {prev.projected_val}, Test: {prev.projected_test}."
    )

    return ToolResult(
        status=status,
        summary=summary,
        metrics={
            "confirmed_gold": prev.normal + prev.anomaly,
            "normal_gold": prev.normal,
            "anomaly_gold": prev.anomaly,
            "hard_normal_gold": prev.hard_normal,
            "conflicts": prev.conflicts,
            "groups_count": prev.groups_count,
            "train_samples": prev.projected_train,
            "val_samples": prev.projected_val,
            "test_samples": prev.projected_test,
        },
        warnings=prev.warnings,
        next_actions=["Call benchmark_build to formally build and export the benchmark."] if status == ToolStatus.OK else ["Submit required human reviews before building."],
        mutation=MutationType.NONE,
    )


def benchmark_build(
    task_id: str,
    build_id: Optional[str] = None,
    config_path: Optional[str] = None,
    output_dir: Optional[str] = None,
    seed: Optional[int] = None,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Formally build benchmark assets, enforce leakage gate, and persist to SQLite (R307).
    Enforces explicit Review Policy Gate without implicit candidate mining (NV-13, NS-04).
    """
    from iad_core.review.service import ReviewQueueService

    if not config_path:
        for candidate_path in [f"configs/{task_id}.yaml", "configs/kuangjiao.yaml"]:
            if os.path.exists(candidate_path):
                config_path = candidate_path
                break
    cfg = load_config(config_path) if config_path and os.path.exists(config_path) else None

    # Domain Hard Gate: Check Review Policy and required reviews (NV-13, NS-04)
    review_svc = ReviewQueueService(task_id=task_id, db_path=db_path)
    decisions = review_svc.repo.list_decisions_by_task(task_id)
    decided_ids = {d.sample_id for d in decisions}

    required_ids = list(cfg.review_policy.required_review_ids) if cfg and hasattr(cfg, "review_policy") else []
    required_cand_ids = [c.sample_id for c in review_svc.candidates if getattr(c, "is_required", True)]
    all_required_ids = set(required_ids) | set(required_cand_ids)

    pending_required = [sid for sid in all_required_ids if sid not in decided_ids]
    if pending_required:
        return ToolResult(
            status=ToolStatus.REVIEW_REQUIRED,
            summary=(
                f"Benchmark build halted for task '{task_id}': {len(pending_required)}/{len(all_required_ids)} "
                f"hard normal candidates require human review before benchmark construction."
            ),
            metrics={
                "total_candidates": len(review_svc.candidates),
                "pending_required_count": len(pending_required),
                "reviewed_count": len(decided_ids),
                "pending_count": len(pending_required),
            },
            warnings=["Unreviewed required hard normal candidates exist. Human review is strictly required."],
            next_actions=["Human operator must submit review decisions in Web UI before building benchmark."],
            mutation=MutationType.NONE,
        )

    # Check Gold sufficiency and conflicts
    gold_policy = cfg.gold if cfg else None
    if gold_policy:
        gold_res = build_gold(
            task_id=task_id,
            policy=gold_policy,
            db_path=db_path,
            persist_to_db=False,
        )
        gold_records = gold_res.records
        conflicts = gold_res.conflicts
        confirmed_normals = [g for g in gold_records if g.gold_status == "CONFIRMED" and g.binary_label == "NORMAL"]
        if len(confirmed_normals) == 0:
            return ToolResult(
                status=ToolStatus.REVIEW_REQUIRED,
                summary=f"Benchmark build halted: 0 confirmed normal Gold records found for '{task_id}'.",
                warnings=["No confirmed normal samples found. Benchmark cannot be created without normal samples."],
                next_actions=["Submit human review decisions confirming normal samples."],
                mutation=MutationType.NONE,
            )
        if conflicts and cfg and cfg.review_policy.block_on_conflicts:
            return ToolResult(
                status=ToolStatus.REVIEW_REQUIRED,
                summary=f"Benchmark build halted: {len(conflicts)} Gold conflict(s) detected for '{task_id}'.",
                metrics={"conflicts_count": len(conflicts)},
                warnings=["Gold conflicts detected. Resolve conflicts before proceeding."],
                next_actions=["Resolve conflicting annotations or review decisions."],
                mutation=MutationType.NONE,
            )

    try:
        res = run_benchmark_pipeline(
            task_id=task_id,
            build_id=build_id,
            config_path=config_path,
            output_dir=output_dir,
            db_path=db_path,
            seed=seed,
        )
    except Exception as e:
        logger.error(f"Benchmark build failed: {e}", exc_info=True)
        return ToolResult(
            status=ToolStatus.ERROR,
            summary=f"Benchmark build failed: {str(e)}",
            warnings=[str(e)],
            next_actions=["Verify config and ensure task samples and reviews exist."],
        )

    artifacts = [
        ArtifactRef(
            artifact_id=f"benchmark_report_{res.build_id}",
            artifact_type="benchmark_report_markdown",
            uri=f"iad://benchmark/{res.build_id}/report.md",
            path=os.path.abspath(res.benchmark_report_md),
            summary="Benchmark build executive report and track readiness in Markdown",
        ),
        ArtifactRef(
            artifact_id=f"leakage_report_{res.build_id}",
            artifact_type="leakage_report_markdown",
            uri=f"iad://benchmark/{res.build_id}/leakage.md",
            path=os.path.abspath(res.leakage_md),
            summary="Leakage gate blocking report in Markdown",
        ),
        ArtifactRef(
            artifact_id=f"split_json_{res.build_id}",
            artifact_type="split_assignment_json",
            uri=f"iad://benchmark/{res.build_id}/split.json",
            path=os.path.abspath(res.split_json),
            summary="Deterministic split assignments in JSON",
        ),
    ]

    if not res.leakage_passed:
        status = ToolStatus.NOT_READY
        summary = f"Benchmark build '{res.build_id}' BLOCKED by Leakage Gate. 0 leakage tolerance violated."
        warnings = ["Leakage gate check failed! See leakage.md for specific violated sample pairs."]
        next_actions=["Resolve group leakage in config or component isolation before rebuilding."]
    else:
        status = ToolStatus.OK
        summary = (
            f"Benchmark build '{res.build_id}' SUCCESS: {res.gold_count} Gold records, "
            f"Train: {res.train_count}, Val: {res.val_count}, Test: {res.test_count}. Leakage: PASS."
        )
        warnings = []
        next_actions=["Call evaluation_plan or baseline_run to evaluate models on this build."]

    return ToolResult(
        status=status,
        summary=summary,
        metrics={
            "build_id": res.build_id,
            "status": res.status,
            "gold_count": res.gold_count,
            "train_count": res.train_count,
            "val_count": res.val_count,
            "test_count": res.test_count,
            "conflict_count": res.conflict_count,
            "leakage_passed": res.leakage_passed,
        },
        artifacts=artifacts,
        warnings=warnings,
        next_actions=next_actions,
        mutation=MutationType.DERIVED_ARTIFACT,
    )


def benchmark_status(
    build_id: str,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Inspect an existing benchmark build (R307).
    """
    db = Database(db_path)
    bench_repo = BenchmarkRepository(db)

    build = bench_repo.get_build(build_id)
    if not build:
        return ToolResult(
            status=ToolStatus.NOT_READY,
            summary=f"Benchmark build '{build_id}' not found.",
            warnings=[f"Build '{build_id}' does not exist in SQLite."],
            next_actions=["Run benchmark_build to create a new benchmark."],
        )

    assignments = bench_repo.get_split_assignments_by_build(build_id)
    train_c = sum(1 for a in assignments if a.split_name == "train")
    val_c = sum(1 for a in assignments if a.split_name == "val")
    test_c = sum(1 for a in assignments if a.split_name == "test")

    return ToolResult(
        status=ToolStatus.OK if build.status == "READY" else ToolStatus.PARTIAL,
        summary=f"Benchmark build '{build_id}': status {build.status}, Train: {train_c}, Val: {val_c}, Test: {test_c}.",
        metrics={
            "build_id": build.build_id,
            "task_id": build.task_id,
            "status": build.status,
            "total_assigned": len(assignments),
            "train_count": train_c,
            "val_count": val_c,
            "test_count": test_c,
            "gold_policy": build.gold_policy,
            "split_policy": build.split_policy,
            "seed": build.seed,
            "output_dir": build.output_dir,
        },
        next_actions=["Call baseline_run to evaluate on this benchmark build."],
        mutation=MutationType.NONE,
    )



def leakage_check(
    build_id: str,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Run or inspect the 5-point Leakage Gate check for a benchmark build (R307).
    """
    leakage_json_path = os.path.join("runs", "benchmark", build_id, "leakage_report.json")
    if os.path.exists(leakage_json_path):
        with open(leakage_json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        is_pass = data.get("is_passed", False) or data.get("status") == "PASS"
        status = ToolStatus.OK if is_pass else ToolStatus.NOT_READY
        total_viol = data.get("total_violations", 0)
        summary = (
            f"Leakage check for '{build_id}': PASS (0 violations)."
            if is_pass
            else f"Leakage check for '{build_id}': FAILED ({total_viol} violations)."
        )
        return ToolResult(
            status=status,
            summary=summary,
            metrics=data,
            warnings=["Leakage violations detected!"] if not is_pass else [],
            next_actions=[],
            mutation=MutationType.NONE,
        )


    return ToolResult(
        status=ToolStatus.NOT_READY,
        summary=f"No leakage report found on disk for build '{build_id}'.",
        warnings=["Leakage report file not found."],
        next_actions=["Run benchmark_build to generate leakage verification."],
    )
