import pytest
import numpy as np

from iad_core.storage.database import Database
from iad_core.storage.models import (
    InspectionTask,
    Sample,
    QualityStatus,
    BenchmarkBuildRecord,
    SplitAssignmentRecord,
    GoldRecord,
)
from iad_core.storage.repositories import (
    TaskRepository,
    SampleRepository,
    BenchmarkRepository,
    GoldRepository,
    EvaluationRepository,
)
from iad_core.evaluation.contracts import (
    PredictionRecord,
    ThresholdStrategy,
    EvaluationInvariantError,
)
from iad_core.evaluation.threshold import ThresholdSelector
from iad_core.evaluation.metrics import compute_image_metrics
from iad_core.evaluation.baselines.mock import MockBaselineRunner
from iad_core.evaluation.evaluator import EvaluationService


@pytest.fixture
def eval_env(tmp_path):
    db_file = str(tmp_path / "eval_invariants.db")
    db = Database(db_file)
    task_repo = TaskRepository(db)
    sample_repo = SampleRepository(db)
    bench_repo = BenchmarkRepository(db)
    gold_repo = GoldRepository(db)

    task_id = "eval_task_01"
    build_id = "eval_build_01"
    policy_name = "default"

    task = InspectionTask(
        task_id=task_id,
        task_name="Eval Test Task",
        inspection_target="surface",
        description="Task for testing evaluation invariants",
    )
    task_repo.upsert(task)

    build = BenchmarkBuildRecord(
        build_id=build_id,
        task_id=task_id,
        gold_policy=policy_name,
        split_policy="default",
        seed=42,
        status="COMPLETED",
        output_dir=str(tmp_path / "build_out"),
    )
    bench_repo.save_build(build)

    return {
        "db": db,
        "task_id": task_id,
        "build_id": build_id,
        "policy_name": policy_name,
        "sample_repo": sample_repo,
        "bench_repo": bench_repo,
        "gold_repo": gold_repo,
    }


def test_evaluation_fails_on_missing_confirmed_gold(eval_env):
    """Ticket E003: Evaluation must fail-fast with EvaluationInvariantError if any assignment lacks CONFIRMED gold."""
    bench_repo = eval_env["bench_repo"]
    sample_repo = eval_env["sample_repo"]
    task_id = eval_env["task_id"]
    build_id = eval_env["build_id"]

    # Create samples
    s_val = Sample(
        sample_id="val_s1",
        task_id=task_id,
        dataset_id="ds1",
        image_path="/path/val1.png",
        relative_path="val1.png",
        width=100,
        height=100,
        quality_status=QualityStatus.PASS,
    )
    s_test = Sample(
        sample_id="test_s1",
        task_id=task_id,
        dataset_id="ds1",
        image_path="/path/test1.png",
        relative_path="test1.png",
        width=100,
        height=100,
        quality_status=QualityStatus.FAIL,
    )
    sample_repo.upsert(s_val)
    sample_repo.upsert(s_test)

    # Assign to splits
    bench_repo.save_split_assignments([
        SplitAssignmentRecord(sample_id="val_s1", build_id=build_id, split_group_id="g1", split_name="val"),
        SplitAssignmentRecord(sample_id="test_s1", build_id=build_id, split_group_id="g2", split_name="test"),
    ])

    service = EvaluationService(db=eval_env["db"])
    runner = MockBaselineRunner(name="mock")

    # Missing GoldRecord entirely
    with pytest.raises(EvaluationInvariantError, match="lacks CONFIRMED Gold record"):
        service.evaluate_model(task_id=task_id, build_id=build_id, model=runner)


def test_threshold_f1_max_fails_fast_on_single_class_val():
    """Ticket E005: F1_MAX threshold selection must fail fast when Val has only one class."""
    preds = [
        PredictionRecord(sample_id="v1", image_score=0.2, split_name="val"),
        PredictionRecord(sample_id="v2", image_score=0.4, split_name="val"),
    ]
    # Single class (all normal 0)
    labels_single = {"v1": 0, "v2": 0}

    with pytest.raises(ValueError, match="requires both Normal.*and Anomaly"):
        ThresholdSelector.select_threshold(preds, labels_single, strategy=ThresholdStrategy.F1_MAX)


def test_threshold_recall_at_fpr_fails_fast_on_single_class_val():
    """Ticket E006: RECALL_AT_FPR threshold selection must fail fast when Val lacks required classes."""
    preds = [
        PredictionRecord(sample_id="v1", image_score=0.8, split_name="val"),
        PredictionRecord(sample_id="v2", image_score=0.9, split_name="val"),
    ]
    # Single class (all anomaly 1)
    labels_single = {"v1": 1, "v2": 1}

    with pytest.raises(ValueError, match="requires both Normal.*and Anomaly"):
        ThresholdSelector.select_threshold(preds, labels_single, strategy=ThresholdStrategy.RECALL_AT_FPR)


