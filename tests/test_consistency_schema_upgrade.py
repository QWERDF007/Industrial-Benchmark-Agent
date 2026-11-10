import sqlite3
from uuid import uuid4

from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.storage.database import Database
from iad_core.workbench.runtime import WorkbenchRuntime


def test_existing_database_can_create_and_resume_checks_after_anchor_schema_upgrade(dataset):
    database, _, config = dataset
    with sqlite3.connect(database.db_path) as connection:
        connection.execute('DROP TABLE consistency_anchor_runs')
        connection.execute('''CREATE TABLE consistency_anchor_runs (
            job_id TEXT NOT NULL REFERENCES job_runs(job_id) ON DELETE CASCADE,
            anchor_id TEXT NOT NULL,ordinal INTEGER NOT NULL CHECK(ordinal>=0),
            session_id TEXT NOT NULL UNIQUE,session_created INTEGER NOT NULL DEFAULT 0,
            state TEXT NOT NULL,phase TEXT NOT NULL,
            candidates_json TEXT,group_json TEXT,result_json TEXT,
            PRIMARY KEY(job_id,anchor_id),UNIQUE(job_id,ordinal))''')

    upgraded = Database(database.db_path)
    runtime = WorkbenchRuntime(upgraded)
    anchor_id = config.dataset.id + ':normal.png'
    request = {'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact',
        'subjects': {'kind': 'samples', 'sample_ids': [anchor_id]}}
    try:
        checks = ConsistencyAgentJobs(runtime)
        job = checks.start(request)
        anchor = checks.anchor(job['run_id'], anchor_id)
        assert anchor.attempt == 1 and anchor.trace_state == 'OPEN'
        assert anchor.visual_plan is None and anchor.trace_error is None
        checks.session_created(job['run_id'], anchor_id)
        assert checks.retrieve(job['run_id'], anchor_id).candidates == []
        checks.cancel(job['run_id'])
        checks.resume(job['run_id'])
        resumed = checks.anchor(job['run_id'], anchor_id)
        assert resumed.attempt == 2 and resumed.session_id == anchor.session_id
        checks.submit_empty(job['run_id'], anchor_id, attempt=2)
        assert runtime.jobs.finish_external(job['run_id'])['status'] == 'COMPLETED'
    finally:
        runtime.close()

    reopened = WorkbenchRuntime(Database(database.db_path))
    try:
        checks = ConsistencyAgentJobs(reopened)
        assert checks.anchor(job['run_id'], anchor_id).result.reason == 'NO_CANDIDATES'
        assert checks.start(request)['run_id'] == job['run_id']
        assert len(checks.anchors(job['run_id'])) == 1
    finally:
        reopened.close()
