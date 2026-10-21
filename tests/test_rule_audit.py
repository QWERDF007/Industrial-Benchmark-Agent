from tests.knowledge_scenarios import selected_group
import json

import httpx
import pytest
from PIL import Image, ImageDraw

from iad_core.entry import audit_evidence, knowledge_get, sample_get
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


@pytest.mark.parametrize('detail_label,other_missing,expected', [
    ('PASS', [], 'PASS'),
    ('FAIL', [], 'FAIL'),
    ('PASS', ['主体背面被遮挡，当前图像无法核验'], 'UNCERTAIN'),
])
def test_learned_check_requests_actual_target_detail_and_keeps_rule_provenance(dataset, mllm_api, detail_label, other_missing, expected, finding_response):
    db, _, config = dataset
    normal = knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge']
    check_id = normal['checks'][0]['check_id']
    target = config.dataset.id + ':dent.png'
    before = sample_get({'sample_id': target}, db.db_path)
    with Image.open(config.root + '/dent.png') as image:
        ImageDraw.Draw(image).rectangle((190, 100, 210, 120), fill='red')
        image.save(config.root + '/dent.png')
    calls = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 4000, 'max_model_len': 262144})
        body = json.loads(request.content)
        views = [json.loads(part['text'][5:]) for part in body['messages'][0]['content']
                 if part['type'] == 'text' and part['text'].startswith('视觉证据：')]
        calls.append(views)
        detail = next((view for view in views if view['crop_bbox'] == [144, 36, 256, 204]), None)
        view = {'description': '主体中部有红色区域，建议复核', 'position_analysis': '主体中部', 'illumination_analysis': '需排除反光'}
        answer = {**view, 'suggested_label': detail_label if detail else 'UNCERTAIN', 'reason_category': 'SURFACE_CHANGE', 'confidence': 0.8,
            'evidence_ids': [item['evidence_id'] for item in views], 'global_view': view,
            'missing_evidence': [] if detail else other_missing,
            'findings': [{**finding_response, 'check_ids': [check_id], 'evidence_ids': [views[0]['evidence_id']]}] if detail and detail_label == 'FAIL' else [],
            'region_observations': [{**view, 'region_index': index} for index, _ in enumerate(
                [item for item in views if item['role'] == 'roi' and item['representation'] == 'raw'], 1)],
            'check_assessments': [{**view, 'check_id': check_id, 'status': ('anomaly' if detail_label == 'FAIL' else 'normal') if detail else 'insufficient',
                'evidence_ids': [detail['evidence_id'] if detail else views[0]['evidence_id']], 'limitations': [],
                'inspection_regions': [] if detail else [{'bbox_1000': [500, 250, 750, 750], 'reason': '核实规则所指表面'}]}]}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(answer)}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(job['run_id'], 5)
        status = runtime.audit.status(job['run_id'])
        assert status['status'] == 'COMPLETED', status
        detail = sample_get({'sample_id': target}, db.db_path)
        analysis = detail['suggestion']['analysis']
        assert len(calls) == 2
        assert len(calls[0]) == 3
        assert len(calls[1]) == 2, '只追加缺少的ROI，不重复发送已分析的局部图和Mask'
        assert analysis['check_assessments'][0]['check_id'] == check_id
        assert analysis['check_assessments'][0]['status'] == ('anomaly' if detail_label == 'FAIL' else 'normal')
        assert analysis['conclusion']['suggested_label'] == expected
        assert set(other_missing) <= set(analysis['conclusion']['missing_evidence'])
        roi, = [region for region in analysis['regions'] if region['crop_bbox'] == [144, 36, 256, 204]]
        assert roi['bbox'] == [160, 60, 240, 180]
        assert roi['origins'][0]['check_ids'] == [check_id]
        media = audit_evidence({'suggestion_id': detail['suggestion']['suggestion_id'], 'evidence_id': roi['image']['evidence_id']}, db.db_path)
        with Image.open(media['path']) as image:
            assert image.size == (112, 168)
            assert image.getpixel((56, 74)) == (255, 0, 0)
        assert detail['annotations'] == before['annotations']
        assert detail['review_decision'] == before['review_decision']
    finally:
        runtime.close()


