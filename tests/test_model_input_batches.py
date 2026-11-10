import base64
import io
import json

import httpx
import pytest
from PIL import Image

from iad_core.workbench.vision import VlmClient
from iad_core.entry import dataset_import, dataset_preview
from iad_core.storage.database import Database
from iad_core.exploration.models import DirectionDraft


@pytest.mark.parametrize('explicit_schema',[False,True])
def test_model_transport_preserves_the_complete_editable_prompt(explicit_schema):
    prompt='只比较轮廓，保留证据不足；这是用户编辑的完整提示词。'
    if explicit_schema:
        prompt+='\n{{response_schema}}\n'
    transport=httpx.MockTransport(lambda request:httpx.Response(200,json={'count':100,'max_model_len':65536}))
    with httpx.Client(transport=transport) as http:
        client=VlmClient(http_client=http)
        plan=client.plan(DirectionDraft,prompt,[],'fixture-model')
    expected=prompt.replace('{{response_schema}}',json.dumps(DirectionDraft.model_json_schema(),ensure_ascii=False)) if explicit_schema else prompt
    assert plan.body['messages'][0]['content']==[{'type':'text','text':expected}]
    assert plan.body['response_format']['json_schema']['name']=='DirectionDraft'


@pytest.mark.parametrize('corrected', [True, False])
def test_model_rechecks_out_of_range_coordinates_without_rescaling_or_clipping(corrected):
    from iad_core.advisory.analysis import RegionProposal

    calls = []
    invalid = [8564, 8979, 9068, 9068]
    revised = [120, 210, 360, 480]

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 100, 'max_model_len': 65536})
        body = json.loads(request.content); calls.append(body)
        box = revised if corrected and len(calls) == 2 else invalid
        result = dict(bbox_1000=box, reason='观察到局部外观差异', check_ids=[])
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    with httpx.Client(transport=httpx.MockTransport(respond)) as http:
        client = VlmClient(http_client=http)
        plan = client.plan(RegionProposal, '结合实际图像返回疑点；格式错误时按反馈重新检查。\n{{response_schema}}', [], 'fixture-model')
        if corrected:
            assert client.generate(plan).bbox_1000 == revised
        else:
            with pytest.raises(ValueError, match='less_than_equal'):
                client.generate(plan)
    assert len(calls) == 2, '只允许模型自行纠正一次，不由程序改写坐标'
    feedback = json.loads(calls[1]['messages'][-1]['content'].split('输出校验结果：', 1)[1])
    assert json.loads(calls[1]['messages'][1]['content'])['bbox_1000'] == invalid
    assert all(issue['type'] == 'less_than_equal' for issue in feedback['schema_validation_errors'])


@pytest.mark.parametrize('corrected',[True,False])
@pytest.mark.parametrize('initial_shape',['extra','other_object','empty','scalar'])
@pytest.mark.parametrize('system_prompt',[None,'按给定结构提交观察。'])
def test_model_repairs_structural_errors_once(corrected,initial_shape,system_prompt):
    calls=[]
    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':100,'max_model_len':65536})
        body=json.loads(request.content);calls.append(body)
        result=dict(summary='边缘结构可见',directions=[],limitations=[])
        if len(calls)==1 or not corrected:
            if initial_shape=='extra':result['checks']=[]
            elif initial_shape=='other_object':result={'checks':[]}
            elif initial_shape=='empty':result={}
            else:result='本次未返回结构化结果'
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(result)}}]})
    with httpx.Client(transport=httpx.MockTransport(respond)) as http:
        client=VlmClient(http_client=http)
        plan=client.plan(DirectionDraft,'按完整格式返回方向；校验失败时根据反馈自行修正。\n{{response_schema}}',[],
            'fixture-model',system_prompt=system_prompt)
        if corrected:
            assert client.generate(plan).summary=='边缘结构可见'
        else:
            with pytest.raises(ValueError,match='extra_forbidden|missing|model_type'):client.generate(plan)
    assert len(calls)==2
    for body in calls:
        systems=[message for message in body['messages'] if message['role']=='system']
        assert systems == ([{'role':'system','content':[{'type':'text','text':system_prompt}]}] if system_prompt else [])
        assert next(message for message in body['messages'] if message['role']=='user') == next(
            message for message in calls[0]['messages'] if message['role']=='user')
    assert '输出校验结果：' in calls[1]['messages'][-1]['content']










