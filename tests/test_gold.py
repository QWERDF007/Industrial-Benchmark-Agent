import pytest
import os
import json
import sqlite3
from typing import List

from app.schemas.sample import Sample, QualityStatus, DataOrigin
from app.schemas.annotation import Annotation, GeometryStatus, AnnotationSource, AnnotationType
from app.schemas.config import GoldPolicyConfig
from app.review.schemas import ReviewDecisionRecord
from app.gold.schemas import GoldRecord, GoldConflictRecord, GoldQuality, BinaryLabel, GoldStatus
from app.gold.resolver import resolve_gold_for_sample
from app.gold.annotation import filter_and_convert_gold_annotations
from app.gold.builder import build_gold
from app.storage.database import Database


def test_gold_review_priority_overrides_existing():
    sample = Sample(
        sample_id="s1",
        task_id="task_test",
        image_path="/tmp/s1.jpg",
        relative_path="s1.jpg",
        quality_status=QualityStatus.FAIL,
        quality_source="imported",
        width=100,
        height=100,
    )
    review = ReviewDecisionRecord(
        sample_id="s1",
        decision="PASS",
        reviewer="expert_reviewer_1",
        reason_code="OVERKILL",
        comment="Pseudo defect, golden sample",
    )
    policy = GoldPolicyConfig(
        policy_name="test_policy",
        trusted_reviewers=["expert_reviewer_1"],
        source_priority=["HUMAN_REVIEW", "PRODUCTION_QA", "EXISTING_QUALITY"],
    )

    gold, conflict = resolve_gold_for_sample(sample, [review], policy)
    assert conflict is None
    assert gold.gold_quality == "PASS"
    assert gold.binary_label == BinaryLabel.NORMAL.value
    assert gold.gold_source == "HUMAN_REVIEW"
    assert gold.gold_source_ref == "expert_reviewer_1"
    assert gold.provenance["reviewer"] == "expert_reviewer_1"
    assert gold.provenance["reason_code"] == "OVERKILL"
    # Original sample is strictly preserved
    assert sample.quality_status == QualityStatus.FAIL


def test_gold_hard_normal_binary_normal():
    sample = Sample(
        sample_id="s2",
        task_id="task_test",
        image_path="/tmp/s2.jpg",
        relative_path="s2.jpg",
        quality_status=QualityStatus.UNCERTAIN,
        width=100,
        height=100,
    )
    review = ReviewDecisionRecord(
        sample_id="s2",
        decision="HARD_NORMAL",
        reviewer="expert_reviewer_1",
        reason_code="PROCESS_VARIATION",
    )
    policy = GoldPolicyConfig(
        policy_name="test_policy",
        trusted_reviewers=["expert_reviewer_1"],
    )

    gold, conflict = resolve_gold_for_sample(sample, [review], policy)
    assert conflict is None
    assert gold.gold_quality == "HARD_NORMAL"
    assert gold.binary_label == BinaryLabel.NORMAL.value
    assert gold.hard_normal is True
    assert gold.gold_status == GoldStatus.CONFIRMED.value


def test_gold_conflict_disagreement():
    sample = Sample(
        sample_id="s3",
        task_id="task_test",
        image_path="/tmp/s3.jpg",
        relative_path="s3.jpg",
        quality_status=QualityStatus.PASS,
        width=100,
        height=100,
    )
    review1 = ReviewDecisionRecord(
        sample_id="s3",
        decision="PASS",
        reviewer="expert_1",
    )
    review2 = ReviewDecisionRecord(
        sample_id="s3",
        decision="FAIL",
        reviewer="expert_2",
    )
    policy = GoldPolicyConfig(
        policy_name="test_policy",
        trusted_reviewers=["expert_1", "expert_2"],
    )

    gold, conflict = resolve_gold_for_sample(sample, [review1, review2], policy)
    assert conflict is not None
    assert gold.gold_status == GoldStatus.CONFLICT.value
    assert gold.gold_quality == GoldQuality.CONFLICT.value
    assert gold.binary_label is None
    assert conflict.sample_id == "s3"


