from uuid import uuid4
import json

import httpx
import numpy as np
import pytest
from PIL import Image

from iad_core.consistency.agent_context import AnchorAgentContext
from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_review import ConsistencyAgentReview
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


def identity_response(context, relation, reason):
    finding = {'relation': relation, 'main_description': '主图真实局部细节。',
        'candidate_description': '候选真实局部细节。'}
    return {'overview': finding, 'summary': reason,
        'regions': {window['ref']: finding for window in context['windows']} | {
            window['ref']: {'observation': '实际局部无法可靠对应。'} for window in context['unmapped_regions']},
        'limitations': []}


@pytest.fixture
def similar_job(dataset, tmp_path, request):
    from iad_core.duplicate.index import PixelIndex
    from iad_core.storage.features import FeatureRepository
    from iad_core.storage.models import FeatureRecord
    from tests.feature_fixtures import configure_test_encoder

    database, _, config = dataset
    case = getattr(request, 'param', 'dent')
    if case == 'registered':
        import cv2
        from iad_core.storage.repositories import SampleRepository
        raw = np.zeros((240, 320, 3), dtype=np.uint8)
        raw[40:200, 40:280] = np.random.default_rng(71).integers(0, 256, (160, 240, 3), dtype=np.uint8)
        transformed = cv2.warpAffine(raw, np.float64([[1, 0, 8], [0, 1, 4]]), (320, 240))
        for name in ('normal', 'normal2', 'dent', 'scratch'):
            Image.fromarray(raw if name == 'dent' else transformed).save(
                SampleRepository(database).get(config.dataset.id + ':' + name + '.png').image_path)
        from iad_core.dataset.registry import DatasetRegistry
        DatasetRegistry(database).rescan(config.dataset.id)
    if case in ('original_resolution', 'no_annotations'):
        from iad_core.storage.repositories import SampleRepository
        from iad_core.dataset.registry import DatasetRegistry
        from PIL import ImageDraw
        for index, name in enumerate(('normal', 'normal2', 'dent', 'scratch')):
            sample = SampleRepository(database).get(config.dataset.id + ':' + name + '.png')
            image = Image.new('RGB', (1600, 1200), '#707070')
            ImageDraw.Draw(image).rectangle((1200+index*20, 800, 1210+index*20, 810), fill='red')
            image.save(sample.image_path)
            shapes = ([{'shape_type':'rectangle', 'label':'defect', 'points':[[100,100],[200,200]]}]
                if case == 'original_resolution' and name in ('dent', 'scratch') else [])
            (tmp_path/'labels'/f'{name}.json').write_text(json.dumps({'imageWidth':1600,'imageHeight':1200,'shapes':shapes}))
        DatasetRegistry(database).rescan(config.dataset.id)
    encoder = configure_test_encoder(database, tmp_path)
    for name in ('normal', 'normal2', 'dent', 'scratch'):
        group = PixelIndex(database).get(config.dataset.id + ':' + name + '.png').content_group_id
        vector = np.zeros(encoder.profile.dim, dtype=encoder.profile.storage_dtype)
        vector[0] = 1
        FeatureRepository(database).upsert(FeatureRecord(content_group_id=group, profile_id=encoder.profile.profile_id,
            dim=encoder.profile.dim, dtype=encoder.profile.storage_dtype, embedding_blob=vector.tobytes()))
    runtime = WorkbenchRuntime(database)
    checks = ConsistencyAgentJobs(runtime)
    anchor = config.dataset.id + ':' + ('dent' if case in ('registered','original_resolution','no_annotations') else case) + '.png'
    run_id = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'combined',
        'min_similarity': 0.9, 'subjects': {'kind': 'samples', 'sample_ids': [anchor]}})['run_id']
    checks.session_created(run_id, anchor)
    checks.retrieve(run_id, anchor)
    try:
        yield runtime, checks, run_id, anchor
    finally:
        runtime.close()


