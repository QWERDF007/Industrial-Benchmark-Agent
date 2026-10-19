import os
import sys
import tempfile
import pytest
from fastapi.testclient import TestClient

from iad_core.storage.database import Database
from iad_core.storage.models import Sample, InspectionTask
from iad_core.storage.repositories import SampleRepository, TaskRepository
from iad_domain_server.api import app, validate_sample_image_path, DB_PATH
import iad_domain_server.api as api_mod


def test_image_path_safety_validation(tmp_path, monkeypatch):
    """NXM-17 / F08: Image paths outside authorized roots are rejected with 403."""
    db_file = str(tmp_path / "test_safety.db")
    db = Database(db_file)
    sample_repo = SampleRepository(db)
    task_repo = TaskRepository(db)

    task_id = "t_safety"
    task_repo.upsert(InspectionTask(task_id=task_id, product="bracket", inspection_target="scratch"))

    # 1. Legitimate image in data/ directory
    data_dir = os.path.realpath("data")
    os.makedirs(data_dir, exist_ok=True)
    valid_img = os.path.join(data_dir, "test_safe_sample.png")
    with open(valid_img, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")

    s_valid = Sample(
        sample_id=f"{task_id}:valid",
        task_id=task_id,
        dataset_id="ds",
        image_path=valid_img,
        relative_path="test_safe_sample.png",
        width=100,
        height=100,
        quality_status="PASS",
    )
    sample_repo.upsert(s_valid)

    # 2. Outside path test
    from fastapi import HTTPException
    s_outside = Sample(
        sample_id=f"{task_id}:outside",
        task_id=task_id,
        dataset_id="ds",
        image_path="/opt/unauthorized_external_dir/leak.png",
        relative_path="leak.png",
        width=100,
        height=100,
        quality_status="PASS",
    )
    # File doesn't exist -> 404
    with pytest.raises(HTTPException) as exc_info:
        validate_sample_image_path(s_outside)
    assert exc_info.value.status_code == 404

    # Now create file in /opt or /tmp if possible, or test outside containment
    fake_outside = os.path.join(tmp_path, "outside", "leak.png")
    os.makedirs(os.path.dirname(fake_outside), exist_ok=True)
    with open(fake_outside, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")

    s_outside.image_path = fake_outside
    # When allowed_roots does not contain tmp_path (simulating production without pytest tempdir)
    monkeypatch.delitem(sys.modules, "pytest", raising=False)
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)
    with pytest.raises(HTTPException) as exc_403:
        validate_sample_image_path(s_outside)
    assert exc_403.value.status_code == 403


    monkeypatch.setattr(api_mod, "DB_PATH", db_file)
    client = TestClient(app)

    # Valid image access succeeds
    resp_valid = client.get(f"/api/sample/{task_id}:valid/image")
    assert resp_valid.status_code == 200

    # Non-existent sample returns 404
    resp_404 = client.get("/api/sample/non_existent:fake/image")
    assert resp_404.status_code == 404

    # Clean up valid test image
    if os.path.exists(valid_img):
        os.remove(valid_img)
