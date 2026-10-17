import os
import json
import pytest
import numpy as np

from iad_core.storage.database import Database
from iad_core.storage.models import (
    InspectionTask,
    Sample,
    QualityStatus,
    DataOrigin,
    BenchmarkBuildRecord,
    SplitAssignmentRecord,
    GoldRecord,
    EvaluationRunRecord,
)
from iad_core.storage.repositories import (
    TaskRepository,
    SampleRepository,
    BenchmarkRepository,
    GoldRepository,
    EvaluationRepository,
    FeatureRepository,
)
from iad_core.evaluation.contracts import (
    PredictionRecord,
    ThresholdStrategy,
    ThresholdResult,
)
from iad_core.evaluation.threshold import ThresholdSelector
from iad_core.evaluation.metrics import (
    compute_image_metrics,
    compute_hard_normal_metrics,
)
from iad_core.evaluation.baselines.mock import MockBaselineRunner
from iad_core.evaluation.baselines.feature_knn import FeatureMemoryBankRunner
from iad_core.evaluation.evaluator import EvaluationService


def test_threshold_selector_security_invariant():
    """R608: Test set predictions MUST NEVER enter ThresholdSelector."""
    preds = [
        PredictionRecord(
            sample_id="test_01",
            image_score=0.85,
            split_name="test",
            predicted_label=1,
        )
    ]
    labels = {"test_01": 1}

    with pytest.raises(ValueError, match="SECURITY VIOLATION"):
        ThresholdSelector.select_threshold(preds, labels, strategy=ThresholdStrategy.F1_MAX)


def test_threshold_selector_strategies():
    """Test ThresholdSelector with F1_MAX, RECALL_AT_FPR, and MANUAL."""
    # Synthetic validation set: 10 normal (scores around 0.1~0.3) and 10 anomaly (scores around 0.7~0.9)
    rng = np.random.default_rng(42)
    val_preds = []
    val_labels = {}

    for i in range(10):
        sid = f"val_norm_{i}"
        score = float(rng.uniform(0.1, 0.3))
        val_preds.append(PredictionRecord(sample_id=sid, image_score=score, split_name="val"))
        val_labels[sid] = 0

    for i in range(10):
        sid = f"val_anom_{i}"
        score = float(rng.uniform(0.7, 0.9))
        val_preds.append(PredictionRecord(sample_id=sid, image_score=score, split_name="val"))
        val_labels[sid] = 1

    # 1. F1_MAX
    res_f1 = ThresholdSelector.select_threshold(val_preds, val_labels, strategy=ThresholdStrategy.F1_MAX)
    assert 0.3 <= res_f1.threshold <= 0.8
    assert res_f1.best_f1 == 1.0

    # 2. RECALL_AT_FPR
    res_fpr = ThresholdSelector.select_threshold(
        val_preds, val_labels, strategy=ThresholdStrategy.RECALL_AT_FPR, target_fpr=0.01
    )
    assert res_fpr.threshold >= 0.25

    # 3. MANUAL
    res_man = ThresholdSelector.select_threshold(
        val_preds, val_labels, strategy=ThresholdStrategy.MANUAL, manual_threshold=0.50
    )
    assert res_man.threshold == 0.50


def test_image_metrics_calculation():
    """Verify standard binary classification & ranking metrics."""
    scores = np.array([0.1, 0.2, 0.3, 0.7, 0.8, 0.9])
    labels = np.array([0, 0, 0, 1, 1, 1])
    th = 0.5

    metrics = compute_image_metrics(scores=scores, binary_labels=labels, threshold=th)
    assert metrics.accuracy == 1.0
    assert metrics.precision == 1.0
    assert metrics.recall == 1.0
    assert metrics.f1 == 1.0
    assert metrics.true_positive == 3
    assert metrics.true_negative == 3
    assert metrics.false_positive == 0
    assert metrics.false_negative == 0
    assert metrics.i_auroc == 1.0
    assert metrics.i_ap == 1.0


def test_hard_normal_metrics_calculation():
    """Verify hard normal false positive rate and separation margin."""
    hard_normal_scores = np.array([0.45, 0.55, 0.65])  # 1 false positive at th=0.5
    normal_scores = np.array([0.1, 0.2, 0.3])
    th = 0.5

    hn_metrics = compute_hard_normal_metrics(
        hard_normal_scores=hard_normal_scores,
        normal_scores=normal_scores,
        threshold=th,
    )
    assert hn_metrics.hard_normal_count == 3
    # 2 of 3 (0.55, 0.65) are >= 0.5
    assert abs(hn_metrics.hard_normal_fpr - (2 / 3)) < 1e-4
    assert hn_metrics.separation_margin > 0.0