@pytest.mark.parametrize('similar_job', ['original_resolution','no_annotations'], indirect=True)
def test_identity_sends_originals_and_only_ten_percent_annotation_crops(similar_job):
    import base64
    import io

    runtime, checks, run_id, anchor = similar_job
    observed = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count':1000,'max_model_len':32768})
        content = json.loads(request.content)['messages'][-1]['content']
        context = json.loads(content[1]['text'])
        sizes = [Image.open(io.BytesIO(base64.b64decode(item['image_url']['url'].split(',')[1]))).size
            for item in content if item['type']=='image_url']
        observed.append((context, sizes))
        return httpx.Response(200, json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(
            identity_response(context,'unverified','逐页记录实际可见内容，不推断身份。'))}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        state = ConsistencyAgentReview(runtime, client).verify(run_id, anchor)
    finally:
        client.close()
    assert state.completed
    assert len(observed)==3
    for context,sizes in observed:
        assert context['scope']=='joint'
        assert sizes[:2]==[(1600,1200),(1600,1200)]
        assert context['windows']==[]
        expected = sum(region[side+'_media_id'] is not None for region in context['unmapped_regions'] for side in ('main','candidate'))
        assert sizes[2:]==[(120,120)]*expected
        assert bool(expected)==any(context['annotations'].values())



@pytest.mark.parametrize('relation', ['content_different', 'unverified'])
def test_nonidentical_candidates_use_annotations_without_quality_labels_or_paths(similar_job, relation):
    runtime, checks, run_id, anchor = similar_job
    generated = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        body = json.loads(request.content)
        generated.append(body)
        text = '\n'.join(part.get('text', '') for message in body['messages'] for part in message['content'])
        assert ':dent.png' not in text and ':normal.png' not in text
        assert 'quality_status' not in text and 'image_label' not in text
        context = json.loads(body['messages'][-1]['content'][1]['text'])
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(identity_response(context, relation,
                '局部内容不同。' if relation == 'content_different' else '关键细节不能确认。'))}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        state = ConsistencyAgentReview(runtime, client).verify(run_id, anchor)
    finally:
        client.close()
    assert state.completed
    assert len(generated) >= 2
    if relation == 'unverified':
        assert any(pair.main_window == (8,8,32,32) or pair.candidate_window == (8,8,32,32)
            for gate in state.gates for pair in gate.region_pairs)
        assert all(pair.mapping == 'unverified' for gate in state.gates if gate.source == 'vision' for pair in gate.region_pairs)
    assert sum(gate.gate_status == 'eligible' for gate in state.gates) == 1
    assert sum(gate.relation == relation for gate in state.gates) == 2
    assert len(state.eligible_ids) == 1
    assert all(gate.media for gate in state.gates)
    from iad_core.consistency.agent_results import ConsistencyAgentResults
    results = ConsistencyAgentResults(runtime.db)
    previews = results.candidates(run_id, anchor)
    assert len(previews.items) == 3
    assert [item.kind for item in previews.items] == ['exact', 'similar', 'similar']
    assert [item.rank for item in previews.items] == [1, 1, 2]
    assert {item.sample_id for item in previews.items} == {gate.candidate_id for gate in state.gates}
    assert {item.image.sample.sample_id for item in results.members(run_id, anchor).items} == set(state.eligible_ids)


@pytest.mark.parametrize('similar_job', ['normal'], indirect=True)
def test_completed_unverified_candidates_pass_without_annotation_assessments(similar_job):
    runtime, checks, run_id, anchor = similar_job

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        context = json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(identity_response(context, 'unverified', '没有足够局部对应证据。'))}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        review = ConsistencyAgentReview(runtime, client)
        state = review.verify(run_id, anchor)
        assert state.completed and not state.eligible_ids
        result = review.finish_rules(run_id, anchor)
        assert result.result == 'passed'
        assert result.pass_reason == 'no_valid_candidate'
        assert result.candidate_stats.unverified == 3
        assert result.assessments == []
        from iad_core.consistency.agent_results import ConsistencyAgentResults
        results = ConsistencyAgentResults(runtime.db)
        assert results.detail(run_id, anchor).program_conclusion == '无有效候选'
        assert results.images(run_id).items[0].summary.program_conclusion == '无有效候选'
        assert results.detail(run_id, anchor).model_conclusion is None
        assert results.images(run_id).items[0].summary.model_conclusion is None
        assert result.conclusion == '通过（无有效候选）'
        assert checks.anchor(run_id, anchor).state == 'COMPLETED'
        assert review.finish_rules(run_id, anchor) == result
    finally:
        client.close()


