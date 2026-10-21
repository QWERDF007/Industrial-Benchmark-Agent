from tests.knowledge_scenarios import selected_group
import base64
import io
import json
import threading

import httpx
import pytest
from PIL import Image

from iad_core import entry
from iad_core.knowledge.service import KnowledgeService
from iad_core.workbench.vision import VlmClient
from iad_core.workbench.runtime import WorkbenchRuntime


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
        expected = {'http': 'HTTPStatusError', 'schema': 'ValueError', 'length': 'ValueError',
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