@pytest.mark.parametrize('case,error', [
    ('missing', 'every frozen check'),
    ('duplicate', 'every frozen check'),
    ('unknown_check', 'every frozen check'),
    ('unknown_evidence', 'unknown visual evidence'),
    ('unknown_region_check', 'unknown check'),
    ('mask_only', 'raw visual evidence'),
])
def test_invalid_rule_coverage_or_evidence_cannot_be_saved(dataset, mllm_api, case, error):
    db, _, config = dataset
    client, _, responses = mllm_api
    check_id = knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge']['checks'][0]['check_id']

    def reply(request):
        if not request.url.path.endswith('/chat/completions'):
            return
        body = json.loads(request.content)
        views = [json.loads(part['text'][5:]) for part in body['messages'][0]['content']
                 if part['type'] == 'text' and part['text'].startswith('视觉证据：')]
        assessment = {**responses['ViewAnalysis'], 'check_id': check_id, 'status': 'normal', 'evidence_ids': [views[0]['evidence_id']]}
        if case == 'unknown_check':
            assessment['check_id'] = 'another_product_check'
        if case == 'unknown_evidence':
            assessment['evidence_ids'] = ['not_sent_to_model']
        if case == 'mask_only':
            assessment['evidence_ids'] = [next(view['evidence_id'] for view in views if view['representation'] == 'annotation_mask')]
        if case == 'unknown_region_check':
            assessment['inspection_regions'] = [{'bbox_1000': [100, 100, 200, 200], 'reason': '待细看', 'check_ids': ['another_product_check']}]
        responses['CheckAssessments'] = [] if case == 'missing' else [assessment] * (2 if case == 'duplicate' else 1)

    client.event_hooks['request'].append(reply)
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))
    target = config.dataset.id + ':dent.png'
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(job['run_id'], 5)
        status = runtime.audit.status(job['run_id'])
        assert status['status'] == 'FAILED', status
        assert error in status['errors'][0]['message']
        assert sample_get({'sample_id': target}, db.db_path)['suggestion'] is None
    finally:
        runtime.close()


@pytest.mark.parametrize('check_status,expected', [('normal', 'PASS'), ('anomaly', 'UNCERTAIN'), ('insufficient', 'UNCERTAIN'), ('not_applicable', 'UNCERTAIN')])
def test_overall_pass_requires_applicable_observable_rules_without_conflict(dataset, mllm_api, check_status, expected):
    db, _, config = dataset
    client, _, responses = mllm_api
    check_id = knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge']['checks'][0]['check_id']

    def reply(request):
        if request.url.path.endswith('/chat/completions'):
            content = json.loads(request.content)['messages'][0]['content']
            overview = next(json.loads(part['text'][5:]) for part in content if part['type'] == 'text' and part['text'].startswith('视觉证据：'))
            responses['CheckAssessments'] = [{**responses['ViewAnalysis'], 'check_id': check_id,
                'status': check_status, 'evidence_ids': [overview['evidence_id']]}]

    client.event_hooks['request'].append(reply)
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))
    target = config.dataset.id + ':dent.png'
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(job['run_id'], 5)
        assert runtime.audit.status(job['run_id'])['status'] == 'COMPLETED'
        analysis = sample_get({'sample_id': target}, db.db_path)['suggestion']['analysis']
        assert analysis['conclusion']['suggested_label'] == expected
        assert analysis['check_assessments'][0]['status'] == check_status
        assert analysis['joint_steps'][-1]['result']['suggested_label'] == 'PASS'
        if expected == 'UNCERTAIN':
            assert analysis['conclusion']['conflicts'] or analysis['conclusion']['missing_evidence']
    finally:
        runtime.close()