def test_mock_baseline_runner():
    """Verify MockBaselineRunner deterministic execution."""
    runner = MockBaselineRunner(name="mock_test")
    samples = [
        Sample(
            sample_id=f"s_{i}",
            task_id="t1",
            dataset_id="d1",
            image_path=f"/fake/{i}.png",
            relative_path=f"{i}.png",
            quality_status=QualityStatus.PASS,
            width=100,
            height=100,
        )
        for i in range(4)
    ]
    runner.prepare(task_id="t1", build_id="b1", train_samples=samples)
    preds = runner.predict(samples, split_name="test")
    assert len(preds) == 4
    for p in preds:
        assert p.split_name == "test"
        assert 0.0 <= p.image_score <= 1.0


def test_evaluation_service_end_to_end(tmp_path):
    """End-to-end evaluation flow: fit on Val, evaluate on Test, save artifacts."""
    db_path = str(tmp_path / "test_eval.db")
    db = Database(db_path)

    task_id = "eval_test_task"
    build_id = "build_001"
    run_dir = str(tmp_path / "runs")

    # Repos
    task_repo = TaskRepository(db)
    sample_repo = SampleRepository(db)
    bench_repo = BenchmarkRepository(db)
    gold_repo = GoldRepository(db)

    task_repo.upsert(
        InspectionTask(
            task_id=task_id,
            product="phone",
            inspection_target="scratch",
        )
    )

    # Insert 10 samples (4 train, 3 val, 3 test)
    samples = []
    assignments = []
    golds = []

    for i in range(10):
        sid = f"sample_{i:02d}"
        if i < 4:
            sp = "train"
            q = QualityStatus.PASS
            b_label = "NORMAL"
            hn = False
        elif i < 7:
            sp = "val"
            q = QualityStatus.PASS if i < 6 else QualityStatus.FAIL
            b_label = "NORMAL" if i < 6 else "ANOMALY"
            hn = (i == 5)
        else:
            sp = "test"
            q = QualityStatus.PASS if i < 9 else QualityStatus.FAIL
            b_label = "NORMAL" if i < 9 else "ANOMALY"
            hn = (i == 8)

        s = Sample(
            sample_id=sid,
            task_id=task_id,
            dataset_id="ds_eval",
            image_path=f"/fake/{sid}.png",
            relative_path=f"{sid}.png",
            quality_status=q,
            width=100,
            height=100,
        )
        samples.append(s)
        assignments.append(
            SplitAssignmentRecord(
                build_id=build_id,
                sample_id=sid,
                split_name=sp,
                split_group_id=f"grp_{i}",
            )
        )
        golds.append(
            GoldRecord(
                sample_id=sid,
                task_id=task_id,
                policy_name="default_gold_policy",
                gold_quality=q.value,
                binary_label=b_label,
                hard_normal=hn,
                gold_source="HUMAN_REVIEW",
                gold_status="CONFIRMED",
                image_path=f"/fake/{sid}.png",
                relative_path=f"{sid}.png",
            )
        )

    sample_repo.upsert_batch(samples)
    bench_repo.upsert_build(
        BenchmarkBuildRecord(
            build_id=build_id,
            task_id=task_id,
            dataset_id="ds_eval",
            gold_policy="default_gold_policy",
            split_policy="default_split_policy",
            seed=42,
            train_count=4,
            val_count=3,
            test_count=3,
            conflict_count=0,
            leakage_passed=True,
            status="READY",
            output_dir=run_dir,
        )
    )
    bench_repo.upsert_split_assignments(assignments)
    gold_repo.upsert_batch(golds)

    # Run evaluation
    service = EvaluationService(db=db)
    eval_run = service.evaluate_model(
        task_id=task_id,
        build_id=build_id,
        model="mock",
        threshold_strategy=ThresholdStrategy.F1_MAX,
        output_dir=run_dir,
    )

    assert eval_run.task_id == task_id
    assert eval_run.build_id == build_id
    assert eval_run.image_metrics is not None
    assert eval_run.threshold is not None

    # Check files created
    assert os.path.exists(eval_run.metrics_json_path)
    assert os.path.exists(eval_run.predictions_path)
    assert os.path.exists(eval_run.report_md_path)

    # Check database persistence
    eval_repo = EvaluationRepository(db)
    saved = eval_repo.get_run(eval_run.run_id)
    assert saved is not None
    assert saved.status == "COMPLETED"
