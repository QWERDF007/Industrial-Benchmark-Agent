import os
import pytest

from iad_core.storage.database import Database
from iad_core.storage.repositories import BenchmarkRepository
from iad_core.benchmark.builder import preview_benchmark_pipeline, run_benchmark_pipeline
from iad_core.tools.benchmark_tools import benchmark_preview, benchmark_build
from iad_core.contracts import ToolStatus
from iad_core.candidate.schemas import CandidateRecord, CandidateSignals


def test_preview_benchmark_matches_build_counts():
    """NV-12 / NS-09: Benchmark Preview uses unified Core logic and matches build split counts."""
    task_id = "kuangjiao_inspection_01"
    config_path = "configs/kuangjiao.yaml"
    db_path = "data/benchmark.db"

    if not os.path.exists(config_path) or not os.path.exists(db_path):
        pytest.skip("Kuangjiao config or DB not found")

    # Call preview directly
    preview_res = preview_benchmark_pipeline(
        task_id=task_id,
        config_path=config_path,
        seed=42,
        db_path=db_path,
    )

    assert preview_res.status == "OK"
    assert preview_res.projected_train == 67
    assert preview_res.projected_val == 23
    assert preview_res.projected_test == 24
    assert preview_res.normal == 8  # 5 PASS + 3 Hard Normal
    assert preview_res.hard_normal == 3
    assert preview_res.anomaly == 106

    # Call tool benchmark_preview
    tool_res = benchmark_preview(
        task_id=task_id,
        config_path=config_path,
        seed=42,
        db_path=db_path,
    )
    assert tool_res.status == ToolStatus.OK
    assert tool_res.metrics["train_samples"] == 67
    assert tool_res.metrics["val_samples"] == 23
    assert tool_res.metrics["test_samples"] == 24
    assert tool_res.metrics["normal_gold"] == 8
    assert tool_res.metrics["anomaly_gold"] == 106


def test_review_gate_non_required_candidates_do_not_block(tmp_path):
    """NV-13 / NS-04: Non-required UNCERTAIN candidates (is_required=False) do NOT block benchmark_build."""
    from iad_core.storage.models import InspectionTask, Sample, QualityStatus, GoldRecord
    from iad_core.storage.repositories import TaskRepository, SampleRepository, GoldRepository
    from iad_core.storage.review_repository import ReviewRepository

    db_path = str(tmp_path / "test_gate.db")
    db = Database(db_path)
    task_repo = TaskRepository(db)
    sample_repo = SampleRepository(db)
    gold_repo = GoldRepository(db)
    review_repo = ReviewRepository(db)

    task_id = "test_task_nonreq"
    task_repo.upsert(InspectionTask(task_id=task_id, task_name="Task NonReq", inspection_target="t"))

    # Create samples: 4 pass, 2 fail, 1 uncertain
    samples = []
    golds = []
    for i in range(4):
        sid = f"norm_{i}"
        samples.append(Sample(sample_id=sid, task_id=task_id, dataset_id="ds", image_path=f"/{sid}.png", relative_path=f"{sid}.png", width=10, height=10, quality_status=QualityStatus.PASS))
        golds.append(GoldRecord(sample_id=sid, task_id=task_id, policy_name="default", gold_quality="PASS", binary_label="NORMAL", gold_source="HUMAN_REVIEW", gold_status="CONFIRMED", image_path=f"/{sid}.png", relative_path=f"{sid}.png"))

    for i in range(2):
        sid = f"anom_{i}"
        samples.append(Sample(sample_id=sid, task_id=task_id, dataset_id="ds", image_path=f"/{sid}.png", relative_path=f"{sid}.png", width=10, height=10, quality_status=QualityStatus.FAIL))
        golds.append(GoldRecord(sample_id=sid, task_id=task_id, policy_name="default", gold_quality="FAIL", binary_label="ANOMALY", gold_source="HUMAN_REVIEW", gold_status="CONFIRMED", image_path=f"/{sid}.png", relative_path=f"{sid}.png"))

    # 1 uncertain sample
    samples.append(Sample(sample_id="unc_1", task_id=task_id, dataset_id="ds", image_path="/unc_1.png", relative_path="unc_1.png", width=10, height=10, quality_status=QualityStatus.UNCERTAIN))

    sample_repo.upsert_batch(samples)
    gold_repo.upsert_batch(golds)

    # Note: unc_1 is not required (is_required=False in fallback, or not in required_review_ids)
    # When benchmark_build runs without required review candidates, it should succeed (not halt with REVIEW_REQUIRED)
    import yaml
    cfg_data = {
        "dataset": {"id": "ds", "name": "DS"},
        "root": str(tmp_path),
        "task": {"task_id": task_id, "name": "Task", "inspection_target": "t"},
        "gold": {"policy_name": "default", "source_priority": ["HUMAN_REVIEW", "EXISTING_QUALITY"]},
        "split": {"policy_name": "default", "seed": 42},
        "review_policy": {"policy_name": "default", "required_review_ids": []},
    }
    cfg_path = str(tmp_path / "config.yaml")
    with open(cfg_path, "w", encoding="utf-8") as f:
        yaml.dump(cfg_data, f)

    res = benchmark_build(
        task_id=task_id,
        config_path=cfg_path,
        db_path=db_path,
        output_dir=str(tmp_path / "build_out"),
    )
    assert res.status == ToolStatus.OK
    assert "Benchmark build" in res.summary