def test_identity_execution_failure_cannot_be_reported_as_zero_eligible_pass(similar_job):
    import io
    from iad_core.consistency.agent_results import ConsistencyAgentResults
    runtime, checks, run_id, anchor = similar_job

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        raise httpx.ReadTimeout('provider did not complete', request=request)

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        review = ConsistencyAgentReview(runtime, client)
        with pytest.raises(httpx.ReadTimeout):
            review.verify(run_id, anchor)
        with pytest.raises(ValueError, match='尚未正常完成'):
            review.finish_rules(run_id, anchor)
        checks.fail(run_id, anchor, '候选验证模型调用超时。', 'SOURCE_UNAVAILABLE')
        detail = ConsistencyAgentResults(runtime.db).detail(run_id, anchor)
        assert detail.outcome.result == 'incomplete' and detail.outcome.pass_reason is None
        assert detail.model_conclusion is None
        assert detail.outcome.candidate_stats.failed == 1
        assert any(gate.execution_status == 'failed' and gate.gate_status is None for gate in detail.gates)
        output = io.StringIO()
        ConsistencyAgentResults(runtime.db).export(run_id, output)
        assert json.loads(output.getvalue())['result'] == 'incomplete'
    finally:
        client.close()


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_trusted_translation_and_local_views_are_frozen_across_incremental_verification(similar_job):
    runtime, checks, run_id, anchor = similar_job
    sent = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        body = json.loads(request.content)
        context = json.loads(body['messages'][-1]['content'][1]['text'])
        assert context['geometry']['status'] == 'registered'
        matrix = np.asarray(context['geometry']['candidate_to_main'])
        point = matrix @ [108, 104, 1]
        np.testing.assert_allclose(point[:2] / point[2], [100, 100], atol=.5)
        sent.append(body)
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(identity_response(context, 'transformed_same_content', '完整视野中的同一局部纹理仅整体平移。'))}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        for _ in range(30):
            before = len(sent)
            state = ConsistencyAgentReview(runtime, client).verify(run_id, anchor, step=True)
            assert len(sent) <= before + 1
            if state.completed:
                break
            with pytest.raises(ValueError, match='尚未正常完成'):
                ConsistencyAgentReview(runtime).finish_rules(run_id, anchor)
        assert state.completed and len(state.eligible_ids) == 3
        assert all(gate.relation == 'transformed_same_content' for gate in state.gates)
        assert ConsistencyAgentReview(runtime).verify(run_id, anchor) == state
        assert len({gate.gate_id for gate in state.gates}) == 3
    finally:
        client.close()


