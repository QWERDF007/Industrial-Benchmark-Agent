import json
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from types import SimpleNamespace

import pytest

from iad_core.knowledge.service import KnowledgeService
from iad_core.workbench.calls import ModelCalls
from iad_core.workbench.model_profile import ModelProfile
from iad_core.workbench.vision import VlmClient
from tests.knowledge_scenarios import selected_group


@pytest.fixture
def streaming_model():
    model = SimpleNamespace(requests=[], emitted=bytearray(), entered=threading.Event(), mode='complete')
    content = json.dumps(dict(summary='仅记录所见，缺少独立变化', checks=[], suspects=[], limitations=['需要更多来源']), ensure_ascii=False)

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def do_POST(self):
            body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            if self.path == '/tokenize':
                data = json.dumps(dict(count=1000, max_model_len=262144)).encode()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(data)))
                self.end_headers()
                self.wfile.write(data)
                return
            model.requests.append(body)
            if not body.get('stream'):
                time.sleep(.8)
                data = json.dumps(dict(choices=[dict(finish_reason='stop', message=dict(content=content))])).encode()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(data)))
                self.end_headers()
                try:
                    self.wfile.write(data)
                except BrokenPipeError:
                    pass
                return
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream; charset=utf-8')
            self.end_headers()
            chunks = [dict(id='stream-1', model='reported-stream-model', choices=[dict(index=0,
                delta=dict(content=content[start:start+15]), finish_reason=None)]) for start in range(0, len(content), 15)]
            chunks += [dict(id='stream-1', model='reported-stream-model', choices=[dict(index=0,
                delta={}, finish_reason='length' if model.mode == 'length' else 'stop')]), dict(id='stream-1', model='reported-stream-model', choices=[],
                usage=dict(prompt_tokens=1000, completion_tokens=100, total_tokens=1100))]
            if model.mode == 'trailing':
                chunks.insert(-2,dict(id='stream-1',model='reported-stream-model',choices=[dict(index=0,delta=dict(content='}'),finish_reason=None)]))
            if model.mode == 'incomplete':
                chunks = chunks[:-2]
            try:
                for chunk in chunks:
                    data = ('data: ' + json.dumps(chunk, ensure_ascii=False) + '\n\n').encode()
                    model.emitted.extend(data)
                    split = len(data)//2
                    self.wfile.write(data[:split]); self.wfile.flush()
                    time.sleep(.04)
                    self.wfile.write(data[split:]); self.wfile.flush()
                    model.entered.set()
                    time.sleep(.04)
                if model.mode != 'incomplete':
                    model.emitted.extend(b'data: [DONE]\n\n')
                    self.wfile.write(b'data: [DONE]\n\n'); self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                pass

    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    model.endpoint = f'http://127.0.0.1:{server.server_port}/v1'
    try:
        yield model
    finally:
        server.shutdown(); server.server_close(); thread.join()


def test_active_generation_survives_read_timeout_between_response_start_and_finish(knowledge_dataset, streaming_model):
    db, config = knowledge_dataset
    profile = ModelProfile(endpoint=streaming_model.endpoint, model_id='stream-model',
        capacity_mode='vllm_tokenize', generation_timeout_seconds=.25, connect_timeout_seconds=2)
    service = KnowledgeService(db, VlmClient(profile=profile))
    try:
        job = service.start(request=selected_group(db, config.dataset.id, 'normal'), kind='normal')
        service.wait(job['run_id'], 5)
        state = service.status(job['run_id'])
        assert state['status'] == 'COMPLETED', state['errors']
        assert streaming_model.requests[0]['stream'] is True
        assert streaming_model.requests[0]['stream_options'] == {'include_usage': True}
        call = state['model_calls'][-1]
        assert call['finish_reason'] == 'stop'
        assert call['usage'] == dict(prompt_tokens=1000, completion_tokens=100, total_tokens=1100)
        assert call['response_id'] == 'stream-1'
        assert call['response_model'] == 'reported-stream-model'
        detail = ModelCalls(db).get(job['run_id'], call['call_id'])
        assert detail.response_body.encode() == bytes(streaming_model.emitted)
    finally:
        service.close()


@pytest.mark.parametrize('mode,message', [('incomplete', '模型流未完整结束'), ('length', '输出达到 token 上限')])
def test_incomplete_stream_never_publishes_even_if_received_json_is_valid(knowledge_dataset, streaming_model, mode, message):
    db, config = knowledge_dataset
    streaming_model.mode = mode
    service = KnowledgeService(db, VlmClient(profile=ModelProfile(endpoint=streaming_model.endpoint,
        model_id='stream-model', capacity_mode='vllm_tokenize', generation_timeout_seconds=.25)))
    try:
        job = service.start(request=selected_group(db, config.dataset.id, 'normal'), kind='normal')
        service.wait(job['run_id'], 5)
        state = service.status(job['run_id'])
        assert state['status'] == 'FAILED'
        assert message in state['errors'][0]['message']
        assert service.repository.current(config.dataset.id, 'normal') is None
        call = state['model_calls'][-1]
        assert call['error']['type'] == 'ValueError'
        assert call['finish_reason'] == ('length' if mode == 'length' else None)
        assert ModelCalls(db).get(job['run_id'], call['call_id']).response_body.encode() == bytes(streaming_model.emitted)
    finally:
        service.close()


def test_cancellation_stops_an_active_stream_and_keeps_the_actual_partial_response(knowledge_dataset, streaming_model):
    db, config = knowledge_dataset
    service = KnowledgeService(db, VlmClient(profile=ModelProfile(endpoint=streaming_model.endpoint,
        model_id='stream-model', capacity_mode='vllm_tokenize', generation_timeout_seconds=2)))
    try:
        job = service.start(request=selected_group(db, config.dataset.id, 'normal'), kind='normal')
        assert streaming_model.entered.wait(3)
        service.cancel(job['run_id'])
        service.wait(job['run_id'], 3)
        state = service.status(job['run_id'])
        assert state['status'] == 'CANCELLED'
        assert service.repository.current(config.dataset.id, 'normal') is None
        call = state['model_calls'][-1]
        assert call['error']['type'] == 'InterruptedError'
        assert call['finish_reason'] is None
        raw = ModelCalls(db).get(job['run_id'], call['call_id']).response_body.encode()
        assert raw and bytes(streaming_model.emitted).startswith(raw)
        assert b'[DONE]' not in raw
    finally:
        service.close()



def test_repeated_json_closing_stops_generation_and_never_publishes_a_prefix(knowledge_dataset,streaming_model):
    db,config=knowledge_dataset
    streaming_model.mode='trailing'
    profile=ModelProfile(endpoint=streaming_model.endpoint,model_id='stream-model',capacity_mode='vllm_tokenize')
    service=KnowledgeService(db,VlmClient(profile=profile))
    try:
        job=service.start(request=selected_group(db,config.dataset.id,'normal'),kind='normal')
        service.wait(job['run_id'],10)
        state=service.status(job['run_id'])
        assert state['status']=='FAILED' and state['completed']==0
        assert len(streaming_model.requests)==2,'原始输出越界后最多由模型修正一次'
        assert state['knowledge_version_id'] is None
        assert all(call['error']['type']=='ModelOutputError' for call in state['model_calls'] if call['operation']=='generate')
        assert 'JSON' in state['errors'][0]['message']
    finally:
        service.close()
