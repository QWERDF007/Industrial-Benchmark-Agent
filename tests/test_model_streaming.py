import json
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from types import SimpleNamespace

import pytest

from iad_core.workbench.calls import ModelCalls
from iad_core.workbench.model_profile import ModelProfile
from iad_core.workbench.vision import VlmClient
from iad_core.advisory.analysis import AnalysisModel


class StreamObservation(AnalysisModel):
    description: str


@pytest.fixture
def streaming_model():
    model = SimpleNamespace(requests=[], emitted=bytearray(), entered=threading.Event(), mode='complete')
    content = json.dumps(dict(description='仅记录原像素中可见的外观变化，保留不确定项。'*10), ensure_ascii=False)

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


@pytest.fixture
def recorded_stream(dataset, streaming_model):
    db, _, config = dataset
    run_id = 'transport-stream'
    with db.connection() as connection:
        connection.execute("INSERT INTO job_runs(job_id,task_id,job_type,status,payload_json) VALUES(?,?,'ANALYSIS_WORKFLOW','RUNNING','{}')",
            (run_id, config.task.task_id))
    profile = ModelProfile(endpoint=streaming_model.endpoint, model_id='stream-model',
        capacity_mode='vllm_tokenize', generation_timeout_seconds=.25, connect_timeout_seconds=2)
    client = VlmClient(profile=profile)
    calls, cancelled = ModelCalls(db), threading.Event()

    def checkpoint():
        if cancelled.is_set():
            raise InterruptedError('用户取消当前传输')

    def generate():
        with calls.bind(run_id, checkpoint):
            plan = client.plan(StreamObservation, '返回实际观察。', [], 'stream-model')
            return client.generate(plan)

    try:
        yield calls, run_id, generate, cancelled
    finally:
        client.client.close()


def test_active_generation_survives_read_timeout_between_response_start_and_finish(recorded_stream, streaming_model):
    calls, run_id, generate, _ = recorded_stream
    result = generate()
    assert result.description.startswith('仅记录原像素')
    assert streaming_model.requests[0]['stream'] is True
    assert streaming_model.requests[0]['stream_options'] == {'include_usage': True}
    call = calls.list(run_id)[-1]
    assert call.finish_reason == 'stop'
    assert call.elapsed_ms > 250
    assert call.usage == dict(prompt_tokens=1000, completion_tokens=100, total_tokens=1100)
    assert call.response_id == 'stream-1'
    assert call.response_model == 'reported-stream-model'
    assert calls.get(run_id, call.call_id).response_body.encode() == bytes(streaming_model.emitted)


@pytest.mark.parametrize('mode,message', [('incomplete', '模型流未完整结束'), ('length', '输出达到 token 上限')])
def test_incomplete_stream_never_returns_a_parsed_prefix(recorded_stream, streaming_model, mode, message):
    calls, run_id, generate, _ = recorded_stream
    streaming_model.mode = mode
    with pytest.raises(ValueError, match=message):
        generate()
    call = calls.list(run_id)[-1]
    assert call.error.type == 'ValueError'
    assert call.finish_reason == ('length' if mode == 'length' else None)
    assert calls.get(run_id, call.call_id).response_body.encode() == bytes(streaming_model.emitted)


def test_cancellation_stops_an_active_stream_and_keeps_the_actual_partial_response(recorded_stream, streaming_model):
    calls, run_id, generate, cancelled = recorded_stream
    errors, results = [], []

    def execute():
        try:
            results.append(generate())
        except Exception as error:
            errors.append(error)

    worker = threading.Thread(target=execute)
    worker.start()
    try:
        assert streaming_model.entered.wait(3)
        cancelled.set()
    finally:
        worker.join(5)
    assert not worker.is_alive() and not results
    assert len(errors) == 1 and isinstance(errors[0], InterruptedError)
    call = calls.list(run_id)[-1]
    assert call.error.type == 'InterruptedError'
    assert call.finish_reason is None
    raw = calls.get(run_id, call.call_id).response_body.encode()
    assert raw and bytes(streaming_model.emitted).startswith(raw)
    assert b'[DONE]' not in raw


def test_repeated_json_closing_never_returns_a_parsed_prefix(recorded_stream, streaming_model):
    calls, run_id, generate, _ = recorded_stream
    streaming_model.mode = 'trailing'
    with pytest.raises(ValueError, match='JSON'):
        generate()
    assert len(streaming_model.requests) == 2
    assert all(call.error.type == 'ModelOutputError' for call in calls.list(run_id) if call.operation == 'generate')