def test_exact_candidates_have_persisted_identity_before_annotation_review(dataset):
    database, _, config = dataset
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchor_id = config.dataset.id + ':dent.png'
        run_id = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id],
            'mode': 'exact', 'subjects': {'kind': 'samples', 'sample_ids': [anchor_id]}})['run_id']
        checks.session_created(run_id, anchor_id)
        selected = checks.retrieve(run_id, anchor_id)
        review = ConsistencyAgentReview(runtime)
        verified = review.verify(run_id, anchor_id)
        assert verified.eligible_ids == [item.sample_id for item in selected.candidates]
        assert verified.gates
        assert all(type(gate).model_validate(gate.model_dump(mode='json')) == gate for gate in verified.gates)
        assert all(item.relation == 'pixel_identical' and item.gate_status == 'eligible' for item in verified.gates)
        assert review.verify(run_id, anchor_id) == verified
        context = AnchorAgentContext(runtime).read(run_id, anchor_id, {}, attempt=1)
        assert context['identity']['completed']
        assert context['identity']['eligible_ids'] == verified.eligible_ids
        assert all('media' not in gate for gate in context['identity']['gates'])
        assert checks.anchor(run_id, anchor_id).result is None
    finally:
        runtime.close()


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_identity_rejects_one_different_local_window_despite_matching_overview(similar_job):
    runtime, checks, run_id, anchor = similar_job
    sent = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1200, 'max_model_len': 32768})
        body = json.loads(request.content)
        context = json.loads(body['messages'][-1]['content'][1]['text'])
        assert context['scope']=='joint' and context['windows']
        sent.append(context)
        answer=identity_response(context,'transformed_same_content','整图轮廓和局部纹理对应。')
        for window in context['windows']:
            if window['main_window']==[8,8,32,32]:
                answer['regions'][window['ref']] = {**answer['regions'][window['ref']],
                    'relation':'content_different','candidate_description':'对应位置新增黑点。'}
                answer['summary'] = '局部新增黑点。'
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        state = ConsistencyAgentReview(runtime, client).verify(run_id, anchor)
        assert state.completed and not state.eligible_ids
        assert len(sent) >= 3
        assert all(gate.relation == 'content_different' and '局部新增黑点' in gate.reason for gate in state.gates)
    finally:
        client.close()


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_identity_capacity_refuses_partial_groups_without_model_generation(similar_job):
    runtime, checks, run_id, anchor = similar_job
    sent = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1200, 'max_model_len': 32768})
        body = json.loads(request.content)
        context = json.loads(body['messages'][-1]['content'][1]['text'])
        assert sum(part['type'] == 'image_url' for part in body['messages'][-1]['content']) <= 4
        sent.append(context)
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(
            identity_response(context, 'transformed_same_content', '本页原始局部逐项对应。'))}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    client.profile = client.profile.model_copy(update={'max_visual_inputs': 3})
    try:
        from iad_core.workbench.vision import ModelCapacityError
        with pytest.raises(ModelCapacityError,match='完整图组'):
            ConsistencyAgentReview(runtime,client).verify(run_id,anchor)
        assert sent==[]
    finally:
        client.close()


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_identity_cannot_qualify_when_model_omits_a_local_window(similar_job):
    from iad_core.consistency.identity import CandidateIdentity
    from iad_core.workbench.completion import ModelOutputError
    runtime, checks, run_id, anchor = similar_job
    generated = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1200, 'max_model_len': 32768})
        message = next(message for message in json.loads(request.content)['messages']
            if message['role'] == 'user' and isinstance(message['content'], list))
        context = json.loads(message['content'][1]['text'])
        decision = identity_response(context, 'transformed_same_content', '外观相似。')
        if context['scope'] == 'joint':
            decision['regions'].pop(context['windows'][-1]['ref'])
            generated.append(decision)
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(decision)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        with pytest.raises(ModelOutputError):
            ConsistencyAgentReview(runtime, client).verify(run_id, anchor)
        assert len(generated) == 2
        assert not CandidateIdentity(runtime).read(run_id, anchor).eligible_ids
    finally:
        client.close()


def test_tiny_identity_regions_keep_original_pixels_and_are_delivered_as_adjacent_pairs(similar_job):
    import base64
    import io
    runtime, checks, run_id, anchor = similar_job
    compared = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1200, 'max_model_len': 32768})
        content = json.loads(request.content)['messages'][-1]['content']
        context = json.loads(content[1]['text'])
        groups = []
        for index, part in enumerate(content):
            if part['type'] == 'text' and part['text'].startswith('原图资料：'):
                group = json.loads(part['text'].removeprefix('原图资料：'))
                groups.append(group)
                if 'window_index' in group:
                    metadata = json.loads(content[index + 1]['text'].removeprefix('图像视图：'))
                    image = Image.open(io.BytesIO(base64.b64decode(content[index + 2]['image_url']['url'].split(',', 1)[1])))
                    assert image.size == (24,24)
                    assert metadata['sent_size'] == list(image.size)
        paired = [(group['window_index'], group['side']) for group in groups if 'window_index' in group]
        assert paired == [(window['window_index'], side) for window in sorted([*context['windows'],*context['unmapped_regions']],key=lambda item:item['window_index']) for side in ('main', 'candidate') if window[side+'_media_id'] is not None]
        compared.append(paired)
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(
            identity_response(context, 'unverified', '逐对核对真实细节，无法确认。'))}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        assert ConsistencyAgentReview(runtime, client).verify(run_id, anchor).completed
        assert compared
    finally:
        client.close()
