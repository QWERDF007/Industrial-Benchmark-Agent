import json

import httpx
import pytest

from iad_core.entry import sample_get
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


def test_operator_retries_only_failed_samples_and_preserves_completed_results(dataset, mllm_api):
    db, _, config = dataset
    external, _, _ = mllm_api
    calls = []
    fail_next = True

    def respond(request):
        nonlocal fail_next
        body = json.loads(request.content)
        if request.url.path.endswith('/chat/completions'):
            images = [json.loads(part['text'][5:]) for part in body['messages'][0]['content']
                      if part['type'] == 'text' and part['text'].startswith('视觉证据：')]
            calls.append(images[0]['evidence_id'])
            if fail_next:
                fail_next = False
                return httpx.Response(500, json={'error': {'message': 'temporary model failure'}})
        return external.send(request)

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        first = runtime.audit.start(dataset_id=config.dataset.id)
        runtime.audit.wait(first['run_id'], 5)
        parent = runtime.audit.status(first['run_id'])
        assert (parent['status'], parent['completed'], parent['failed'], parent['unprocessed']) == ('PARTIAL', 3, 1, 0)
        originals = {sid: sample_get({'sample_id': sid}, db.db_path)['suggestion']
                     for sid in parent['completed_sample_ids']}
        retry = runtime.audit.retry(run_id=first['run_id'])
        runtime.audit.wait(retry['run_id'], 5)
        child = runtime.audit.status(retry['run_id'])
        assert child['parent_run_id'] == first['run_id']
        assert child['root_run_id'] == first['run_id']
        assert child['sample_ids'] == parent['failed_sample_ids']
        assert (child['status'], child['completed'], child['failed']) == ('COMPLETED', 1, 0)
        assert child['normal_version_id'] == parent['normal_version_id']
        assert runtime.audit.status(first['run_id']) == parent
        assert all(sample_get({'sample_id': sid}, db.db_path)['suggestion'] == suggestion
                   for sid, suggestion in originals.items())
        assert len(calls) == 5
        with pytest.raises(ValueError, match='没有.*重试'):
            runtime.audit.retry(run_id=first['run_id'])
        assert len(calls) == 5
    finally:
        runtime.close()


@pytest.mark.parametrize('changed', ['image', 'annotations', 'reference_evidence'])
def test_retry_rejects_changed_frozen_inputs_before_contacting_model(dataset, mllm_api, changed):
    from iad_core.entry import dataset_scan, knowledge_evidence, knowledge_get
    from pathlib import Path
    from PIL import Image

    db, _, config = dataset
    external, bodies, responses = mllm_api
    runtime = WorkbenchRuntime(db, VlmClient(external))
    target = config.dataset.id + ':dent.png'
    responses['CheckAssessments'] = []
    try:
        first = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(first['run_id'], 5)
        assert runtime.audit.status(first['run_id'])['status'] == 'FAILED'
        responses.pop('CheckAssessments')
        if changed == 'image':
            Image.new('RGB', (320, 240), 'red').save(Path(config.root) / 'dent.png')
        elif changed == 'annotations':
            labels = Path(config.annotations.root)
            source = labels / 'dent.json'
            document = json.loads(source.read_text())
            document['shapes'][0]['points'] = [[10, 10], [50, 50]]
            source.write_text(json.dumps(document))
            dataset_scan({'dataset_id': config.dataset.id}, db.db_path)
        else:
            normal = knowledge_get({'version_id': first['normal_version_id']}, db.db_path)['knowledge']
            item = normal['evidence'][0]['image']
            location = knowledge_evidence({'version_id': normal['version_id'], 'evidence_id': item['evidence_id']}, db.db_path)
            Path(location['path']).write_bytes(b'changed evidence')
        before = len(bodies)
        with pytest.raises(ValueError, match='重新启动'):
            runtime.audit.retry(run_id=first['run_id'])
        assert len(bodies) == before
        assert len(runtime.audit.list(config.dataset.id)) == 1
        assert sample_get({'sample_id': target}, db.db_path)['suggestion'] is None
    finally:
        runtime.close()


def test_second_worker_cannot_mark_a_live_workers_job_interrupted(dataset, mllm_api):
    db, _, config = dataset
    external, _, _ = mllm_api
    runtime = WorkbenchRuntime(db, VlmClient(external))
    try:
        with pytest.raises(ValueError, match='工作进程'):
            WorkbenchRuntime(db, VlmClient(external))
        assert runtime.audit.list(config.dataset.id) == []
    finally:
        runtime.close()


