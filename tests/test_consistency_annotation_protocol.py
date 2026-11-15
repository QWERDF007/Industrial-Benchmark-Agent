import json

import httpx
import pytest

from iad_core.consistency.agent_review import ConsistencyAgentReview
from iad_core.consistency.identity import CandidateIdentity
from iad_core.workbench.vision import VlmClient
from tests.test_consistency_identity import identity_response, similar_job
from tests.test_consistency_program_workflow import pair_job


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
@pytest.mark.parametrize('scope', ['overview', 'region'])
def test_annotation_disputes_retain_original_image_differences_and_only_reference_real_regions(pair_job, scope):
    runtime, checks, run_id = pair_job
    anchor = next(item.anchor_id for item in checks.anchors(run_id) if item.anchor_id.endswith(':scratch.png'))
    audit_calls = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        body = json.loads(request.content)
        parts = next(message['content'] for message in body['messages'] if message['role'] == 'user')
        context = json.loads(parts[1]['text'])
        if 'facts' not in context:
            answer = identity_response(context, 'transformed_same_content', '两图实际纹理相同。')
        else:
            audit_calls.append(context)
            schema = body['response_format']['json_schema']['schema']
            reviews = schema['$defs'][schema['properties']['reviews']['$ref'].rsplit('/', 1)[1]]
            decisions = {}
            for candidate, facts in context['facts']['candidates'].items():
                decision = schema['$defs'][reviews['properties'][candidate]['$ref'].rsplit('/', 1)[1]]
                pixel_identical = facts['identity']['relation'] == 'pixel_identical'
                assert ('GATE_DISPUTE' in decision['properties']['verdict']['enum']) != pixel_identical
                regions = facts['gate']['verified_region_pair_ids']
                contract = decision['properties']['disputed_regions']
                assert contract['maxItems'] == len(regions)
                if regions:
                    choices = contract['items'].get('enum', [contract['items'].get('const')])
                    assert set(choices) == set(regions)
                decisions[candidate] = {'verdict': 'EQUIVALENT' if pixel_identical else 'GATE_DISPUTE',
                    'explanation': '两侧标注覆盖相同。' if pixel_identical else '两图左下角弧形边缘内侧的浅蓝色块有无不同。',
                    'issues': [], 'limitations': [],
                    'disputed_regions': regions[:1] if scope == 'region' and not pixel_identical else []}
            answer = {'reviews': decisions}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop',
            'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        review = ConsistencyAgentReview(runtime, client)
        state = review.verify(run_id, anchor)
        observed = review.observe(run_id, anchor, {'request_id': 'annotation-content-dispute',
            'fingerprint': state.fingerprint, 'candidate_ids': state.eligible_ids,
            'question': '核对两图原始标注，同时保留具体图像差别。'})
        disputes = [item.gate_dispute for item in observed.result.observations if item.gate_dispute]
        assert len(audit_calls) == 1 and len(disputes) == 1
        assert bool(disputes[0].region_pair_ids) == (scope == 'region')
        assert disputes[0].reason == '两图左下角弧形边缘内侧的浅蓝色块有无不同。'
        assert not CandidateIdentity(runtime).read(run_id, anchor).completed
    finally:
        client.close()
