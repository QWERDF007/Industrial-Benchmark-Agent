import sqlite3
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

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


def test_a_cold_query_process_opens_initialized_database_without_a_write_lock(tmp_path):
    path = str(tmp_path / 'cold-query.db')
    database = Database(path)
    with database.connection() as writer:
        writer.execute('BEGIN IMMEDIATE')
        query = subprocess.run([sys.executable, '-c',
            'from iad_core.storage.database import Database;'
            'from iad_core.storage.repositories import TaskRepository;'
            'import sys;print(TaskRepository(Database(sys.argv[1])).get("not-created"))', path],
            capture_output=True, text=True, timeout=3, check=True)
        assert query.stdout.strip() == 'None'


def test_short_connections_retain_wal_and_committed_rows_between_operations(tmp_path):
    path = tmp_path / 'journal.db'
    database = Database(str(path))
    with database.connection() as connection:
        connection.execute('CREATE TABLE connection_values(value INTEGER)')
        connection.execute('INSERT INTO connection_values VALUES(7)')
    journal = Path(str(path) + '-wal')
    assert journal.exists(), 'Closing a short operation must not repeatedly checkpoint and remove WAL'
    identity = journal.stat().st_ino
    for _ in range(10):
        with database.connection() as connection:
            assert connection.execute('SELECT value FROM connection_values').fetchone()[0] == 7
        assert journal.stat().st_ino == identity
    database.close()
    assert not journal.exists(), 'Releasing the database must finish the journal lifecycle'
    with sqlite3.connect(path) as connection:
        assert connection.execute('SELECT value FROM connection_values').fetchone()[0] == 7


def test_short_read_and_write_connections_share_the_same_wal_without_cleanup_races(tmp_path):
    database = Database(str(tmp_path / 'connection-churn.db'))
    with database.connection() as connection:
        connection.execute('CREATE TABLE connection_values(id INTEGER PRIMARY KEY,value BLOB NOT NULL)')

    def access(worker):
        for index in range(150):
            with database.connection() as connection:
                if worker == 0:
                    connection.execute('INSERT INTO connection_values VALUES(?,?)', (index, b'x' * 32768))
                else:
                    connection.execute('SELECT COUNT(*) FROM connection_values').fetchone()

    with ThreadPoolExecutor(max_workers=4) as executor:
        list(executor.map(access, range(4)))
    with database.connection() as connection:
        assert connection.execute('SELECT COUNT(*) FROM connection_values').fetchone()[0] == 150


def test_temporary_connection_state_does_not_shadow_the_next_operation(tmp_path):
    database = Database(str(tmp_path / 'temporary-state.db'))
    with database.connection(temporary=True) as connection:
        connection.execute('CREATE TEMP TABLE samples(sample_id TEXT)')
        connection.execute("INSERT INTO samples VALUES('temporary-only')")
        assert connection.execute('SELECT sample_id FROM samples').fetchone()[0] == 'temporary-only'
    with database.connection() as connection:
        assert connection.execute('SELECT COUNT(*) FROM samples').fetchone()[0] == 0
        assert connection.execute("SELECT COUNT(*) FROM sqlite_temp_master WHERE name='samples'").fetchone()[0] == 0


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