def test_uncertain_excluded():
    sample = Sample(
        sample_id="s4",
        task_id="task_test",
        image_path="/tmp/s4.jpg",
        relative_path="s4.jpg",
        quality_status=QualityStatus.UNCERTAIN,
        width=100,
        height=100,
    )
    policy = GoldPolicyConfig(policy_name="test_policy")

    gold, conflict = resolve_gold_for_sample(sample, [], policy)
    assert conflict is None
    assert gold.gold_status == GoldStatus.EXCLUDED.value
    assert gold.gold_quality == GoldQuality.EXCLUDED.value
    assert gold.binary_label is None


def test_annotation_filtering():
    annos = [
        Annotation(
            annotation_id="a1",
            sample_id="s1",
            annotation_type=AnnotationType.BBOX,
            raw_label="scratch",
            geometry_status=GeometryStatus.VALID,
            bbox=[10, 10, 50, 50],
        ),
        Annotation(
            annotation_id="a2",
            sample_id="s1",
            annotation_type=AnnotationType.BBOX,
            raw_label="dust",
            geometry_status=GeometryStatus.INVALID,
            bbox=[-10, 10, 50, 50],
        ),
        Annotation(
            annotation_id="a3",
            sample_id="s1",
            annotation_type=AnnotationType.BBOX,
            raw_label="dent",
            geometry_status=GeometryStatus.CLIPPED,
            bbox=[0, 0, 100, 100],
        ),
    ]

    gold_annos = filter_and_convert_gold_annotations(annos)
    assert len(gold_annos) == 2
    assert {a.annotation_id for a in gold_annos} == {"a1", "a3"}


def test_build_gold_e2e(tmp_path):
    db_path = str(tmp_path / "test.db")
    Database(db_path)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Insert test samples
    cursor.execute("""
        INSERT INTO samples (sample_id, task_id, dataset_id, image_path, relative_path, quality_status, width, height)
        VALUES ('s1', 'task_1', 'ds1', '/img/s1.jpg', 's1.jpg', 'PASS', 100, 100),
               ('s2', 'task_1', 'ds1', '/img/s2.jpg', 's2.jpg', 'UNCERTAIN', 100, 100),
               ('s3', 'task_1', 'ds1', '/img/s3.jpg', 's3.jpg', 'UNCERTAIN', 100, 100),
               ('s4', 'task_1', 'ds1', '/img/s4.jpg', 's4.jpg', 'FAIL', 100, 100)
    """)
    # Insert review: s2 -> HARD_NORMAL
    cursor.execute("""
        INSERT INTO review_decisions (sample_id, decision, reviewer, reason_code)
        VALUES ('s2', 'HARD_NORMAL', 'expert_1', 'VARIATION')
    """)
    conn.commit()
    conn.close()

    out_dir = str(tmp_path / "gold_out")
    policy = GoldPolicyConfig(
        policy_name="p1",
        trusted_reviewers=["expert_1"],
    )

    res = build_gold(
        task_id="task_1",
        policy=policy,
        output_dir=out_dir,
        db_path=db_path,
    )

    assert res.total_samples == 4
    assert res.gold_confirmed_count == 3  # s1 (PASS), s2 (HARD_NORMAL), s4 (FAIL)
    assert res.normal_count == 1  # s1
    assert res.hard_normal_count == 1  # s2
    assert res.fail_count == 1  # s4
    assert res.excluded_count == 1  # s3 (UNCERTAIN)

    assert os.path.exists(res.gold_jsonl_path)
    assert os.path.exists(res.conflicts_json_path)

    # Verify database persistence
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT sample_id, gold_quality, binary_label, hard_normal, gold_status FROM gold_records ORDER BY sample_id")
    rows = cursor.fetchall()
    conn.close()

    assert len(rows) == 4
    assert rows[0] == ("s1", "PASS", "NORMAL", 0, "CONFIRMED")
    assert rows[1] == ("s2", "HARD_NORMAL", "NORMAL", 1, "CONFIRMED")
    assert rows[2] == ("s3", "EXCLUDED", None, 0, "EXCLUDED")
    assert rows[3] == ("s4", "FAIL", "ANOMALY", 0, "CONFIRMED")
