import base64
from copy import deepcopy
import io
import json
from uuid import uuid4

import httpx
import pytest
from PIL import Image
from pydantic import ValidationError

from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_context import AnchorAgentContext
from iad_core.workbench.calls import ModelCalls
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


def test_anchor_visual_observation_records_the_images_actually_sent_and_reuses_its_request(dataset):
    from iad_core.consistency.agent_review import ConsistencyAgentReview

    database, _, config = dataset
    sent = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        body = json.loads(request.content)
        sent.append(body)
        content = body['messages'][0]['content']
        media = [json.loads(part['text'].removeprefix('视觉证据：')) for part in content
            if part['type'] == 'text' and part['text'].startswith('视觉证据：')]
        facts = json.loads(content[0]['text'].split('冻结视觉输入：')[1].split('\n')[0])
        assert set(facts['required_media_ids'][config.dataset.id + ':scratch.png']) == {item['evidence_id'] for item in media}
        for part in content:
            if part['type'] == 'image_url':
                with Image.open(io.BytesIO(base64.b64decode(part['image_url']['url'].split(',')[1]))) as pixels:
                    assert pixels.convert('RGB').getpixel((0, 0)) == (0, 0, 255)
        answer = {'observations': [{'candidate_id': config.dataset.id + ':scratch.png',
            'description': '两侧原始像素相同，主图和参考图的类别名称不同',
            'phenomena_comparable': True, 'appearance_explains_annotation_difference': False,
            'media_ids': [item['evidence_id'] for item in media], 'limitations': ['仅核对标注一致性，不裁决哪侧标注正确']}]}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop',
            'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchor_id = config.dataset.id + ':dent.png'
        job_id = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact',
            'subjects': {'kind': 'samples', 'sample_ids': [anchor_id]}})['run_id']
        checks.session_created(job_id, anchor_id)
        selected = checks.retrieve(job_id, anchor_id)
        review = ConsistencyAgentReview(runtime, client)
        request = {'request_id': str(uuid4()), 'fingerprint': selected.fingerprint,
            'candidate_ids': [config.dataset.id + ':scratch.png'], 'question': '核实原始像素与类别差异',
            'windows': [{'sample_id': config.dataset.id + ':scratch.png', 'bbox': [2, 3, 12, 9], 'padding': 5, 'reason': '原像素补证'}]}
        observed = review.observe(job_id, anchor_id, request)
        assert observed.request.request_id == request['request_id']
        assert observed.request.anchor_id == anchor_id
        assert observed.request.candidate_ids == request['candidate_ids']
        assert observed.request.media
        focused = AnchorAgentContext(runtime).read(job_id, anchor_id,
            {'candidate_id': request['candidate_ids'][0]}, attempt=1)
        verification = focused['observations'][0]['facts']['evidence'][0]['verification']
        assert verification['relation'] == 'EXACT'
        assert verification['registration']['status'] == 'UNSUPPORTED'
        assert len(sent) == 1
        with pytest.raises(ValueError, match='新的request_id'):
            review.observe(job_id, anchor_id, {**request, 'question': '在原始像素中补充核对标注边界'})
        actual = [json.loads(part['text'].removeprefix('视觉证据：')) for part in sent[0]['messages'][0]['content']
            if part['type'] == 'text' and part['text'].startswith('视觉证据：')]
        assert [item.evidence_id for item in observed.request.media] == [item['evidence_id'] for item in actual]
        assert any(item['source'] == 'model' and item['crop_bbox'] == [0, 0, 17, 14] and item['sent_size'] == [17, 14] for item in actual)
        assert observed.result.observations[0].phenomena_comparable
        assert review.observe(job_id, anchor_id, request) == observed
        assert len(sent) == 1
        calls = ModelCalls(database).list(job_id)
        assert [call.operation for call in calls] == ['tokenize', 'generate']
        assert all(call.role == 'vision' and call.request_id == request['request_id'] for call in calls)
        assert checks.anchor(job_id, anchor_id).result is None
        reference = {'candidate_id': request['candidate_ids'][0], 'comparison': {
            key: observed.request.facts['candidates'][request['candidate_ids'][0]]['comparison'][key]
            for key in ('result_id', 'evidence_id')}}
        draft = {'assessments': [{'candidate_id': request['candidate_ids'][0], 'verdict': 'MATERIAL',
            'conclusion': '类别不一致', 'categories': ['类别不一致'], 'explanation': '同像素对应区域的原始类别名称不同',
            'findings': ['原始标注类别不一致']}], 'overall': {'verdict': 'MATERIAL', 'text': '类别不一致',
            'references': [reference]}, 'conclusions': [{'text': '同像素图的标注类别不一致', 'references': [reference]}],
            'limitations': []}
        submission = {'fingerprint': selected.fingerprint, 'draft': draft,
            'observation_ids': {request['candidate_ids'][0]: [observed.observation_id]}}
        for invalid in ('coverage', 'observation', 'aggregate', 'exact_facts'):
            rejected = deepcopy(submission)
            if invalid == 'coverage':
                rejected['observation_ids'] = {}
            elif invalid == 'observation':
                rejected['observation_ids'][request['candidate_ids'][0]] = ['another-session-observation']
            elif invalid == 'aggregate':
                rejected['draft']['overall'].update(verdict='EQUIVALENT', text='一致')
            else:
                rejected['draft']['overall'].update(verdict='EQUIVALENT', text='一致')
                rejected['draft']['assessments'][0].update(verdict='EQUIVALENT', conclusion='一致', categories=[])
            with pytest.raises(ValueError):
                review.submit(job_id, anchor_id, rejected)
            assert checks.anchor(job_id, anchor_id).result is None
            assert runtime.jobs.status(job_id)['completed'] == 0
        submitted = {'fingerprint': selected.fingerprint,
            'assessment': {key: value for key, value in draft['assessments'][0].items() if key != 'conclusion'},
            'observation_ids': [observed.observation_id]}
        with pytest.raises(ValidationError) as invalid_decision:
            review.assess(job_id, anchor_id, {**submitted,
                'assessment': {**submitted['assessment'], 'categories': []}})
        problems = invalid_decision.value.errors(include_context=False, include_url=False)
        assert len(problems) == 1
        assert problems[0]['loc'] == ('assessment',)
        assert 'MATERIAL必须' in problems[0]['msg']
        assert 'conclusion' not in problems[0]['msg'] and 'overall' not in problems[0]['msg']
        assert review.assessments(job_id, anchor_id) == []
        assessment = review.assess(job_id, anchor_id, submitted)
        assert assessment.submission.comparison.model_dump(exclude_none=True) == reference['comparison']
        with pytest.raises(ValueError, match='comparison'):
            review.assess(job_id, anchor_id, {**submitted,
                'comparison': {'result_id': 'forged', 'evidence_id': 'forged'}})
        assert review.assessments(job_id, anchor_id) == [assessment]
        assert review.assess(job_id, anchor_id, submitted) == assessment
        assert checks.anchor(job_id, anchor_id).result is None
        final = {'fingerprint': selected.fingerprint, 'assessment_ids': [assessment.assessment_id]}
        with pytest.raises(ValidationError, match='conclusions'):
            review.finalize(job_id, anchor_id, {**final, 'conclusions': ['没有来源的新事实']})
        with pytest.raises(ValueError, match='恰好引用'):
            review.finalize(job_id, anchor_id, {**final, 'assessment_ids': [assessment.assessment_id, assessment.assessment_id]})
        changed = {**submitted, 'assessment': {**submitted['assessment'],
            'explanation': '同像素图像中主图标注类别与参考图不同，已复查原始类别名称'}}
        revised = review.assess(job_id, anchor_id, changed)
        assert revised.assessment_id != assessment.assessment_id
        with pytest.raises(ValueError, match='最新评估'):
            review.finalize(job_id, anchor_id, final)
        assessment = review.assess(job_id, anchor_id, submitted)
        final['assessment_ids'] = [assessment.assessment_id]
        result = review.finalize(job_id, anchor_id, final)
        assert result.reason == 'MODEL_REVIEWED'
        assert result.overall.verdict == 'MATERIAL'
        assert result.limitations == ['仅核对标注一致性，不裁决哪侧标注正确']
        assert checks.anchor(job_id, anchor_id).result == result
        assert result.conclusions[0].text == result.assessments[0].explanation
        assert review.finalize(job_id, anchor_id, final) == result
        assert runtime.jobs.status(job_id)['completed'] == 1
        from iad_core.consistency.agent_results import ConsistencyAgentResults
        results = ConsistencyAgentResults(database)
        detail = results.detail(job_id, anchor_id)
        assert detail.original_conclusion == detail.model_conclusion == '类别不一致'
        assert detail.observations == [observed]
        assert detail.requests == [observed.request]
        assert detail.evidence[0].candidate_id == request['candidate_ids'][0]
        assert detail.evidence[0].evidence_id == reference['comparison']['evidence_id']
        assert detail.result == result
        assert results.report(job_id).agreement == {'一致': 1, '不一致': 0}
        gallery = results.gallery(job_id)
        assert gallery.total == 1
        assert gallery.items[0].group_id == anchor_id
        assert gallery.items[0].conflict_categories == ['类别不一致']
        assert gallery.items[0].model_conclusion == '类别不一致'
        members = results.members(job_id, anchor_id)
        assert [item.image.sample_id for item in members.items] == request['candidate_ids']
        assert results.analysis(job_id, anchor_id).result.overall.text == '类别不一致'
        with pytest.raises(ValueError, match='终稿'):
            review.submit(job_id, anchor_id, {**submission, 'draft': {**draft, 'limitations': ['不同终稿']}})
    finally:
        client.close()
        runtime.close()


