import pytest
import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


def test_shared_workbench_model_settings_are_revisioned_without_dataset(tmp_path):
    from iad_core.entry import model_settings_get, model_settings_save

    database = str(tmp_path / 'settings.db')
    empty = model_settings_get({}, database)
    assert empty == {'revision': 0, 'selection': None}
    selection = {'provider_id': 'inspection-server', 'model_id': 'vision-model',
                 'limits': {'capacity_mode': 'vllm_tokenize', 'max_output_tokens': 4096}}
    first = model_settings_save({'expected_revision': 0, 'selection': selection}, database)
    assert first['revision'] == 1
    assert first['selection']['model_id'] == 'vision-model'
    assert model_settings_get({}, database) == first

    with pytest.raises(ValueError, match='配置已变化'):
        model_settings_save({'expected_revision': 0, 'selection': {**selection, 'model_id': 'another'}}, database)
    assert model_settings_get({}, database) == first
    with pytest.raises(ValueError):
        model_settings_save({'expected_revision': 1, 'selection': {**selection, 'api_key': 'must-not-persist'}}, database)
    assert model_settings_get({}, database) == first


def test_exploration_uses_frozen_provider_model_and_does_not_persist_credentials(dataset):
    from iad_core.entry import (direction_exploration_start, direction_exploration_status, direction_exploration_retry,
        workbench, close_workbenches, model_connection_check, model_settings_save)

    db, _, config = dataset
    calls = []
    entered, release = threading.Event(), threading.Event()
    fail_next = []

    class ExternalModel(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def send_json(self, response):
            data = json.dumps(response).encode()
            self.send_response(200); self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(data))); self.end_headers(); self.wfile.write(data)

        def do_GET(self):
            calls.append((self.path, self.headers.get('Authorization'), None))
            self.send_json({'data': [{'id': 'selected-vision-model'}]})

        def do_POST(self):
            body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            calls.append((self.path, self.headers.get('Authorization'), body))
            if self.path.endswith('/tokenize'):
                response = {'count': 2000, 'max_model_len': 32768}
            else:
                if fail_next:
                    fail_next.pop(); entered.set()
                    assert release.wait(5), 'test must release the in-flight request'
                    self.send_error(503, 'temporary model outage')
                    return
                ids = [json.loads(v['text'][5:])['evidence_id'] for v in body['messages'][0]['content']
                       if v['type'] == 'text' and v['text'].startswith('视觉证据：')]
                answer = {'summary': '比较两组图像', 'directions': [{'title': '颜色变化', 'instruction': '结合光照比较颜色',
                    'applies_to': 'both', 'rationale': '两组均可见颜色', 'evidence_ids': ids, 'limitations': []}], 'limitations': []}
                response = {'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(answer)}}]}
            self.send_json(response)

    server = ThreadingHTTPServer(('127.0.0.1', 0), ExternalModel)
    thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
    profile = {'endpoint': f'http://127.0.0.1:{server.server_port}/v1/chat/completions',
               'capacity_mode': 'vllm_tokenize', 'provider_id': 'selected-server', 'provider_name': '所选服务',
               'model_id': 'selected-vision-model', 'credential_ref': 'SELECTED_MODEL_KEY'}
    execution = {'profile': profile, 'api_key': 'isolated-execution-key'}
    try:
        checked = model_connection_check({'_model_execution': execution}, db.db_path)
        assert checked == {'model_id': 'selected-vision-model', 'capacity_mode': 'vllm_tokenize', 'context_tokens': 32768, 'image_verified': False}
        job = direction_exploration_start({'request': {'dataset_id': config.dataset.id,
            'normal_images': [config.dataset.id + ':normal.png'], 'defect_images': [config.dataset.id + ':dent.png']},
            '_model_execution': execution}, db.db_path)
        workbench(db.db_path).jobs.wait(job['run_id'], 5)
        finished = direction_exploration_status({'run_id': job['run_id']}, db.db_path)
        assert finished['status'] == 'COMPLETED', finished['errors']
        assert finished['model_name'] == 'selected-vision-model'
        assert finished['model_profile']['provider_id'] == 'selected-server'
        assert len(calls) == 4
        assert all(header == 'Bearer isolated-execution-key' and (body is None or body['model'] == 'selected-vision-model')
                   for _, header, body in calls)
        with db.connection() as conn:
            persisted = conn.execute('SELECT payload_json FROM job_runs WHERE job_id=?', (job['run_id'],)).fetchone()[0]
        assert 'isolated-execution-key' not in persisted
        assert 'api_key' not in persisted

        # A running request and its retry keep A after the global choice changes to B.
        fail_next.append(True)
        running = direction_exploration_start({'request': {'dataset_id': config.dataset.id,
            'normal_images': [config.dataset.id + ':normal.png'], 'defect_images': [config.dataset.id + ':dent.png']},
            '_model_execution': execution}, db.db_path)
        assert entered.wait(5)
        other = {'profile': {**profile, 'model_id': 'other-model', 'provider_id': 'other-provider'}, 'api_key': 'other-key'}
        model_settings_save({'expected_revision': 0, 'selection': {'provider_id': 'other-provider', 'model_id': 'other-model',
            'limits': {'capacity_mode': 'vllm_tokenize'}}}, db.db_path)
        assert direction_exploration_status({'run_id': running['run_id']}, db.db_path)['model_profile']['provider_id'] == 'selected-server'
        release.set(); workbench(db.db_path).jobs.wait(running['run_id'], 5)
        failed = direction_exploration_status({'run_id': running['run_id']}, db.db_path)
        assert failed['status'] == 'FAILED'
        with pytest.raises(ValueError, match='重试必须使用原作业'):
            direction_exploration_retry({'run_id': running['run_id'], '_model_execution': other}, db.db_path)
        before_retry = len(calls)
        frozen = {'profile': failed['model_profile'], 'api_key': 'rotated-original-key'}
        retried = direction_exploration_retry({'run_id': running['run_id'], '_model_execution': frozen}, db.db_path)
        workbench(db.db_path).jobs.wait(retried['run_id'], 5)
        assert direction_exploration_status({'run_id': retried['run_id']}, db.db_path)['status'] == 'COMPLETED'
        assert all(header == 'Bearer rotated-original-key' and body['model'] == 'selected-vision-model'
                   for _, header, body in calls[before_retry:])
        with pytest.raises(ValueError, match='宿主解析'):
            direction_exploration_start({'request': {'dataset_id': config.dataset.id}}, db.db_path)
        before_other = len(calls)
        new = direction_exploration_start({'request': {'dataset_id': config.dataset.id,
            'normal_images': [config.dataset.id + ':normal.png'], 'defect_images': [config.dataset.id + ':dent.png']},
            '_model_execution': other}, db.db_path)
        workbench(db.db_path).jobs.wait(new['run_id'], 5)
        assert direction_exploration_status({'run_id': new['run_id']}, db.db_path)['status'] == 'COMPLETED'
        assert all(header == 'Bearer other-key' and body['model'] == 'other-model' for _, header, body in calls[before_other:])
    finally:
        release.set()
        close_workbenches(); server.shutdown(); server.server_close(); thread.join(3)
