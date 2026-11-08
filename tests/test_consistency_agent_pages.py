from uuid import uuid4
import json
import httpx
import numpy as np
import pytest
from PIL import Image

from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_review import ConsistencyAgentReview
from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.duplicate.index import PixelIndex
from iad_core.storage.database import Database
from iad_core.storage.features import FeatureRepository
from iad_core.storage.models import FeatureRecord
from iad_core.workbench.model_profile import ModelProfile
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient
from tests.feature_fixtures import configure_test_encoder


@pytest.mark.parametrize('budget', ['images', 'context', 'bytes'])
def test_thirty_candidates_are_planned_with_real_media_budgets_and_resume_completed_pages(tmp_path, budget):
    images = tmp_path / 'images'
    images.mkdir()
    for index in range(31):
        name = 'anchor' if index == 0 else f'candidate-{index:02}'
        Image.new('RGB', (32, 32), (index, 30, 180)).save(images / (name + '.png'))
        (images / (name + '.json')).write_text(json.dumps({'imageWidth': 32, 'imageHeight': 32, 'shapes': []}))
    database = Database(str(tmp_path / 'pages.db'))
    config = DatasetRegistry(database).import_labelme(DatasetImport(format='labelme', name='真实媒体分页',
        image_dir=str(images), annotation_dir=str(images)))
    encoder = configure_test_encoder(database, tmp_path)
    features = FeatureRepository(database)
    for image in sorted(images.glob('*.png')):
        group = PixelIndex(database).get(config.dataset.id + ':' + image.name).content_group_id
        vector = np.zeros(encoder.profile.dim, dtype=encoder.profile.storage_dtype)
        vector[0] = 1
        features.upsert(FeatureRecord(content_group_id=group, profile_id=encoder.profile.profile_id,
            dim=encoder.profile.dim, dtype=encoder.profile.storage_dtype, embedding_blob=vector.tobytes()))
    generated, tokenized = [], []
    profile = ModelProfile(endpoint='http://fixture/v1/chat/completions', model_id='vision', capacity_mode='vllm_tokenize',
        context_tokens=8192, max_output_tokens=2048, max_visual_inputs=3 if budget == 'images' else None,
        max_request_bytes=48000 if budget == 'bytes' else None)

    def respond(request):
        body = json.loads(request.content)
        content = body['messages'][0]['content']
        facts = json.loads(content[1]['text'])['facts']
        if request.url.path.endswith('/tokenize'):
            tokenized.append(body)
            return httpx.Response(200, json={'count': 1000 + (1500 * len(facts['candidates']) if budget == 'context' else 0), 'max_model_len': 8192})
        generated.append(body)
        media = [json.loads(item['text'].removeprefix('视觉证据：'))['evidence_id'] for item in content
            if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        assert all(item['image_url']['url'].startswith('data:image/png;base64,') for item in content if item['type'] == 'image_url')
        if profile.max_visual_inputs:
            assert sum(item['type'] == 'image_url' for item in content) <= profile.max_visual_inputs
        if profile.max_request_bytes:
            assert len(request.content) <= profile.max_request_bytes
        answer = {'observations': [{'candidate_id': identity, 'description': '两侧均为有效空标注，图像已实际读取',
            'phenomena_comparable': True, 'appearance_explains_annotation_difference': False, 'media_ids': media, 'limitations': []}
            for identity in facts['candidates']]}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)), profile=profile)
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchor_id = config.dataset.id + (':candidate-12.png' if budget == 'context' else ':anchor.png')
        job_id = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'combined', 'max_similar_candidates': 30,
            'subjects': {'kind': 'samples', 'sample_ids': [anchor_id]}})['run_id']
        checks.session_created(job_id, anchor_id)
        selected = checks.retrieve(job_id, anchor_id)
        assert len(selected.candidates) == 30
        review = ConsistencyAgentReview(runtime, client)
        plan = review.plan(job_id, anchor_id)
        assert plan.fingerprint == selected.fingerprint
        assert len(plan.pages) > 1
        assert [identity for page in plan.pages for identity in page.candidate_ids] == [item.sample_id for item in selected.candidates]
        assert len({page.request_id for page in plan.pages}) == len(plan.pages)
        assert generated == []
        token_count = len(tokenized)
        assert review.plan(job_id, anchor_id) == plan
        assert len(tokenized) == token_count
        first = review.observe(job_id, anchor_id, plan.pages[0])
        assert checks.anchor(job_id, anchor_id).result is None
        checks.cancel(job_id)
        checks.resume(job_id)
        attempt = checks.anchor(job_id, anchor_id).attempt
        assert review.plan(job_id, anchor_id, attempt=attempt) == plan
        assert review.observe(job_id, anchor_id, plan.pages[0], attempt=attempt) == first
        assert len(generated) == 1
        observations = [first, *[review.observe(job_id, anchor_id, page, attempt=attempt) for page in plan.pages[1:]]]
        assert len(generated) == len(plan.pages)
        assert checks.anchor(job_id, anchor_id).result is None
        observed = {identity: item for item in observations for identity in item.request.candidate_ids}
        from iad_core.consistency.agent_context import AnchorAgentContext
        context = AnchorAgentContext(runtime)
        index = context.read(job_id, anchor_id, {}, attempt=attempt)
        assert {item['candidate_id'] for item in index['observations']} == set(observed)
        assert {identity for receipt in index['observation_index'] for identity in receipt['candidate_ids']} == set(observed)
        candidate_id = plan.pages[-1].candidate_ids[-1]
        focused = context.read(job_id, anchor_id, {'candidate_id': candidate_id}, attempt=attempt)
        assert len(focused['observations']) == 1
        detail = focused['observations'][0]
        assert detail['candidate_id'] == candidate_id
        assert detail['request']['candidate_ids'] == observed[candidate_id].request.candidate_ids
        assert list(detail['facts']['candidates']) == [candidate_id]
        assert detail['facts']['anchor']['side'] == observed[candidate_id].request.facts['candidates'][candidate_id]['comparison']['anchor_side']
        assert detail['facts']['anchor']['evidence_id'] == observed[candidate_id].request.facts['candidates'][candidate_id]['comparison']['evidence_id']
        assert {source['sample_id'] for source in detail['facts']['sources'].values()} == {anchor_id, candidate_id}
        assert detail['result']['observations'] == [item.model_dump(mode='json')
            for item in observed[candidate_id].result.observations if item.candidate_id == candidate_id]
        assert len(detail['facts']['evidence']) == 1
        assert len(generated) == len(plan.pages), 'Reading retained evidence must not repeat visual generation'
        references = [{'candidate_id': identity, 'comparison': {
            key: item.request.facts['candidates'][identity]['comparison'][key] for key in ('result_id', 'evidence_id')}}
            for identity, item in observed.items()]
        draft = {'assessments': [{'candidate_id': identity, 'verdict': 'EQUIVALENT', 'conclusion': '一致', 'categories': [],
            'explanation': '双方原图可见且均为有效空标注', 'findings': []} for identity in observed],
            'overall': {'verdict': 'EQUIVALENT', 'text': '一致', 'references': references},
            'conclusions': [{'text': '全部入选候选均已实际核对', 'references': references}], 'limitations': []}
        result = review.submit(job_id, anchor_id, {'fingerprint': plan.fingerprint, 'draft': draft,
            'observation_ids': {identity: [item.observation_id] for identity, item in observed.items()}}, attempt=attempt)
        assert result.overall.verdict == 'EQUIVALENT'
        assert runtime.jobs.finish_external(job_id)['completed'] == 1
    finally:
        client.close();runtime.close()
