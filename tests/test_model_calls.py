from tests.knowledge_scenarios import selected_group
import base64
import io
import json
import os
import sqlite3
import zlib
import threading
from pathlib import Path

import httpx
import pytest
from PIL import Image

from iad_core import entry
from iad_core.knowledge.service import KnowledgeService
from iad_core.workbench.vision import VlmClient
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.calls import ModelCalls
from iad_core.storage.database import Database
from iad_core.storage.call_payloads import CallPayloads


@pytest.fixture
def record_call(dataset):
    db, _, config = dataset

    def record(run_id, body, respond=lambda request: httpx.Response(200, json={'choices': []})):
        with db.connection() as conn:
            conn.execute("INSERT INTO job_runs(job_id,task_id,job_type,status,payload_json) VALUES(?,?,'MODEL_AUDIT','COMPLETED',?)",
                (run_id, config.task.task_id, json.dumps({'request': {'dataset_id': config.dataset.id}})))
        recorder = ModelCalls(db)
        with httpx.Client(transport=httpx.MockTransport(respond)) as client:
            request = client.build_request('POST', 'https://model.invalid/generate', content=body)
            with recorder.bind(run_id), ModelCalls.exchange(client, request, 'generate', 'HistoryTest') as response:
                response.read()
                response.raise_for_status()
        return recorder

    return record


def test_large_call_history_is_deleted_without_reading_request_bodies(dataset, record_call):
    db, registry, config = dataset
    body = json.dumps({'image': base64.b64encode(os.urandom(4 * 1024 * 1024)).decode()}).encode()
    recorder = record_call('large-history', body)
    call = recorder.list('large-history')[0]
    assert recorder.get('large-history', call.call_id).request_body.encode() == body

    def read_count():
        return int(Path('/proc/self/io').read_text().split('rchar: ')[1].splitlines()[0])

    before = read_count()
    registry.delete(config.dataset.id)
    assert read_count() - before < 1_000_000, '删除历史不应读取整个图像请求'
    with pytest.raises(LookupError):
        recorder.get('large-history', call.call_id)
    assert sum(path.stat().st_size for path in Path(db.db_path).parent.rglob('*') if path.is_file()) < 2_000_000


def test_recorded_payloads_survive_a_rolled_back_dataset_delete(dataset, tmp_path, record_call):
    db, registry, config = dataset
    recorder = record_call('rollback', b'{"original":true}')
    call = recorder.list('rollback')[0]
    images = tmp_path / 'dependent'; images.mkdir()
    Image.new('RGB', (32, 32), 'green').save(images / 'other.png')
    other = registry.import_dataset({'format': 'labelme', 'name': '保留', 'image_dir': str(images), 'annotation_dir': str(images)})
    with db.connection() as conn:
        conn.execute("INSERT INTO knowledge_versions VALUES('source',?,NULL,'signature','{}','now')", (config.dataset.id,))
        conn.execute("INSERT INTO knowledge_versions VALUES('dependent',?,'source','signature','{}','now')", (other.dataset.id,))
    with pytest.raises(sqlite3.IntegrityError):
        registry.delete(config.dataset.id)
    assert recorder.get('rollback', call.call_id).request_body == '{"original":true}'
    assert registry.get(config.dataset.id).dataset.id == config.dataset.id


def test_committed_payload_retirement_is_recovered_when_database_reopens(dataset, record_call):
    db, _, _ = dataset
    record_call('recovery', b'{"recover":true}')
    with sqlite3.connect(db.db_path) as conn:
        conn.execute('PRAGMA foreign_keys=ON')
        conn.execute("DELETE FROM model_calls WHERE run_id='recovery'")
        conn.execute("DELETE FROM job_runs WHERE job_id='recovery'")
    assert any(db.call_payloads.root.rglob('*.request'))
    reopened = Database(db.db_path)
    assert not any(reopened.call_payloads.root.rglob('*.request'))
    with reopened.connection() as conn:
        assert conn.execute('SELECT count(*) FROM call_payload_deletions').fetchone()[0] == 0


