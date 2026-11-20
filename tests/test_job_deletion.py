import json

import pytest

from iad_core.workbench.jobs import JobRunner
from iad_core.workbench.calls import ModelCallSummary


def test_frozen_evidence_reference_lookup_does_not_scan_all_anchors(dataset):
    db, _, _ = dataset
    with db.connection() as connection:
        query = connection.execute('EXPLAIN QUERY PLAN SELECT 1 FROM consistency_anchor_evidence WHERE evidence_id=?',
            ('deleted-evidence',)).fetchall()
    assert any('SEARCH consistency_anchor_evidence' in row[3] for row in query), [row[3] for row in query]


@pytest.mark.parametrize('table', ['analysis_media_deliveries', 'audit_media_deliveries',
    'audit_master_reads', 'audit_master_media_deliveries'])
def test_call_reference_lookup_does_not_scan_other_jobs_media(dataset, table):
    db, _, _ = dataset
    with db.connection() as connection:
        query = connection.execute(f'EXPLAIN QUERY PLAN SELECT 1 FROM {table} WHERE call_id=?', ('deleted-call',)).fetchall()
    assert any('SEARCH '+table in row[3] for row in query), [row[3] for row in query]


@pytest.fixture
def deletion_job(dataset):
    db, _, config = dataset
    runner = JobRunner(db, ('ANALYSIS_WORKFLOW', 'MODEL_AUDIT', 'IMAGE_INDEX', 'PIXEL_INDEX'))
    sample_id = config.dataset.id + ':dent.png'

    def create(kind='ANALYSIS_WORKFLOW', *, finish=True, **lineage):
        job = runner.start(kind, config.task.task_id,
            {'dataset_id': config.dataset.id, 'sample_ids': [sample_id]}, None, '检查', **lineage)
        if finish:
            runner.record(job['run_id'], sample_id)
            return runner.finish_external(job['run_id'])
        return job

    yield runner, create
    runner.close()


def test_delete_finished_job_removes_its_request_and_calls_from_database(dataset):
    db, _, config = dataset
    runner = JobRunner(db, ('ANALYSIS_WORKFLOW',))
    sample_id = config.dataset.id + ':dent.png'
    try:
        job = runner.start('ANALYSIS_WORKFLOW', config.task.task_id,
            {'dataset_id': config.dataset.id, 'sample_ids': [sample_id]}, None, '检查')
        run_id = job['run_id']
        runner.record(run_id, sample_id)
        runner.finish_external(run_id)
        call = ModelCallSummary(call_id='deleted-call', run_id=run_id, operation='generate',
            schema_name=None, phase=None, sample_id=sample_id, started_at='2026-11-20T00:00:00Z')
        with db.connection() as connection:
            connection.execute('INSERT INTO model_calls VALUES(?,?,?)', (call.call_id, run_id, call.model_dump_json()))

        assert runner.delete(run_id, ('ANALYSIS_WORKFLOW',)) == {'deleted_run_id': run_id}

        with pytest.raises(LookupError, match='Job not found'):
            runner.status(run_id)
        with db.connection() as connection:
            assert connection.execute('SELECT count(*) FROM job_requests WHERE job_id=?', (run_id,)).fetchone()[0] == 0
            assert connection.execute('SELECT count(*) FROM model_calls WHERE run_id=?', (run_id,)).fetchone()[0] == 0
            assert connection.execute('PRAGMA foreign_key_check').fetchall() == []
        assert runner.list(config.dataset.id, ('ANALYSIS_WORKFLOW',)) == []
    finally:
        runner.close()


