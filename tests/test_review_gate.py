import os
import json
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from iad_core.storage.database import Database
from iad_core.storage.models import (
    InspectionTask,
    Sample,
    QualityStatus,
    ReviewDecisionRecord,
    ReviewSession,
)
from iad_core.storage.repositories import (
    TaskRepository,
    SampleRepository,
    ReviewRepository,
)
from iad_core.candidate.schemas import CandidateRecord, CandidateSignals
from iad_domain_server.api import app, DB_PATH
from iad_domain_server.contracts import ToolStatus
from iad_domain_server.tools.benchmark_tools import benchmark_build


@pytest.fixture
def test_env(tmp_path, monkeypatch):
    test_db = str(tmp_path / "test_benchmark.db")
    monkeypatch.setattr("iad_domain_server.api.DB_PATH", test_db)
    
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


def test_benchmark_build_halts_when_candidates_unreviewed(test_env, monkeypatch):
    """Ticket C001, K004: benchmark_build MUST halt with REVIEW_REQUIRED if unreviewed candidates exist."""
    # Write a candidate to runs/candidate_mining/gate_task_01/candidates.json
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


def test_review_session_api_workflow(test_env):
    """Ticket C003: Review session strictly binds reviewer and manages decisions."""
    client = TestClient(app)

    # 1. Start session
    resp = client.post("/api/review/session/start", json={
        "reviewer": "expert_alice",
        "session_type": "HARD_NORMAL_AUDIT",
        "task_id": test_env["task_id"],
    })
    assert resp.status_code == 200
    sess_data = resp.json()
    session_id = sess_data["session_id"]
    assert sess_data["reviewer"] == "expert_alice"

    # 2. Submit decision bound to session
    dec_resp = client.post(f"/api/review/{session_id}/decision", json={
        "sample_id": test_env["sample1"].sample_id,
        "decision": "HARD_NORMAL",
        "session_id": session_id,
        "reason_code": "BENIGN_VARIATION",
        "comment": "Verified as benign noise",
    })
    assert dec_resp.status_code == 200
    dec_data = dec_resp.json()
    assert dec_data["reviewer"] == "expert_alice"
    assert dec_data["decision"] == "HARD_NORMAL"

    # 3. Submitting decision with invalid session returns 404
    bad_resp = client.post("/api/review/revsess_nonexistent/decision", json={
        "sample_id": test_env["sample1"].sample_id,
        "decision": "PASS",
        "session_id": "revsess_nonexistent",
    })
    assert bad_resp.status_code == 404

    # 4. Finish session
    finish_resp = client.post(f"/api/review/{session_id}/finish")
    assert finish_resp.status_code == 200
    finish_data = finish_resp.json()
    assert finish_data["status"] == "finished"
    assert finish_data["reviewed_count"] == 1


def test_safe_image_endpoint_and_file_removal(test_env):
    """Ticket C004: Safe image endpoint works; insecure /api/file is deleted."""
    client = TestClient(app)

    # 1. Valid sample returns image
    resp = client.get(f"/api/sample/{test_env['sample1'].sample_id}/image")
    assert resp.status_code == 200
    assert resp.headers["content-type"] in ("image/png", "application/octet-stream")

    # 2. Invalid sample returns 404
    bad_resp = client.get("/api/sample/non_existent_sample/image")
    assert bad_resp.status_code == 404

    # 3. Insecure /api/file endpoint must return 404 (route does not exist)
    file_resp = client.get(f"/api/file?path={test_env['sample1'].image_path}")
    assert file_resp.status_code == 404