def test_uncommitted_job_artifacts_are_reclaimed_on_reopen(dataset, record_call):
    db, _, _ = dataset
    record_call('orphan', b'{"original":true}')
    kept = record_call('kept', b'{"preserved":true}')
    call = kept.list('kept')[0]
    before = sum(path.stat().st_size for path in db.call_payloads.root.rglob('*') if path.is_file())
    with sqlite3.connect(db.db_path) as conn:
        conn.execute('DROP TRIGGER retire_call_payloads')
        conn.execute("DELETE FROM model_calls WHERE run_id='orphan'")
        conn.execute("DELETE FROM job_runs WHERE job_id='orphan'")
    reopened = Database(db.db_path)
    assert ModelCalls(reopened).get('kept', call.call_id).request_body == '{"preserved":true}'
    assert sum(path.stat().st_size for path in reopened.call_payloads.root.rglob('*') if path.is_file()) < before


def test_database_backup_keeps_call_bodies_independent(dataset, tmp_path, record_call):
    db, _, config = dataset
    calls = record_call('backup', b'{"original":true}')
    call = calls.list('backup')[0]
    destination = tmp_path / 'backup' / 'snapshot.db'
    db.backup(str(destination))
    copied = Database(str(destination))
    assert ModelCalls(copied).get('backup', call.call_id) == calls.get('backup', call.call_id)
    with pytest.raises(FileExistsError):
        db.backup(str(destination))
    from iad_core.dataset.registry import DatasetRegistry
    DatasetRegistry(copied).delete(config.dataset.id)
    assert calls.get('backup', call.call_id).request_body == '{"original":true}'


def test_failed_backup_publication_leaves_no_partial_backup(dataset, tmp_path, record_call, monkeypatch):
    db, _, _ = dataset
    calls = record_call('backup-failure', b'{"original":true}')
    call = calls.list('backup-failure')[0]
    destination = tmp_path / 'backup' / 'snapshot.db'
    sync = CallPayloads._sync_directory

    def fail_publish(directory):
        if directory == destination.parent:
            raise OSError('模拟备份发布失败')
        sync(directory)

    with monkeypatch.context() as patch:
        patch.setattr(CallPayloads, '_sync_directory', staticmethod(fail_publish))
        with pytest.raises(OSError, match='发布失败'):
            db.backup(str(destination))
    assert not destination.exists()
    assert sum(path.stat().st_size for path in destination.parent.rglob('*') if path.is_file()) == 0
    assert calls.get('backup-failure', call.call_id).request_body == '{"original":true}'


@pytest.mark.parametrize('kind', ['request', 'response'])
def test_missing_recorded_payload_is_reported_as_integrity_failure(dataset, record_call, kind):
    db, _, _ = dataset
    calls = record_call('missing-payload', b'{"original":true}')
    call = calls.list('missing-payload')[0]
    next(db.call_payloads.root.rglob('*.' + kind)).unlink()
    with pytest.raises(RuntimeError, match='正文缺失'):
        calls.get('missing-payload', call.call_id)


def test_late_response_cannot_recreate_deleted_payloads(dataset, record_call):
    db, registry, config = dataset
    entered, release = threading.Event(), threading.Event()
    errors = []

    def respond(request):
        entered.set()
        assert release.wait(10)
        return httpx.Response(200, json={'choices': []})

    def record():
        try:
            record_call('late', b'{"late":true}', respond)
        except Exception as error:
            errors.append(error)

    worker = threading.Thread(target=record)
    worker.start()
    try:
        assert entered.wait(5)
        registry.delete(config.dataset.id)
    finally:
        release.set()
        worker.join(10)
    assert not worker.is_alive() and not errors
    assert sum(path.stat().st_size for path in db.call_payloads.root.rglob('*') if path.is_file()) == 0


