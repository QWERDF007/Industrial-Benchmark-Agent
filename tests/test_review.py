import os
import json
import tempfile
import numpy as np
import pytest

from iad_core.storage.database import Database
from iad_core.storage.repositories import (
    TaskRepository,
    SampleRepository,
    FeatureRepository,
    AnnotationRepository,
    ReviewDecisionRepository,
)
from iad_core.storage.models import (
    FeatureRecord,
    InspectionTask,
    Sample,
    QualityStatus,
    DataOrigin,
    Annotation,
    AnnotationType,
    AnnotationSource,
    GeometryStatus,
)
from iad_core.evidence.builder import EvidenceBuilder, build_evidence
from iad_core.review.schemas import ReviewDecisionType, ReasonCode, ReviewDecisionRecord
from iad_core.review.service import ReviewQueueService
from iad_core.review.report import export_review_decisions, generate_review_report


@pytest.fixture
def review_test_env():
    """Create a temporary environment with synthetic database, features, and annotations."""
    temp_dir = tempfile.mkdtemp()
    db_path = os.path.join(temp_dir, "test_review.db")
    db = Database(db_path)
    db.init_schema()

    task_id = "test_review_task"
    task_repo = TaskRepository(db)
    task_repo.upsert(
        InspectionTask(
            task_id=task_id,
            product="semiconductor",
            station="sta_2",
            camera="cam_2",
            inspection_target="scratch",
            description="Test task for review queue",
        )
    )

    sample_repo = SampleRepository(db)
    feat_repo = FeatureRepository(db)
    anno_repo = AnnotationRepository(db)

    dim = 32
    rng = np.random.default_rng(100)

    # 1 PASS sample
    pass_id = "pass_sample_01"
    sample_repo.upsert(
        Sample(
            sample_id=pass_id,
            task_id=task_id,
            dataset_id="ds_test",
            image_path=os.path.join(temp_dir, f"{pass_id}.png"),
            relative_path=f"{pass_id}.png",
            data_origin=DataOrigin.LEGACY_TRAIN,
            quality_status=QualityStatus.PASS,
            batch_id="batch_01",
            width=200,
            height=200,
        )
    )
    with open(os.path.join(temp_dir, f"{pass_id}.png"), "w") as f:
        f.write("mock png")

    v_pass = rng.standard_normal(dim).astype(np.float32)
    v_pass /= np.linalg.norm(v_pass)
    feat_repo.upsert(
        FeatureRecord(
            sample_id=pass_id,
            model_id="dinov2_vitb14_reg",
            preprocess_key="dinov2_224_norm",
            dim=dim,
            dtype="fp16",
            embedding_blob=v_pass.astype(np.float16).tobytes(),
        )
    )

    # 3 UNCERTAIN candidates
    cand_ids = ["cand_01", "cand_02", "cand_03"]
    for idx, c_id in enumerate(cand_ids):
        sample_repo.upsert(
            Sample(
                sample_id=c_id,
                task_id=task_id,
                dataset_id="ds_test",
                image_path=os.path.join(temp_dir, f"{c_id}.png"),
                relative_path=f"{c_id}.png",
                data_origin=DataOrigin.LEGACY_TEST,
                quality_status=QualityStatus.UNCERTAIN,
                batch_id="batch_01",
                physical_sample_id=f"chip_{idx + 1}",
                width=200,
                height=200,
            )
        )
        with open(os.path.join(temp_dir, f"{c_id}.png"), "w") as f:
            f.write("mock png")

        v_cand = v_pass + rng.normal(0, 0.2, dim).astype(np.float32)
        v_cand /= np.linalg.norm(v_cand)
        feat_repo.upsert(
            FeatureRecord(
                sample_id=c_id,
                model_id="dinov2_vitb14_reg",
                preprocess_key="dinov2_224_norm",
                dim=dim,
                dtype="fp16",
                embedding_blob=v_cand.astype(np.float16).tobytes(),
            )
        )

    # Add annotation for cand_01
    anno_repo.upsert(
        Annotation(
            annotation_id="anno_cand_01",
            sample_id="cand_01",
            annotation_type=AnnotationType.BBOX,
            raw_label="edge_variation",
            phenomenon="edge_shift",
            bbox=[10, 10, 50, 50],
            geometry_status=GeometryStatus.VALID,
            source=AnnotationSource.IMPORTED,
        )
    )

    # Create dummy verified_groups.json
    groups_path = os.path.join(temp_dir, "verified_groups.json")
    with open(groups_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "task_id": task_id,
                "groups": [
                    {
                        "group_id": "ver_grp_01",
                        "sample_ids": ["cand_01", "cand_02"],
                        "avg_similarity": 0.99,
                        "is_verified": True,
                        "is_cross_origin": False,
                    }
                ],
            },
            f,
        )

    return {
        "db": db,
        "db_path": db_path,
        "temp_dir": temp_dir,
        "task_id": task_id,
        "cand_ids": cand_ids,
        "pass_id": pass_id,
        "groups_path": groups_path,
    }


