import json

import httpx
import pytest
from uuid import uuid4

from iad_core.consistency.agent_review import ConsistencyAgentReview
from iad_core.workbench.vision import VlmClient
from tests.test_consistency_identity import similar_job


def test_unpaired_observations_have_required_fields_and_do_not_fail_the_check(similar_job):
    runtime, _, run_id, anchor = similar_job
    requests = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        body = json.loads(request.content)
        schema = body['response_format']['json_schema']['schema']
        assert 'regions' in schema['properties'], 'Every delivered region needs a defined response field'
        context = json.loads(body['messages'][-1]['content'][1]['text'])
        finding = {'main_description': '蓝色底面。', 'candidate_description': '蓝色底面。',
            'relation': 'unverified'}
        regions = {region['ref']: {'observation': '局部可见蓝色边缘，另一侧没有可靠对应位置。'}
            for region in context['unmapped_regions']}
        requests.append(context)
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps({
            'overview': finding, 'summary': '两图局部无法可靠对应，不能确认内容相同。',
            'regions': regions, 'limitations': []})}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        state = ConsistencyAgentReview(runtime, client).verify(run_id, anchor)
    finally:
        client.close()
    assert state.completed
    assert len(requests) == 2
    for gate in state.gates:
        if gate.source == 'vision':
            assert gate.relation == 'unverified'
            assert gate.unmapped_region_checks
            assert {item.region_pair_id for item in gate.unmapped_region_checks} == set(gate.required_region_pair_ids)
            assert all(item.media_ids for item in gate.unmapped_region_checks)


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_visual_review_directly_saves_annotation_decisions_and_finalizes(similar_job):
    from iad_core.consistency.workflow import ConsistencyWorkflow
    from iad_core.consistency.identity import CandidateIdentity

    runtime, checks, run_id, anchor = similar_job
    requests = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        body = json.loads(request.content)
        context = json.loads(body['messages'][-1]['content'][1]['text'])
        if context.get('scope') == 'joint':
            finding = {'main_description': '完整的彩色纹理。', 'candidate_description': '平移后的相同纹理。',
                'relation': 'transformed_same_content'}
            answer = {'overview': finding, 'summary': '两图纹理相同，只有整体平移。', 'limitations': [],
                'regions': {region['ref']: finding for region in context['windows']}}
        else:
            requests.append(context)
            answer = {'reviews': {identity: {'verdict': 'EQUIVALENT',
                'explanation': '两图的框覆盖相同区域，类别相同。', 'issues': [], 'limitations': [], 'disputed_regions': []}
                for identity in context['facts']['candidates']}}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        CandidateIdentity(runtime, client).verify(run_id, anchor)
        workflow = ConsistencyWorkflow(runtime, client)
        assert workflow.audit(run_id, anchor)['ready']
        result = workflow.finish(run_id, anchor)
        assert result.result == 'passed'
        assert result.assessments
        assert all(item.explanation == '两图的框覆盖相同区域，类别相同。' for item in result.assessments)
        assert checks.anchor(run_id, anchor).state == 'COMPLETED'
        before = len(requests)
        assert workflow.finish(run_id, anchor) == result
        assert len(requests) == before
    finally:
        client.close()


@pytest.fixture
def pair_job(similar_job):
    from iad_core.consistency.identity import CandidateIdentity
    runtime, checks, source_run, _ = similar_job
    dataset_id = checks.snapshot(source_run).scopes.subjects.dataset_ids[0]
    run_id = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [dataset_id],
        'mode': 'combined', 'min_similarity': .9})['run_id']
    for anchor in checks.anchors(run_id):
        checks.session_created(run_id, anchor.anchor_id)
        checks.retrieve(run_id, anchor.anchor_id)
        CandidateIdentity(runtime).prepare(run_id, anchor.anchor_id)
    return runtime, checks, run_id


def test_pair_queue_runs_larger_frozen_annotation_groups_first(pair_job):
    from iad_core.consistency.pair_reviews import ConsistencyPairReviews

    runtime, _, run_id = pair_job
    reviews = ConsistencyPairReviews(runtime)
    before = reviews.plan(run_id)
    counts = []
    for task in before:
        link = task.links[0]
        with runtime.db.connection() as connection:
            raw = connection.execute('''SELECT result.snapshot_json FROM consistency_anchor_evidence captured
                JOIN consistency_results result USING(evidence_id)
                WHERE captured.job_id=? AND captured.anchor_id=? AND captured.candidate_id=?''',
                (run_id, link.anchor_id, link.candidate_id)).fetchone()[0]
        sources = json.loads(raw)['sources']
        counts.append(sum(len(source['annotations']['annotations']) for source in sources.values()))
    assert len(set(counts)) > 1
    assert counts == sorted(counts, reverse=True)
    assert reviews.plan(run_id) == before