@pytest.mark.parametrize('case', ['different_object', 'unregistered_position', 'exact_extra', 'exact_missing'])
def test_visual_comparability_keeps_physical_changes_distinct_from_exact_annotation_direction(dataset, tmp_path, case):
    import numpy as np

    from iad_core.consistency.agent_review import ConsistencyAgentReview
    from iad_core.dataset.registry import DatasetImport
    from iad_core.duplicate.index import PixelIndex
    from iad_core.storage.features import FeatureRepository
    from iad_core.storage.models import FeatureRecord
    from tests.feature_fixtures import configure_test_encoder

    database, registry, config = dataset
    root = tmp_path / 'reference'
    root.mkdir()
    Image.new('RGB', (320, 240), (0, 0, 200) if case in ('different_object', 'unregistered_position') else 'blue').save(root / 'reference.png')
    if case == 'unregistered_position':
        (root / 'reference.json').write_text(json.dumps({'imageWidth': 320, 'imageHeight': 240,
            'shapes': [{'label': 'dent', 'shape_type': 'rectangle', 'points': [[12, 10], [32, 30]]}]}))
    config.annotations.annotation_coverage = 'EXHAUSTIVE'
    registry.save(config)
    registry.rescan(config.dataset.id)
    reference_dataset = registry.import_labelme(DatasetImport(format='labelme', name='对侧空标',
        image_dir=str(root), annotation_dir=str(root), annotation_policy={'annotation_coverage': 'EXHAUSTIVE'}))
    main_id = config.dataset.id + ':dent.png'
    reference_id = reference_dataset.dataset.id + ':reference.png'
    corpus_id = reference_dataset.dataset.id
    if case == 'exact_missing':
        main_id, reference_id = reference_id, main_id
        corpus_id = config.dataset.id
    if case in ('different_object', 'unregistered_position'):
        encoder = configure_test_encoder(database, tmp_path)
        for identity in (main_id, reference_id):
            group = PixelIndex(database).get(identity).content_group_id
            vector = np.zeros(encoder.profile.dim, dtype=encoder.profile.storage_dtype)
            vector[0] = 1
            FeatureRepository(database).upsert(FeatureRecord(content_group_id=group,
                profile_id=encoder.profile.profile_id, dim=encoder.profile.dim,
                dtype=encoder.profile.storage_dtype, embedding_blob=vector.tobytes()))

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        content = json.loads(request.content)['messages'][0]['content']
        media = [json.loads(item['text'].removeprefix('视觉证据：'))['evidence_id'] for item in content
            if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        answer = {'observations': [{'candidate_id': reference_id,
            'description': '局部对象可比，框的位置不同，但没有可靠配准' if case == 'unregistered_position' else '两侧表面实际状态不同',
            'phenomena_comparable': case == 'unregistered_position',
            'appearance_explains_annotation_difference': case != 'unregistered_position',
            'media_ids': media, 'limitations': []}]}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        job_id = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id, reference_dataset.dataset.id],
            'mode': 'combined' if case in ('different_object', 'unregistered_position') else 'exact', 'max_exact_candidates': 1,
            'subjects': {'kind': 'samples', 'sample_ids': [main_id]},
            'corpus_scope': {'kind': 'datasets', 'dataset_ids': [corpus_id]}})['run_id']
        checks.session_created(job_id, main_id)
        candidates = checks.retrieve(job_id, main_id)
        assert [item.sample_id for item in candidates.candidates] == [reference_id]
        review = ConsistencyAgentReview(runtime, client)
        observed = review.observe(job_id, main_id, {'request_id': str(uuid4()), 'fingerprint': candidates.fingerprint,
            'candidate_ids': [reference_id], 'question': '核实物体实际状态是否解释标注差异'})
        comparison = observed.request.facts['candidates'][reference_id]['comparison']
        reference = {'candidate_id': reference_id, 'comparison': {key: comparison[key] for key in ('result_id', 'evidence_id')}}
        draft = {'assessments': [{'candidate_id': reference_id, 'verdict': 'EQUIVALENT', 'conclusion': '一致',
            'categories': [], 'explanation': '标注差异由实物实际表面状态解释', 'findings': []}],
            'overall': {'verdict': 'EQUIVALENT', 'text': '一致', 'references': [reference]},
            'conclusions': [{'text': '实物状态不同，各侧标注与各自可见现象相符', 'references': [reference]}], 'limitations': []}
        submission = {'fingerprint': candidates.fingerprint, 'draft': draft,
            'observation_ids': {reference_id: [observed.observation_id]}}
        if case == 'unregistered_position':
            decision = {'fingerprint': candidates.fingerprint, 'observation_ids': [observed.observation_id],
                'assessment': {'candidate_id': reference_id, 'verdict': 'MATERIAL', 'categories': ['位置差异'],
                    'explanation': '主图框相对参考图向左偏移，局部可见对象相似', 'findings': ['主图框的左边界比参考图向左两像素']}}
            with pytest.raises(ValueError, match='重复追加原像素局部'):
                review.assess(job_id, main_id, decision)
            assert review.assessments(job_id, main_id) == []
            decision['assessment'].update(verdict='UNCERTAIN', categories=[],
                explanation='保留两侧标注框位置差异，但缺少可靠坐标对应，不能判定位置冲突')
            saved = review.assess(job_id, main_id, decision)
            result = review.finalize(job_id, main_id, {'fingerprint': candidates.fingerprint,
                'assessment_ids': [saved.assessment_id]})
            assert result.overall.verdict == 'UNCERTAIN'
            assert result.assessments[0].conclusion is None
            assert result.assessments[0].findings == ['主图框的左边界比参考图向左两像素']
            assert runtime.jobs.status(job_id)['completed'] == 1
        elif case == 'different_object':
            unsupported = deepcopy(submission)
            unsupported['draft']['overall'].update(verdict='MATERIAL', text='多类别')
            unsupported['draft']['assessments'][0].update(verdict='MATERIAL', conclusion='多类别', categories=['多类别'])
            with pytest.raises(ValueError, match='可比'):
                review.submit(job_id, main_id, unsupported)
            assert review.submit(job_id, main_id, submission).overall.verdict == 'EQUIVALENT'
            from iad_core.consistency.agent_results import ConsistencyAgentResults
            results = ConsistencyAgentResults(database)
            detail = results.detail(job_id, main_id)
            assert detail.original_conclusion == '多类别'
            assert detail.model_conclusion == '无冲突'
            report = results.report(job_id)
            assert report.original_conflicts == 1
            assert report.original_categories == {'多类别': 1}
            assert report.model_categories == {'无冲突': 1}
            assert report.agreement == {'一致': 0, '不一致': 1}
            gallery = results.gallery(job_id)
            assert gallery.total == 1
            assert gallery.items[0].conflict_categories == ['多类别']
            assert gallery.items[0].model_state == 'EQUIVALENT'
            assert gallery.items[0].model_conclusion == '无冲突'
        else:
            with pytest.raises(ValueError):
                review.submit(job_id, main_id, submission)
            direction = '少类别' if case == 'exact_missing' else '多类别'
            opposite = '多类别' if direction == '少类别' else '少类别'
            draft['overall'].update(verdict='MATERIAL', text=opposite)
            draft['assessments'][0].update(verdict='MATERIAL', conclusion=opposite, categories=[opposite])
            with pytest.raises(ValueError):
                review.submit(job_id, main_id, submission)
            draft['overall']['text'] = direction
            draft['assessments'][0].update(conclusion=direction, categories=[direction],
                explanation='原始像素相同，主图相对参考图的标注数量不同')
            assert review.submit(job_id, main_id, submission).overall.text == direction
    finally:
        client.close()
        runtime.close()
