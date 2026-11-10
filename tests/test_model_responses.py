import base64
import io
import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from types import SimpleNamespace

import pytest
import httpx
from PIL import Image
from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.evidence.images import EvidenceImages
from iad_core.storage.repositories import SampleRepository
from iad_core.workbench.calls import ModelCalls
from iad_core.workbench.model_profile import ModelProfile
from iad_core.workbench.vision import VlmClient


class Observation(AnalysisModel):
    description: str


class CompleteObservation(Observation):
    limitations: list[str] = Field(default_factory=list)
    overview: str | None = None


def test_chat_model_receives_the_output_contract_when_server_ignores_response_format():
    requests=[]
    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':32768})
        body=json.loads(request.content);requests.append(body)
        text='\n'.join(message['content'] if isinstance(message['content'],str) else
            '\n'.join(part.get('text','') for part in message['content']) for message in body['messages'])
        explicit='"properties"' in text and '"description"' in text and '"required"' in text
        answer={'description':'按已注册契约返回。'} if explicit else {'verdict':'同内容'}
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(answer)}}]})
    profile=ModelProfile(endpoint='http://model.invalid/v1',api='openai-completions',model_id='local',capacity_mode='vllm_tokenize')
    client=VlmClient(httpx.Client(transport=httpx.MockTransport(respond)),profile=profile)
    try:
        result=client.generate(client.plan(Observation,'原始用户提示词。',[],'local',system_prompt='原始系统提示词。'))
        assert result.description=='按已注册契约返回。'
        assert len(requests)==1
        assert requests[0]['messages'][0]['content'][0]['text']=='原始系统提示词。'
        assert requests[0]['messages'][1]['content'][0]['text']=='原始用户提示词。'
    finally:
        client.close()


@pytest.fixture
def responses_model():
    model = SimpleNamespace(requests=[], status='completed', text='{"description":"原始图像可见。"}', invalid_once=False, error=None)

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def do_POST(self):
            body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            model.requests.append((self.path, body))
            if self.path != '/v1/responses':
                self.send_error(404)
                return
            if model.error is not None:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': {'message': model.error, 'type': 'invalid_request_error'}}).encode())
                return
            result = {'id':'resp_fixture','created_at':1,'model':'gpt-6.1-sol','object':'response',
                'status':model.status,'parallel_tool_calls':True,'tool_choice':'auto','tools':[],
                'output':[{'id':'msg_fixture','type':'message','role':'assistant','status':'completed',
                    'content':[{'type':'output_text','text':'{}' if model.invalid_once and len(model.requests)==1 else model.text,'annotations':[]}]}],
                'usage':{'input_tokens':300,'output_tokens':20,'total_tokens':320,
                    'input_tokens_details':{'cached_tokens':40},'output_tokens_details':{'reasoning_tokens':0}}}
            if model.status=='incomplete':
                result['incomplete_details']={'reason':'max_output_tokens'}
            self.send_response(200)
            self.send_header('Content-Type','text/event-stream')
            self.end_headers()
            events = [{'type':'response.created','response':{**result,'status':'in_progress','output':[]}}]
            if model.status != 'disconnected':
                events.append({'type':'response.'+model.status,'response':result})
            for event in events:
                self.wfile.write(('event: '+event['type']+'\ndata: '+json.dumps(event,ensure_ascii=False)+'\n\n').encode())
                self.wfile.flush()

    server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    model.endpoint=f'http://127.0.0.1:{server.server_port}/v1'
    try:
        yield model
    finally:
        server.shutdown();server.server_close();thread.join()


def test_responses_vision_delivers_original_pixels_and_records_only_actual_usage(dataset, responses_model):
    db, _, config=dataset
    run='responses-observation'
    with db.connection() as connection:
        connection.execute("INSERT INTO job_runs(job_id,task_id,job_type,status,payload_json) VALUES(?,?,'ANALYSIS_WORKFLOW','RUNNING','{}')",
            (run,config.task.task_id))
    source=SampleRepository(db).get(config.dataset.id+':dent.png')
    image=EvidenceImages(db.db_path).capture(source,'overview','coverage',full_resolution=True)
    profile=ModelProfile(endpoint=responses_model.endpoint,api='openai-responses',model_id='gpt-6.1-sol',
        capacity_mode='provider_managed',context_tokens=32768,max_output_tokens=4096)
    calls=ModelCalls(db)
    client=VlmClient(profile=profile,api_key='isolated-key')
    try:
        with calls.bind(run,role='vision'):
            plan=client.plan(Observation,'核对本次图像。',[image],client.resolve_model(),system_prompt='保留真实观察。')
            result=client.generate(plan)
        assert result.description=='原始图像可见。'
        assert len(responses_model.requests)==1
        path,body=responses_model.requests[0]
        assert path=='/v1/responses'
        assert body['input'][0]['role']=='system'
        assert body['input'][0]['content']==[{'type':'input_text','text':'保留真实观察。'}]
        assert body['text']['format']['type']=='json_schema'
        assert body['max_output_tokens']==4096
        assert 'messages' not in body and 'stream_options' not in body
        picture=next(part for part in body['input'][1]['content'] if part['type']=='input_image')
        with Image.open(io.BytesIO(base64.b64decode(picture['image_url'].split(',')[1]))) as sent, Image.open(source.image_path) as original:
            assert sent.size==(320,240)
            assert sent.tobytes()==original.tobytes()
        record,=calls.list(run)
        assert record.operation=='generate'
        assert record.finish_reason=='completed'
        assert record.usage['input_tokens']==300 and record.usage['output_tokens']==20
        assert record.response_id=='resp_fixture'
    finally:
        client.close()