@pytest.mark.parametrize('valid',[True,False])
def test_json_object_mode_preserves_visible_schema_and_validates_the_result(valid):
    from iad_core.workbench.model_profile import ModelProfile
    from iad_core.workbench.completion import ModelOutputError
    prompt='用户完整提示词：输出本批真实观察。\n{{response_schema}}\n'
    def respond(request):
        body=json.loads(request.content)
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':100,'max_model_len':65536})
        assert body['response_format']=={'type':'json_object'}
        assert json.dumps(DirectionDraft.model_json_schema(),ensure_ascii=False) in body['messages'][0]['content'][0]['text']
        value=dict(summary='仅记录实际观察',directions=[],limitations=[]) if valid else {'summary':'缺少必填字段'}
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(value)}}]})
    profile=ModelProfile(endpoint='http://model/v1',model_id='fixture-model',capacity_mode='vllm_tokenize',
        request_parameters={'response_format':{'type':'json_object'}})
    with httpx.Client(transport=httpx.MockTransport(respond)) as http:
        client=VlmClient(http_client=http,profile=profile)
        plan=client.plan(DirectionDraft,prompt,[],'fixture-model')
        if valid:assert client.generate(plan).summary=='仅记录实际观察'
        else:
            with pytest.raises(ModelOutputError,match='missing'):client.generate(plan)


@pytest.mark.parametrize('explicit_schema', [False, True])
def test_json_object_mode_delivers_the_output_contract_outside_editable_prompts(explicit_schema):
    from iad_core.consistency.agent_review_models import AnchorVisualResult
    from iad_core.workbench.model_profile import ModelProfile

    system = '你是标注一致性审核员，只依据实际图像和原始标注判断。'
    instruction = '比较主图与候选的标注。'
    if explicit_schema:
        instruction += '\n{{response_schema}}'
    captured = []
    schema = json.dumps(AnchorVisualResult.model_json_schema(), ensure_ascii=False)

    def respond(request):
        body = json.loads(request.content)
        captured.append(body)
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 100, 'max_model_len': 65536})
        user = next(message for message in body['messages'] if message['role'] == 'user')
        assert user['content'][0]['text'] == instruction.replace('{{response_schema}}', schema)
        assert sum(schema in part.get('text', '') for part in user['content']) == 1
        if len(captured) == 2:
            return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': '{}'}}]})
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps({
            'observations': [{'candidate_id': 'candidate', 'description': '两侧标注不同',
                'media_ids': ['anchor-original', 'candidate-original'], 'limitations': []}]})}}]})

    profile = ModelProfile(endpoint='http://model/v1', capacity_mode='vllm_tokenize',
        request_parameters={'response_format': {'type': 'json_object'}})
    with httpx.Client(transport=httpx.MockTransport(respond)) as http:
        client = VlmClient(http_client=http, profile=profile)
        plan = client.plan(AnchorVisualResult, instruction, [], 'fixture-model', system_prompt=system)
        assert client.generate(plan).observations[0].media_ids == ['anchor-original', 'candidate-original']
    assert captured[0]['messages'] == captured[1]['messages'], '容量检查须包含实际发送的输出合同'
    assert len(captured) == 4
    assert captured[2]['messages'] == captured[3]['messages']
    assert captured[0]['messages'][1] == captured[2]['messages'][1], '修正重试不重复添加输出合同'
    assert captured[1]['messages'][0] == {'role': 'system', 'content': [{'type': 'text', 'text': system}]}


def test_correction_counts_the_complete_conversation_before_generating():
    from iad_core.workbench.model_profile import ModelProfile
    from iad_core.workbench.vision import ModelCapacityError
    generated, tokenized = [], []

    def respond(request):
        body=json.loads(request.content)
        if request.url.path.endswith('/tokenize'):
            tokenized.append(body)
            return httpx.Response(200,json={'count':100 if len(body['messages'])==1 else 120,'max_model_len':128})
        generated.append(body)
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':'{}'}}]})

    profile=ModelProfile(endpoint='http://model.test/v1',capacity_mode='vllm_tokenize',context_tokens=128)
    with httpx.Client(transport=httpx.MockTransport(respond)) as http:
        client=VlmClient(http_client=http,profile=profile)
        plan=client.plan(DirectionDraft,'完整可编辑提示词。\n{{response_schema}}',[],'fixture-model',output_reserve=16)
        with pytest.raises(ModelCapacityError,match='输入 120 token'):
            client.generate(plan)
    assert len(generated)==1,'纠正对话超出容量时不能发送第二次生成'
    assert [m['role'] for m in tokenized[1]['messages']]==['user','assistant','user']
    assert tokenized[1]['messages'][0]==generated[0]['messages'][0]
