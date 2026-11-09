import json

import pytest

from iad_core.workbench.runtime import WorkbenchRuntime


@pytest.mark.parametrize('kind', ['IMAGE_INDEX', 'DATA_CONSISTENCY'])
def test_non_mllm_jobs_recover_committed_progress_and_retry_without_chat_configuration(dataset, kind):
    import os
    import subprocess
    import sys
    from pathlib import Path
    db, _, config = dataset
    sample_ids = [config.dataset.id + ':' + name for name in ('normal.png', 'normal2.png')]
    code = '''
import json,os,sys
from iad_core.storage.database import Database
from iad_core.workbench.runtime import WorkbenchRuntime
runtime=WorkbenchRuntime(Database(sys.argv[1]))
samples=json.loads(sys.argv[4])
def execute(context):
    context.record(samples[0])
    print(context.run_id,flush=True)
    os._exit(17)
started=runtime.jobs.start(sys.argv[2],sys.argv[3],{'dataset_id':sys.argv[3],'sample_ids':samples},execute,'CPU progress')
runtime.jobs.wait(started['run_id'],20)
'''
    child = subprocess.run([sys.executable, '-c', code, db.db_path, kind, config.dataset.id, json.dumps(sample_ids)],
        env={**os.environ, 'PYTHONPATH':str(Path(__file__).resolve().parents[1] / 'python'),
            'LIVE_VLM_REQUEST_PARAMETERS':'invalid-json'}, capture_output=True, text=True, timeout=30)
    assert child.returncode == 17, child.stderr
    run_id = child.stdout.strip()
    runtime = WorkbenchRuntime(db)
    try:
        interrupted = runtime.jobs.status(run_id)
        assert (interrupted['status'], interrupted['completed'], interrupted['unprocessed']) == ('INTERRUPTED', 1, 1)
        assert interrupted['completed_sample_ids'] == sample_ids[:1]
        options = runtime.jobs.retry_options(run_id, (kind,))
        assert options['selection_mode'] == 'subset'
        assert [sample['sample_id'] for sample in options['samples']] == sample_ids[1:]
        retry = runtime.jobs.retry(run_id, (kind,), lambda context:context.record(sample_ids[1]))
        runtime.jobs.wait(retry['run_id'], 5)
        completed = runtime.jobs.status(retry['run_id'])
        assert completed['status'] == 'COMPLETED' and completed['completed'] == 1
        assert completed['parent_run_id'] == run_id and completed['sample_ids'] == sample_ids[1:]
        assert completed['model_name'] is None and completed['model_calls'] == []
        assert runtime.jobs.status(run_id)['completed_sample_ids'] == sample_ids[:1]
    finally:
        runtime.close()



def test_second_worker_cannot_mark_a_live_workers_job_interrupted(dataset):
    from threading import Event
    db, _, config = dataset
    runtime = WorkbenchRuntime(db)
    entered, release = Event(), Event()
    sid=config.dataset.id+':normal.png'
    def execute(context):
        entered.set()
        if not release.wait(10):
            raise RuntimeError('测试未释放当前作业')
        context.record(sid)
    try:
        first=runtime.jobs.start('IMAGE_INDEX',config.task.task_id,
            dict(dataset_id=config.dataset.id,sample_ids=[sid]),execute,'保持本场作业')
        assert entered.wait(5)
        with pytest.raises(ValueError,match='工作进程'):
            WorkbenchRuntime(db)
        assert runtime.jobs.status(first['run_id'])['status']=='RUNNING'
        release.set()
        runtime.jobs.wait(first['run_id'],5)
        assert runtime.jobs.status(first['run_id'])['completed']==1
    finally:
        release.set()
        runtime.close()
