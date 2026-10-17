import os
import json
import sqlite3
import pytest

from app.schemas.sample import QualityStatus, DataOrigin
from app.storage.database import Database
from app.benchmark.builder import run_benchmark_pipeline


def test_benchmark_e2e_synthetic(tmp_path):
    db_path = str(tmp_path / "benchmark_test.db")
    Database(db_path)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    task_id = "task_synthetic_01"

    # Insert 30 synthetic samples
    for i in range(30):
        sid = f"s_{i:02d}"
        phys_id = f"phys_{i // 3}" if i < 15 else None
        seq_id = f"seq_{i // 2}" if 15 <= i < 20 else None
        origin = "AUGMENTED" if 20 <= i < 24 else "LEGACY_TRAIN"
        quality = "PASS" if i < 10 else ("FAIL" if i < 18 else "UNCERTAIN")

        cursor.execute("""
            INSERT INTO samples (
                sample_id, task_id, dataset_id, image_path, relative_path,
                quality_status, data_origin, physical_sample_id,
                capture_sequence_id, width, height
            ) VALUES (?, ?, 'ds_synth', ?, ?, ?, ?, ?, ?, 100, 100)
        """, (
            sid, task_id, f"/img/{sid}.jpg", f"{sid}.jpg",
            quality, origin, phys_id, seq_id,
        ))

    # Insert review decisions:
    # s_18, s_19 -> HARD_NORMAL
    cursor.execute("""
        INSERT INTO review_decisions (sample_id, decision, reviewer, reason_code)
        VALUES ('s_18', 'HARD_NORMAL', 'expert_reviewer_1', 'VARIATION'),
               ('s_19', 'HARD_NORMAL', 'expert_reviewer_1', 'VARIATION')
    """)

    # s_24, s_25 -> FAIL
    cursor.execute("""
        INSERT INTO review_decisions (sample_id, decision, reviewer, reason_code)
        VALUES ('s_24', 'FAIL', 'expert_reviewer_1', 'TRUE_DEFECT'),
               ('s_25', 'FAIL', 'expert_reviewer_1', 'TRUE_DEFECT')
    """)

    # s_26 -> CONFLICT (two expert reviewers disagree)
    cursor.execute("""
        INSERT INTO review_decisions (sample_id, decision, reviewer)
        VALUES ('s_26', 'PASS', 'reviewer_1'),
               ('s_26', 'FAIL', 'expert_reviewer_1')
    """)

    # Insert annotations
    cursor.execute("""
        INSERT INTO annotations (
            annotation_id, sample_id, annotation_type, raw_label,
            bbox_json, geometry_status, source
        ) VALUES ('anno_1', 's_10', 'bbox', 'scratch', '[10,10,40,40]', 'VALID', 'imported'),
                 ('anno_2', 's_10', 'bbox', 'dust', '[-5,0,20,20]', 'INVALID', 'imported')
    """)

    conn.commit()
    conn.close()

    out_dir = str(tmp_path / "benchmark_run")
    build_id = "test_build_synthetic_001"

    result = run_benchmark_pipeline(
        task_id=task_id,
        build_id=build_id,
        output_dir=out_dir,
        db_path=db_path,
        seed=42,
    )

    # 1. Verification of exported files
    assert os.path.exists(result.gold_jsonl)
    assert os.path.exists(result.split_json)
    assert os.path.exists(result.train_jsonl)
    assert os.path.exists(result.val_jsonl)
    assert os.path.exists(result.test_jsonl)
    assert os.path.exists(result.conflicts_json)
    assert os.path.exists(result.leakage_json)
    assert os.path.exists(result.leakage_md)
    assert os.path.exists(result.benchmark_report_md)

    # 2. Verification of Leakage Gate
    assert result.leakage_passed is True

    # 3. Verification of Conflict
    assert result.conflict_count == 1
    with open(result.conflicts_json, "r", encoding="utf-8") as f:
        conflicts = json.load(f)
        assert len(conflicts) == 1
        assert conflicts[0]["sample_id"] == "s_26"

    # 4. Check that augmented samples never enter test
    with open(result.test_jsonl, "r", encoding="utf-8") as f:
        test_samples = [json.loads(line) for line in f if line.strip()]
        for s in test_samples:
            assert s["data_origin"] != "AUGMENTED"

    # 5. Check database tables
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM split_assignments WHERE build_id = ?", (build_id,))
    split_count = cursor.fetchone()[0]
    cursor.execute("SELECT status FROM benchmark_builds WHERE build_id = ?", (build_id,))
    b_status = cursor.fetchone()[0]
    conn.close()

    assert split_count == result.train_count + result.val_count + result.test_count
    assert b_status in ("READY", "PARTIAL")
