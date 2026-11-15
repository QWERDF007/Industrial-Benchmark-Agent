import json

import httpx
import pytest
from uuid import uuid4

from iad_core.consistency.agent_review import ConsistencyAgentReview
from iad_core.workbench.vision import VlmClient
from tests.test_consistency_identity import similar_job, identity_response


@pytest.mark.parametrize('similar_job', ['no_annotations'], indirect=True)
def test_empty_annotations_finish_without_pixel_comparisons_or_png_encoding(similar_job):
    import cProfile
    from iad_core.consistency.workflow import ConsistencyWorkflow

    runtime, checks, run_id, anchor = similar_job
    profile = cProfile.Profile()
    profile.enable()
    prepared = ConsistencyWorkflow(runtime).prepare(run_id, anchor)
    profile.disable()
    assert prepared['completed']
    assert checks.anchor(run_id, anchor).result.reason == 'PROGRAM_REVIEWED'
    calls = [(entry.code.co_name, entry.callcount) for entry in profile.getstats()
        if not isinstance(entry.code, str) and (entry.code.co_name == 'verify_pixels'
            or entry.code.co_name == 'save' and entry.code.co_filename.endswith('/PIL/Image.py'))]
    assert calls == [], f'Empty annotation proof does not require pixel comparison or PNG rendering: {calls}'


@pytest.mark.parametrize('similar_job', ['no_annotations', 'mixed_empty'], indirect=True)
def test_empty_annotation_pairs_bypass_all_models_and_preserve_nonempty_candidates(similar_job):
    from iad_core.consistency.identity import CandidateIdentity
    from iad_core.consistency.workflow import ConsistencyWorkflow
    from iad_core.consistency.agent_results import ConsistencyAgentResults

    runtime, checks, run_id, anchor = similar_job
    generated = []

    def respond(request):
        body = json.loads(request.content)
        context = json.loads(body['messages'][-1]['content'][1]['text'])
        assert any(context['annotations'].values()), 'Both empty annotations must bypass the model'
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        generated.append(context)
        answer = identity_response(context, 'unverified', '两图单侧有标注，图像内容仍无法确认。')
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        state = CandidateIdentity(runtime, client).verify(run_id, anchor)
        workflow = ConsistencyWorkflow(runtime, client)
        assert workflow.audit(run_id, anchor)['ready']
        result = workflow.finish(run_id, anchor)
        assert result.reason == 'PROGRAM_REVIEWED'
        assert result.overall.verdict == 'EQUIVALENT'
        assert result.result == 'passed'
        assert result.candidate_stats.consistent == result.candidate_stats.eligible
        assert all(gate.relation is None and gate.source == 'program' and not gate.observation_call_ids
            for gate in state.gates if gate.basis == 'empty_annotations')
        gate = next(gate for gate in state.gates if gate.basis == 'empty_annotations')
        with pytest.raises(ValueError, match='冻结标注'):
            CandidateIdentity(runtime).recheck(run_id, anchor, gate.candidate_id, expected_revision=gate.revision,
                request_id='recheck-empty')
        assert len(generated) == (1 if any(gate.basis != 'empty_annotations' for gate in state.gates) else 0)
        assert len(result.assessments) == (2 if generated else 3)
        assert workflow.finish(run_id, anchor) == result
        assert ConsistencyAgentReview(runtime).finalize(run_id, anchor, {'fingerprint': result.fingerprint,
            'assessment_ids': [item.assessment_id for item in ConsistencyAgentReview(runtime).assessments(run_id, anchor)]}) == result
        summary = ConsistencyAgentResults(runtime.db).images(run_id).items[0].summary
        assert summary.program_conclusion == '一致'
        assert summary.model_conclusion is None
        assert len(checks.anchor(run_id, anchor).result.candidate_record_ids) == len(result.candidate_record_ids)
    finally:
        client.close()


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
        requests.append(context)
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(
            identity_response(context, 'unverified', '两图局部无法可靠对应，不能确认内容相同。'))}}]})

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
            answer = identity_response(context, 'transformed_same_content', '两图纹理相同，只有整体平移。')
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


