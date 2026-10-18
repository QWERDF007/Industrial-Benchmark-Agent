import os
import json
import pytest

from iad_core.storage.database import Database
from iad_core.storage.models import InspectionTask, Sample
from iad_core.storage.repositories import TaskRepository, SampleRepository
from iad_core.advisory.schemas import AuditSuggestion, ConclusionStatus, RecommendedAction
from iad_core.advisory.repository import AuditSuggestionRepository
from iad_domain_server.tools.candidate_tools import candidate_merge
from iad_domain_server.contracts import ToolStatus


@pytest.fixture
def candidate_merge_db(tmp_path):
    db_file = str(tmp_path / "test_merge.db")
    db = Database(db_file)
    task_repo = TaskRepository(db)
    sample_repo = SampleRepository(db)
    sug_repo = AuditSuggestionRepository(db)

    task_repo.upsert(InspectionTask(task_id="t_merge", inspection_target="surface"))

    # Seed 4 samples
    for i in range(1, 5):
        sample_repo.upsert(
            Sample(
                sample_id=f"t_merge:s{i}",
                task_id="t_merge",
                dataset_id="ds1",
                image_path=f"/tmp/s{i}.png",
                relative_path=f"s{i}.png",
                width=100,
                height=100,
                quality_status="UNCERTAIN",
            )
        )

    # 1. DINO mined candidates (s1 and s2)
    cand_dir = tmp_path / "runs" / "candidates" / "t_merge"
    cand_dir.mkdir(parents=True)
    with open(cand_dir / "candidates.json", "w") as f:
        json.dump(
            {
                "task_id": "t_merge",
                "candidates": [
                    {"sample_id": "t_merge:s1", "final_score": 0.85},
                    {"sample_id": "t_merge:s2", "final_score": 0.60},
                ],
            },
            f,
        )

    # 2. LLM suggestions (s2 and s3)
    sug_repo.save(
        AuditSuggestion(
            suggestion_id="sug_m2",
            task_id="t_merge",
            sample_id="t_merge:s2",
            conclusion_status=ConclusionStatus.EVIDENCE_SUPPORTED,
            recommended_action=RecommendedAction.REVIEW,
        )
    )
    sug_repo.save(
        AuditSuggestion(
            suggestion_id="sug_m3",
            task_id="t_merge",
            sample_id="t_merge:s3",
            conclusion_status=ConclusionStatus.EVIDENCE_SUPPORTED,
            recommended_action=RecommendedAction.REVIEW,
        )
    )

    # 3. Audit issues (s4)
    with db.connection() as conn:
        c = conn.cursor()
        c.execute(
            """
            INSERT INTO import_issues (task_id, dataset_id, sample_id, issue_type, severity, message)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            ("t_merge", "ds1", "t_merge:s4", "geometry_clipped", "WARNING", "BBox was clipped"),
        )

    return db_file, str(cand_dir)


def test_candidate_merge_provenance_and_breakdown(candidate_merge_db):
    db_file, out_dir = candidate_merge_db

    res = candidate_merge(
        task_id="t_merge",
        output_dir=out_dir,
        include_dino=True,
        include_llm=True,
        include_audit=True,
        db_path=db_file,
    )

    assert res.status == ToolStatus.REVIEW_REQUIRED
    metrics = res.metrics
    assert metrics["total_unique_candidates"] == 4
    breakdown = metrics["breakdown"]
    assert breakdown["dino_only"] == 1  # s1
    assert breakdown["both_dino_llm"] == 1  # s2
    assert breakdown["llm_only"] == 1  # s3
    assert breakdown["audit_only"] == 1  # s4

    # Top candidate should be s2 (consensus of DINO + LLM)
    top_candidates = metrics["top_candidates"]
    assert top_candidates[0]["sample_id"] == "t_merge:s2"
    assert "DINO" in top_candidates[0]["sources"]
    assert "LLM" in top_candidates[0]["sources"]

    # Verify generated report artifacts
    assert os.path.exists(os.path.join(out_dir, "merged_candidates.json"))
    assert os.path.exists(os.path.join(out_dir, "merged_candidates.md"))
