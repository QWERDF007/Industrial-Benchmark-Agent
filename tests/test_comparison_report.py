import pytest
import numpy as np

from iad_core.evaluation.contracts import (
    EvaluationRun,
    ThresholdResult,
    ThresholdStrategy,
    ImageMetrics,
    PixelMetrics,
    HardNormalMetrics,
    DomainMetrics,
)
from iad_core.evaluation.report import generate_comparison_report
from iad_core.storage.database import Database
from iad_core.storage.models import EvaluationRunRecord
from iad_core.storage.repositories import EvaluationRepository
from iad_core.tools.evaluation_tools import evaluation_compare
from iad_core.contracts import ToolStatus


def make_dummy_run(
    run_id: str,
    model_id: str,
    protocol: str = "UNSUPERVISED_NORMAL",
    n_normal: int = 2,
    n_hn: int = 1,
    n_anomaly: int = 22,
    hard_normal_fpr: float = 0.0,
    status: str = "COMPLETED",
) -> EvaluationRun:
    th = ThresholdResult(
        threshold=0.5,
        strategy=ThresholdStrategy.F1_MAX,
        fit_split="val",
        fit_samples_count=23,
        best_f1=0.9,
    )
    im = ImageMetrics(
        i_auroc=0.85,
        i_ap=0.90,
        recall_at_fpr_01=1.0,
        recall_at_fpr_05=1.0,
        threshold=0.5,
        accuracy=0.92,
        precision=0.91,
        recall=0.93,
        f1=0.92,
        true_positive=20,
        false_positive=1,
        true_negative=1,
        false_negative=2,
    )
    hn = HardNormalMetrics(
        hard_normal_count=n_hn,
        hard_normal_fpr=hard_normal_fpr,
        hard_normal_score_mean=0.3,
        hard_normal_score_median=0.3,
        normal_score_mean=0.2,
        normal_score_median=0.2,
        separation_margin=0.1,
    )
    dm = DomainMetrics(
        metrics_by_domain={
            "domain_A": {
                "sample_count": 10,
                "normal_count": 0,
                "anomaly_count": 10,
                "accuracy": 1.0,
                "f1": 1.0,
                "i_auroc": None,
                "false_positive": 0,
                "false_negative": 0,
            },
            "domain_B": {
                "sample_count": 14,
                "normal_count": 2,
                "anomaly_count": 12,
                "accuracy": 0.90,
                "f1": 0.91,
                "i_auroc": 0.88,
                "false_positive": 1,
                "false_negative": 0,
            },
        }
    )
    return EvaluationRun(
        run_id=run_id,
        task_id="kuangjiao_inspection_01",
        build_id="kuangjiao_inspection_01_20261017_003",
        model_id=model_id,
        status=status,
        protocol=protocol,
        threshold=th,
        image_metrics=im,
        pixel_metrics=PixelMetrics(status="NOT_EVALUATED"),
        hard_normal_metrics=hn,
        domain_metrics=dm,
        val_class_counts={"NORMAL": 1, "ANOMALY": 22},
        test_class_counts={"NORMAL": n_normal, "HARD_NORMAL": n_hn, "ANOMALY": n_anomaly},
        predictions_path="/tmp/preds.jsonl",
        metrics_json_path="/tmp/metrics.json",
        report_md_path="/tmp/report.md",
        error_analysis_md_path="/tmp/error.md",
        elapsed_seconds=1.5,
    )


