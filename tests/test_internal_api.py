import os
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from iad_core.storage.database import Database
from iad_core.storage.models import InspectionTask, Sample, Annotation
from iad_core.storage.repositories import TaskRepository, SampleRepository, AnnotationRepository
from iad_core.advisory.schemas import AuditSuggestion, ConclusionStatus, RecommendedAction
from iad_core.advisory.repository import AuditSuggestionRepository
from iad_domain_server.api import app, DB_PATH


@pytest.fixture
def api_test_env(tmp_path, monkeypatch):
    test_db = str(tmp_path / "test_api_server.db")
    monkeypatch.setattr("iad_domain_server.api.DB_PATH", test_db)

    db = Database(test_db)
    task_repo = TaskRepository(db)
    sample_repo = SampleRepository(db)
    anno_repo = AnnotationRepository(db)
    sug_repo = AuditSuggestionRepository(db)

    task_repo.upsert(InspectionTask(task_id="t_internal", inspection_target="surface"))

    img_dir = tmp_path / "images"
    img_dir.mkdir()
    img_path = str(img_dir / "sample.png")
    Image.new("RGB", (100, 100), color="blue").save(img_path)

    sample_repo.upsert(
        Sample(
            sample_id="t_internal:s1",
            task_id="t_internal",
            dataset_id="ds1",
            image_path=img_path,
            relative_path="sample.png",
            width=100,
            height=100,
            quality_status="PASS",
        )
    )

    anno_repo.upsert(
        Annotation(
            annotation_id="ann_int",
            sample_id="t_internal:s1",
            annotation_type="bbox",
            raw_label="scratch",
            bbox=[10, 10, 40, 40],
            source_width=100,
            source_height=100,
        )
    )

    sug_repo.save(
        AuditSuggestion(
            suggestion_id="sug_int1",
            task_id="t_internal",
            sample_id="t_internal:s1",
            conclusion_status=ConclusionStatus.EVIDENCE_SUPPORTED,
            recommended_action=RecommendedAction.REVIEW,
        )
    )

    return test_db


def test_internal_tool_gateway(api_test_env):
    client = TestClient(app)

    # 1. Allowed tool call
    resp = client.post("/internal/tool/task_inspect", json={"task_id": "t_internal"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "OK"
    assert data["metrics"]["total_samples"] == 1

    # 2. Rejection of unpermitted / non-existent tool
    bad_resp = client.post("/internal/tool/non_existent_tool", json={})
    assert bad_resp.status_code == 404

    # 3. Rejection of review write via internal tool
    review_resp = client.post("/internal/tool/review_write", json={})
    assert review_resp.status_code == 404


def test_internal_sample_images(api_test_env):
    client = TestClient(app)

    # 1. Raw image
    resp_raw = client.get("/internal/sample/t_internal:s1/image?view=raw")
    assert resp_raw.status_code == 200
    assert resp_raw.headers["content-type"] in ("image/png", "application/octet-stream")

    # 2. Annotation overlay
    resp_overlay = client.get("/internal/sample/t_internal:s1/image?view=annotation_overlay")
    assert resp_overlay.status_code == 200

    # 3. Crop region
    resp_crop = client.get("/internal/sample/t_internal:s1/image?bbox=10,10,40,40&padding=0.1")
    assert resp_crop.status_code == 200


def test_suggestions_and_overview(api_test_env):
    client = TestClient(app)

    resp_sug = client.get("/api/suggestions/t_internal")
    assert resp_sug.status_code == 200
    data = resp_sug.json()
    assert len(data["suggestions"]) == 1
    assert data["suggestions"][0]["suggestion_id"] == "sug_int1"

    resp_overview = client.get("/api/task/t_internal/overview")
    assert resp_overview.status_code == 200
    overview = resp_overview.json()
    assert overview["total_suggestions"] == 1
    assert overview["total_samples"] == 1