@pytest.mark.parametrize('interrupted', ['', 'replace', 'fsync'])
def test_existing_call_bodies_are_migrated_without_losing_details(dataset, monkeypatch, interrupted):
    db, _, config = dataset
    request = b'{"model":"original","messages":[]}'
    response = b'{"choices":[],"usage":{"total_tokens":7}}'
    summary = json.dumps({'call_id': 'old-call', 'run_id': 'old-run', 'operation': 'generate',
        'schema_name': 'OldTest', 'phase': None, 'sample_id': None, 'started_at': '2026-01-01'})
    with sqlite3.connect(db.db_path) as conn:
        conn.execute("INSERT INTO job_runs(job_id,task_id,job_type,status,payload_json) VALUES('old-run',?,'MODEL_AUDIT','COMPLETED','{}')", (config.task.task_id,))
        conn.execute('DROP TABLE model_calls')
        conn.execute('CREATE TABLE model_calls(call_id TEXT PRIMARY KEY,run_id TEXT NOT NULL REFERENCES job_runs(job_id),summary_json TEXT NOT NULL,request_body BLOB NOT NULL,response_body BLOB)')
        conn.execute('INSERT INTO model_calls VALUES(?,?,?,?,?)', ('old-call', 'old-run', summary, zlib.compress(request), zlib.compress(response)))
    if interrupted:
        def fail_replace(*args):
            raise OSError('模拟正文迁移落盘失败')

        with monkeypatch.context() as patch:
            patch.setattr(os, interrupted, fail_replace)
            with pytest.raises(OSError, match='落盘失败'):
                Database(db.db_path)
        with sqlite3.connect(db.db_path) as conn:
            assert zlib.decompress(conn.execute('SELECT request_body FROM model_calls').fetchone()[0]) == request
    reopened = Database(db.db_path)
    saved = ModelCalls(reopened).get('old-run', 'old-call')
    assert saved.request_body.encode() == request
    assert saved.response_body.encode() == response
    with reopened.connection() as conn:
        assert {row[1] for row in conn.execute('PRAGMA table_info(model_calls)')} == {'call_id', 'run_id', 'summary_json'}
        assert conn.execute('PRAGMA foreign_key_check').fetchall() == []


@pytest.mark.parametrize('failure', ['http', 'timeout'])
def test_recorded_payloads_preserve_provider_failures(dataset, record_call, failure):
    db, _, _ = dataset

    def respond(request):
        if failure == 'timeout':
            raise httpx.ReadTimeout('original timeout', request=request)
        return httpx.Response(500, content=b'original provider error')

    with pytest.raises(httpx.HTTPError):
        record_call('failed', b'{"original":true}', respond)
    recorder = ModelCalls(db)
    call = recorder.list('failed')[0]
    detail = recorder.get('failed', call.call_id)
    assert detail.request_body == '{"original":true}'
    assert detail.response_body == ('original provider error' if failure == 'http' else None)
    assert detail.error.type == ('HTTPStatusError' if failure == 'http' else 'ReadTimeout')