@pytest.mark.parametrize('similar_job', ['mixed_empty'], indirect=True)
def test_shared_pairs_preserve_program_empty_proofs_among_annotated_candidates(similar_job):
    from iad_core.consistency.identity import CandidateIdentity
    from iad_core.consistency.pair_reviews import ConsistencyPairReviews

    runtime, checks, source_run, _ = similar_job
    dataset_id = checks.snapshot(source_run).scopes.subjects.dataset_ids[0]
    run_id = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [dataset_id],
        'mode': 'combined', 'min_similarity': .9})['run_id']
    for anchor in checks.anchors(run_id):
        checks.session_created(run_id, anchor.anchor_id)
        checks.retrieve(run_id, anchor.anchor_id)
    generated = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        context = json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])
        pairs = context['pairs'] if context['scope'] == 'pairs' else {'p0': context}
        assert all(any(pair['annotations'].values()) for pair in pairs.values())
        generated.extend(pairs.values())
        answers = {key: identity_response(pair, 'unverified', '局部无法可靠对应，内容无法确认。')
            for key, pair in pairs.items()}
        answer = answers if context['scope'] == 'pairs' else answers['p0']
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        reviews = ConsistencyPairReviews(runtime, client)
        tasks = reviews.plan(run_id)
        for offset in range(0, len(tasks), 4):
            reviews.review_many(run_id, [task.pair_key for task in tasks[offset:offset+4]])
        states = [CandidateIdentity(runtime).read(run_id, anchor.anchor_id) for anchor in checks.anchors(run_id)]
        assert all(state.completed for state in states)
        empty = [gate for state in states for gate in state.gates if gate.basis == 'empty_annotations']
        assert empty and generated
        assert all(gate.source == 'program' and gate.geometry is None and not gate.observation_call_ids for gate in empty)
    finally:
        client.close()


def test_failed_pair_batch_keeps_the_shared_call_visible_from_every_link(pair_job):
    from iad_core.consistency.pair_reviews import ConsistencyPairReviews
    from iad_core.consistency.agent_results import ConsistencyAgentResults

    runtime, checks, run_id = pair_job

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        return httpx.Response(500, json={'error': {'message': '共享请求失败'}})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        reviews = ConsistencyPairReviews(runtime, client)
        tasks = reviews.plan(run_id)[:4]
        with pytest.raises(httpx.HTTPStatusError):
            reviews.review_many(run_id, [task.pair_key for task in tasks])
        checks.fail(run_id, tasks[0].links[-1].anchor_id, '共享请求失败', 'EXECUTION_ERROR')
        reviews.plan(run_id)
        for task in tasks:
            for link in task.links:
                calls = ConsistencyAgentResults(runtime.db).diagnostics(run_id, link.anchor_id).calls
                shared = [call for call in calls if call.operation == 'generate']
                assert len(shared) == 1
                assert task.pair_key in shared[0].pair_keys
                assert shared[0].error and shared[0].http_status == 500
    finally:
        client.close()


