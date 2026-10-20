import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

import pytest

from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


@pytest.mark.parametrize(('component', 'old', 'new'), [
    ('audit', '不要预设产品或缺陷清单。', '不要预设产品或缺陷清单。新增判据必须核实。'),
    ('audit', '"temperature": 0.1', '"temperature": 0.2'),
    ('knowledge', 'OUTPUT_TOKENS = 8192', 'OUTPUT_TOKENS = 4096'),
])
def test_updated_generation_refuses_old_job_retry(dataset, mllm_api, tmp_path, component, old, new):
    db, _, config = dataset
    external, _, responses = mllm_api
    runtime = WorkbenchRuntime(db, VlmClient(external))
    try:
        responses['CheckAssessments'] = []
        service = getattr(runtime, component)
        if component == 'knowledge':
            responses['Tokenize'] = {'count': 262144, 'max_model_len': 262144}
            job = service.start(dataset_id=config.dataset.id, kind='normal', model_name='updated-install-test')
        else:
            job = service.start(dataset_id=config.dataset.id, sample_ids=[config.dataset.id + ':dent.png'])
        service.wait(job['run_id'], 5)
        assert service.status(job['run_id'])['status'] == 'FAILED'
    finally:
        runtime.close()
    job_count = len(getattr(runtime, component).list(config.dataset.id))
    installed = tmp_path / 'updated-build'
    package = installed / 'iad_core'
    shutil.copytree(Path(__file__).resolve().parents[1] / 'python/iad_core', package,
        ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
    matching = [path for path in package.rglob('*.py') if old in path.read_text()]
    assert len(matching) == 1
    source = matching[0]
    source.write_text(source.read_text().replace(old, new))
    process = subprocess.run([sys.executable, '-c', '''
import json,sys,httpx
from iad_core.storage.database import Database
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient
calls=[]
def external(request):
    calls.append(request.url.path)
    return httpx.Response(500,json={'error':{'message':'unexpected model request'}})
runtime=WorkbenchRuntime(Database(sys.argv[1]),VlmClient(httpx.Client(transport=httpx.MockTransport(external))))
try:
    try:
        service=getattr(runtime,sys.argv[4])
        result=service.retry(sys.argv[2])
        service.wait(result['run_id'],5)
        refused=False
    except ValueError as error:
        refused='重新启动' in str(error)
    print(json.dumps({'refused':refused,'calls':calls,'jobs':len(getattr(runtime,sys.argv[4]).list(sys.argv[3]))}))
finally:
    runtime.close()
''', db.db_path, job['run_id'], config.dataset.id, component], env={**os.environ, 'PYTHONPATH': str(installed)},
        capture_output=True, text=True, timeout=15, check=True)
    assert json.loads(process.stdout) == {'refused': True, 'calls': [], 'jobs': job_count}


@pytest.mark.parametrize('configured', [False, True])
def test_audit_sends_only_explicitly_configured_model_credentials(dataset, mllm_api, monkeypatch, configured):
    import httpx
    db, _, config = dataset
    external, _, _ = mllm_api
    if configured:
        monkeypatch.setenv('LIVE_VLM_KEY', 'synthetic-test-token')
    else:
        monkeypatch.delenv('LIVE_VLM_KEY', raising=False)
    seen = []
    def respond(request):
        seen.append(request.headers.get('Authorization'))
        return external.send(request)
    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[config.dataset.id + ':dent.png'])
        runtime.audit.wait(job['run_id'], 5)
        assert runtime.audit.status(job['run_id'])['status'] == 'COMPLETED'
        assert len(seen) >= 2
        expected = 'Bearer synthetic-test-token' if configured else None
        if any(value != expected for value in seen):
            pytest.fail('容量预检和模型分析只能携带显式配置的认证')
    finally:
        runtime.close()
