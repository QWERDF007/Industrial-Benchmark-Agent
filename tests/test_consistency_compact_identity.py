import json
import re

import httpx
import pytest

from iad_core.consistency.agent_review import ConsistencyAgentReview
from iad_core.workbench.vision import VlmClient
from iad_core.workbench.model_profile import ModelProfile
from tests.test_consistency_identity import similar_job, identity_response
from tests.test_consistency_program_workflow import pair_job


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_same_content_requires_visible_features_for_every_region(similar_job):
    runtime, _, run_id, anchor = similar_job
    sent = []
    observation = '两侧局部的亮暗纹理块和相邻细线形状、位置一一对应。'

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        content = next(message['content'] for message in json.loads(request.content)['messages']
            if message['role'] == 'user' and isinstance(message['content'], list))
        context = json.loads(content[1]['text'])
        sent.append(context)
        answer = identity_response(context, 'transformed_same_content', '两图局部纹理和细线对应一致。')
        answer['details'] = ([{'refs': [window['ref'] for window in context['windows']],
            'observation': observation}] if len(sent) > 1 else [])
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop',
            'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        state = ConsistencyAgentReview(runtime, client).verify(run_id, anchor)
        assert state.completed
        gates = [gate for gate in state.gates if gate.source == 'vision']
        assert len(sent) == len(gates) + 1, '没有局部观察事实的相同判断必须先纠正'
        assert all(check.observation == observation for gate in gates for check in gate.region_checks)
    finally:
        client.close()


@pytest.mark.parametrize('similar_job', ['original_resolution'], indirect=True)
def test_identity_visual_batches_limit_pairs_and_images_without_dropping_evidence(pair_job):
    from iad_core.consistency.pair_reviews import ConsistencyPairReviews

    runtime, _, run_id = pair_job
    delivered = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        content = json.loads(request.content)['messages'][-1]['content']
        context = json.loads(content[1]['text'])
        pairs = context['pairs'] if context['scope'] == 'pairs' else {'p0': context}
        assert len(pairs) <= 4, '身份核对每次最多四对，不能用大批次替代实际局部观察'
        assert len(pairs) == 1 or sum(part['type'] == 'image_url' for part in content) <= 24
        delivered.extend(pairs.values())
        answers = {key: identity_response(pair, 'unverified', '当前局部无法可靠对应。')
            for key, pair in pairs.items()}
        answer = answers if context['scope'] == 'pairs' else answers['p0']
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop',
            'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        reviews = ConsistencyPairReviews(runtime, client)
        tasks = reviews.plan(run_id)
        assert len(tasks) > 4
        receipts = reviews.review_many(run_id, [task.pair_key for task in tasks])
        assert len(receipts) == len(delivered) == len(tasks)
        assert all(receipt.observation_call_ids for receipt in receipts)
        from pathlib import Path
        from scripts.compare_consistency_inputs import compare_inputs
        proof = compare_inputs(Path(runtime.db.db_path), {'run_id': run_id, 'pairs': []}, run_id)
        assert proof['visual_pairs_with_actual_original_and_all_roi_delivery'] == len(tasks)
    finally:
        client.close()


@pytest.mark.parametrize('similar_job', ['registered', 'registered_mixed', 'original_resolution'], indirect=True)
@pytest.mark.parametrize('protocol', ['openai-completions', 'openai-responses'])
def test_pair_batch_declares_each_region_contract_once(pair_job, record_property, protocol):
    from iad_core.consistency.pair_reviews import ConsistencyPairReviews

    runtime, _, run_id = pair_job
    requests = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        body = json.loads(request.content)
        messages = body['input'] if protocol == 'openai-responses' else body['messages']
        context = json.loads(messages[-1]['content'][1]['text'])
        assert context['scope'] == 'pairs'
        schema = (body['text']['format']['schema'] if protocol == 'openai-responses'
            else body['response_format']['json_schema']['schema'])
        layouts = {
            (tuple(view['ref'] for view in pair['windows']),
             tuple(view['ref'] for view in pair['unmapped_regions']))
            for pair in context['pairs'].values()
        }
        definitions = [value for value in schema['$defs'].values() if value.get('title') == 'IdentityDecision']
        record_property('schema_bytes', len(json.dumps(schema, ensure_ascii=False).encode()))
        record_property('pairs', len(context['pairs']))
        record_property('distinct_region_layouts', len(layouts))
        record_property('region_layouts', json.dumps(sorted(layouts)))
        assert len(definitions) == len(layouts), 'Identical region layouts must share the output contract'
        assert set(schema['properties']) == set(schema['required']) == set(context['pairs'])
        requests.append(body)
        answers = {key: identity_response(pair, 'unverified', '两图局部无法可靠对应。')
            for key, pair in context['pairs'].items()}
        if protocol == 'openai-responses':
            return httpx.Response(200, json={'status':'completed','output':[{'type':'message','role':'assistant',
                'content':[{'type':'output_text','text':json.dumps(answers),'annotations':[]}]}]})
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop',
            'message': {'content': json.dumps(answers)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)), profile=ModelProfile(
        endpoint='http://model.invalid/v1', api=protocol, model_id='vision',
        capacity_mode='provider_managed' if protocol == 'openai-responses' else 'vllm_tokenize',
        context_tokens=32768))
    try:
        reviews = ConsistencyPairReviews(runtime, client)
        tasks = reviews.plan(run_id)
        receipts = reviews.review_many(run_id, [task.pair_key for task in tasks])
        delivered_pairs = [json.loads((body['input'] if protocol == 'openai-responses' else body['messages'])[-1]
            ['content'][1]['text'])['pairs'] for body in requests]
        assert sum(map(len, delivered_pairs)) == len(receipts) == len(tasks)
        assert all(len(pairs) <= 4 for pairs in delivered_pairs)
    finally:
        client.close()