@pytest.mark.parametrize('similar_job', ['original_resolution'], indirect=True)
def test_capacity_split_preserves_successful_pairs_when_a_later_request_fails(pair_job):
    from iad_core.consistency.identity import CandidateIdentity
    from iad_core.consistency.pair_reviews import ConsistencyPairReviews

    runtime, checks, run_id = pair_job
    sent = []
    armed = False

    def respond(request):
        body = json.loads(request.content)
        context = json.loads(next(message['content'] for message in body['messages']
            if message['role'] == 'user' and isinstance(message['content'], list))[1]['text'])
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 32768 if context['scope'] == 'pairs' else 1000,
                'max_model_len': 32768})
        sent.append(context)
        if armed and len(sent) == 2:
            return httpx.Response(500, json={'error': {'message': '第二个子批请求失败'}})
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(
            identity_response(context, 'content_different', '两图中央纹理不同。'))}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        reviews = ConsistencyPairReviews(runtime, client)
        planned = reviews.plan(run_id)
        tasks = [next(task for task in planned if {task.links[0].anchor_id.rsplit(':', 1)[1],
            task.links[0].candidate_id.rsplit(':', 1)[1]} == names)
            for names in ({'dent.png', 'normal.png'}, {'scratch.png', 'normal2.png'})]
        assert len(tasks) == 2
        for task in planned:
            if task not in tasks:
                reviews.review(run_id, task.pair_key)
        sent.clear()
        armed = True
        with pytest.raises(httpx.HTTPStatusError):
            reviews.review_many(run_id, [task.pair_key for task in tasks])
        owner = tasks[0].links[0]
        successful = next(gate for gate in CandidateIdentity(runtime).read(run_id, owner.anchor_id).gates
            if gate.candidate_id == owner.candidate_id)
        assert successful.execution_status == 'completed'
        with runtime.db.connection() as connection:
            assert connection.execute('SELECT count(*) FROM consistency_gate_observations WHERE job_id=? AND anchor_id=? AND candidate_id=?',
                (run_id, owner.anchor_id, owner.candidate_id)).fetchone()[0] == 1
            assert connection.execute('SELECT result_json FROM consistency_pair_reviews WHERE job_id=? AND pair_key=?',
                (run_id, tasks[0].pair_key)).fetchone()[0] is not None
        for link in tasks[0].links:
            gate = next(gate for gate in CandidateIdentity(runtime).read(run_id, link.anchor_id).gates
                if gate.candidate_id == link.candidate_id)
            assert gate.execution_status == 'completed' and gate.pair_key == tasks[0].pair_key
        for anchor in checks.anchors(run_id):
            checks.fail(run_id, anchor.anchor_id, '子批请求失败', 'EXECUTION_ERROR')
        checks.finish(run_id)
        checks.resume(run_id)
        from iad_core.consistency.workflow import ConsistencyWorkflow
        assert ConsistencyWorkflow(runtime).prepare(run_id, owner.anchor_id, attempt=2)['completed']
        assert checks.anchor(run_id, owner.anchor_id).result.reason == 'NO_ELIGIBLE_CANDIDATES'
        receipts = reviews.review_many(run_id, [task.pair_key for task in tasks])
        assert len(receipts) == 2 and len(sent) == 3
        assert next(gate for gate in CandidateIdentity(runtime).read(run_id, owner.anchor_id).gates
            if gate.candidate_id == owner.candidate_id).observation_call_ids == successful.observation_call_ids
        for task in tasks:
            for link in task.links:
                gate = next(gate for gate in CandidateIdentity(runtime).read(run_id, link.anchor_id).gates
                    if gate.candidate_id == link.candidate_id)
                assert gate.execution_status == 'completed' and gate.pair_key == task.pair_key
    finally:
        client.close()


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_pair_batch_shares_one_real_call_and_preserves_each_pair_and_reverse_link(pair_job):
    from iad_core.consistency.pair_reviews import ConsistencyPairReviews
    from iad_core.consistency.identity import CandidateIdentity
    from iad_core.consistency.agent_results import ConsistencyAgentResults

    runtime, _, run_id = pair_job
    sent = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        body = json.loads(request.content)
        context = json.loads(next(item['content'] for item in body['messages']
            if item['role'] == 'user' and isinstance(item['content'], list))[1]['text'])
        assert context['scope'] == 'pairs'
        delivered = [json.loads(part['text'][5:])['evidence_id'] for part in body['messages'][-1]['content']
            if part['type'] == 'text' and part['text'].startswith('原图资料：')]
        required = {identity for pair in context['pairs'].values() for identity in [*pair['required_image_ids'],
            *[region[side] for region in [*pair['windows'], *pair['unmapped_regions']]
                for side in ('main_media_id', 'candidate_media_id') if region[side]]]}
        assert set(delivered) == required, 'Every original and region must resolve to a delivered image'
        assert len(delivered) == len(set(delivered)), 'Shared images should be delivered once per request'
        sent.append(context)
        answer = {key: identity_response(pair, 'content_different', '两图中央胶线的形状不同。')
            for key, pair in context['pairs'].items()}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        pairs = ConsistencyPairReviews(runtime, client)
        tasks = pairs.plan(run_id)[:4]
        assert len(tasks) >= 2
        receipts = pairs.review_many(run_id, [task.pair_key for task in tasks])
        assert len(sent) == 1 and len(sent[0]['pairs']) == len(tasks)
        assert len(receipts) == len(tasks)
        assert len({call for receipt in receipts for call in receipt.observation_call_ids}) == 1
        for task in tasks:
            for link in task.links:
                gate = next(gate for gate in CandidateIdentity(runtime).read(run_id, link.anchor_id).gates
                    if gate.candidate_id == link.candidate_id)
                assert gate.reason == '两图中央胶线的形状不同。'
                assert gate.relation == 'content_different'
                assert gate.pair_key == task.pair_key
                calls = ConsistencyAgentResults(runtime.db).diagnostics(run_id, link.anchor_id).calls
                assert set(gate.observation_call_ids) <= {call.call_id for call in calls}
        pairs.review_many(run_id, [task.pair_key for task in tasks])
        assert len(sent) == 1
    finally:
        client.close()