def test_evidence_package_completeness(review_test_env):
    env = review_test_env
    builder = EvidenceBuilder(
        task_id=env["task_id"],
        db=env["db"],
        verified_groups_path=env["groups_path"],
    )

    ev = builder.build_evidence("cand_01")

    # Checks completeness
    assert ev.sample_id == "cand_01"
    assert ev.task_id == env["task_id"]
    assert ev.evidence_version == "v2"

    # Metadata
    assert ev.metadata["physical_sample_id"] == "chip_1"
    assert ev.metadata["batch_id"] == "batch_01"
    assert ev.metadata["quality_status"] == "UNCERTAIN"

    # Annotations
    assert len(ev.annotations) == 1
    assert ev.annotations[0].phenomenon == "edge_shift"

    # Nearest normal reference
    assert len(ev.nearest_normal) >= 1
    assert ev.nearest_normal[0].sample_id == env["pass_id"]
    assert 0.0 <= ev.nearest_normal[0].similarity <= 1.0

    # Nearest neighbors
    assert len(ev.nearest_neighbors) >= 1
    neighbor_ids = [n.sample_id for n in ev.nearest_neighbors]
    assert "cand_01" not in neighbor_ids  # Should not include query itself

    # Verified duplicates & component members
    assert len(ev.verified_duplicates) == 1
    assert ev.verified_duplicates[0].sample_id == "cand_02"
    assert ev.verified_duplicates[0].group_id == "ver_grp_01"
    assert len(ev.verified_component_members) == 1
    assert ev.verified_component_members[0].sample_id == "cand_02"


def test_review_decision_persistence_and_isolated_quality(review_test_env):
    """
    CRITICAL INVARIANT TEST:
    Verifies review decision is saved to review_decisions,
    and samples.quality_status in SQLite remains strictly untouched!
    """
    env = review_test_env
    db = env["db"]
    repo = ReviewDecisionRepository(db)
    sample_repo = SampleRepository(db)

    # Check original quality status
    s_before = sample_repo.get("cand_01")
    assert s_before is not None
    assert s_before.quality_status == QualityStatus.UNCERTAIN

    # Save HARD_NORMAL review decision
    rec = ReviewDecisionRecord(
        sample_id="cand_01",
        decision="HARD_NORMAL",
        reviewer="expert_alice",
        reason_code="normal_color_shift",
        comment="Mild color shift but meets cosmetic requirements",
        evidence_version="v1",
        review_duration_ms=4500,
    )
    repo.append_decision(rec)

    # 1. Verify saved in review_decisions
    saved = repo.get("cand_01", reviewer="expert_alice")
    assert saved is not None
    assert saved.decision == "HARD_NORMAL"
    assert saved.reason_code == "normal_color_shift"
    assert saved.review_duration_ms == 4500

    # 2. Check counts
    counts = repo.count_by_decision(env["task_id"])
    assert counts.get("HARD_NORMAL") == 1

    # 3. CRITICAL: Verify samples table quality_status was NOT mutated
    s_after = sample_repo.get("cand_01")
    assert s_after.quality_status == QualityStatus.UNCERTAIN
    assert s_after.quality_status == s_before.quality_status


