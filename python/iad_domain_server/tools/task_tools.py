import logging
from typing import Dict, Any, Optional

from iad_core.storage.database import Database
from iad_core.storage.repositories import (
    TaskRepository,
    SampleRepository,
    AnnotationRepository,
    FeatureRepository,
    ReviewRepository,
    BenchmarkRepository,
    EvaluationRepository,
)
from iad_domain_server.contracts import ToolResult, ToolStatus, MutationType

logger = logging.getLogger("iad_domain_server.tools.task")


def task_inspect(
    task_id: str,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Inspect task status and domain readiness (R303).
    Summarizes sample counts, quality status, annotations, features, reviews, builds, and evaluations.
    """
    db = Database(db_path)
    task_repo = TaskRepository(db)
    sample_repo = SampleRepository(db)
    anno_repo = AnnotationRepository(db)
    feat_repo = FeatureRepository(db)
    review_repo = ReviewRepository(db)
    bench_repo = BenchmarkRepository(db)
    eval_repo = EvaluationRepository(db)

    task = task_repo.get(task_id)
    samples = sample_repo.list_by_task(task_id)
    total_samples = len(samples)

    if total_samples == 0:
        return ToolResult(
            status=ToolStatus.NOT_READY,
            summary=f"Task '{task_id}' has no samples imported yet.",
            metrics={"total_samples": 0},
            warnings=["No dataset samples found in database."],
            next_actions=["Run dataset_audit to import and audit the dataset."],
        )

    # Quality status breakdown
    pass_count = sum(1 for s in samples if s.quality_status == "PASS")
    fail_count = sum(1 for s in samples if s.quality_status == "FAIL")
    uncertain_count = sum(1 for s in samples if s.quality_status == "UNCERTAIN")

    # Annotation count
    anno_count = anno_repo.count_by_task(task_id)

    # Feature coverage
    feat_count = feat_repo.count_by_task(task_id, "dinov2_vitb14_reg", "dinov2_224_norm")
    feat_coverage = feat_count / total_samples if total_samples > 0 else 0.0

    # Review status
    review_stats = review_repo.get_stats(task_id)

    # Latest build
    latest_build = bench_repo.get_latest_build(task_id)
    latest_build_id = latest_build.build_id if latest_build else None

    # Latest evaluations
    eval_runs = eval_repo.list_by_task(task_id)

    metrics = {
        "total_samples": total_samples,
        "quality_distribution": {
            "PASS": pass_count,
            "FAIL": fail_count,
            "UNCERTAIN": uncertain_count,
        },
        "annotations_count": anno_count,
        "feature_coverage": round(feat_coverage, 4),
        "features_cached": feat_count,
        "review_decisions_count": review_stats.get("total_decisions", 0),
        "latest_build_id": latest_build_id,
        "evaluation_runs_count": len(eval_runs),
    }

    warnings = []
    next_actions = []

    if feat_coverage < 1.0:
        warnings.append(f"Feature coverage is {feat_coverage * 100:.1f}%. Extraction required.")
        next_actions.append("Call feature_prepare to extract representations.")
    elif review_stats.get("total_decisions", 0) == 0:
        warnings.append("No human review decisions found. Hard normal candidate review is recommended.")
        next_actions.append("Call candidate_mine to discover challenging normal candidates.")
    elif not latest_build_id:
        next_actions.append("Call benchmark_build to construct train/val/test splits.")
    else:
        next_actions.append("Call evaluation_plan or baseline_run to evaluate models.")

    return ToolResult(
        status=ToolStatus.OK,
        summary=f"Task '{task_id}' inspected: {total_samples} samples (PASS: {pass_count}, FAIL: {fail_count}, UNCERTAIN: {uncertain_count}), feature coverage: {feat_coverage * 100:.1f}%.",
        metrics=metrics,
        warnings=warnings,
        next_actions=next_actions,
        mutation=MutationType.NONE,
    )