def test_evaluation_uses_binary_label_and_hard_normal(eval_env):
    """Tickets E001, E002, E007: Evaluation strictly maps binary_label and tracks hard normal & class counts."""
    bench_repo = eval_env["bench_repo"]
    sample_repo = eval_env["sample_repo"]
    gold_repo = eval_env["gold_repo"]
    task_id = eval_env["task_id"]
    build_id = eval_env["build_id"]
    policy_name = eval_env["policy_name"]

    # 1 train, 2 val (1 normal, 1 anomaly), 3 test (1 regular normal, 1 hard normal, 1 anomaly)
    samples = [
        Sample(sample_id="tr1", task_id=task_id, dataset_id="ds1", image_path="/p/tr1.png", relative_path="tr1.png", width=10, height=10, quality_status=QualityStatus.PASS),
        Sample(sample_id="v_norm", task_id=task_id, dataset_id="ds1", image_path="/p/vn.png", relative_path="vn.png", width=10, height=10, quality_status=QualityStatus.PASS),
        Sample(sample_id="v_anom", task_id=task_id, dataset_id="ds1", image_path="/p/va.png", relative_path="va.png", width=10, height=10, quality_status=QualityStatus.FAIL),
        Sample(sample_id="t_norm", task_id=task_id, dataset_id="ds1", image_path="/p/tn.png", relative_path="tn.png", width=10, height=10, quality_status=QualityStatus.PASS),
        Sample(sample_id="t_hn", task_id=task_id, dataset_id="ds1", image_path="/p/thn.png", relative_path="thn.png", width=10, height=10, quality_status=QualityStatus.UNCERTAIN),
        Sample(sample_id="t_anom", task_id=task_id, dataset_id="ds1", image_path="/p/ta.png", relative_path="ta.png", width=10, height=10, quality_status=QualityStatus.FAIL),
    ]
    for s in samples:
        sample_repo.upsert(s)

    assignments = [
        SplitAssignmentRecord(sample_id="tr1", build_id=build_id, split_group_id="g0", split_name="train"),
        SplitAssignmentRecord(sample_id="v_norm", build_id=build_id, split_group_id="g1", split_name="val"),
        SplitAssignmentRecord(sample_id="v_anom", build_id=build_id, split_group_id="g2", split_name="val"),
        SplitAssignmentRecord(sample_id="t_norm", build_id=build_id, split_group_id="g3", split_name="test"),
        SplitAssignmentRecord(sample_id="t_hn", build_id=build_id, split_group_id="g4", split_name="test"),
        SplitAssignmentRecord(sample_id="t_anom", build_id=build_id, split_group_id="g5", split_name="test"),
    ]
    bench_repo.save_split_assignments(assignments)

    golds = [
        GoldRecord(sample_id="tr1", task_id=task_id, policy_name=policy_name, gold_quality="PASS", binary_label="NORMAL", hard_normal=False, gold_source="HUMAN_REVIEW", gold_status="CONFIRMED", image_path="/p/tr1.png", relative_path="tr1.png"),
        GoldRecord(sample_id="v_norm", task_id=task_id, policy_name=policy_name, gold_quality="PASS", binary_label="NORMAL", hard_normal=False, gold_source="HUMAN_REVIEW", gold_status="CONFIRMED", image_path="/p/vn.png", relative_path="vn.png"),
        GoldRecord(sample_id="v_anom", task_id=task_id, policy_name=policy_name, gold_quality="FAIL", binary_label="ANOMALY", hard_normal=False, gold_source="HUMAN_REVIEW", gold_status="CONFIRMED", image_path="/p/va.png", relative_path="va.png"),
        GoldRecord(sample_id="t_norm", task_id=task_id, policy_name=policy_name, gold_quality="PASS", binary_label="NORMAL", hard_normal=False, gold_source="HUMAN_REVIEW", gold_status="CONFIRMED", image_path="/p/tn.png", relative_path="tn.png"),
        GoldRecord(sample_id="t_hn", task_id=task_id, policy_name=policy_name, gold_quality="HARD_NORMAL", binary_label="NORMAL", hard_normal=True, gold_source="HUMAN_REVIEW", gold_status="CONFIRMED", image_path="/p/thn.png", relative_path="thn.png"),
        GoldRecord(sample_id="t_anom", task_id=task_id, policy_name=policy_name, gold_quality="FAIL", binary_label="ANOMALY", hard_normal=False, gold_source="HUMAN_REVIEW", gold_status="CONFIRMED", image_path="/p/ta.png", relative_path="ta.png"),
    ]
    gold_repo.upsert_batch(golds)

    service = EvaluationService(db=eval_env["db"])
    runner = MockBaselineRunner(name="mock")
    eval_run = service.evaluate_model(task_id=task_id, build_id=build_id, model=runner)

    # Verify class counts
    assert eval_run.val_class_counts == {"NORMAL": 1, "ANOMALY": 1}
    assert eval_run.test_class_counts == {"NORMAL": 2, "ANOMALY": 1, "HARD_NORMAL": 1}

    # Verify Hard Normal metric was calculated
    assert eval_run.hard_normal_metrics is not None
    assert eval_run.hard_normal_metrics.hard_normal_count == 1
    assert eval_run.image_metrics.i_auroc is not None
    assert 0.0 <= eval_run.image_metrics.i_auroc <= 1.0