def test_delete_family_removes_retries_and_exclusive_descendants(dataset, deletion_job):
    db, _, _ = dataset
    runner, create = deletion_job
    root = create(finish=False)
    runner.cancel(root['run_id'], ('ANALYSIS_WORKFLOW',))
    retry = create(parent_run_id=root['run_id'], root_run_id=root['run_id'])
    child = create('IMAGE_INDEX', parent_run_id=retry['run_id'])
    grandchild = create('PIXEL_INDEX', parent_run_id=child['run_id'])
    retained = create()

    runner.delete(retry['run_id'], ('ANALYSIS_WORKFLOW',), family=True)

    for job in (root, retry, child, grandchild):
        with pytest.raises(LookupError):
            runner.status(job['run_id'])
    assert runner.status(retained['run_id'])['status'] == 'COMPLETED'
    with db.connection() as connection:
        assert connection.execute('PRAGMA foreign_key_check').fetchall() == []


def test_delete_preserves_a_child_shared_with_another_job(dataset, deletion_job):
    db, _, _ = dataset
    runner, create = deletion_job
    removed, retained = create(), create()
    exclusive = create('IMAGE_INDEX', parent_run_id=removed['run_id'])
    shared = create('PIXEL_INDEX', parent_run_id=removed['run_id'])
    shared_descendant = create('IMAGE_INDEX', parent_run_id=shared['run_id'])
    with db.connection() as connection:
        connection.execute("UPDATE job_runs SET payload_json=json_set(payload_json,'$.batch_runs',json(?)) WHERE job_id=?",
            (json.dumps([shared['run_id']]), retained['run_id']))

    runner.delete(removed['run_id'], ('ANALYSIS_WORKFLOW',))

    with pytest.raises(LookupError):
        runner.status(exclusive['run_id'])
    for job in (retained, shared, shared_descendant):
        assert runner.status(job['run_id'])['status'] == 'COMPLETED'


def test_active_owned_child_blocks_the_whole_deletion(dataset, deletion_job):
    db, _, _ = dataset
    runner, create = deletion_job
    root = create()
    child = create('IMAGE_INDEX', finish=False, parent_run_id=root['run_id'])
    with pytest.raises(ValueError, match='请先取消作业'):
        runner.delete(root['run_id'], ('ANALYSIS_WORKFLOW',))
    assert runner.status(root['run_id'])['status'] == 'COMPLETED'
    assert runner.status(child['run_id'])['status'] == 'RUNNING'
    with db.connection() as connection:
        assert connection.execute('SELECT count(*) FROM call_payload_deletions').fetchone()[0] == 0


def test_job_creation_does_not_depend_on_request_and_ownership_trigger_order(dataset, deletion_job):
    db, _, _ = dataset
    runner, create = deletion_job
    with db.connection() as connection:
        capture = connection.execute("SELECT sql FROM sqlite_master WHERE type='trigger' AND name='capture_job_request'").fetchone()[0]
        connection.execute('DROP TRIGGER capture_job_request')
        connection.execute(capture)
    root = create()
    child = create('IMAGE_INDEX', parent_run_id=root['run_id'])
    with db.connection() as connection:
        assert connection.execute('SELECT count(*) FROM job_ownership_edges WHERE parent_id=? AND child_id=?',
            (root['run_id'], child['run_id'])).fetchone()[0] == 1
    runner.delete(root['run_id'], ('ANALYSIS_WORKFLOW',))
    with pytest.raises(LookupError):
        runner.status(child['run_id'])


@pytest.mark.parametrize('shared', [False, True])
def test_index_batch_is_removed_only_with_all_its_owners(dataset, deletion_job, shared):
    db, _, _ = dataset
    runner, create = deletion_job
    removed = create()
    index = create('IMAGE_INDEX', parent_run_id=removed['run_id'])
    retained = create() if shared else None
    with db.connection() as connection:
        connection.execute('''INSERT INTO consistency_runs
            (batch_id,request_id,fingerprint,root_batch_id,plan_json) VALUES('batch','request','hash','batch','{}')''')
        connection.execute('INSERT INTO consistency_children VALUES(?,?,?)', ('batch', 0, index['run_id']))
        for job in (removed, retained) if shared else (removed,):
            connection.execute("UPDATE job_runs SET payload_json=json_set(payload_json,'$.index_batch_id','batch') WHERE job_id=?",
                (job['run_id'],))

    runner.delete(removed['run_id'], ('ANALYSIS_WORKFLOW',))

    with db.connection() as connection:
        assert connection.execute("SELECT count(*) FROM consistency_runs WHERE batch_id='batch'").fetchone()[0] == int(shared)
        assert connection.execute('PRAGMA foreign_key_check').fetchall() == []
    if shared:
        assert runner.status(index['run_id'])['status'] == 'COMPLETED'
        assert runner.status(retained['run_id'])['status'] == 'COMPLETED'
    else:
        with pytest.raises(LookupError):
            runner.status(index['run_id'])


