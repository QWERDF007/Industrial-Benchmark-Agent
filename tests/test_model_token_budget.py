import json

import httpx
import pytest

from iad_core.workbench.model_profile import ModelProfile
from iad_core.workbench.vision import VlmClient


@pytest.mark.parametrize('count,server_context,expected', [
    (42370, 262144, False), (30981, 262144, False), (28672, 262144, True), (20000, 24000, False)])
def test_actual_token_budget_obeys_both_frozen_and_provider_context(count, server_context, expected):
    body = {'model': 'planner', 'messages': [{'role': 'user', 'content': '核对冻结证据'}],
        'tools': [{'type': 'function', 'function': {'name': 'anchor_assess', 'parameters': {'type': 'object'}}}],
        'tool_choice': 'auto', 'parallel_tool_calls': False, 'chat_template_kwargs': {'enable_thinking': False},
        'max_tokens': 4096, 'stream': True}

    def respond(request):
        assert str(request.url) == 'http://provider/tokenize'
        assert request.headers['Authorization'] == 'Bearer isolated-test-key'
        assert json.loads(request.content) == {key: value for key, value in body.items()
            if key not in ('stream', 'max_tokens')}
        return httpx.Response(200, json={'count': count, 'max_model_len': server_context})

    transport = httpx.Client(transport=httpx.MockTransport(respond))
    client = VlmClient(transport, profile=ModelProfile(endpoint='http://provider/v1',
        model_id='planner', context_tokens=32768, max_output_tokens=4096), api_key='isolated-test-key')
    try:
        budget = client.token_budget(body, 4096, 'ConsistencyAgent')
        assert budget.fits is expected
        assert budget.input_tokens == count
        assert budget.context_tokens == min(server_context, 32768)
        assert budget.output_reserve == 4096
    finally:
        client.close()


@pytest.mark.parametrize('field', ['max_tokens', 'max_completion_tokens'])
@pytest.mark.parametrize('count,expected', [(1000, True), (40000, False)])
def test_agent_without_a_configured_output_limit_checks_the_actual_native_request(field, count, expected):
    body = {'model': 'planner', 'messages': [{'role': 'user', 'content': '审核原始图像'}], field: 32768}
    with httpx.Client(transport=httpx.MockTransport(lambda request: httpx.Response(200,
            json={'count': count, 'max_model_len': 65536}))) as http:
        client = VlmClient(http, profile=ModelProfile(endpoint='http://provider/v1', model_id='planner',
            context_tokens=65536, max_output_tokens=None))
        budget = client.token_budget(body, None, 'NativeAgent')
        assert budget.output_reserve == 32768
        assert budget.fits is expected


@pytest.mark.parametrize('count,reserve,fits', [(1000, 64536, True), (65536, 1, False)])
def test_agent_without_a_wire_output_limit_checks_remaining_context(count, reserve, fits):
    body = {'model': 'planner', 'messages': [{'role': 'user', 'content': '审核原始图像'}]}
    with httpx.Client(transport=httpx.MockTransport(lambda request: httpx.Response(200,
            json={'count': count, 'max_model_len': 65536}))) as http:
        client = VlmClient(http, profile=ModelProfile(endpoint='http://provider/v1', model_id='planner',
            context_tokens=65536, max_output_tokens=None))
        budget = client.token_budget(body, None, 'NativeAgent')
        assert budget.output_reserve == reserve
        assert budget.fits is fits