def test_operator_retries_failed_knowledge_without_publishing_twice(dataset, mllm_api):
    from iad_core.entry import knowledge_get
    db, _, config = dataset
    external, _, _ = mllm_api
    failing = True

    def respond(request):
        if failing and request.url.path.endswith('/chat/completions'):
            return httpx.Response(500, json={'error': {'message': 'temporary failure'}})
        response = external.send(request)
        if request.url.path.endswith('/chat/completions'):
            body = json.loads(request.content)
            parent = json.loads(body['messages'][0]['content'][0]['text'].split('冻结父版本候选：')[1].split('\n')[0])
            result = json.loads(response.json()['choices'][0]['message']['content'])
            result['revisions'] = [{'previous_check_id': check['check_id'],
                'current_check_titles': ['表面外观'], 'reason': '同一外观判据重新核验'} for check in parent['checks']]
            response = httpx.Response(200, json={'choices': [{'message': {'content': json.dumps(result)}}]})
        return response

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        first = runtime.knowledge.start(dataset_id=config.dataset.id, kind='normal', model_name='retry-test-model')
        runtime.knowledge.wait(first['run_id'], 5)
        parent = runtime.knowledge.status(first['run_id'])
        assert parent['status'] == 'FAILED'
        with pytest.raises(ValueError, match='联合.*全部'):
            runtime.knowledge.retry(run_id=first['run_id'], sample_ids=parent['sample_ids'][:1])
        assert len(runtime.knowledge.list(config.dataset.id)) == 2
        failing = False
        child = runtime.knowledge.retry(run_id=first['run_id'])
        runtime.knowledge.wait(child['run_id'], 5)
        status = runtime.knowledge.status(child['run_id'])
        assert (status['status'], status['completed'], status['failed']) == ('COMPLETED', 2, 0), status['errors']
        assert status['parent_run_id'] == first['run_id']
        assert knowledge_get({'version_id': status['knowledge_version_id']}, db.db_path)['knowledge']['version_id'] == status['knowledge_version_id']
        assert runtime.knowledge.status(first['run_id']) == parent
        with pytest.raises(ValueError, match='没有.*重试'):
            runtime.knowledge.retry(run_id=first['run_id'])
        assert knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge']['version_id'] == status['knowledge_version_id']
    finally:
        runtime.close()


