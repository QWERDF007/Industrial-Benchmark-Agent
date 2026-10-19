import os
import json
import pytest
from fastapi.testclient import TestClient

from iad_core.storage.database import Database
from iad_core.storage.models import InspectionTask, Sample, QualityStatus, DataOrigin
from iad_core.storage.repositories import TaskRepository, SampleRepository, ReviewDecisionRepository
from iad_core.advisory.schemas import AuditSuggestion, ConclusionStatus, RecommendedAction
from iad_core.advisory.repository import AuditSuggestionRepository
from iad_core.candidate.merger import merge_candidates
from iad_core.review.service import ReviewQueueService
from iad_domain_server.api import app, DB_PATH
import iad_domain_server.api as api_mod


@pytest.fixture
def merge_queue_env(tmp_path, monkeypatch):
    db_file = str(tmp_path / "test_merge_queue.db")
    db = Database(db_file)
    task_repo = TaskRepository(db)
    sample_repo = SampleRepository(db)
    sug_repo = AuditSuggestionRepository(db)

    task_id = "task_mq_01"
    task_repo.upsert(InspectionTask(task_id=task_id, product="lens", inspection_target="crack"))

    # Create 5 samples:
    # s1: DINO only
    # s2: DINO + LLM
    # s3: LLM only
    # s4: AUDIT only
    # s5: Normal uncertain, not in candidates
    for i in range(1, 6):
        sample_repo.upsert(
            Sample(
                sample_id=f"{task_id}:s{i}",
                task_id=task_id,
                dataset_id="ds_mq",
                image_path=f"/tmp/{task_id}_s{i}.png",
                relative_path=f"s{i}.png",
                width=100,
                height=100,
                quality_status=QualityStatus.UNCERTAIN,
                data_origin=DataOrigin.LEGACY_TRAIN,
            )
        )

    # 1. DINO candidate mining in default runs/candidates/<task_id>
    cand_dir = os.path.join("runs", "candidates", task_id)
    os.makedirs(cand_dir, exist_ok=True)
    with open(os.path.join(cand_dir, "candidates.json"), "w") as f:
        json.dump(
            {
                "task_id": task_id,
                "candidates": [
                    {"sample_id": f"{task_id}:s1", "final_score": 0.88},
                    {"sample_id": f"{task_id}:s2", "final_score": 0.72},
                ],
            },
            f,
        )

    # 2. LLM suggestions
    sug_repo.save(
        AuditSuggestion(
            suggestion_id="sug_mq_02",
            task_id=task_id,
            sample_id=f"{task_id}:s2",
            conclusion_status=ConclusionStatus.EVIDENCE_SUPPORTED,
            recommended_action=RecommendedAction.REVIEW,
        )
    )
    sug_repo.save(
        AuditSuggestion(
            suggestion_id="sug_mq_03",
            task_id=task_id,
            sample_id=f"{task_id}:s3",
            conclusion_status=ConclusionStatus.EVIDENCE_SUPPORTED,
            recommended_action=RecommendedAction.REVIEW,
        )
    )

    # 3. Audit issue
    with db.connection() as conn:
        c = conn.cursor()
        c.execute(
            """
            INSERT INTO import_issues (task_id, dataset_id, sample_id, issue_type, severity, message)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (task_id, "ds_mq", f"{task_id}:s4", "missing_annotation", "WARNING", "Missing annotation on anomaly"),
        )

    monkeypatch.setattr(api_mod, "DB_PATH", db_file)

    yield db_file, task_id, str(cand_dir)

    import shutil
    if os.path.exists(cand_dir):
        shutil.rmtree(cand_dir, ignore_errors=True)


def test_merge_queue_e2e_contract_and_web_api(merge_queue_env):
    """
    NXM-01, NXM-02, NXM-03:
    1. Merge candidates creates unique 'candidates' SSOT file
    2. ReviewQueueService strictly parses it with correct sources, scores, and required flags
    3. Web API /api/review/{task_id}/queue serves all candidates without fallback
    4. Does NOT mutate Sample.quality_status or ReviewDecisionRecord
    """
    db_file, task_id, out_dir = merge_queue_env
    db = Database(db_file)
    sample_repo = SampleRepository(db)

    # Record initial states
    s1_before = sample_repo.get(f"{task_id}:s1")
    assert s1_before.quality_status == QualityStatus.UNCERTAIN

    # Step 1: Merge candidates
    res = merge_candidates(
        task_id=task_id,
        db_path=db_file,
        output_dir=out_dir,
        include_dino=True,
        include_llm=True,
        include_audit=True,
    )
    assert res["total_unique_candidates"] == 4
    merged_file = os.path.join(out_dir, "merged_candidates.json")
    assert os.path.exists(merged_file)

    with open(merged_file, "r") as f:
        content = json.load(f)
    assert "candidates" in content
    assert len(content["candidates"]) == 4

    # Quality status was not mutated
    s1_after = sample_repo.get(f"{task_id}:s1")
    assert s1_after.quality_status == QualityStatus.UNCERTAIN

    # Step 2: ReviewQueueService consumption
    service = ReviewQueueService(task_id=task_id, db=db, candidates_json_path=merged_file)
    cands = service.candidates
    assert len(cands) == 4

    by_id = {c.sample_id: c for c in cands}
    assert set(by_id[f"{task_id}:s1"].sources) == {"DINO"}
    assert set(by_id[f"{task_id}:s2"].sources) == {"DINO", "LLM"}
    assert set(by_id[f"{task_id}:s3"].sources) == {"LLM"}
    assert set(by_id[f"{task_id}:s4"].sources) == {"AUDIT"}

    # Check is_required
    assert by_id[f"{task_id}:s1"].is_required is True
    assert by_id[f"{task_id}:s2"].is_required is True
    assert by_id[f"{task_id}:s3"].is_required is True  # LLM REVIEW action

    # Step 3: Web API consumption via TestClient
    client = TestClient(app)
    resp = client.get(f"/api/review/{task_id}/queue")
    assert resp.status_code == 200
    queue_data = resp.json()

    assert queue_data["total_candidates"] == 4
    items = queue_data["items"]
    assert len(items) == 4

    item_by_id = {it["sample_id"]: it for it in items}
    assert item_by_id[f"{task_id}:s2"]["sources"] == ["DINO", "LLM"] or set(item_by_id[f"{task_id}:s2"]["sources"]) == {"DINO", "LLM"}
    assert item_by_id[f"{task_id}:s3"]["sources"] == ["LLM"]
    assert item_by_id[f"{task_id}:s4"]["sources"] == ["AUDIT"]

    # Step 4: Make review decision and verify status update
    sess_resp = client.post(f"/api/review/{task_id}/session/start", json={"reviewer": "human_reviewer"})
    assert sess_resp.status_code == 200
    sess_id = sess_resp.json()["session_id"]

    dec_resp = client.post(
        f"/api/review/{sess_id}/decision",
        json={
            "sample_id": f"{task_id}:s2",
            "decision": "HARD_NORMAL",
            "reason_code": "NORMAL_NOMINAL",
            "comment": "Verified hard normal by operator",
        },
    )
    assert dec_resp.status_code == 200

    # Review decision recorded in DB
    dec_repo = ReviewDecisionRepository(db)
    saved_dec = dec_repo.get(f"{task_id}:s2", reviewer="human_reviewer")
    assert saved_dec is not None
    assert saved_dec.decision == "HARD_NORMAL"

    # Queue reflects reviewed state
    queue_resp2 = client.get(f"/api/review/{task_id}/queue")
    item2 = next(it for it in queue_resp2.json()["items"] if it["sample_id"] == f"{task_id}:s2")
    assert item2["reviewed"] is True
    assert item2["current_decision"] == "HARD_NORMAL"