def test_responses_schema_repair_retains_system_prompt_and_original_images(dataset,responses_model):
    responses_model.invalid_once=True
    db, _, config=dataset
    image=EvidenceImages(db.db_path).capture(SampleRepository(db).get(config.dataset.id+':dent.png'),
        'overview','coverage',full_resolution=True)
    client=VlmClient(profile=ModelProfile(endpoint=responses_model.endpoint,api='openai-responses',model_id='gpt-6.1-sol',
        capacity_mode='provider_managed',context_tokens=32768,max_output_tokens=4096))
    try:
        result=client.generate(client.plan(Observation,'核对图像。',[image],client.resolve_model(),system_prompt='保留原始规则。'))
        assert result.description=='原始图像可见。'
        assert len(responses_model.requests)==2
        first,second=[body for _,body in responses_model.requests]
        assert second['input'][0]==first['input'][0]
        assert second['input'][1]==first['input'][1]
        assert second['input'][2]=={'role':'assistant','content':'{}'}
        assert second['input'][3]['role']=='user'
    finally:
        client.close()


def test_responses_strict_schema_requires_defaulted_fields(dataset, responses_model):
    db, _, config = dataset
    responses_model.text = '{"description":"原始图像可见。","limitations":[],"overview":null}'
    image = EvidenceImages(db.db_path).capture(SampleRepository(db).get(config.dataset.id + ':dent.png'),
        'overview', 'coverage', full_resolution=True)
    client = VlmClient(profile=ModelProfile(endpoint=responses_model.endpoint, api='openai-responses', model_id='gpt-6.1-sol',
        capacity_mode='provider_managed', context_tokens=32768, max_output_tokens=4096))
    try:
        result = client.generate(client.plan(CompleteObservation, '核对图像。', [image], client.resolve_model()))
        assert result.overview is None and result.limitations == []
        schema = responses_model.requests[0][1]['text']['format']['schema']
        assert set(schema['required']) == {'description', 'limitations', 'overview'}
        assert 'default' not in schema['properties']['overview']
    finally:
        client.close()


def test_responses_provider_error_is_visible_and_recorded(dataset, responses_model):
    responses_model.error = 'Unsupported parameter: min_p'
    db, _, config = dataset
    run = 'responses-provider-error'
    with db.connection() as connection:
        connection.execute("INSERT INTO job_runs(job_id,task_id,job_type,status,payload_json) VALUES(?,?,'ANALYSIS_WORKFLOW','RUNNING','{}')",
            (run, config.task.task_id))
    image = EvidenceImages(db.db_path).capture(SampleRepository(db).get(config.dataset.id + ':dent.png'),
        'overview', 'coverage', full_resolution=True)
    client = VlmClient(profile=ModelProfile(endpoint=responses_model.endpoint, api='openai-responses', model_id='gpt-6.1-sol',
        capacity_mode='provider_managed', context_tokens=32768, max_output_tokens=4096))
    calls = ModelCalls(db)
    try:
        plan = client.plan(Observation, '核对图像。', [image], client.resolve_model())
        with calls.bind(run, role='vision'), pytest.raises(httpx.HTTPStatusError, match='Unsupported parameter: min_p') as caught:
            client.generate(plan)
        assert caught.value.response.status_code == 400
        assert len(responses_model.requests) == 1
        record, = calls.list(run)
        assert record.http_status == 400
        assert responses_model.error in record.error.message
        assert json.loads(calls.get(run, record.call_id).response_body)['error']['message'] == responses_model.error
    finally:
        client.close()


@pytest.mark.parametrize('status',['incomplete','disconnected'])
def test_responses_never_publishes_partial_streams(dataset,responses_model,status):
    responses_model.status=status
    db, _, config=dataset
    image=EvidenceImages(db.db_path).capture(SampleRepository(db).get(config.dataset.id+':dent.png'),
        'overview','coverage',full_resolution=True)
    client=VlmClient(profile=ModelProfile(endpoint=responses_model.endpoint,api='openai-responses',model_id='gpt-6.1-sol',
        capacity_mode='provider_managed',context_tokens=32768,max_output_tokens=4096))
    try:
        plan=client.plan(Observation,'核对图像。',[image],client.resolve_model())
        with pytest.raises(ValueError,match='未完整|未完成|上限'):
            client.generate(plan)
    finally:
        client.close()


@pytest.mark.parametrize('invalid_again', [False,True])
def test_invalid_json_gets_one_model_repair_with_original_inputs_and_stays_strict(dataset,invalid_again):
    from iad_core.workbench.completion import ModelOutputError
    requests=[]
    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':32768})
        body=json.loads(request.content);requests.append(body)
        invalid='{"description":"真实图像观察。","limitations":["原始限制"\n"]}\n</end>'
        text=invalid if len(requests)==1 or invalid_again else '{"description":"真实图像观察。","limitations":[]}'
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':text}}]})
    db,_,config=dataset
    image=EvidenceImages(db.db_path).capture(SampleRepository(db).get(config.dataset.id+':dent.png'),'overview','coverage',full_resolution=True)
    client=VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        plan=client.plan(CompleteObservation,'原始用户提示词。',[image],client.resolve_model(),system_prompt='原始系统提示词。')
        if invalid_again:
            with pytest.raises(ModelOutputError,match='json_invalid'):client.generate(plan)
        else:
            assert client.generate(plan).description=='真实图像观察。'
        assert len(requests)==2
        assert requests[1]['messages'][:2]==requests[0]['messages']
        assert requests[1]['messages'][2]['role']=='assistant'
        assert requests[1]['messages'][2]['content'].endswith('</end>')
        assert 'json_invalid' in requests[1]['messages'][3]['content']
    finally:
        client.close()