@pytest.mark.parametrize('similar_job', ['registered', 'original_resolution'], indirect=True)
def test_pair_inputs_are_frozen_locally_before_visual_workers_and_reused_unchanged(pair_job):
    import cProfile
    from iad_core.consistency.pair_reviews import ConsistencyPairReviews

    runtime, _, run_id = pair_job
    reviews = ConsistencyPairReviews(runtime)
    keys = [task.pair_key for task in reviews.plan(run_id)[:4]]
    assert reviews.prepare_many(run_id, keys) == len(keys)
    with runtime.db.connection() as connection:
        frozen = dict(connection.execute('''SELECT anchor_id || candidate_id,plan_json
            FROM consistency_identity_inputs WHERE job_id=?''', (run_id,)))
        assert len(frozen) == len(keys)
        assert connection.execute('SELECT count(*) FROM model_calls WHERE run_id=?', (run_id,)).fetchone()[0] == 0

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        context = json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])
        answer = {key: identity_response(pair, 'unverified', '两图局部无法可靠对应。')
            for key, pair in context['pairs'].items()}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop',
            'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        profile = cProfile.Profile()
        profile.enable()
        receipts = ConsistencyPairReviews(runtime, client).review_many(run_id, keys)
        profile.disable()
        assert len(receipts) == len(keys)
        expensive = [(entry.code.co_name, entry.callcount) for entry in profile.getstats()
            if not isinstance(entry.code, str) and (
                entry.code.co_name == 'estimate' and entry.code.co_filename.endswith('/identity_geometry.py')
                or entry.code.co_name == 'save' and entry.code.co_filename.endswith('/PIL/Image.py'))]
        assert not expensive, f'模型执行名额中不应重新配准或编码局部图片：{expensive}'
        with runtime.db.connection() as connection:
            current = dict(connection.execute('''SELECT anchor_id || candidate_id,plan_json
                FROM consistency_identity_inputs WHERE job_id=?''', (run_id,)))
        assert all(current[key] == value for key, value in frozen.items())
    finally:
        client.close()


@pytest.mark.parametrize('budget', ['PAIR_REVIEW_MEDIA_BYTES', 'PAIR_REVIEW_REGION_BUDGET'])
@pytest.mark.parametrize('similar_job', ['original_resolution'], indirect=True)
def test_pair_media_budget_splits_batches_without_removing_any_original_or_region(pair_job, monkeypatch, budget):
    import iad_core.consistency.identity_inspection as inspection
    from iad_core.consistency.pair_reviews import ConsistencyPairReviews

    runtime, _, run_id = pair_job
    monkeypatch.setattr(inspection, budget, 1)
    delivered = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        context = json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])
        assert context['scope'] == 'joint', '超过媒体预算的图像对须拆到独立请求，不能缩图或丢弃局部'
        delivered.append(context)
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(
            identity_response(context, 'unverified', '两图局部无法可靠对应。'))}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        pairs = ConsistencyPairReviews(runtime, client)
        keys = [task.pair_key for task in pairs.plan(run_id)[:4]]
        receipts = pairs.review_many(run_id, keys)
        assert len(receipts) == len(delivered) == len(keys)
        assert all(receipt.observation_call_ids for receipt in receipts)
        from pathlib import Path
        from scripts.compare_consistency_inputs import compare_inputs
        proof = compare_inputs(Path(runtime.db.db_path), {'run_id': run_id, 'pairs': []}, run_id)
        assert proof['visual_pairs_with_actual_original_and_all_roi_delivery'] == len(keys)
    finally:
        client.close()