def test_operator_can_reopen_actual_model_requests_responses_and_reported_usage(knowledge_dataset):
    db, config = knowledge_dataset
    actual = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            response = httpx.Response(200, json={'count': 1234, 'max_model_len': 262144})
        else:
            response = httpx.Response(200, json={
                'id': 'provider-call-1', 'model': 'reported-model',
                'usage': {'prompt_tokens': 1234, 'completion_tokens': 37, 'total_tokens': 1271,
                          'prompt_tokens_details': {'cached_tokens': 50}},
                'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps({
                    'summary': '缺少独立变化，暂不归纳判据', 'checks': [], 'suspects': [], 'limitations': ['需要更多来源'],
                })}}],
            })
        actual.append((request.content, response.content))
        return response

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond), timeout=httpx.Timeout(7.25, connect=1.5))))
    try:
        started = service.start(request=selected_group(service.db, config.dataset.id, kind='normal'), kind='normal', model_name='test-mllm')
        service.wait(started['run_id'], 5)
        job = service.status(started['run_id'])
        assert job['status'] == 'COMPLETED', job
        assert job['request']['model_profile']['generation_timeout_seconds'] == 7.25
        assert job['request']['model_profile']['connect_timeout_seconds'] == 1.5
        calls = job['model_calls']
        assert [call['operation'] for call in calls] == ['tokenize', 'generate']
        assert all(call['schema_name'] == 'KnowledgeDraft' for call in calls)
        assert all(call['http_status'] == 200 and call['error'] is None for call in calls)
        assert all(call['elapsed_ms'] >= 0 and call['finished_at'] for call in calls)
        assert calls[0]['usage'] is None
        assert calls[1]['usage'] == {'prompt_tokens': 1234, 'completion_tokens': 37, 'total_tokens': 1271,
                                    'prompt_tokens_details': {'cached_tokens': 50}}
        assert calls[1]['finish_reason'] == 'stop'
        assert calls[1]['response_id'] == 'provider-call-1'
        assert calls[1]['response_model'] == 'reported-model'
        assert calls[1]['phase'] == 'LEARNING_NORMAL'
    finally:
        service.close()
    for call, (request_body, response_body) in zip(calls, actual):
        detail = entry.OPERATIONS['model_call_get']({'run_id': job['run_id'], 'call_id': call['call_id']}, db.db_path)
        assert detail['request_body'].encode() == request_body
        assert detail['response_body'].encode() == response_body
        assert 'authorization' not in detail
        content = json.loads(detail['request_body'])['messages'][0]['content']
        encoded = next(part['image_url']['url'] for part in content if part['type'] == 'image_url')
        with Image.open(io.BytesIO(base64.b64decode(encoded.split(',', 1)[1]))) as image:
            assert image.size == (320, 240)
            assert image.getpixel((100, 120)) == (204, 204, 204)


@pytest.mark.parametrize('failure', ['http', 'schema', 'length', 'malformed_choices', 'timeout'])
def test_failed_calls_preserve_actual_output_and_the_original_error(knowledge_dataset, failure):
    db, config = knowledge_dataset

    def respond(request):
        if failure == 'timeout':
            raise httpx.ReadTimeout('controlled timeout', request=request)
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 100, 'max_model_len': 262144})
        if failure == 'http':
            return httpx.Response(500, text='controlled provider error')
        if failure == 'malformed_choices':
            return httpx.Response(200, json={'choices': 'invalid'})
        return httpx.Response(200, json={'choices': [{
            'finish_reason': 'length' if failure == 'length' else 'stop',
            'message': {'content': '{}'},
        }]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = service.start(request=selected_group(service.db, config.dataset.id, kind='normal'), kind='normal', model_name='test-mllm')
        service.wait(job['run_id'], 5)
        status = service.status(job['run_id'])
        assert status['status'] == 'FAILED', status
        call = status['model_calls'][-1]
        assert call['finished_at'] and call['elapsed_ms'] >= 0
        expected = {'http': 'HTTPStatusError', 'schema': 'ModelOutputError', 'length': 'ValueError',
                    'malformed_choices': 'AttributeError', 'timeout': 'ReadTimeout'}
        assert call['error']['type'] == expected[failure]
        assert call['error']['message'] == status['errors'][0]['message']
        detail = entry.OPERATIONS['model_call_get']({'run_id': job['run_id'], 'call_id': call['call_id']}, db.db_path)
        if failure == 'timeout':
            assert detail['response_body'] is None
            assert call['http_status'] is None
            assert len(status['model_calls']) == 1
        elif failure == 'http':
            assert detail['response_body'] == 'controlled provider error'
            assert call['http_status'] == 500
        else:
            assert json.loads(detail['response_body'])['choices']
            assert call['http_status'] == 200
        assert call['usage'] is None
    finally:
        service.close()


def test_concurrent_jobs_keep_separate_model_call_histories(knowledge_dataset, tmp_path):
    db, config = knowledge_dataset
    images, labels = tmp_path / 'second-images', tmp_path / 'second-labels'
    images.mkdir()
    labels.mkdir()
    Image.new('RGB', (80, 60), 'white').save(images / 'other.png')
    second = entry.dataset_import({'format': 'labelme', 'name': '另一部件', 'image_dir': str(images), 'annotation_dir': str(labels)}, db.db_path)
    arrived = threading.Barrier(2)

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 100, 'max_model_len': 262144})
        arrived.wait(5)
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps({
            'summary': '独立作业观察', 'checks': [], 'suspects': [], 'limitations': [],
        })}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        first = service.start(request=selected_group(service.db, config.dataset.id, kind='normal'), kind='normal', model_name='first-model')
        other = service.start(request=selected_group(service.db, second['dataset_id'], kind='normal'), kind='normal', model_name='second-model')
        for job, model in [(first, 'first-model'), (other, 'second-model')]:
            service.wait(job['run_id'], 5)
            result = service.status(job['run_id'])
            assert result['status'] == 'COMPLETED', result
            assert len(result['model_calls']) == 2
            for call in result['model_calls']:
                detail = entry.OPERATIONS['model_call_get']({'run_id': job['run_id'], 'call_id': call['call_id']}, db.db_path)
                assert json.loads(detail['request_body'])['model'] == model
                with pytest.raises(LookupError, match='not found'):
                    entry.OPERATIONS['model_call_get']({'run_id': other['run_id'] if job is first else first['run_id'],
                                                      'call_id': call['call_id']}, db.db_path)
    finally:
        service.close()