def test_review_queue_service(review_test_env):
    env = review_test_env
    service = ReviewQueueService(
        task_id=env["task_id"],
        db=env["db"],
    )

    # Initial stats
    stats_0 = service.get_stats()
    assert stats_0.total_candidates == 3
    assert stats_0.reviewed_count == 0
    assert stats_0.pending_count == 3

    # Next candidate
    ev1 = service.get_next_pending()
    assert ev1 is not None
    first_id = ev1.sample_id

    # Save decision for first candidate
    service.save_decision(
        sample_id=first_id,
        decision=ReviewDecisionType.HARD_NORMAL,
        reason_code=ReasonCode.NORMAL_POSITION_SHIFT,
        comment="Approved minor shift",
        reviewer="default",
        duration_ms=3000,
    )

    # Stats after 1 review
    stats_1 = service.get_stats()
    assert stats_1.reviewed_count == 1
    assert stats_1.pending_count == 2
    assert stats_1.candidate_yield == 1.0  # 1 HARD_NORMAL / 1 reviewed

    # Next should now be second candidate
    ev2 = service.get_next_pending()
    assert ev2 is not None
    assert ev2.sample_id != first_id

    # Skip second candidate
    service.skip_sample(sample_id=ev2.sample_id, reason="Corrupted glare", reviewer="default", duration_ms=1000)

    # Stats after skip
    stats_2 = service.get_stats()
    assert stats_2.reviewed_count == 2
    assert stats_2.skipped_count == 1
    assert stats_2.pending_count == 1


def test_review_report_and_export(review_test_env):
    env = review_test_env
    db = env["db"]
    task_id = env["task_id"]
    out_dir = os.path.join(env["temp_dir"], "runs", "review")

    service = ReviewQueueService(task_id=task_id, db=db)
    service.save_decision(
        sample_id="cand_01",
        decision=ReviewDecisionType.HARD_NORMAL,
        reason_code=ReasonCode.NORMAL_COLOR_SHIFT,
        comment="Good hard normal",
        duration_ms=2500,
    )
    service.save_decision(
        sample_id="cand_02",
        decision=ReviewDecisionType.FAIL,
        reason_code=ReasonCode.DEFECT_CONFIRMED,
        comment="Crack observed",
        duration_ms=3500,
    )

    service.save_decision(sample_id="cand_01", decision=ReviewDecisionType.FAIL, comment="Confirmed after inspection")

    # Export JSON
    exp_path = export_review_decisions(task_id=task_id, db=db, output_dir=out_dir)
    assert os.path.exists(exp_path)
    with open(exp_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert len(data) == 3
    assert {r["comment"] for r in data if r["sample_id"] == "cand_01"} == {"Good hard normal", "Confirmed after inspection"}

    # Generate Markdown Report
    rep_path = generate_review_report(task_id=task_id, db=db, output_dir=out_dir)
    assert os.path.exists(rep_path)
    with open(rep_path, "r", encoding="utf-8") as f:
        md = f.read()

    assert f"# Human Review Audit Report: {task_id}" in md
    assert "HARD_NORMAL" in md
    assert "FAIL" in md
    assert "Decision Distribution" in md
    assert "Reason Codes Breakdown" in md


def test_review_session_and_wall_clock_tracking(review_test_env):
    """C309: Verify review_session_id, started_at, and submitted_at are persisted and queried."""
    env = review_test_env
    db = env["db"]
    task_id = env["task_id"]

    service = ReviewQueueService(task_id=task_id, db=db)
    session_id = "session_20261017_test_01"
    start_ts = "2026-10-17T11:45:00.000Z"
    submit_ts = "2026-10-17T11:45:03.500Z"

    rec = service.save_decision(
        sample_id="cand_03",
        decision=ReviewDecisionType.HARD_NORMAL,
        reason_code=ReasonCode.NORMAL_NOMINAL,
        comment="Session test",
        reviewer="session_reviewer",
        review_session_id=session_id,
        started_at=start_ts,
        submitted_at=submit_ts,
        duration_ms=3500,
    )

    repo = ReviewDecisionRepository(db)
    saved = repo.get("cand_03", reviewer="session_reviewer")
    assert saved is not None
    assert saved.review_session_id == session_id
    assert saved.started_at == start_ts
    assert saved.submitted_at == submit_ts
    assert saved.review_duration_ms == 3500
    assert saved.evidence_version == "v2"