@pytest.mark.parametrize('similar_job', ['dent', 'registered', 'original_resolution'], indirect=True)
def test_prepared_pair_survives_owner_failure_and_reuses_the_same_regions_after_resume(pair_job):
    from iad_core.consistency.pair_reviews import ConsistencyPairReviews
    from iad_core.consistency.identity import CandidateIdentity

    runtime, checks, run_id = pair_job
    sent = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        context = json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])
        sent.append(context)
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(
            identity_response(context, 'unverified', '两图局部无法可靠对应。'))}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        reviews = ConsistencyPairReviews(runtime, client)
        task = next(task for task in reviews.plan(run_id) if len(task.links) == 2)
        owner = task.links[0]
        assert reviews.prepare_many(run_id, [task.pair_key]) == 1
        with runtime.db.connection() as connection:
            before = connection.execute('''SELECT plan_json FROM consistency_identity_inputs
                WHERE job_id=? AND anchor_id=? AND candidate_id=?''',
                (run_id, owner.anchor_id, owner.candidate_id)).fetchone()[0]
        checks.fail(run_id, owner.anchor_id, '另一个图像对失败', 'EXECUTION_ERROR')
        receipt = reviews.review_many(run_id, [task.pair_key])[0]
        assert receipt.observation_owner_id != owner.anchor_id
        checks.cancel(run_id)
        checks.resume(run_id)
        reviews.review(run_id, task.pair_key)
        with runtime.db.connection() as connection:
            after = connection.execute('''SELECT plan_json FROM consistency_identity_inputs
                WHERE job_id=? AND anchor_id=? AND candidate_id=?''',
                (run_id, owner.anchor_id, owner.candidate_id)).fetchone()[0]
        assert before == after
        assert len(sent) == 1
        for link in task.links:
            gate = next(gate for gate in CandidateIdentity(runtime).read(run_id, link.anchor_id).gates
                if gate.candidate_id == link.candidate_id)
            assert gate.execution_status == 'completed' and gate.pair_key == task.pair_key
    finally:
        client.close()


@pytest.mark.parametrize('similar_job', ['original_resolution'], indirect=True)
def test_opposite_pair_input_preparation_shares_one_geometry_and_region_plan(pair_job):
    from concurrent.futures import ThreadPoolExecutor
    from threading import Barrier
    from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
    from iad_core.consistency.identity_inputs import IdentityInputs
    from iad_core.consistency.pair_reviews import ConsistencyPairReviews

    runtime, checks, run_id = pair_job
    link = ConsistencyPairReviews(runtime).plan(run_id)[0].links[0]
    group = ConsistencyAgentEvidence(runtime).freeze(run_id, link.anchor_id, checkpoint=lambda: None)
    member = next(member for member in group.members if member.image.sample_id == link.candidate_id)
    saved = runtime.consistency_service.evidence(member.comparison.evidence_id)
    sources = (saved.sources.left, saved.sources.right)
    prompts = checks.snapshot(run_id).prompts
    barrier = Barrier(2)

    def prepare(ordered):
        barrier.wait(timeout=5)
        return IdentityInputs(runtime.db).freeze(run_id,
            ordered[0].sample.sample_id, ordered[1].sample.sample_id, ordered, prompts)

    with ThreadPoolExecutor(max_workers=2) as executor:
        left = executor.submit(prepare, sources)
        right = executor.submit(prepare, tuple(reversed(sources)))
        first, second = left.result(timeout=15), right.result(timeout=15)
    assert first.region_pairs == second.inverted().region_pairs


@pytest.mark.parametrize('similar_job', ['original_resolution'], indirect=True)
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


