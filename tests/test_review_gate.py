import os
import json
import pytest
from PIL import Image

from iad_core.storage.database import Database
from iad_core.storage.models import (
    InspectionTask,
    Sample,
    QualityStatus,
    ReviewSession,
    ReviewDecisionRecord,
)
from iad_core.storage.repositories import TaskRepository, SampleRepository
from iad_core.storage.review_repository import ReviewRepository
from iad_core.candidate.schemas import CandidateRecord, CandidateSignals
from iad_core.contracts import ToolStatus
from iad_core.tools.benchmark_tools import benchmark_build
from iad_core.dataset.path_safety import validate_sample_image_path, PathSafetyError


@pytest.fixture
def test_env(tmp_path):
    test_db = str(tmp_path / "test_benchmark.db")
    
    db = Database(test_db)
    task_repo = TaskRepository(db)
    sample_repo = SampleRepository(db)
    review_repo = ReviewRepository(db)

    # Create dummy images
    img_dir = tmp_path / "images"
    img_dir.mkdir()
    img1_path = str(img_dir / "sample1.png")
    img2_path = str(img_dir / "sample2.png")
    Image.new("RGB", (50, 50), color="white").save(img1_path)
    Image.new("RGB", (50, 50), color="blue").save(img2_path)

    # Seed task
    task = InspectionTask(
        task_id="gate_task_01",
        task_name="Gate Test Task",
        inspection_target="surface",
        description="Task for testing review gate",
    )
    task_repo.upsert(task)

    # Seed samples: sample1 is UNCERTAIN (acting as candidate), sample2 is PASS
    s1 = Sample(
        sample_id="gate_task_01:img1",
        task_id="gate_task_01",
        dataset_id="ds1",
        image_path=img1_path,
        relative_path="img1.png",
        width=50,
        height=50,
        quality_status=QualityStatus.UNCERTAIN,
    )
    s2 = Sample(
        sample_id="gate_task_01:img2",
        task_id="gate_task_01",
        dataset_id="ds1",
        image_path=img2_path,
        relative_path="img2.png",
        width=50,
        height=50,
        quality_status=QualityStatus.PASS,
    )
    sample_repo.upsert(s1)
    sample_repo.upsert(s2)

    return {
        "db": db,
        "db_path": test_db,
        "task_id": "gate_task_01",
        "sample1": s1,
        "sample2": s2,
        "review_repo": review_repo,
    }


def test_benchmark_build_blocked_by_unreviewed_candidates(test_env):
    """Ticket C001, C002: Build must fail-fast with REVIEW_REQUIRED if candidates exist without decisions."""
    cand_dir = os.path.join("runs", "candidate_mining", test_env["task_id"])
    os.makedirs(cand_dir, exist_ok=True)
    cand_file = os.path.join(cand_dir, "candidates.json")
    
    cand = CandidateRecord(
        sample_id=test_env["sample1"].sample_id,
        rank=1,
        candidate_score=0.95,
        signals=CandidateSignals(
            normal_distance=0.8,
            density_outlier=0.7,
            domain_novelty=0.5,
            annotation_signal=0.0,
        ),
        data_origin="ORIGINAL",
        quality_status="UNCERTAIN",
        image_path=test_env["sample1"].image_path,
        relative_path=test_env["sample1"].relative_path,
    )
    with open(cand_file, "w", encoding="utf-8") as f:
        json.dump([cand.model_dump()], f)

    try:
        result = benchmark_build(task_id=test_env["task_id"], db_path=test_env["db_path"])
        assert result.status == ToolStatus.REVIEW_REQUIRED
        assert "require human review before benchmark construction" in result.summary
        assert result.metrics["pending_count"] > 0
    finally:
        if os.path.exists(cand_file):
            os.remove(cand_file)


def test_review_session_workflow(test_env):
    """Ticket C003: Review session strictly binds reviewer and manages decisions."""
    repo = test_env["review_repo"]

    # 1. Start session
    session_id = "revsess_test_001"
    sess = ReviewSession(
        session_id=session_id,
        reviewer="expert_alice",
        session_type="HARD_NORMAL_AUDIT",
        task_id=test_env["task_id"],
    )
    repo.save_session(sess)
    loaded_sess = repo.get_session(session_id)
    assert loaded_sess is not None
    assert loaded_sess.reviewer == "expert_alice"

    # 2. Submit decision bound to session
    dec = ReviewDecisionRecord(
        decision_id="dec_001",
        sample_id=test_env["sample1"].sample_id,
        decision="HARD_NORMAL",
        session_id=session_id,
        reviewer="expert_alice",
        reason_code="BENIGN_VARIATION",
        comment="Verified as benign noise",
    )
    repo.append_decision(dec)

    saved_dec = repo.get_decision(test_env["sample1"].sample_id)
    assert saved_dec is not None
    assert saved_dec.reviewer == "expert_alice"
    assert saved_dec.decision == "HARD_NORMAL"

    # 3. Finish session
    sess.submitted_at = "2026-10-20T08:00:00Z"
    sess.total_reviewed = 1
    repo.save_session(sess)
    updated_sess = repo.get_session(session_id)
    assert updated_sess.total_reviewed == 1


def test_safe_image_path_validation(test_env):
    """Ticket C004: Safe image path validation works correctly."""
    # 1. Valid sample resolves to verified path
    valid_path = validate_sample_image_path(test_env["sample1"], db_path=test_env["db_path"])
    assert os.path.exists(valid_path)

    # 2. Non-existent sample raises PathSafetyError with 404
    non_existent = Sample(
        sample_id="gate_task_01:non_existent",
        task_id="gate_task_01",
        dataset_id="ds1",
        image_path="/tmp/non_existent_img_12345.png",
        relative_path="non_existent.png",
        width=100,
        height=100,
        quality_status="PASS",
    )
    with pytest.raises(PathSafetyError) as exc_info:
        validate_sample_image_path(non_existent, db_path=test_env["db_path"])
    assert exc_info.value.status_code == 404
