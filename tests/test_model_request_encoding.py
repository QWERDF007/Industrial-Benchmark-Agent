import base64
import json
from pathlib import Path

import httpx
import pytest
from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.evidence.images import EvidenceImages
from iad_core.storage.repositories import SampleRepository
from iad_core.workbench.model_profile import ModelProfile
from iad_core.workbench.vision import VlmClient


class Observation(AnalysisModel):
    description: str = Field(description='中文观察 🔍')


@pytest.mark.parametrize('api', ['openai-responses', 'openai-completions'])
def test_model_requests_escape_unicode_without_changing_text_or_images(dataset, api):
    db, _, config = dataset
    image = EvidenceImages(db.db_path).capture(SampleRepository(db).get(config.dataset.id + ':dent.png'),
        'overview', 'global', full_resolution=True)
    image_url = 'data:image/png;base64,' + base64.b64encode(Path(image.path).read_bytes()).decode('ascii')
    instruction = '中文核对 🔍\n保留引号"和反斜杠\\'
    context = {'图像路径': '/data/中文/🔍.png'}

    def respond(request):
        assert request.content.isascii(), '模型请求正文中的非 ASCII 字符必须转义'
        assert b'\\u4e2d\\u6587' in request.content
        assert b'\\ud83d\\udd0d' in request.content
        assert request.headers['Content-Type'] == 'application/json'
        assert int(request.headers['Content-Length']) == len(request.content)
        assert request.headers['Authorization'] == 'Bearer test-key'
        if request.url.path == '/tokenize':
            assert json.loads(request.content)['messages'][-1]['content']
            return httpx.Response(200, json={'count': 100, 'max_model_len': 8192})
        assert request.headers['Accept'] == 'text/event-stream'
        assert request.headers['Accept-Encoding'] == 'identity'
        body = json.loads(request.content)
        assert body == plan.body
        if api == 'openai-completions':
            assert any(part.get('image_url') == {'url': image_url}
                for message in body['messages'] for part in message['content'])
            return httpx.Response(200, json={'choices': [{'finish_reason': 'stop',
                'message': {'content': '{"description":"核对完成 🔍"}'}}]})
        assert any(part.get('image_url') == image_url for message in body['input'] for part in message['content'])
        return httpx.Response(200, json={'status': 'completed', 'output': [{'type': 'message',
            'content': [{'type': 'output_text', 'text': '{"description":"核对完成 🔍"}'}]}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)), profile=ModelProfile(
        endpoint='http://provider/v1', api=api, model_id='vision',
        capacity_mode='provider_managed' if api == 'openai-responses' else 'vllm_tokenize'),
        api_key='test-key')
    try:
        plan = client.plan(Observation, instruction, [image], 'vision', context=context)
        assert client.generate(plan).description == '核对完成 🔍'
    finally:
        client.close()


@pytest.mark.parametrize('limit, allowed', [(16, False), (17, True), (18, True)])
def test_request_limit_counts_the_transmitted_unicode_escape_bytes(limit, allowed):
    # {"text":"\u4e2d"} 的传输正文为 17 字节。
    client = VlmClient(profile=ModelProfile(endpoint='http://provider/v1', max_request_bytes=limit))
    try:
        assert client.within_limits({'text': '中'}, []) is allowed
    finally:
        client.close()
