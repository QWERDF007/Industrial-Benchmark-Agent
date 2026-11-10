import json
import subprocess
import sys
from uuid import uuid4

from iad_core.entry import audit_job_sample, audit_job_samples


def test_current_audit_is_readable_in_an_independent_query_worker(native_audit):
    jobs, dataset_id, consistency_job_id, role = native_audit
    job = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id],
        consistency_job_id=consistency_job_id, knowledge=None), agent=role)
    first = jobs.samples(job['run_id'])[0]
    jobs.session_created(job['run_id'], first.sample_id)
    requests = [dict(request_id=operation, operation=operation, arguments=arguments, db_path=jobs.db.db_path)
        for operation, arguments in [
            ('audit_status', dict(run_id=job['run_id'])),
            ('audit_list', dict(dataset_id=dataset_id)),
            ('audit_job_samples', dict(run_id=job['run_id'])),
            ('audit_job_sample', dict(run_id=job['run_id'], sample_id=first.sample_id)),
        ]]
    process = subprocess.run([sys.executable, '-m', 'iad_core.entry', '--query-worker'],
        input=''.join(json.dumps(request)+'\n' for request in requests), capture_output=True,
        text=True, timeout=15, check=True)
    responses = {item['request_id']:item for item in map(json.loads, process.stdout.splitlines())}
    assert set(responses) == {item['request_id'] for item in requests}
    assert all(item['event'] == 'result' for item in responses.values()), responses
    status = responses['audit_status']['data']
    listed = responses['audit_list']['data']['jobs'][0]
    for view in [status, listed]:
        assert view['run_id'] == job['run_id']
        assert view['completed'] == 0 and view['total_samples'] == 6
        assert not set(view) & {'request', 'submission', 'input_sources', 'instruction'}
    assert responses['audit_job_samples']['data'] == audit_job_samples(dict(run_id=job['run_id']), jobs.db.db_path)
    detail = audit_job_sample(dict(run_id=job['run_id'], sample_id=first.sample_id), jobs.db.db_path)
    assert responses['audit_job_sample']['data'] == detail
    assert detail['sample']['session_id'] == first.session_id
    assert detail['consistency']['job_id'] == consistency_job_id
