import pytest
import os
import json
import sqlite3
from typing import List, Dict

from iad_core.storage.models import Sample, QualityStatus, DataOrigin
from iad_core.task.config import SplitPolicyConfig, SplitRatiosConfig
from iad_core.split.group import build_split_groups, SplitGroup
from iad_core.split.builder import build_group_split, SplitResult
from iad_core.split.leakage import check_leakage, LeakageReport


def create_sample(
    sample_id: str,
    physical_sample_id: str = None,
    capture_sequence_id: str = None,
    data_origin: DataOrigin = DataOrigin.UNKNOWN,
    quality_status: QualityStatus = QualityStatus.PASS,
) -> Sample:
    return Sample(
        sample_id=sample_id,
        task_id="task_split_test",
        dataset_id="ds_test",
        image_path=f"/img/{sample_id}.jpg",
        relative_path=f"{sample_id}.jpg",
        width=100,
        height=100,
        physical_sample_id=physical_sample_id,
        capture_sequence_id=capture_sequence_id,
        data_origin=data_origin,
        quality_status=quality_status,
    )


def test_group_physical_sample():
    s1 = create_sample("s1", physical_sample_id="phys_A")
    s2 = create_sample("s2", physical_sample_id="phys_A")
    s3 = create_sample("s3", physical_sample_id="phys_B")

    groups, sample_to_group = build_split_groups([s1, s2, s3])
    assert sample_to_group["s1"] == sample_to_group["s2"]
    assert sample_to_group["s1"] != sample_to_group["s3"]
    assert len(groups) == 2


def test_group_capture_sequence():
    s1 = create_sample("s1", capture_sequence_id="seq_10")
    s2 = create_sample("s2", capture_sequence_id="seq_10")
    s3 = create_sample("s3", capture_sequence_id="seq_20")

    groups, sample_to_group = build_split_groups([s1, s2, s3])
    assert sample_to_group["s1"] == sample_to_group["s2"]
    assert sample_to_group["s1"] != sample_to_group["s3"]


def test_group_verified_duplicate():
    s1 = create_sample("s1")
    s2 = create_sample("s2")
    s3 = create_sample("s3")

    dup_pairs = [("s1", "s2")]
    groups, sample_to_group = build_split_groups([s1, s2, s3], verified_pairs=dup_pairs)
    assert sample_to_group["s1"] == sample_to_group["s2"]
    assert sample_to_group["s1"] != sample_to_group["s3"]


def test_group_transitive_union():
    # s1 ~ s2 (phys_A)
    # s2 ~ s3 (duplicate pair)
    # s3 ~ s4 (seq_X)
    s1 = create_sample("s1", physical_sample_id="phys_A")
    s2 = create_sample("s2", physical_sample_id="phys_A")
    s3 = create_sample("s3", capture_sequence_id="seq_X")
    s4 = create_sample("s4", capture_sequence_id="seq_X")
    s5 = create_sample("s5")  # isolated

    dup_pairs = [("s2", "s3")]
    groups, sample_to_group = build_split_groups([s1, s2, s3, s4, s5], verified_pairs=dup_pairs)

    grp_1 = sample_to_group["s1"]
    assert sample_to_group["s2"] == grp_1
    assert sample_to_group["s3"] == grp_1
    assert sample_to_group["s4"] == grp_1
    assert sample_to_group["s5"] != grp_1
    assert len(groups) == 2


def test_split_deterministic():
    samples = [
        create_sample(f"s_{i:02d}", physical_sample_id=f"phys_{i // 3}", quality_status=QualityStatus.PASS if i % 2 == 0 else QualityStatus.FAIL)
        for i in range(30)
    ]
    policy = SplitPolicyConfig(seed=42)

    groups, sample_to_group = build_split_groups(samples)
    split1 = build_group_split(samples, groups, sample_to_group, policy)
    split2 = build_group_split(samples, groups, sample_to_group, policy)

    assert split1.assignments == split2.assignments
    assert set(split1.train_ids) == set(split2.train_ids)
    assert set(split1.val_ids) == set(split2.val_ids)
    assert set(split1.test_ids) == set(split2.test_ids)


def test_group_never_cross_split():
    samples = [
        create_sample(f"s_{i:02d}", physical_sample_id=f"phys_{i // 2}", quality_status=QualityStatus.PASS if i % 2 == 0 else QualityStatus.FAIL)
        for i in range(40)
    ]
    policy = SplitPolicyConfig(seed=123)

    groups, sample_to_group = build_split_groups(samples)
    split = build_group_split(samples, groups, sample_to_group, policy)

    for grp in groups:
        assigned_splits = {split.assignments[s_id] for s_id in grp.sample_ids}
        assert len(assigned_splits) == 1, f"Group {grp.group_id} crossed splits: {assigned_splits}"


def test_augmented_not_in_test():
    samples = [
        create_sample(f"s_{i:02d}", data_origin=DataOrigin.AUGMENTED if i < 10 else DataOrigin.LEGACY_TRAIN)
        for i in range(30)
    ]
    policy = SplitPolicyConfig(seed=42, exclude_origins_from_test=["AUGMENTED"])

    groups, sample_to_group = build_split_groups(samples)
    split = build_group_split(samples, groups, sample_to_group, policy)

    for sid in split.test_ids:
        assert sid not in [f"s_{i:02d}" for i in range(10)], f"Augmented sample {sid} entered test split"


def test_leakage_physical_detected():
    s1 = create_sample("s1", physical_sample_id="phys_leak")
    s2 = create_sample("s2", physical_sample_id="phys_leak")
    samples = [s1, s2]

    # Malicious/invalid assignment: s1 in train, s2 in test
    assignments = {"s1": "train", "s2": "test"}
    report = check_leakage(samples, assignments)

    assert report.is_passed is False
    assert len(report.physical_leakages) > 0
    assert report.physical_leakages[0]["physical_sample_id"] == "phys_leak"


def test_leakage_duplicate_detected():
    s1 = create_sample("s1")
    s2 = create_sample("s2")
    samples = [s1, s2]
    verified_pairs = [("s1", "s2")]

    assignments = {"s1": "train", "s2": "val"}
    report = check_leakage(samples, assignments, verified_pairs=verified_pairs)

    assert report.is_passed is False
    assert len(report.duplicate_leakages) > 0
    assert report.duplicate_leakages[0]["sample_id_a"] == "s1"
    assert report.duplicate_leakages[0]["sample_id_b"] == "s2"


def test_leakage_augmented_in_test_detected():
    s1 = create_sample("s1", data_origin=DataOrigin.AUGMENTED)
    samples = [s1]

    assignments = {"s1": "test"}
    report = check_leakage(samples, assignments)

    assert report.is_passed is False
    assert len(report.augmented_leakages) > 0
