import json
from uuid import UUID

import pytest

from iad_core.advisory.repository import AuditSuggestionRepository
from iad_core.advisory.schemas import AuditSuggestion, HypothesisItem
from iad_core.entry import dispatch_request, extract_suggestion_meta
from iad_core.storage.database import Database
from iad_core.storage.models import InspectionTask, Sample
from iad_core.storage.repositories import SampleRepository, TaskRepository


@pytest.fixture
def workbench(tmp_path, monkeypatch):
    db = Database(str(tmp_path / "workbench.db"))
    TaskRepository(db).upsert(InspectionTask(task_id="task", inspection_target="surface"))
    TaskRepository(db).upsert(InspectionTask(task_id="other", inspection_target="surface"))
    SampleRepository(db).upsert(Sample(
        sample_id="dataset:image.png", task_id="task", dataset_id="dataset",
        image_path=str(tmp_path / "image.png"), relative_path="image.png",
        quality_status="UNCERTAIN", width=100, height=100,
    ))
    emitted = []
    monkeypatch.setattr("iad_core.entry.emit", emitted.append)

    def request(operation, **arguments):
        emitted.clear()
        dispatch_request({"operation": operation, "arguments": arguments, "db_path": db.db_path})
        return emitted[-1]

    return db, request


@pytest.mark.parametrize("confidence", [0.0, 0.61, 1.0, None])
def test_confidence_round_trip(workbench, confidence):
    db, _ = workbench
    repo = AuditSuggestionRepository(db)
    repo.save(AuditSuggestion(
        suggestion_id="suggestion", task_id="task", sample_id="dataset:image.png",
        hypotheses=[HypothesisItem(label="FAIL")], confidence=confidence,
    ))
    assert extract_suggestion_meta(repo.get("suggestion"))["confidence"] == confidence


def test_review_session_submission_preserves_raw_quality(workbench):
    db, request = workbench
    session = request("review_start_session", task_id="task", reviewer="alice")["data"]
    result = request("review_submit_decision", session_id=session["session_id"],
                     sample_id="dataset:image.png", decision="HARD_NORMAL", comment="verified")
    assert result["event"] == "result"
    assert SampleRepository(db).get("dataset:image.png").quality_status == "UNCERTAIN"
    with db.connection() as conn:
        row = conn.execute("SELECT reviewer,comment FROM review_decisions").fetchone()
        assert tuple(row) == ("alice", "verified")


@pytest.mark.parametrize("decision", ["INVALID", "", "pass"])
def test_review_rejects_invalid_decision(workbench, decision):
    db, request = workbench
    session = request("review_start_session", task_id="task", reviewer="alice")["data"]
    result = request("review_submit_decision", session_id=session["session_id"],
                     sample_id="dataset:image.png", decision=decision)
    assert result["event"] == "error"
    with db.connection() as conn:
        assert conn.execute("SELECT count(*) FROM review_decisions").fetchone()[0] == 0


def test_review_rejects_cross_task_sample(workbench):
    _, request = workbench
    session = request("review_start_session", task_id="other", reviewer="alice")["data"]
    result = request("review_submit_decision", session_id=session["session_id"],
                     sample_id="dataset:image.png", decision="PASS")
    assert result["event"] == "error"


def test_report_counts_latest_suggestion_per_sample(workbench):
    db, request = workbench
    repo = AuditSuggestionRepository(db)
    for number in range(2):
        repo.save(AuditSuggestion(suggestion_id=str(number), task_id="task",
                                  sample_id="dataset:image.png"))
    result = request("report_get", task_id="task")["data"]
    assert result["vlm_audited_count"] == 1
    assert result["vlm_coverage_pct"] == 100
    assert result["quality"]["model"]["unstructured_samples"] == 1
    assert result["quality"]["knowledge_versions"] == []


def test_detail_and_grid_use_the_same_score(workbench):
    db, request = workbench
    AuditSuggestionRepository(db).save(AuditSuggestion(
        suggestion_id="half", task_id="task", sample_id="dataset:image.png",
        hypotheses=[HypothesisItem(label="FAIL")], confidence=0.605,
    ))
    grid = request("sample_list", task_id="task")["data"]["items"][0]
    detail = request("sample_get", sample_id="dataset:image.png")["data"]
    assert detail["visual_suspicion_score"] == grid["visual_suspicion_score"]
    assert detail["technical_quality_score"] == grid["technical_quality_score"]


def test_sample_uuid_is_stable_across_detail_and_grid(workbench):
    _, request = workbench
    grid = request("sample_list", task_id="task")["data"]["items"][0]
    detail = request("sample_get", sample_id="dataset:image.png")["data"]["sample"]
    assert str(UUID(detail["sample_uuid"])) == grid["sample_uuid"]
    assert request("sample_get", sample_id="dataset:image.png")["data"]["sample"]["sample_uuid"] == detail["sample_uuid"]
