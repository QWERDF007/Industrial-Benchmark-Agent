import json

import httpx
import pytest

from iad_core.consistency.agent_review import ConsistencyAgentReview
from iad_core.consistency.identity import CandidateIdentity
from iad_core.consistency.pair_reviews import ConsistencyPairReviews
from iad_core.consistency.workflow import ConsistencyWorkflow
from iad_core.workbench.vision import VlmClient
from tests.test_consistency_identity import identity_response, similar_job
from tests.test_consistency_program_workflow import pair_job


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
@pytest.mark.parametrize('resolution', ['content_different', 'transformed_same_content'])
@pytest.mark.parametrize('located', [True, False])
def test_shared_recheck_addresses_reverse_observation_and_finishes_both_anchors(pair_job, resolution, located):
    runtime, checks, run_id = pair_job
    requests = []
    disputed = False
    locations = []
    reason = '右侧中部一侧有孤立黑点，另一侧对应位置没有。'

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        body = json.loads(request.content)
        assert 'prefixItems' not in json.dumps(body['response_format']['json_schema']['schema'])
        context = json.loads(body['messages'][-1]['content'][1]['text'])
        if context.get('scope') == 'dispute_locations':
            locations.append(context)
            answer = {item['ref']: {'windows': [{'sample_id': item['source_side'],
                'bbox': [220, 80, 244, 104], 'reason': reason}], 'limitation': ''}
                for item in context['disputes']}
        elif 'facts' in context:
            answer = {'reviews': {identity: {
                'verdict': 'GATE_DISPUTE' if disputed else 'EQUIVALENT',
                'explanation': reason if disputed else '两侧标注一致。',
                'issues': [], 'limitations': [], 'disputed_regions': [],
                **({'disputed_windows': [{'sample_id': 'main', 'bbox': [220, 80, 244, 104], 'reason': reason}]}
                    if disputed and located else {}),
            } for identity, candidate in context['facts']['candidates'].items()}}
        else:
            requests.append(context)
            relation = resolution if context.get('disputes') else 'transformed_same_content'
            answer = identity_response(context, relation, '两图实际内容不同。' if relation == 'content_different' else '两图细节相同。')
            if context.get('disputes'):
                answer['disputes'] = [{'ref': item['ref'], 'visual_relation':
                    'different' if relation == 'content_different' else 'same',
                    'observation': '一侧黑点在另一侧确实消失。' if relation == 'content_different' else '对应位置均有相同黑点。'}
                    for item in context['disputes']]
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        pairs = ConsistencyPairReviews(runtime, client)
        tasks = pairs.plan(run_id)
        task = next(task for task in tasks if len(task.links) == 2)
        for item in tasks:
            pairs.review(run_id, item.pair_key)
        owner, reverse = task.links
        gate = next(gate for gate in CandidateIdentity(runtime).read(run_id, reverse.anchor_id).gates
            if gate.candidate_id == reverse.candidate_id)
        before = len(requests)
        disputed = True
        observed = ConsistencyAgentReview(runtime, client).observe(run_id, reverse.anchor_id, {
            'request_id': 'content-dispute', 'fingerprint': gate.fingerprint,
            'candidate_ids': [reverse.candidate_id], 'question': '核对标注和原图。'})
        disputed = False
        pending = pairs.plan(run_id)
        assert len(pending) == 1
        pairs.review(run_id, pending[0].pair_key)
        assert len(requests) == before + 1
        dispute = requests[-1]['disputes'][0]
        assert dispute['reason'] == reason
        assert dispute['source_side'] == 'candidate'
        assert dispute['windows'][0]['sample_id'] == 'candidate'
        assert len(dispute['media_ids']) == 4
        assert len(locations) == (0 if located else 1)
        for link in task.links:
            gate = next(gate for gate in CandidateIdentity(runtime).read(run_id, link.anchor_id).gates
                if gate.candidate_id == link.candidate_id)
            assert gate.relation == resolution
            assert gate.dispute_checks[0].observation_id == observed.observation_id
            assert gate.dispute_checks[0].observation
            workflow = ConsistencyWorkflow(runtime, client)
            assert workflow.audit(run_id, link.anchor_id)['ready']
            workflow.finish(run_id, link.anchor_id)
            assert checks.anchor(run_id, link.anchor_id).state == 'COMPLETED'
        assert pairs.plan(run_id) == []
    finally:
        client.close()


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_a_targeted_identity_result_still_allows_new_observed_content_disputes(similar_job):
    runtime, _, run_id, anchor = similar_job

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        context = json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])
        if 'facts' in context:
            answer = {'reviews': {identity: {'verdict': 'GATE_DISPUTE', 'explanation': '右侧黑点存在内容疑点。',
                'issues': [], 'disputed_regions': [], 'disputed_windows': [
                    {'sample_id': 'main', 'bbox': [220, 80, 244, 104], 'reason': '核对黑点。'}]}
                for identity in context['facts']['candidates']}}
        else:
            answer = identity_response(context, 'transformed_same_content', '实际对应细节相同。')
            if context.get('disputes'):
                answer['disputes'] = [{'ref': item['ref'], 'visual_relation': 'same',
                    'observation': '对应位置实际均有同一黑点。'} for item in context['disputes']]
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        review = ConsistencyAgentReview(runtime, client)
        state = review.verify(run_id, anchor)
        candidate = next(gate.candidate_id for gate in state.gates if gate.source == 'vision')
        for request_id in ('first-dispute', 'new-dispute'):
            review.observe(run_id, anchor, {'request_id': request_id, 'fingerprint': state.fingerprint,
                'candidate_ids': [candidate], 'question': '核对原图实际内容。'})
            gate = next(gate for gate in CandidateIdentity(runtime).read(run_id, anchor).gates if gate.candidate_id == candidate)
            assert gate.execution_status == 'pending'
            state = review.verify(run_id, anchor)
            gate = next(gate for gate in state.gates if gate.candidate_id == candidate)
            assert len(gate.dispute_checks) == (1 if request_id == 'first-dispute' else 2)
    finally:
        client.close()
