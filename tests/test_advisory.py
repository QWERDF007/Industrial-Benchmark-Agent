import pytest
from iad_core.storage.database import Database
from iad_core.storage.models import InspectionTask, Sample, QualityStatus
from iad_core.storage.repositories import TaskRepository, SampleRepository
from iad_core.advisory.schemas import (
    AuditSuggestion,
    ConclusionStatus,
    RecommendedAction,
    ObservationItem,
    HypothesisItem,
    EvidenceRefItem,
)
from iad_core.advisory.repository import AuditSuggestionRepository


@pytest.fixture
def advisory_db(tmp_path):
    db_file = str(tmp_path / "test_advisory.db")
    db = Database(db_file)
    task_repo = TaskRepository(db)
    sample_repo = SampleRepository(db)

    task_repo.upsert(InspectionTask(task_id="adv_task", inspection_target="surface"))
    sample_repo.upsert(
        Sample(
            sample_id="adv_task:s1",
            task_id="adv_task",
            dataset_id="ds1",
            image_path="/tmp/fake1.png",
            relative_path="s1.png",
            width=100,
            height=100,
            quality_status="PASS",
        )
    )
    return db


def test_audit_suggestion_crud_and_isolation(advisory_db):
    repo = AuditSuggestionRepository(advisory_db)
    sample_repo = SampleRepository(advisory_db)

    sug = AuditSuggestion(
        suggestion_id="sug_001",
        task_id="adv_task",
        sample_id="adv_task:s1",
        session_id="sess_123",
        model_route="dsh-vision-expert",
        observations=[
            ObservationItem(
                phenomenon="scratched line",
                region_xyxy=[10, 20, 50, 60],
                description="Potential micro scratch visible in center ROI",
            )
        ],
        hypotheses=[
            HypothesisItem(
                label="scratch",
                supporting_refs=["dino_dist=0.88"],
                contradicting_refs=["lighting_glare_possible"],
            )
        ],
        conclusion_status=ConclusionStatus.EVIDENCE_SUPPORTED,
        recommended_action=RecommendedAction.REVIEW,
        evidence_refs=[
            EvidenceRefItem(kind="image_view", sample_id="adv_task:s1", tool_name="sample_view")
        ],
        input_modalities_used=["image", "text"],
    )

    saved = repo.save(sug)
    assert saved.suggestion_id == "sug_001"

    # Query back
    fetched = repo.get("sug_001")
    assert fetched is not None
    assert fetched.sample_id == "adv_task:s1"
    assert len(fetched.observations) == 1
    assert fetched.observations[0].phenomenon == "scratched line"
    assert fetched.conclusion_status == ConclusionStatus.EVIDENCE_SUPPORTED
    assert fetched.recommended_action == RecommendedAction.REVIEW

    # Invariance check: original Sample.quality_status remains untouched (PASS)
    sample = sample_repo.get("adv_task:s1")
    assert sample.quality_status == QualityStatus.PASS.value