def test_pair_planning_work_does_not_grow_with_unrelated_annotation_history(pair_job, tmp_path, monkeypatch):
    from PIL import Image
    from iad_core.dataset.registry import DatasetRegistry
    from iad_core.consistency.pair_reviews import ConsistencyPairReviews

    runtime, _, run_id = pair_job
    reviews = ConsistencyPairReviews(runtime)
    instructions = 0

    def tick():
        nonlocal instructions
        instructions += 1000
        return 0

    connect = runtime.db.get_connection

    def observed_connection():
        connection = connect()
        connection.set_progress_handler(tick, 1000)
        return connection

    monkeypatch.setattr(runtime.db, 'get_connection', observed_connection)
    before = reviews.plan(run_id)
    baseline = instructions
    directory = tmp_path / 'unrelated'; directory.mkdir()
    Image.new('RGB', (1024, 1024), 'green').save(directory / 'other.png')
    (directory / 'other.json').write_text(json.dumps({'imageWidth': 1024, 'imageHeight': 1024,
        'shapes': [{'shape_type': 'rectangle', 'label': '划痕',
            'points': [[1 + index % 100 * 10, 1 + index // 100 * 10], [8 + index % 100 * 10, 8 + index // 100 * 10]]}
            for index in range(10000)]}))
    DatasetRegistry(runtime.db).import_dataset({'format': 'labelme', 'name': '无关历史',
        'image_dir': str(directory), 'annotation_dir': str(directory)})
    instructions = 0
    assert reviews.plan(run_id) == before
    assert instructions <= baseline + 10000, f'不应扫描无关标注：{baseline} -> {instructions}'


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
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(
            identity_response(context, 'content_different', '两图局部纹理不同。'))}}]})

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
@pytest.mark.parametrize('failed_link_index', [0, 1])
def test_shared_dispute_survives_a_failed_side_and_recovery(pair_job, failed_link_index):
    from iad_core.consistency.identity import CandidateIdentity
    from iad_core.consistency.pair_reviews import ConsistencyPairReviews

    runtime, checks, run_id = pair_job
    requests = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        context = json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])
        requests.append(context)
        relation = 'transformed_same_content' if len(requests) == 1 else 'content_different'
        answers = {
            key: identity_response(pair, relation, '两图细节相同。' if len(requests) == 1 else '两图中央纹理不同。')
            for key, pair in (context['pairs'] if context['scope'] == 'pairs' else {'p0': context}).items()
        }
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {
            'content': json.dumps(answers if context['scope'] == 'pairs' else answers['p0'])}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        reviews = ConsistencyPairReviews(runtime, client)
        tasks = reviews.plan(run_id)
        reviews.review_many(run_id, [task.pair_key for task in tasks])
        assert len(requests) == 1
        task = next(task for task in tasks if len(task.links) == 2)
        failed, active = task.links[failed_link_index], task.links[1 - failed_link_index]
        checks.fail(run_id, failed.anchor_id, '另一个候选处理失败。', 'EXECUTION_ERROR')
        stopped_gate = next(item for item in CandidateIdentity(runtime).read(run_id, failed.anchor_id).gates
            if item.candidate_id == failed.candidate_id)
        with pytest.raises(ValueError, match='主图已停止'):
            CandidateIdentity(runtime).commit(run_id, failed.anchor_id, stopped_gate,
                expected_revision=stopped_gate.revision, request_id='forbidden-completed-record')
        checks.cancel(run_id)
        with pytest.raises(ValueError, match='主图已停止'):
            CandidateIdentity(runtime).recheck(run_id, failed.anchor_id, failed.candidate_id,
                expected_revision=stopped_gate.revision, request_id='forbidden-cancelled-dispute')
        checks.resume(run_id)
        checks.fail(run_id, failed.anchor_id, '另一个候选处理失败。', 'EXECUTION_ERROR', attempt=2)
        gate = next(item for item in CandidateIdentity(runtime).read(run_id, active.anchor_id).gates
            if item.candidate_id == active.candidate_id)
        pending = CandidateIdentity(runtime).recheck(run_id, active.anchor_id, active.candidate_id,
            expected_revision=gate.revision, request_id='dispute-with-failed-reverse', attempt=2)
        stopped = checks.anchor(run_id, failed.anchor_id)
        assert stopped.state == 'FAILED' and stopped.phase == 'FAILED'
        revoked = next(item for item in CandidateIdentity(runtime).read(run_id, failed.anchor_id).gates
            if item.candidate_id == failed.candidate_id)
        assert revoked.execution_status == 'pending', 'Recovery must not resurrect a disputed reverse gate'
        assert len(requests) == 1
        checks.cancel(run_id)
        checks.resume(run_id)
        reviews.review_many(run_id, [task.pair_key])
        assert len(requests) == 2, 'A shared dispute requires a new model observation after recovery'
        for link in task.links:
            latest = next(item for item in CandidateIdentity(runtime).read(run_id, link.anchor_id).gates
                if item.candidate_id == link.candidate_id)
            assert latest.relation == 'content_different'
            assert latest.execution_status == 'completed'
        assert CandidateIdentity(runtime).recheck(run_id, active.anchor_id, active.candidate_id,
            expected_revision=gate.revision, request_id='dispute-with-failed-reverse', attempt=3) == pending
        assert reviews.plan(run_id) == []
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
