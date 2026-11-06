import sqlite3

import pytest
from iad_core.storage.database import Database
from iad_core.storage.repositories import (
    TaskRepository,
    SampleRepository,
    AnnotationRepository,
    IssueRepository,
)
from iad_core.storage.models import (
    InspectionTask,
    Sample,
    QualityStatus,
    Annotation,
    AnnotationType,
    AnnotationSource,
    ImportIssue,
    IssueType,
    Severity,
)



@pytest.fixture
def temp_db(tmp_path):
    db_file = tmp_path / "test.db"
    return Database(str(db_file))


def test_opening_initialized_database_does_not_compete_with_an_active_writer(tmp_path):
    path = str(tmp_path / 'concurrent.db')
    database = Database(path)
    with database.connection() as writer:
        writer.execute('BEGIN IMMEDIATE')
        reader = Database(path)
        assert TaskRepository(reader).get('not-created') is None


def test_schema_changes_are_reconciled_when_reopening_database(tmp_path):
    path = str(tmp_path / 'changed.db')
    database = Database(path)
    with database.connection() as connection:
        connection.execute('DROP TABLE knowledge_check_reviews')
    reopened = Database(path)
    with reopened.connection() as connection:
        assert connection.execute('SELECT COUNT(*) FROM knowledge_check_reviews').fetchone()[0] == 0


def test_replaced_database_is_initialized_without_reusing_previous_file_state(tmp_path):
    path, replacement = tmp_path / 'current.db', tmp_path / 'replacement.db'
    Database(str(path))
    with sqlite3.connect(replacement) as connection:
        connection.execute('CREATE TABLE replacement_marker (value TEXT)')
        connection.execute("INSERT INTO replacement_marker VALUES ('restored')")
    replacement.replace(path)
    reopened = Database(str(path))
    assert TaskRepository(reopened).get('not-created') is None
    with reopened.connection() as connection:
        assert connection.execute('SELECT value FROM replacement_marker').fetchone()[0] == 'restored'


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
def test_existing_database_refreshes_a_changed_scope_projection_before_deletion(dataset):
    import json
    import pytest
    from iad_core.storage.database import Database
    from iad_core.dataset.registry import DatasetRegistry
    db, _, config = dataset
    with db.connection() as conn:
        definition = conn.execute("SELECT sql FROM sqlite_master WHERE name='job_dataset_scopes_source'").fetchone()[0]
        previous = definition.replace("job_type IN ('ANALYSIS_WORKFLOW','MODEL_AUDIT')", "job_type='ANALYSIS_WORKFLOW'")
        assert previous != definition
        conn.execute('DROP VIEW job_dataset_scopes_source')
        conn.execute(previous)
        conn.execute("INSERT INTO job_runs(job_id,task_id,job_type,status,payload_json) VALUES('scope-upgrade',?,'MODEL_AUDIT','PENDING',?)",
            (config.task.task_id,json.dumps({'request':{'dataset_id':'other-owner','dataset_ids':[config.dataset.id]}})))
    reopened = Database(db.db_path)
    with pytest.raises(ValueError,match='作业'):
        DatasetRegistry(reopened).delete(config.dataset.id)