def test_mutual_candidates_share_one_actual_identity_observation(pair_job):
    from iad_core.consistency.pair_reviews import ConsistencyPairReviews
    from iad_core.consistency.identity import CandidateIdentity
    runtime, checks, run_id = pair_job
    requests = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        body = json.loads(request.content)
        context = json.loads(body['messages'][-1]['content'][1]['text'])
        requests.append(context)
        finding = {'main_description': '蓝色区域。', 'candidate_description': '存在不同纹理。',
            'relation': 'content_different'}
        regions = {region['ref']: (finding if region['mapping'] == 'registered' else
            {'observation': '只能看到一侧局部，没有可靠对应位置。'})
            for region in [*context['windows'], *context['unmapped_regions']]}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps({
            'overview': finding, 'summary': '两图局部纹理不同。', 'regions': regions, 'limitations': []})}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        pairs = ConsistencyPairReviews(runtime, client)
        tasks = pairs.plan(run_id)
        assert tasks
        for task in tasks:
            pairs.review(run_id, task.pair_key)
            pairs.review(run_id, task.pair_key)
        assert len(requests) == len(tasks)
        states = {anchor.anchor_id: CandidateIdentity(runtime).read(run_id, anchor.anchor_id)
            for anchor in checks.anchors(run_id)}
        assert all(state.completed for state in states.values())
        for anchor_id, state in states.items():
            for gate in state.gates:
                reverse = next(item for item in states[gate.candidate_id].gates if item.candidate_id == anchor_id)
                assert gate.relation == reverse.relation
                if gate.source == 'vision':
                    assert gate.pair_key == reverse.pair_key
                    assert gate.pair_key
                    assert gate.observation_call_ids == reverse.observation_call_ids
                    assert len(gate.observation_call_ids) == 1
                    assert {view.evidence_id for view in gate.media} == {view.evidence_id for view in reverse.media}
    finally:
        client.close()


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_shared_pair_preserves_geometric_uncertainty_in_both_directions(pair_job):
    from iad_core.consistency.identity import CandidateIdentity
    from iad_core.consistency.pair_reviews import ConsistencyPairReviews
    from tests.test_consistency_identity import identity_response

    runtime, _, run_id = pair_job

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        context = json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])
        answer = identity_response(context, 'transformed_same_content', '两图只有整体平移。')
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        reviews = ConsistencyPairReviews(runtime, client)
        task = next(task for task in reviews.plan(run_id) if len(task.links) == 2)
        reviews.review(run_id, task.pair_key)
        gates = [next(gate for gate in CandidateIdentity(runtime).read(run_id, link.anchor_id).gates
            if gate.candidate_id == link.candidate_id) for link in task.links]
        assert all(gate.geometry.reprojection_error_px is not None for gate in gates)
        assert gates[0].geometry.reprojection_error_px == pytest.approx(gates[1].geometry.reprojection_error_px, abs=.001)
    finally:
        client.close()


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_identity_dispute_invalidates_both_projections_before_one_shared_recheck(pair_job):
    import numpy as np
    from iad_core.consistency.pair_reviews import ConsistencyPairReviews
    from iad_core.consistency.identity import CandidateIdentity
    from tests.test_consistency_identity import identity_response

    runtime, checks, run_id = pair_job
    requests = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        context = json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])
        requests.append(context)
        answer = identity_response(context, 'transformed_same_content', '两图细节相同。')
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        pairs = ConsistencyPairReviews(runtime, client)
        for task in pairs.plan(run_id):
            pairs.review(run_id, task.pair_key)
        a, gate = next((anchor.anchor_id, gate) for anchor in checks.anchors(run_id)
            for gate in CandidateIdentity(runtime).read(run_id, anchor.anchor_id).gates if gate.source == 'vision')
        b = gate.candidate_id
        reverse = next(item for item in CandidateIdentity(runtime).read(run_id, b).gates if item.candidate_id == a)
        np.testing.assert_allclose(np.asarray(gate.geometry.candidate_to_main) @ np.asarray(reverse.geometry.candidate_to_main),
            np.eye(3), atol=1e-6)
        before = len(requests)
        pending = CandidateIdentity(runtime).recheck(run_id, a, b, expected_revision=gate.revision, request_id='actual-content-dispute')
        assert CandidateIdentity(runtime).recheck(run_id, a, b, expected_revision=gate.revision,
            request_id='actual-content-dispute') == pending
        assert next(item for item in CandidateIdentity(runtime).read(run_id, b).gates
            if item.candidate_id == a).execution_status == 'pending'
        tasks = pairs.plan(run_id)
        assert len(tasks) == 1
        pairs.review(run_id, tasks[0].pair_key)
        assert len(requests) == before + 1
        assert all(CandidateIdentity(runtime).read(run_id, anchor.anchor_id).completed for anchor in checks.anchors(run_id))
        assert CandidateIdentity(runtime).recheck(run_id, a, b, expected_revision=gate.revision,
            request_id='actual-content-dispute') == pending
        assert pairs.plan(run_id) == [], 'A replay cannot invalidate the newer shared review'
    finally:
        client.close()
