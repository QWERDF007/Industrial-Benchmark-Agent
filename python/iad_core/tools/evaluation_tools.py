import os
import json
import logging
from typing import Optional, List, Dict, Any, Tuple

from iad_core.storage.database import Database
from iad_core.storage.models import EvaluationRunRecord
from iad_core.storage.repositories import BenchmarkRepository, EvaluationRepository
from iad_core.evaluation.contracts import ThresholdStrategy, EvaluationPlan
from iad_core.evaluation.report import generate_comparison_report
from iad_core.contracts import ToolResult, ToolStatus, MutationType, ArtifactRef

logger = logging.getLogger("iad_core.tools.evaluation")


def evaluation_plan(
    task_id: str,
    build_id: str,
    model_ids: Optional[List[str]] = None,
    threshold_strategy: str = "f1_max",
    target_fpr: float = 0.01,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Plan baseline model evaluations on a specific benchmark build (R308, V2-S01).
    """
    if not build_id:
        raise ValueError("build_id is required for evaluation_plan")

    models = model_ids or ["patchcore", "dinomaly2"]
    db = Database(db_path)
    bench_repo = BenchmarkRepository(db)
    build = bench_repo.get_build(build_id)

    if not build:
        return ToolResult(
            status=ToolStatus.NOT_READY,
            summary=f"Benchmark build '{build_id}' not found. Cannot formulate evaluation plan.",
            warnings=[f"Build '{build_id}' does not exist."],
            next_actions=["Run benchmark_build to construct a benchmark build first."],
        )

    return ToolResult(
        status=ToolStatus.OK,
        summary=f"Evaluation plan created for task '{task_id}', build '{build_id}'. Models: {', '.join(models)}.",
        metrics={
            "task_id": task_id,
            "build_id": build_id,
            "models": models,
            "threshold_strategy": threshold_strategy,
            "target_fpr": target_fpr,
        },
        next_actions=[f"Call baseline_run for each model in {models}."],
        mutation=MutationType.NONE,
    )


def baseline_run(
    task_id: str,
    build_id: str,
    model_id: str = "dinomaly2",
    threshold_strategy: str = "f1_max",
    target_fpr: float = 0.01,
    output_dir: Optional[str] = None,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Execute baseline training and evaluation on a benchmark build (R308, V2-S01).
    STRICT SECURITY INVARIANT (R608):
    Threshold selection algorithms can ONLY consume Validation split predictions!
    Test predictions are evaluated strictly at the Val-fitted threshold.
    """
    if not build_id:
        raise ValueError("build_id is required for baseline_run")

    db = Database(db_path)
    bench_repo = BenchmarkRepository(db)
    target_build = bench_repo.get_build(build_id)

    if not target_build:
        return ToolResult(
            status=ToolStatus.NOT_READY,
            summary=f"No valid benchmark build found for build '{build_id}'. Cannot execute baseline.",
            warnings=[f"Build '{build_id}' not found."],
            next_actions=["Run benchmark_build first."],
        )

    try:
        strat = ThresholdStrategy(threshold_strategy)
    except ValueError:
        strat = ThresholdStrategy.F1_MAX

    from iad_core.evaluation.evaluator import EvaluationService
    eval_service = EvaluationService(db_path=db_path)
    try:
        eval_run = eval_service.evaluate_model(
            task_id=task_id,
            build_id=build_id,
            model=model_id,
            threshold_strategy=strat,
            target_fpr=target_fpr,
            output_dir=output_dir,
        )
    except Exception as e:
        logger.error(f"Baseline run failed for {model_id}: {e}", exc_info=True)
        return ToolResult(
            status=ToolStatus.ERROR,
            summary=f"Baseline execution failed for '{model_id}': {str(e)}",
            warnings=[str(e)],
            next_actions=["Verify benchmark build exists and contains valid Val and Test splits."],
        )

    im = eval_run.image_metrics
    hn = eval_run.hard_normal_metrics

    artifacts = [
        ArtifactRef(
            artifact_id=f"metrics_md_{eval_run.run_id}",
            artifact_type="evaluation_report_markdown",
            uri=f"iad://evaluation/{eval_run.run_id}/metrics.md",
            path=os.path.abspath(eval_run.report_md_path),
            summary="Model evaluation metrics and domain breakdown in Markdown",
        ),
        ArtifactRef(
            artifact_id=f"error_analysis_md_{eval_run.run_id}",
            artifact_type="error_analysis_markdown",
            uri=f"iad://evaluation/{eval_run.run_id}/error_analysis.md",
            path=os.path.abspath(eval_run.error_analysis_md_path),
            summary="Top false positive and false negative error analysis in Markdown",
        ),
        ArtifactRef(
            artifact_id=f"metrics_json_{eval_run.run_id}",
            artifact_type="evaluation_metrics_json",
            uri=f"iad://evaluation/{eval_run.run_id}/metrics.json",
            path=os.path.abspath(eval_run.metrics_json_path),
            summary="Detailed evaluation metrics in JSON",
        ),
    ]

    auroc_str = f"{im.i_auroc:.4f}" if im.i_auroc is not None else "N/A"
    summary = (
        f"Baseline '{model_id}' evaluated on '{build_id}': I-AUROC={auroc_str}, "
        f"F1={im.f1:.4f}, Hard Normal FPR={hn.hard_normal_fpr:.4f} (Val threshold={eval_run.threshold.threshold:.4f})."
    )

    return ToolResult(
        status=ToolStatus.OK,
        summary=summary,
        metrics={
            "run_id": eval_run.run_id,
            "model_id": model_id,
            "build_id": build_id,
            "i_auroc": im.i_auroc,
            "i_ap": im.i_ap,
            "recall_at_fpr_01": im.recall_at_fpr_01,
            "f1": im.f1,
            "accuracy": im.accuracy,
            "hard_normal_fpr": hn.hard_normal_fpr,
            "selected_threshold": eval_run.threshold.threshold,
            "elapsed_seconds": eval_run.elapsed_seconds,
        },
        artifacts=artifacts,
        next_actions=[
            "Call baseline_run to evaluate another model for comparison.",
            "Call evaluation_compare to generate multi-model comparison.",
        ],
        mutation=MutationType.DERIVED_ARTIFACT,
    )


def evaluation_compare(
    task_id: str,
    build_id: str,
    run_ids: Optional[List[str]] = None,
    output_dir: Optional[str] = None,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Compare multiple baseline evaluation runs on a benchmark build (R308, V2-S01).
    Analyzes overall metrics, Hard Normal robustness, and Domain Shift generalization.
    """
    if not build_id:
        raise ValueError("build_id is required for evaluation_compare")

    db = Database(db_path)
    eval_repo = EvaluationRepository(db)
    bench_repo = BenchmarkRepository(db)
    all_records = eval_repo.list_by_task(task_id)
    # Filter by build_id and optional run_ids
    filtered = [r for r in all_records if r.build_id == build_id]
    warnings = []

    if run_ids:
        filtered = [r for r in filtered if r.run_id in run_ids]
        for r in filtered:
            m = r.metrics or {}
            if r.status in ("FAILED", "PROTOCOL_INVALID") or m.get("status") in ("FAILED", "PROTOCOL_INVALID"):
                warnings.append(f"Run '{r.run_id}' is marked as {r.status}. It will be excluded from formal ranking.")
    else:
        # Default: pick latest valid run per (model_id, protocol) (NV-14, NS-10)
        valid_records = []
        for r in filtered:
            m = r.metrics or {}
            if r.status in ("FAILED", "PROTOCOL_INVALID") or m.get("status") in ("FAILED", "PROTOCOL_INVALID"):
                continue
            valid_records.append(r)

        # Group by (model_id, protocol) and pick latest run (first seen since records are ordered by id DESC)
        latest_by_model: Dict[Tuple[str, str], EvaluationRunRecord] = {}
        for r in valid_records:
            m = r.metrics or {}
            proto = m.get("protocol") or "UNKNOWN"
            key = (r.model_id, proto)
            if key not in latest_by_model:
                latest_by_model[key] = r

        filtered = list(latest_by_model.values())

    if not filtered:
        target_build = bench_repo.get_build(build_id)
        if not target_build:
            return ToolResult(
                status=ToolStatus.NOT_READY,
                summary=f"Benchmark build '{build_id}' not found. Cannot compare evaluations.",
                warnings=[f"Build '{build_id}' not found."],
                next_actions=["Run benchmark_build first."],
            )
        return ToolResult(
            status=ToolStatus.NOT_READY,
            summary=f"No valid completed evaluation runs found for build '{build_id}'.",
            warnings=["Please execute baseline_run on this build first."],
            next_actions=["Run baseline_run to generate evaluation runs."],
        )

    # Convert records back to EvaluationRun
    runs = []
    for r in filtered:
        try:
            from iad_core.evaluation.contracts import EvaluationRun
            er = EvaluationRun.model_validate(r.metrics)
            runs.append(er)
        except Exception as e:
            logger.warning(f"Failed to parse evaluation metrics for run {r.run_id}: {e}")

    out_d = output_dir or os.path.join("runs", "evaluation", f"compare_{build_id}")
    out_md = os.path.join(out_d, "comparison.md")
    report_res = generate_comparison_report(runs, output_path=out_md)

    compared_count = len(report_res.get("models", []))
    if compared_count == 0:
        return ToolResult(
            status=ToolStatus.NOT_READY,
            summary=f"No valid runs could be compared for build '{build_id}'.",
            warnings=warnings or ["No runs passed evaluation validity checks."],
            next_actions=["Execute new baseline runs with valid protocols."],
        )

    artifacts = [
        ArtifactRef(
            artifact_id=f"comparison_md_{build_id}",
            artifact_type="comparison_report_markdown",
            uri=f"iad://benchmark/{build_id}/comparison.md",
            path=os.path.abspath(out_md),
            summary="Multi-model benchmark comparison and domain shift analysis in Markdown",
        )
    ]

    return ToolResult(
        status=ToolStatus.OK,
        summary=f"Compared {compared_count} baseline runs on build '{build_id}'. Best Hard Normal model: '{report_res.get('best_hard_normal_model')}'.",
        metrics={
            "build_id": build_id,
            "compared_runs_count": compared_count,
            "best_hard_normal_model": report_res.get("best_hard_normal_model"),
            "models": report_res.get("models"),
            "selected_eval_run_ids": report_res.get("selected_eval_run_ids"),
            "track_readiness": report_res.get("track_readiness"),
            "fpr_resolution": report_res.get("fpr_resolution"),
        },
        artifacts=artifacts,
        warnings=warnings,
        next_actions=["Inspect comparison.md for full model rankings."],
        mutation=MutationType.DERIVED_ARTIFACT,
    )
