import pytest
from app.storage.database import Database
from app.storage.repositories import (
    TaskRepository,
    SampleRepository,
    AnnotationRepository,
    IssueRepository,
)
from app.schemas.task import InspectionTask
from app.schemas.sample import Sample, QualityStatus
from app.schemas.annotation import Annotation, AnnotationType, AnnotationSource
from app.schemas.issue import ImportIssue, IssueType, Severity


@pytest.fixture
def temp_db(tmp_path):
    db_file = tmp_path / "test.db"
    return Database(str(db_file))


def test_task_repository(temp_db):
    repo = TaskRepository(temp_db)
    task = InspectionTask(
        task_id="task_01",
        product="graphite",
        inspection_target="surface",
    )
    repo.upsert(task)
    retrieved = repo.get("task_01")
    assert retrieved is not None
    assert retrieved.product == "graphite"

    # Test update
    task.description = "Updated description"
    repo.upsert(task)
    retrieved2 = repo.get("task_01")
    assert retrieved2.description == "Updated description"


def test_sample_idempotency(temp_db):
    sample_repo = SampleRepository(temp_db)
    s1 = Sample(
        sample_id="img_01",
        task_id="task_01",
        dataset_id="ds_01",
        image_path="/data/img1.png",
        relative_path="good/img1.png",
        width=100,
        height=100,
        quality_status=QualityStatus.PASS,
    )
    sample_repo.upsert(s1)
    assert sample_repo.count_by_task("task_01") == 1

    # Insert same sample again (with updated quality_status)
    s1_updated = Sample(
        sample_id="img_01",
        task_id="task_01",
        dataset_id="ds_01",
        image_path="/data/img1.png",
        relative_path="good/img1.png",
        width=100,
        height=100,
        quality_status=QualityStatus.FAIL,
    )
    sample_repo.upsert(s1_updated)
    # Count must NOT increase!
    assert sample_repo.count_by_task("task_01") == 1
    # Status should be updated
    retrieved = sample_repo.get("img_01")
    assert retrieved.quality_status == QualityStatus.FAIL


def test_annotation_repository(temp_db):
    ann_repo = AnnotationRepository(temp_db)
    ann = Annotation(
        annotation_id="ann_01",
        sample_id="img_01",
        annotation_type=AnnotationType.BBOX,
        raw_label="18",
        phenomenon="glue_overflow",
        bbox=[10, 20, 30, 40],
    )
    ann_repo.upsert(ann)
    anns = ann_repo.list_by_sample("img_01")
    assert len(anns) == 1
    assert anns[0].raw_label == "18"
    assert anns[0].bbox == [10.0, 20.0, 30.0, 40.0]


def test_issue_repository(temp_db):
    issue_repo = IssueRepository(temp_db)
    issue = ImportIssue(
        task_id="task_01",
        sample_id="img_01",
        issue_type=IssueType.UNKNOWN_LABEL,
        severity=Severity.WARNING,
        message="Unknown label 99",
    )
    issue_repo.add(issue)
    assert issue_repo.count_by_task("task_01") == 1
    issues = issue_repo.list_by_task("task_01")
    assert len(issues) == 1
    assert issues[0].issue_type == IssueType.UNKNOWN_LABEL