def test_cancelled_job_retains_in_flight_request_and_actual_late_response(knowledge_dataset):
    db, config = knowledge_dataset
    entered, release = threading.Event(), threading.Event()

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 100, 'max_model_len': 262144})
        entered.set()
        assert release.wait(5)
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps({
            'summary': '迟到结果不发布', 'checks': [], 'suspects': [], 'limitations': [],
        })}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = service.start(request=selected_group(service.db, config.dataset.id, kind='normal'), kind='normal', model_name='test-mllm')
        assert entered.wait(3)
        running = service.status(job['run_id'])
        call = running['model_calls'][-1]
        assert call['operation'] == 'generate' and call['finished_at'] is None
        detail = entry.OPERATIONS['model_call_get']({'run_id': job['run_id'], 'call_id': call['call_id']}, db.db_path)
        assert json.loads(detail['request_body'])['messages']
        assert detail['response_body'] is None
        service.cancel(job['run_id'])
        release.set()
        service.wait(job['run_id'], 5)
        status = service.status(job['run_id'])
        assert status['status'] == 'CANCELLED' and status['completed'] == 0
        saved = entry.OPERATIONS['model_call_get']({'run_id': job['run_id'], 'call_id': call['call_id']}, db.db_path)
        assert saved['finished_at'] and saved['http_status'] == 200
        assert json.loads(json.loads(saved['response_body'])['choices'][0]['message']['content'])['summary'] == '迟到结果不发布'
        assert entry.knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge'] is None
    finally:
        release.set()
        service.close()


def test_audit_calls_are_linked_to_the_actual_sample_and_frozen_job(dataset, mllm_api):
    db, _, config = dataset
    client, _, _ = mllm_api
    runtime = WorkbenchRuntime(db, VlmClient(client))
    target = config.dataset.id + ':dent.png'
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(job['run_id'], 5)
        status = runtime.audit.status(job['run_id'])
        assert status['status'] == 'COMPLETED', status
        assert status['model_calls']
        assert all(call['sample_id'] == target and call['schema_name'] == 'JointAnalysis' for call in status['model_calls'])
        for call in status['model_calls']:
            detail = entry.OPERATIONS['model_call_get']({'run_id': job['run_id'], 'call_id': call['call_id']}, db.db_path)
            assert status['normal_version_id'] in json.loads(detail['request_body'])['messages'][0]['content'][0]['text']
        assert entry.sample_get({'sample_id': target}, db.db_path)['suggestion']['analysis']['normal_version_id'] == status['normal_version_id']
    finally:
        runtime.close()
