import os
import sys
import tempfile
import pytest

from iad_core.storage.database import Database
from iad_core.storage.models import Sample, InspectionTask
from iad_core.storage.repositories import SampleRepository, TaskRepository
from iad_core.dataset.path_safety import validate_sample_image_path, PathSafetyError
from iad_core.entry import op_sample_image_path


def test_image_path_safety_validation(tmp_path, monkeypatch):
    """NXM-17 / F08 / DS-S15: Image paths outside authorized roots are rejected with 403."""
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
    with pytest.raises(PathSafetyError) as exc_info:
        validate_sample_image_path(s_outside, db_path=db_file)
    assert exc_info.value.status_code == 404

    # Now create file in /opt or /tmp if possible, or test outside containment
    fake_outside = os.path.join(tmp_path, "outside", "leak.png")
    os.makedirs(os.path.dirname(fake_outside), exist_ok=True)
    with open(fake_outside, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")

    s_outside.image_path = fake_outside
    # When allowed_roots does not contain outside path (simulating production without pytest tempdir)
    monkeypatch.setattr("iad_core.dataset.path_safety.get_authorized_dataset_roots", lambda db_path=None: [data_dir])
    with pytest.raises(PathSafetyError) as exc_403:
        validate_sample_image_path(s_outside, db_path=db_file)
    assert exc_403.value.status_code == 403

    # Clean up valid test image
    if os.path.exists(valid_img):
        os.remove(valid_img)
