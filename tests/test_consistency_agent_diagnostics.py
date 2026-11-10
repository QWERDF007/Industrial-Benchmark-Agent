from uuid import uuid4
import json

from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_results import ConsistencyAgentResults
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.storage.database import Database


def test_historical_missing_agent_call_logging_is_unknown_while_no_candidates_proves_zero(dataset):
    db, _, config = dataset
    runtime = WorkbenchRuntime(db)
    try:
        checks = ConsistencyAgentJobs(runtime)
        normal, nonempty = [config.dataset.id + ':' + name + '.png' for name in ('normal', 'dent')]
        run = checks.start({'submission_id': str(uuid4()), 'mode': 'exact', 'dataset_ids': [config.dataset.id],
            'subjects': {'kind': 'samples', 'sample_ids': [normal, nonempty]}})['run_id']
        with db.connection() as connection:
            payload = json.loads(connection.execute('SELECT payload_json FROM job_runs WHERE job_id=?', (run,)).fetchone()[0])
            payload['request']['consistency_check'].pop('model_call_logging')
            payload['request']['consistency_check'].pop('phase_logging')
            connection.execute('UPDATE job_runs SET payload_json=? WHERE job_id=?', (json.dumps(payload), run))
        results = ConsistencyAgentResults(db)
        historical = results.diagnostics(run, nonempty)
        assert historical.phase_recording == 'UNAVAILABLE'
        assert historical.roles.agent.recording == 'UNAVAILABLE'
        assert historical.roles.agent.requests is None
        assert historical.roles.agent.failed_requests is None
        assert historical.roles.agent.total_tokens is None
        assert historical.roles.agent.recorded_requests == 0
        checks.session_created(run, normal)
        checks.retrieve(run, normal)
        checks.submit_empty(run, normal)
        zero = results.diagnostics(run, normal)
        assert zero.roles.agent.recording == 'COMPLETE'
        assert zero.roles.agent.requests == zero.roles.vision.requests == 0
    finally:
        runtime.close()


def test_anchor_phase_intervals_survive_cancel_resume_and_database_reopen(dataset):
    from datetime import datetime, timezone

    db, _, config = dataset
    runtime = WorkbenchRuntime(db)
    anchor_id = config.dataset.id + ':normal.png'
    before = datetime.now(timezone.utc)
    try:
        checks = ConsistencyAgentJobs(runtime)
        run = checks.start({'submission_id': str(uuid4()), 'mode': 'exact', 'dataset_ids': [config.dataset.id],
            'subjects': {'kind': 'samples', 'sample_ids': [anchor_id]}})['run_id']
        queries = ConsistencyAgentResults(db)
        pending = queries.diagnostics(run, anchor_id)
        assert pending.phase_recording == 'COMPLETE'
        assert [(item.phase, item.attempt) for item in pending.phases] == [('CREATING_SESSION', 1)]
        assert before <= pending.phases[0].started_at <= datetime.now(timezone.utc)
        assert pending.phases[0].ended_at is None
        assert pending.phases[0].duration_seconds is None
        checks.session_created(run, anchor_id)
        checks.retrieve(run, anchor_id)
        checks.phase(run, anchor_id, 'RULE_READY')
        checks.cancel(run)
        checks.resume(run)
        checks.submit_empty(run, anchor_id, attempt=2)
        runtime.jobs.finish_external(run)
        saved = queries.diagnostics(run, anchor_id)
        assert [(item.phase, item.attempt) for item in saved.phases] == [
            ('CREATING_SESSION', 1), ('RETRIEVING', 1), ('RETRIEVING_ANCHOR', 1), ('RULE_READY', 1),
            ('CANCELLED', 1), ('RESUMING', 2), ('SUBMITTED', 2)]
        assert all(item.ended_at is not None and item.duration_seconds >= 0 for item in saved.phases)
        assert saved.phases[4].duration_seconds == saved.phases[-1].duration_seconds == 0
        assert saved.calls == []
        checks.submit_empty(run, anchor_id, attempt=2)
        assert queries.diagnostics(run, anchor_id) == saved
    finally:
        runtime.close()
    reopened = WorkbenchRuntime(Database(db.db_path))
    try:
        assert ConsistencyAgentResults(reopened.db).diagnostics(run, anchor_id) == saved
    finally:
        reopened.close()


def test_resuming_without_a_recorded_stop_preserves_unknown_stage_end(dataset):
    db, _, config = dataset
    runtime = WorkbenchRuntime(db)
    anchor_id = config.dataset.id + ':normal.png'
    try:
        checks = ConsistencyAgentJobs(runtime)
        run = checks.start({'submission_id': str(uuid4()), 'mode': 'exact', 'dataset_ids': [config.dataset.id],
            'subjects': {'kind': 'samples', 'sample_ids': [anchor_id]}})['run_id']
        checks.session_created(run, anchor_id)
        checks.retrieve(run, anchor_id)
        runtime.jobs.interrupt_external(run)
        checks.resume(run)
        checks.submit_empty(run, anchor_id, attempt=2)
        runtime.jobs.finish_external(run)
        phases = ConsistencyAgentResults(db).diagnostics(run, anchor_id).phases
        unfinished = next(item for item in phases if item.phase == 'RULE_READY')
        assert unfinished.attempt == 1
        assert unfinished.ended_at is None
        assert unfinished.duration_seconds is None
        assert phases[-1].attempt == 2
        assert phases[-1].duration_seconds == 0
    finally:
        runtime.close()
