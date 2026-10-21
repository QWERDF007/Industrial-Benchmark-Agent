import json
from uuid import uuid4

import httpx
import pytest

from iad_core.advisory.repository import AuditSuggestionRepository
from iad_core.advisory.schemas import AuditSuggestion
from iad_core.entry import sample_get
from iad_core.storage.database import Database
from iad_core.workbench.review import HumanReview, ReviewSubmission
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


@pytest.mark.parametrize(('status', 'completed_names', 'failed_names'), [
    ('CANCELLED', ['normal2'], ['dent']),
    ('PARTIAL', ['normal', 'normal2', 'scratch'], ['dent']),
    ('COMPLETED', ['normal', 'dent', 'normal2', 'scratch'], []),
])
def test_historical_audit_remains_readable_after_upgrade(dataset, status, completed_names, failed_names):
    db, _, config = dataset
    dataset_id = config.dataset.id
    run_id = 'audit_historical'
    sample_ids = [dataset_id + ':' + name + '.png' for name in ['normal', 'dent', 'normal2', 'scratch']]
    completed = [dataset_id + ':' + name + '.png' for name in completed_names]
    failed = [dataset_id + ':' + name + '.png' for name in failed_names]
    payload = {'dataset_id': dataset_id, 'model_name': 'historical-model', 'sample_ids': sample_ids,
        'completed': len(completed), 'failed': len(failed), 'total_samples': 4,
        'errors': [{'sample_id': sid, 'message': 'historical model failure'} for sid in failed],
        'profile_id': 'historical-profile', 'reference_sample_ids': [sample_ids[0]]}
    with db.connection() as conn:
        conn.execute('''INSERT INTO job_runs(job_id,task_id,job_type,status,progress,message,payload_json)
            VALUES(?,?,'MODEL_AUDIT',?,?,?,?)''', (run_id, config.task.task_id, status,
            (len(completed) + len(failed)) / 4, status, json.dumps(payload)))
    repository = AuditSuggestionRepository(db)
    for index, sid in enumerate(completed):
        repository.save(AuditSuggestion(suggestion_id='historical-' + str(index), task_id=config.task.task_id,
            sample_id=sid, audit_run_id=run_id))
    repository.save(AuditSuggestion(suggestion_id='another-audit', task_id=config.task.task_id,
        sample_id=sample_ids[0], audit_run_id='another-run'))
    HumanReview(db).submit(ReviewSubmission(submission_id=str(uuid4()), dataset_id=dataset_id,
        sample_id=sample_ids[0], reviewer='operator', decision='PASS', comment='已核实'))
    original = repository.get('historical-0').model_dump()

    def unexpected_model_call(request):
        pytest.fail('读取历史作业不得调用模型')

    runtime = WorkbenchRuntime(Database(db.db_path), VlmClient(httpx.Client(transport=httpx.MockTransport(unexpected_model_call))))
    try:
        job = runtime.audit.status(run_id)
        assert runtime.audit.list(dataset_id) == [job]
        assert job['root_run_id'] == run_id
        assert job['parent_run_id'] is None
        assert job['status'] == status
        assert job['completed_sample_ids'] == completed
        assert job['failed_sample_ids'] == failed
        assert (job['completed'], job['failed'], job['unprocessed']) == (len(completed), len(failed), 4 - len(completed) - len(failed))
        assert [error['sample_id'] for error in job['errors']] == failed
        assert repository.get('historical-0').model_dump() == original
        detail = sample_get({'sample_id': sample_ids[0]}, db.db_path)
        assert detail['review_history'][0]['comment'] == '已核实'
        assert detail['sample']['sample_uuid']
        with pytest.raises(ValueError, match='历史作业缺少冻结输入'):
            runtime.jobs.retry_options(run_id, ('MODEL_AUDIT',))
        with pytest.raises(ValueError, match='历史作业缺少冻结输入'):
            runtime.audit.retry(run_id)
        Database(db.db_path)
        assert runtime.audit.status(run_id) == job
    finally:
        runtime.close()