@pytest.mark.parametrize('shared', [None, 'anchor', 'audit'])
def test_frozen_evidence_is_deleted_only_after_its_last_reference(indexed_dataset, shared):
    from pathlib import Path
    from uuid import uuid4

    from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
    from iad_core.workbench.runtime import WorkbenchRuntime

    db, _, config = indexed_dataset
    originals = {path: path.read_bytes() for root in (config.root, config.annotations.root)
        for path in Path(root).rglob('*') if path.is_file()}
    runtime = WorkbenchRuntime(db)
    try:
        checks = ConsistencyAgentJobs(runtime)
        removed = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact'})['run_id']
        for anchor in checks.anchors(removed):
            if checks.retrieve(removed, anchor.anchor_id).candidates:
                ConsistencyAgentEvidence(runtime).freeze(removed, anchor.anchor_id, checkpoint=lambda: None)
        checks.cancel(removed)
        with db.connection() as connection:
            evidence = [row[0] for row in connection.execute('SELECT evidence_id FROM consistency_anchor_evidence WHERE job_id=?', (removed,))]
        assert evidence
        retained = None
        if shared == 'anchor':
            retained = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact'})['run_id']
            for anchor in checks.anchors(retained):
                if checks.retrieve(retained, anchor.anchor_id).candidates:
                    ConsistencyAgentEvidence(runtime).freeze(retained, anchor.anchor_id, checkpoint=lambda: None)
            checks.cancel(retained)
        elif shared == 'audit':
            sample_id = config.dataset.id + ':dent.png'
            audit = runtime.jobs.start('MODEL_AUDIT', config.task.task_id,
                {'dataset_id': config.dataset.id, 'sample_ids': [sample_id]}, None, '审计')
            retained = audit['run_id']
            runtime.jobs.record(retained, sample_id)
            runtime.jobs.finish_external(retained)
            with db.connection() as connection:
                connection.execute('INSERT INTO audit_workflow_runs(job_id,snapshot_json) VALUES(?,?)', (retained, '{}'))
                connection.execute('INSERT INTO audit_upstream_records VALUES(?,?,?,?)',
                    (retained, sample_id, 0, json.dumps({'evidence': [{'evidence_id': identity} for identity in evidence]})))

        runtime.jobs.delete(removed, ('ANALYSIS_WORKFLOW',), family=True)

        with db.connection() as connection:
            assert connection.execute('SELECT count(*) FROM consistency_anchor_runs WHERE job_id=?', (removed,)).fetchone()[0] == 0
            remaining = connection.execute('SELECT count(*) FROM consistency_results WHERE evidence_id IN (SELECT value FROM json_each(?))',
                (json.dumps(list(set(evidence))),)).fetchone()[0]
            assert remaining == (len(set(evidence)) if shared else 0)
            assert connection.execute('PRAGMA foreign_key_check').fetchall() == []
        if retained:
            runtime.jobs.delete(retained, ('MODEL_AUDIT',) if shared == 'audit' else ('ANALYSIS_WORKFLOW',), family=True)
            with db.connection() as connection:
                assert connection.execute('SELECT count(*) FROM consistency_results').fetchone()[0] == 0
        assert all(path.read_bytes() == content for path, content in originals.items())
    finally:
        runtime.close()