@pytest.mark.parametrize('similar_job', ['original_resolution'], indirect=True)
def test_unmapped_regions_keep_every_observation_and_require_empty_registered_details(similar_job):
    runtime, _, run_id, anchor = similar_job
    observed = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        body = json.loads(request.content)
        content = next(message['content'] for message in body['messages']
            if message['role'] == 'user' and isinstance(message['content'], list))
        context = json.loads(content[1]['text'])
        assert not context['windows']
        schema = body['response_format']['json_schema']['schema']
        assert schema['properties']['details']['maxItems'] == 0
        observed.append(context)
        answer = identity_response(context, 'unverified', '两图没有可靠对应位置，局部内容无法确认。')
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop',
            'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        state = ConsistencyAgentReview(runtime, client).verify(run_id, anchor)
        assert state.completed and observed
        for gate in state.gates:
            if gate.source == 'vision':
                assert not gate.region_checks
                assert {check.region_pair_id for check in gate.unmapped_region_checks} == set(gate.required_region_pair_ids)
                assert all(check.observation for check in gate.unmapped_region_checks)
    finally:
        client.close()


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
@pytest.mark.parametrize('overlap', [False, True])
def test_repeated_difference_fact_is_shared_without_dropping_any_region_judgment(similar_job, overlap):
    runtime, _, run_id, anchor = similar_job

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        content = next(message['content'] for message in json.loads(request.content)['messages']
            if message['role'] == 'user' and isinstance(message['content'], list))
        context = json.loads(content[1]['text'])
        answer = identity_response(context, 'content_different', '两图中央纹理的明暗分布不同。')
        answer['details'] = [{'refs': [window['ref'] for window in context['windows']],
            'observation': '中央纹理一侧为亮块，另一侧为暗块。'}]
        if overlap:
            answer['details'].append({'refs': [window['ref'] for window in context['windows']],
                'observation': '纹理右侧另多出一个黑点。'})
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        state = ConsistencyAgentReview(runtime, client).verify(run_id, anchor)
        assert state.completed
        for gate in state.gates:
            if gate.source == 'vision':
                assert gate.relation == 'content_different'
                assert len(gate.region_checks) == len(gate.required_region_pair_ids)
                observation = '中央纹理一侧为亮块，另一侧为暗块。' + ('；纹理右侧另多出一个黑点。' if overlap else '')
                assert all(check.visual_relation == 'different' and check.observation == observation
                    for check in gate.region_checks)
    finally:
        client.close()


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_compact_identity_records_every_region_and_shares_visible_features(similar_job):
    runtime, _, run_id, anchor = similar_job
    contexts = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        body = json.loads(request.content)
        assert 'summary_refs' not in body['response_format']['json_schema']['schema']['properties']
        content = next(message['content'] for message in body['messages']
            if message['role'] == 'user' and isinstance(message['content'], list))
        context = json.loads(content[1]['text'])
        contexts.append(context)
        answer = {'overview': 'same', 'summary': '两图纹理相同，所有标注区域均已核对。',
            'regions': 'S' * len(context['windows']), 'unmapped_regions': {},
            'details': [{'refs': [window['ref'] for window in context['windows']],
                'observation': '两侧纹理块和相邻细线的形状、位置一一对应。'}], 'limitations': []}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        state = ConsistencyAgentReview(runtime, client).verify(run_id, anchor)
        assert state.completed and state.eligible_ids
        assert contexts and all(context['windows'] for context in contexts)
        for gate in state.gates:
            if gate.source == 'vision':
                assert len(gate.region_checks) == len(gate.required_region_pair_ids)
                assert all(check.visual_relation == 'same' and
                    check.observation == '两侧纹理块和相邻细线的形状、位置一一对应。' for check in gate.region_checks)
                assert gate.reason == '两图纹理相同，所有标注区域均已核对。'
    finally:
        client.close()


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_each_required_region_retains_its_judgment_without_repeating_the_explanation(similar_job):
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
        answer = identity_response(context, 'transformed_same_content', '两图纹理和细线相同，只有整体平移。')
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
            assert all(check.visual_relation == 'same' and
                check.observation == '两侧纹理块和相邻细线的形状、位置一一对应。'
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
        answer = identity_response(context, 'content_different', summary)
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