@pytest.mark.parametrize('provisional_status,expected', [('not_applicable', 'PASS'), ('normal', 'UNCERTAIN'), ('anomaly', 'UNCERTAIN')])
def test_unverified_rule_blocks_only_when_applicable_to_target(dataset, mllm_api, provisional_status, expected):
    db, _, config = dataset
    client, _, responses = mllm_api
    old = knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge']
    responses['KnowledgeDraft']['checks'].append({**responses['KnowledgeDraft']['checks'][0],
        'title': '额外部件', 'subject': '可选部件', 'criterion': '部件表面可见', 'status': 'provisional'})
    responses['KnowledgeDraft']['revisions'] = [{'previous_check_id': old['checks'][0]['check_id'],
        'current_check_titles': ['表面外观'], 'reason': '延续正常判据'}]
    if provisional_status == 'anomaly':
        responses['VlmResult']['suggested_label'] = 'FAIL'
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))
    target = config.dataset.id + ':dent.png'
    try:
        mining = runtime.knowledge.start(request=selected_group(runtime.knowledge.db, config.dataset.id, kind='normal', knowledge_preset=[old['version_id']]), kind='normal', model_name='model-with-additional-rule')
        runtime.knowledge.wait(mining['run_id'], 5)
        assert runtime.knowledge.status(mining['run_id'])['status'] == 'COMPLETED'

        def reply(request):
            if request.url.path.endswith('/chat/completions'):
                content = json.loads(request.content)['messages'][0]['content']
                checks = json.loads(content[0]['text'].split('冻结知识：')[1].split('\n')[0])['checks']
                overview = next(json.loads(part['text'][5:]) for part in content if part['type'] == 'text' and part['text'].startswith('视觉证据：'))
                responses['CheckAssessments'] = [{**responses['ViewAnalysis'], 'check_id': check['check_id'],
                    'status': provisional_status if check['title'] == '额外部件' else 'normal', 'evidence_ids': [overview['evidence_id']]} for check in checks]

        client.event_hooks['request'].append(reply)
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(job['run_id'], 5)
        assert runtime.audit.status(job['run_id'])['status'] == 'COMPLETED'
        analysis = sample_get({'sample_id': target}, db.db_path)['suggestion']['analysis']
        assert analysis['conclusion']['suggested_label'] == expected
        provisional = next(item for item in analysis['check_assessments'] if item['check_id'] != old['checks'][0]['check_id'])
        assert provisional['status'] == ('not_applicable' if provisional_status == 'not_applicable' else 'insufficient')
    finally:
        runtime.close()


def test_anomalous_rule_in_a_child_batch_is_not_erased_by_overall_pass(dataset, mllm_api):
    from iad_core.entry import dataset_scan
    db, _, config = dataset
    client, _, responses = mllm_api
    check_id = knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge']['checks'][0]['check_id']
    Image.new('RGB', (6000, 1800), 'blue').save(config.root + '/large.png')
    dataset_scan({'dataset_id': config.dataset.id}, db.db_path)
    responses['Tokenize'] = {'tokens_per_image': 1000, 'max_model_len': 26000}
    calls = []

    def reply(request):
        if request.url.path.endswith('/chat/completions'):
            content = json.loads(request.content)['messages'][0]['content']
            calls.append(content)
            overview = next(json.loads(part['text'][5:]) for part in content if part['type'] == 'text' and part['text'].startswith('视觉证据：'))
            responses['CheckAssessments'] = [{**responses['ViewAnalysis'], 'check_id': check_id,
                'status': 'anomaly' if len(calls) == 1 else 'normal', 'evidence_ids': [overview['evidence_id']]}]

    client.event_hooks['request'].append(reply)
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))
    target = config.dataset.id + ':large.png'
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(job['run_id'], 10)
        assert runtime.audit.status(job['run_id'])['status'] == 'COMPLETED'
        analysis = sample_get({'sample_id': target}, db.db_path)['suggestion']['analysis']
        assert len(calls) == 3
        assert analysis['joint_steps'][0]['result']['check_assessments'][0]['status'] == 'anomaly'
        assert analysis['joint_steps'][-1]['result']['check_assessments'][0]['status'] == 'normal'
        assert analysis['check_assessments'][0]['status'] == 'insufficient'
        assert analysis['conclusion']['suggested_label'] == 'UNCERTAIN'
        assert any(check_id in item for item in analysis['conclusion']['conflicts'])
    finally:
        runtime.close()
