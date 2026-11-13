import json
import re

import httpx
import pytest

from iad_core.consistency.agent_review import ConsistencyAgentReview
from iad_core.workbench.vision import VlmClient
from tests.test_consistency_identity import similar_job
from tests.test_consistency_program_workflow import pair_job


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_each_required_region_retains_both_observations_without_repeating_the_explanation(similar_job):
    runtime, _, run_id, anchor = similar_job
    contexts = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        body = json.loads(request.content)
        content = next(message['content'] for message in body['messages']
            if message['role'] == 'user' and isinstance(message['content'], list))
        context = json.loads(content[1]['text'])
        assert not re.search(r'(?:img_|rp_|ann_)[0-9a-f]{32,}', json.dumps(body['messages'])), \
            'Program-bound evidence must use short references throughout the actual model request'
        contexts.append(context)
        finding = {'main_description': '右下角纹理和细线清晰。', 'candidate_description': '相同细线随整体平移。',
            'relation': 'transformed_same_content'}
        answer = {'overview': finding, 'summary': '两图纹理和细线相同，只有整体平移。',
            'regions': {region['ref']: finding for region in context['windows']}, 'limitations': []}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        state = ConsistencyAgentReview(runtime, client).verify(run_id, anchor)
        assert state.completed
        gates = [gate for gate in state.gates if gate.source == 'vision']
        assert gates and len(contexts) == len(gates)
        for gate in gates:
            assert gate.reason == '两图纹理和细线相同，只有整体平移。'
            assert gate.region_checks
            assert set(gate.required_region_pair_ids) == {check.region_pair_id for check in gate.region_checks}
            assert all(check.main_description and check.candidate_description and check.reason is None
                for check in gate.region_checks)
    finally:
        client.close()


@pytest.mark.parametrize(('field', 'directional_text'), [
    ('summary', '主图右下角多出一条短划痕，两图内容不同。'),
    ('summary', '候选图右下角没有短划痕，两图内容不同。'),
    ('summary', '左图右下角多出一条短划痕，两图内容不同。'),
    ('summary', '右图右下角没有短划痕，两图内容不同。'),
    ('limitations', ['主图局部太小，看不清纹理。']),
    ('limitations', ['候选图局部太小，看不清纹理。']),
])
def test_shared_comparison_corrects_directional_text_before_publishing_either_side(pair_job, field, directional_text):
    from iad_core.consistency.identity import CandidateIdentity
    from iad_core.consistency.pair_reviews import ConsistencyPairReviews

    runtime, _, run_id = pair_job
    requests = []
    summary = '两图右下角的短划痕有无不同，实际内容不同。'

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        body = json.loads(request.content)
        content = next(message['content'] for message in body['messages']
            if message['role'] == 'user' and isinstance(message['content'], list))
        context = json.loads(content[1]['text'])
        requests.append(body)
        finding = {'main_description': '右下角有一条短划痕。',
            'candidate_description': '右下角没有对应短划痕。', 'relation': 'content_different'}
        regions = {region['ref']: (finding if region['mapping'] == 'registered' else
            {'observation': '局部可见蓝色边缘，没有可靠配对的另一侧局部。'})
            for region in [*context['windows'], *context['unmapped_regions']]}
        answer = {'overview': finding, 'summary': summary, 'regions': regions, 'limitations': []}
        if len(requests) == 1:
            answer[field] = directional_text
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        reviews = ConsistencyPairReviews(runtime, client)
        task = next(task for task in reviews.plan(run_id) if len(task.links) == 2)
        reviews.review(run_id, task.pair_key)
        assert len(requests) == 2, 'Directional shared prose must be corrected before either side receives it'
        gates = [next(gate for gate in CandidateIdentity(runtime).read(run_id, link.anchor_id).gates
            if gate.candidate_id == link.candidate_id) for link in task.links]
        assert all(gate.reason == summary for gate in gates)
        assert gates[0].observation_call_ids == gates[1].observation_call_ids
        assert len(gates[0].observation_call_ids) == 1
    finally:
        client.close()
