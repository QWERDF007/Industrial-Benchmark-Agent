import os
import json
import logging
from typing import Optional, Dict, Any, List

from iad_core.storage.database import Database
from iad_core.storage.repositories import BenchmarkRepository, GoldRepository, ReviewRepository, SampleRepository
from iad_core.benchmark.builder import run_benchmark_pipeline, load_verified_duplicates, generate_build_id
from iad_core.task.config import load_config
from iad_core.gold.builder import build_gold
from iad_core.split.group import build_split_groups
from iad_core.split.builder import build_group_split
from iad_core.split.leakage import check_leakage
from iad_domain_server.contracts import ToolResult, ToolStatus, MutationType, ArtifactRef

logger = logging.getLogger("iad_domain_server.tools.benchmark")


def benchmark_preview(
    task_id: str,
    config_path: Optional[str] = None,
    seed: int = 42,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Preview Gold adjudication and atomic group split without persisting to SQLite (R307).
    """
    if not config_path:
        for candidate_path in [f"configs/{task_id}.yaml", "configs/kuangjiao.yaml"]:
            if os.path.exists(candidate_path):
                config_path = candidate_path
                break

    if not config_path or not os.path.exists(config_path):
        return ToolResult(
            status=ToolStatus.ERROR,
            summary=f"Benchmark preview requires config. None found for task '{task_id}'.",
            warnings=["Task configuration is required."],
            next_actions=["Provide valid config_path."],
        )

    cfg = load_config(config_path)
    db = Database(db_path)
    review_repo = ReviewRepository(db)
    sample_repo = SampleRepository(db)

    # Check human review presence
    review_stats = review_repo.get_stats(task_id)
    total_decisions = review_stats.get("total_decisions", 0)

    samples = sample_repo.list_by_task(task_id)
    samples_map = {s.sample_id: s for s in samples}

    verified_pairs, verified_groups = load_verified_duplicates(task_id)

    # In-memory gold preview
    gold_records, conflicts = build_gold(
        task_id=task_id,
        policy=cfg.gold,
        db_path=db_path,
        persist_to_db=False,
    )

    confirmed_golds = [g for g in gold_records if g.gold_status == "CONFIRMED"]
    normal_golds = [g for g in confirmed_golds if g.gold_quality in ("NORMAL", "HARD_NORMAL")]
    anomaly_golds = [g for g in confirmed_golds if g.gold_quality == "ANOMALY"]

    if len(normal_golds) == 0:
        return ToolResult(
            status=ToolStatus.REVIEW_REQUIRED,
            summary=f"Preview halted: 0 confirmed normal Gold records for '{task_id}'. Human review is required.",
            metrics={
                "total_samples": len(samples),
                "confirmed_gold": len(confirmed_golds),
                "normal_gold": 0,
                "anomaly_gold": len(anomaly_golds),
                "conflicts": len(conflicts),
                "human_reviews": total_decisions,
            },
            warnings=["No confirmed normal samples found. Benchmark cannot be created without normal samples."],
            next_actions=["Complete human review on hard normal candidates first."],
        )

    # Build split groups
    gold_dict = {g.sample_id: g for g in confirmed_golds}
    groups = build_split_groups(
        samples=samples,
        gold_map=gold_dict,
        verified_pairs=verified_pairs,
        verified_components=verified_groups,
        physical_sample_scope=cfg.split.physical_sample_scope,
    )

    split_res = build_group_split(groups=groups, policy=cfg.split, seed=seed)

    status = ToolStatus.OK
    warnings = []
    if total_decisions == 0:
        warnings.append("Preview generated without human review decisions. Only raw trusted quality was used.")

    return ToolResult(
        status=status,
        summary=(
            f"Benchmark Preview for '{task_id}': {len(confirmed_golds)} Confirmed Gold "
            f"({len(normal_golds)} Normal/HardNormal, {len(anomaly_golds)} Anomaly), "
            f"Split -> Train: {len(split_res.train_sample_ids)}, Val: {len(split_res.val_sample_ids)}, Test: {len(split_res.test_sample_ids)}."
        ),
        metrics={
            "confirmed_gold": len(confirmed_golds),
            "normal_gold": len(normal_golds),
            "anomaly_gold": len(anomaly_golds),
            "conflicts": len(conflicts),
            "groups_count": len(groups),
            "train_samples": len(split_res.train_sample_ids),
            "val_samples": len(split_res.val_sample_ids),
            "test_samples": len(split_res.test_sample_ids),
        },
        warnings=warnings,
        next_actions=["Call benchmark_build to formally build and export the benchmark."],
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
    """
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