def test_deletion_removes_owned_session_files_and_call_payloads_after_commit(dataset, deletion_job):
    from pathlib import Path

    db, _, _ = dataset
    runner, create = deletion_job
    removed, retained = create(), create()
    root = Path(db.db_path).parent
    removed_files, retained_files = [], []
    for module in ('consistency', 'audit', 'knowledge', 'exploration'):
        for job, files in ((removed, removed_files), (retained, retained_files)):
            filename = root / (module + '-sessions') / '2026-11-20T00-00-00.000Z' / job['run_id'] / 'session.jsonl'
            filename.parent.mkdir(parents=True, exist_ok=True)
            filename.write_text('保留本作业的记录。', encoding='utf-8')
            files.append(filename)
    call = ModelCallSummary(call_id='owned-file-call', run_id=removed['run_id'], operation='generate',
        schema_name=None, phase=None, sample_id=None, started_at='2026-11-20T00:00:00Z')
    with db.call_payloads.prepare(removed['run_id'], call.call_id, 'request', b'{"model":"test"}') as prepared:
        with db.connection(after_commit=prepared.commit) as connection:
            connection.execute('INSERT INTO model_calls VALUES(?,?,?)', (call.call_id, removed['run_id'], call.model_dump_json()))
            prepared.publish()

    runner.delete(removed['run_id'], ('ANALYSIS_WORKFLOW',))

    assert all(not path.exists() for path in removed_files)
    assert all(path.read_text(encoding='utf-8') == '保留本作业的记录。' for path in retained_files)
    with pytest.raises(RuntimeError, match='请求正文缺失'):
        db.call_payloads.read(removed['run_id'], call.call_id)
    assert runner.status(retained['run_id'])['status'] == 'COMPLETED'


def test_rollback_keeps_job_records_and_session_files(dataset, deletion_job):
    from pathlib import Path
    from iad_core.storage.job_deletion import JobDeletion

    db, _, _ = dataset
    runner, create = deletion_job
    job = create()
    filename = Path(db.db_path).parent / 'consistency-sessions' / 'timestamp' / job['run_id'] / 'session.jsonl'
    filename.parent.mkdir(parents=True)
    filename.write_text('事务回滚后保留。', encoding='utf-8')
    with pytest.raises(RuntimeError, match='回滚'):
        with db.connection() as connection:
            JobDeletion(connection).delete([job['run_id']])
            assert filename.exists()
            raise RuntimeError('回滚')
    assert filename.read_text(encoding='utf-8') == '事务回滚后保留。'
    assert runner.status(job['run_id'])['status'] == 'COMPLETED'


def test_schema_upgrade_physically_removes_marked_jobs_and_retires_the_marker(dataset, deletion_job):
    from iad_core.storage.database import Database

    db, _, _ = dataset
    runner, create = deletion_job
    removed, retained = create(), create()
    child = create('IMAGE_INDEX', parent_run_id=removed['run_id'])
    with db.connection() as connection:
        if 'deleted_at' not in {row[1] for row in connection.execute('PRAGMA table_info(job_runs)')}:
            connection.execute('ALTER TABLE job_runs ADD COLUMN deleted_at TEXT')
        connection.execute("UPDATE job_runs SET deleted_at='2026-11-19T00:00:00Z' WHERE job_id=?", (removed['run_id'],))
        connection.execute("UPDATE schema_revision SET source_digest='previous-schema'")

    upgraded = Database(db.db_path)
    try:
        with upgraded.connection() as connection:
            assert connection.execute('SELECT count(*) FROM job_runs WHERE job_id IN (?,?)',
                (removed['run_id'], child['run_id'])).fetchone()[0] == 0
            assert 'deleted_at' not in {row[1] for row in connection.execute('PRAGMA table_info(job_runs)')}
            assert connection.execute('SELECT count(*) FROM job_runs WHERE job_id=?', (retained['run_id'],)).fetchone()[0] == 1
            assert connection.execute('PRAGMA foreign_key_check').fetchall() == []
    finally:
        upgraded.close()