def test_generate_comparison_report_deduplicates_runs():
    """NV-14 / NS-10: Exactly one row per (model_id, protocol), picks latest run, excludes FAILED."""
    runs = [
        make_dummy_run(run_id="run_knn_01", model_id="feature_knn_dinov2"),
        make_dummy_run(run_id="run_knn_02", model_id="feature_knn_dinov2"),  # Newer run
        make_dummy_run(run_id="run_patch_01", model_id="patchcore"),
        make_dummy_run(run_id="run_bad_01", model_id="broken_model", status="FAILED"),  # FAILED
        make_dummy_run(run_id="run_proto_01", model_id="invalid_model", status="PROTOCOL_INVALID"),  # PROTOCOL_INVALID
    ]

    res = generate_comparison_report(runs)

    assert len(res["models"]) == 2  # feature_knn_dinov2 and patchcore only
    model_ids = [m["model_id"] for m in res["models"]]
    assert model_ids == ["feature_knn_dinov2", "patchcore"]

    # Selected run for feature_knn_dinov2 must be the newer one
    assert res["selected_eval_run_ids"]["feature_knn_dinov2"] == "run_knn_02"
    assert res["selected_eval_run_ids"]["patchcore"] == "run_patch_01"


def test_generate_comparison_report_statistical_sufficiency():
    """NV-15 / NS-11: Resolution reporting, Recall@1%FPR marked NOT_EVALUATED, provisional HN."""
    run = make_dummy_run(
        run_id="run_dino_01",
        model_id="dinomaly2",
        protocol="PRETRAINED_INFERENCE",
        n_normal=2,
        n_hn=1,
        n_anomaly=22,
        hard_normal_fpr=0.0,
    )

    res = generate_comparison_report([run])

    # Check FPR resolution = 1 / 2 = 50%
    assert res["fpr_resolution"] == 0.5
    assert "PARTIAL" in res["track_readiness"]
    assert res["models"][0]["recall_at_fpr_01_status"] == "NOT_EVALUATED"

    # Check Markdown output
    md = res["report_markdown"]
    assert "Target FPR Resolution**: `50.0%` (`1 / 2`)" in md
    assert "NOT_EVALUATED (res=50%)" in md
    assert "0/1 (0.0000) [PROVISIONAL]" in md
    assert "PROVISIONAL" in md


def test_domain_breakdown_single_class_na_auroc():
    """NV-15 / NS-11: Domains with 0 normal samples have I-AUROC = N/A."""
    run = make_dummy_run(run_id="run_01", model_id="patchcore")
    res = generate_comparison_report([run])
    md = res["report_markdown"]

    # Domain A has 0 normal samples, so AUROC must be N/A
    assert "| `domain_A` | 0 | 10 | 1.0000 | 1.0000 | N/A | 0 | 0 |" in md
    # Domain B has 2 normal samples, so AUROC is calculated
    assert "| `domain_B` | 2 | 12 | 0.9000 | 0.9100 | 0.8800 | 1 | 0 |" in md


def test_evaluation_compare_tool_e2e(tmp_path):
    """NV-14 / NV-15 E2E: Tool correctly filters and deduplicates database records."""
    db_file = str(tmp_path / "test_compare.db")
    db = Database(db_file)
    eval_repo = EvaluationRepository(db)

    task_id = "task_test"
    build_id = "build_003"

    run1 = make_dummy_run("run_old_knn", "feature_knn_dinov2")
    run2 = make_dummy_run("run_new_knn", "feature_knn_dinov2")
    run3 = make_dummy_run("run_patch", "patchcore")
    run_failed = make_dummy_run("run_fail", "failed_model", status="FAILED")

    for r in [run1, run2, run3, run_failed]:
        r.task_id = task_id
        r.build_id = build_id
        eval_repo.save_run(
            EvaluationRunRecord(
                run_id=r.run_id,
                task_id=r.task_id,
                build_id=r.build_id,
                model_id=r.model_id,
                threshold_strategy="f1_max",
                status=r.status,
                output_dir=str(tmp_path / r.run_id),
                metrics=r.model_dump(),
            )
        )

    tool_res = evaluation_compare(
        task_id=task_id,
        build_id=build_id,
        output_dir=str(tmp_path / "out_compare"),
        db_path=db_file,
    )

    assert tool_res.status == ToolStatus.OK
    assert tool_res.metrics["compared_runs_count"] == 2
    assert tool_res.metrics["selected_eval_run_ids"]["feature_knn_dinov2"] == "run_new_knn"
    assert tool_res.metrics["selected_eval_run_ids"]["patchcore"] == "run_patch"