def test_operator_recovers_a_killed_worker_without_reauditing_committed_samples(dataset, mllm_api, monkeypatch):
    import os
    import subprocess
    import sys
    import threading
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

    db, _, config = dataset
    external, _, _ = mllm_api
    entered, release = threading.Event(), threading.Event()
    calls = []

    class Model(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def do_POST(self):
            body = self.rfile.read(int(self.headers['Content-Length']))
            document = json.loads(body)
            if self.path.endswith('/chat/completions'):
                image = next(json.loads(item['text'][5:]) for item in document['messages'][0]['content']
                             if item['type'] == 'text' and item['text'].startswith('视觉证据：'))
                calls.append(image['evidence_id'])
                if len(calls) == 2:
                    entered.set()
                    assert release.wait(15)
            result = external.send(httpx.Request('POST', 'http://test-model' + self.path, content=body))
            self.send_response(result.status_code)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            try:
                self.wfile.write(result.content)
            except BrokenPipeError:
                pass

    server = ThreadingHTTPServer(('127.0.0.1', 0), Model)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    env = {**os.environ, 'LIVE_VLM_ENDPOINT': f'http://127.0.0.1:{server.server_port}/v1'}
    monkeypatch.setenv('LIVE_VLM_ENDPOINT', env['LIVE_VLM_ENDPOINT'])
    worker = subprocess.Popen([sys.executable, '-m', 'iad_core.entry'], stdin=subprocess.PIPE,
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=env)
    runtime = None
    try:
        worker.stdin.write(json.dumps({'request_id': 'start', 'operation': 'audit_start',
            'arguments': {'dataset_id': config.dataset.id}, 'db_path': db.db_path}) + '\n')
        worker.stdin.flush()
        response = json.loads(worker.stdout.readline())
        assert response['event'] == 'result', response
        first = response['data']
        assert entered.wait(10), 'Worker must commit one sample and enter the second real HTTP request'
        completed_id = first['sample_ids'][0]
        committed = sample_get({'sample_id': completed_id}, db.db_path)['suggestion']
        assert committed and committed['audit_run_id'] == first['run_id']
        worker.kill()
        worker.communicate(timeout=5)
        assert worker.returncode != 0
        release.set()
        runtime = WorkbenchRuntime(db, VlmClient())
        parent = runtime.audit.status(first['run_id'])
        assert (parent['status'], parent['completed'], parent['failed'], parent['unprocessed']) == ('INTERRUPTED', 1, 0, 3)
        assert parent['completed_sample_ids'] == [completed_id]
        interrupted_call = parent['model_calls'][-1]
        assert interrupted_call['error']['type'] == 'WorkerInterrupted'
        assert interrupted_call['http_status'] is None and interrupted_call['usage'] is None
        assert interrupted_call['elapsed_ms'] is None
        child = runtime.audit.retry(run_id=first['run_id'])
        runtime.audit.wait(child['run_id'], 5)
        status = runtime.audit.status(child['run_id'])
        assert (status['status'], status['completed'], status['failed']) == ('COMPLETED', 3, 0)
        assert completed_id not in status['sample_ids']
        assert runtime.audit.status(first['run_id']) == parent
        assert sample_get({'sample_id': completed_id}, db.db_path)['suggestion'] == committed
        assert calls.count(calls[0]) == 1
        assert all(sample_get({'sample_id': sid}, db.db_path)['suggestion'] for sid in first['sample_ids'])
    finally:
        release.set()
        if worker.poll() is None:
            worker.kill()
            worker.communicate(timeout=5)
        if runtime:
            runtime.close()
        server.shutdown()
        server.server_close()


def test_retries_are_idempotent_and_nonoverlapping_across_selected_subsets(dataset, mllm_api):
    import threading

    db, _, config = dataset
    external, _, responses = mllm_api
    responses['CheckAssessments'] = []
    entered, release = threading.Event(), threading.Event()
    block_once = False

    def respond(request):
        nonlocal block_once
        if block_once and request.url.path.endswith('/chat/completions'):
            block_once = False
            entered.set()
            assert release.wait(5)
        return external.send(request)

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        first = runtime.audit.start(dataset_id=config.dataset.id)
        runtime.audit.wait(first['run_id'], 5)
        parent = runtime.audit.status(first['run_id'])
        assert parent['status'] == 'FAILED'
        responses.pop('CheckAssessments')
        block_once = True
        subset = parent['sample_ids'][:2]
        child = runtime.audit.retry(run_id=first['run_id'], sample_ids=subset)
        assert entered.wait(5)
        duplicate = runtime.audit.retry(run_id=first['run_id'], sample_ids=list(reversed(subset)))
        assert duplicate['run_id'] == child['run_id']
        with pytest.raises(ValueError, match='关联作业'):
            runtime.audit.retry(run_id=first['run_id'], sample_ids=[subset[0], parent['sample_ids'][2]])
        with pytest.raises(ValueError, match='仍在执行'):
            runtime.audit.retry(run_id=child['run_id'])
        release.set()
        runtime.audit.wait(child['run_id'], 5)
        assert runtime.audit.status(child['run_id'])['status'] == 'COMPLETED'
        final = runtime.audit.retry(run_id=first['run_id'])
        runtime.audit.wait(final['run_id'], 5)
        status = runtime.audit.status(final['run_id'])
        assert status['status'] == 'COMPLETED'
        assert status['sample_ids'] == parent['sample_ids'][2:]
        assert len(runtime.audit.list(config.dataset.id)) == 3
        assert runtime.audit.status(first['run_id']) == parent
    finally:
        release.set()
        runtime.close()


def test_knowledge_retry_rejects_changed_human_feedback(dataset, mllm_api):
    from iad_core.workbench.review import HumanReview, ReviewSubmission

    db, _, config = dataset
    external, _, _ = mllm_api
    def respond(request):
        if request.url.path.endswith('/chat/completions'):
            return httpx.Response(500, json={'error': {'message': 'temporary model failure'}})
        return external.send(request)

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        first = runtime.knowledge.start(dataset_id=config.dataset.id, kind='normal', model_name='retry-test-model')
        runtime.knowledge.wait(first['run_id'], 5)
        assert runtime.knowledge.status(first['run_id'])['status'] == 'FAILED'
        sid = first['sample_ids'][0]
        reviews = HumanReview(db)
        session = reviews.start(config.task.task_id, 'operator', config.dataset.id)
        reviews.submit(ReviewSubmission(session_id=session['session_id'], sample_id=sid, decision='PASS'))
        decision = sample_get({'sample_id': sid}, db.db_path)['review_decision']
        with pytest.raises(ValueError, match='重新启动挖掘'):
            runtime.knowledge.retry(run_id=first['run_id'])
        assert sample_get({'sample_id': sid}, db.db_path)['review_decision'] == decision
        assert len(runtime.knowledge.list(config.dataset.id)) == 2  # initial normal and failed attempt
    finally:
        runtime.close()
