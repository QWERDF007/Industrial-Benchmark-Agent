import pytest
from iad_core.storage.models import Sample, QualityStatus
from iad_core.gold.schemas import GoldRecord, GoldStatus
from iad_core.evaluation.contracts import EvaluationInvariantError
from iad_core.evaluation.training import select_training_samples, TrainSelectionResult


def make_sample(sample_id: str, quality: QualityStatus = QualityStatus.PASS) -> Sample:
    return Sample(
        sample_id=sample_id,
        task_id="task_test",
        dataset_id="ds_test",
        image_path=f"/fake/{sample_id}.png",
        relative_path=f"{sample_id}.png",
        width=100,
        height=100,
        quality_status=quality,
    )


def make_gold(
    sample_id: str,
    binary_label: str = "NORMAL",
    hard_normal: bool = False,
    status: str = "CONFIRMED",
) -> GoldRecord:
    return GoldRecord(
        sample_id=sample_id,
        task_id="task_test",
        policy_name="test_policy",
        gold_quality="HARD_NORMAL" if hard_normal else ("PASS" if binary_label == "NORMAL" else "FAIL"),
        binary_label=binary_label,
        hard_normal=hard_normal,
        gold_source="HUMAN_REVIEW",
        gold_status=status,
        image_path=f"/fake/{sample_id}.png",
        relative_path=f"{sample_id}.png",
    )


def test_select_training_samples_basic():
    """NV-05 / NS-05: Selects normal training samples based strictly on CONFIRMED Gold binary_label."""
    s1 = make_sample("s1", quality=QualityStatus.PASS)
    s2 = make_sample("s2", quality=QualityStatus.PASS)
    s3 = make_sample("s3", quality=QualityStatus.UNCERTAIN)  # raw uncertain, but gold normal
    s4 = make_sample("s4", quality=QualityStatus.FAIL)
    s5 = make_sample("s5", quality=QualityStatus.PASS)       # raw pass, but gold anomaly (inverted)

    gold_map = {
        "s1": make_gold("s1", binary_label="NORMAL", hard_normal=False),
        "s2": make_gold("s2", binary_label="NORMAL", hard_normal=False),
        "s3": make_gold("s3", binary_label="NORMAL", hard_normal=True),
        "s4": make_gold("s4", binary_label="ANOMALY", hard_normal=False),
        "s5": make_gold("s5", binary_label="ANOMALY", hard_normal=False),
    }

    train_samples = [s1, s2, s3, s4, s5]

    # Default: include_hard_normal_in_train = True
    res = select_training_samples(train_samples, gold_map, include_hard_normal_in_train=True)
    assert isinstance(res, TrainSelectionResult)
    assert res.train_total_count == 5
    assert res.normal_count == 3
    assert res.hard_normal_count == 1
    assert res.anomaly_count == 2
    assert [s.sample_id for s in res.train_normal] == ["s1", "s2", "s3"]
    assert [s.sample_id for s in res.train_anomaly] == ["s4", "s5"]

    # When include_hard_normal_in_train = False
    res_no_hn = select_training_samples(train_samples, gold_map, include_hard_normal_in_train=False)
    assert res_no_hn.normal_count == 2
    assert res_no_hn.hard_normal_count == 1
    assert [s.sample_id for s in res_no_hn.train_normal] == ["s1", "s2"]
    assert "s3" not in [s.sample_id for s in res_no_hn.train_normal]


def test_select_training_samples_fails_on_unconfirmed_gold():
    """NV-05: Missing or unconfirmed gold in training set raises EvaluationInvariantError."""
    s1 = make_sample("s1")
    s2 = make_sample("s2")

    gold_map = {
        "s1": make_gold("s1", status="CONFIRMED"),
        "s2": make_gold("s2", status="PENDING"),
    }

    with pytest.raises(EvaluationInvariantError, match="lacks CONFIRMED Gold"):
        select_training_samples([s1, s2], gold_map)


def test_select_training_samples_fails_when_no_normal():
    """NV-05: Fail-fast when train_normal is empty."""
    s1 = make_sample("s1")
    gold_map = {
        "s1": make_gold("s1", binary_label="ANOMALY"),
    }

    with pytest.raises(EvaluationInvariantError, match="No normal training samples found"):
        select_training_samples([s1], gold_map)


def test_train_selection_dict_export():
    """NV-05: train_selection export structure."""
    s1 = make_sample("s1")
    gold_map = {"s1": make_gold("s1", binary_label="NORMAL")}
    res = select_training_samples([s1], gold_map)
    d = res.to_dict()
    assert d["train_total_count"] == 1
    assert d["train_normal_count"] == 1
    assert d["normal_sample_ids"] == ["s1"]
    assert d["anomaly_sample_ids"] == []


def test_train_selection_on_real_003_build():
    """NV-05: Verifies on real kuangjiao _003 build: exactly 67 train samples, 4 normal (3 PASS + 1 HN), 63 anomaly."""
    import os
    from iad_core.storage.database import Database
    from iad_core.storage.repositories import BenchmarkRepository, SampleRepository, GoldRepository

    db_path = "data/benchmark.db"
    if not os.path.exists(db_path):
        pytest.skip("data/benchmark.db not found")

    db = Database(db_path)
    bench_repo = BenchmarkRepository(db)
    sample_repo = SampleRepository(db)
    gold_repo = GoldRepository(db)

    build_id = "kuangjiao_inspection_01_20261017_003"
    build = bench_repo.get_build(build_id)
    if not build:
        pytest.skip(f"Build {build_id} not found in DB")

    assignments = bench_repo.get_split_assignments_by_build(build_id)
    split_map = {a.sample_id: a.split_name for a in assignments}

    all_samples = sample_repo.list_by_task("kuangjiao_inspection_01")
    sample_dict = {s.sample_id: s for s in all_samples}
    gold_records = gold_repo.list_by_task("kuangjiao_inspection_01", policy_name=build.gold_policy)
    gold_dict = {g.sample_id: g for g in gold_records}

    train_samples = [sample_dict[sid] for sid, sp in split_map.items() if sp == "train" and sid in sample_dict]
    assert len(train_samples) == 67

    res = select_training_samples(train_samples, gold_dict, include_hard_normal_in_train=True)
    assert res.train_total_count == 67
    assert res.normal_count == 4
    assert res.hard_normal_count == 1
    assert res.anomaly_count == 63
    assert len(res.train_normal) == 4
    assert len(res.train_anomaly) == 63

