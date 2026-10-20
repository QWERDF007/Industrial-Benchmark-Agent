import base64
import io
import json
import os
from pathlib import Path

import httpx
import pytest
from PIL import Image, ImageDraw

from iad_core.entry import dataset_import, knowledge_evidence, knowledge_get, sample_get
from iad_core.knowledge.service import KnowledgeService
from iad_core.storage.database import Database
from iad_core.workbench.vision import VlmClient
from iad_core.workbench.review import HumanReview, ReviewSubmission


@pytest.fixture
def large_mask_dataset(tmp_path, request):
    with_reference_mask = getattr(request, 'param', False)
    images, labels = tmp_path / 'images', tmp_path / 'labels'
    images.mkdir()
    labels.mkdir()
    for index in range(3):
        image = Image.new('RGB', (2400, 1200), (180 + index,) * 3)
        ImageDraw.Draw(image).rectangle((200, 200, 2200, 1000), outline='black', width=10)
        if index == 2:
            ImageDraw.Draw(image).rectangle((2290, 1140, 2310, 1160), fill='red')
        image.save(images / f'part-{index}.png')
    mask = io.BytesIO()
    Image.new('L', (2400, 1200), 255).save(mask, 'PNG')
    (labels / 'part-2.json').write_text(json.dumps({'imageWidth': 2400, 'imageHeight': 1200, 'shapes': [{
        'shape_type': 'mask', 'label': '待核实表面', 'points': [[0, 0], [2399, 1199]],
        'mask': base64.b64encode(mask.getvalue()).decode(),
    }]}))
    if with_reference_mask:
        (labels / 'part-0.json').write_text((labels / 'part-2.json').read_text())
    db_path = str(tmp_path / 'knowledge.db')
    dataset = dataset_import({'name': '几何部件', 'image_dir': str(images), 'annotation_dir': str(labels)}, db_path)
    target_id = dataset['dataset_id'] + ':part-2.png'
    if with_reference_mask:
        review = HumanReview(Database(db_path))
        session = review.start(dataset['dataset_id'], 'operator', dataset['dataset_id'])
        review.submit(ReviewSubmission(session_id=session['session_id'], sample_id=dataset['dataset_id'] + ':part-0.png', decision='PASS'))
    original = sample_get({'sample_id': target_id}, db_path)
    return db_path, dataset, target_id, original, with_reference_mask


@pytest.fixture
def large_mask_mining(large_mask_dataset):
    db_path, dataset, target_id, original, with_reference_mask = large_mask_dataset
    actual = []
    comparisons = set()
    rejected = []
    responses = {'scenario': 'complete'}
    capacity = 19600 if with_reference_mask else 17200

    def respond(request):
        body = json.loads(request.content)
        content = body['messages'][0]['content']
        evidence = [json.loads(part['text'][5:]) for part in content
                    if part['type'] == 'text' and part['text'].startswith('视觉证据：')]
        verification = '待核验疑点：' in content[0]['text']
        if request.url.path.endswith('/tokenize'):
            count = len(evidence) * 2000 if verification else 1000
            if verification and responses['scenario'] == 'no_combine':
                payload = json.loads(content[0]['text'].split('待核验疑点：', 1)[1].split('\n请根据图像', 1)[0])
                if payload['child_results']:
                    count = capacity
            if verification and count + 8192 > capacity:
                rejected.append(len(evidence))
            return httpx.Response(200, json={'count': count, 'max_model_len': capacity if verification else 262144})
        if body['response_format']['json_schema']['name'] == 'KnowledgeVerification':
            payload = json.loads(content[0]['text'].split('待核验疑点：', 1)[1].split('\n请根据图像', 1)[0])
            target, = payload['findings']
            actual.append((payload, evidence))
            raw = [item for item in evidence if item['role'] == 'roi' and item['representation'] == 'raw']
            target_raw = [item for item in raw if item['evidence_id'] in {region['image']['evidence_id'] for region in target['regions']}]
            assert target_raw
            for item in target_raw:
                binary = next(view for view in evidence if view['representation'] == 'annotation_mask'
                              and view['source_sha256'] == item['source_sha256'] and view['crop_bbox'] == item['crop_bbox'])
                assert item['sent_size'] == binary['sent_size']
            red = next((item for item in target_raw if item['crop_bbox'][0] <= 2300 < item['crop_bbox'][2]
                        and item['crop_bbox'][1] <= 1150 < item['crop_bbox'][3]), None)
            if red:
                position = next(i for i, part in enumerate(content) if part['type'] == 'text'
                                and part['text'].startswith('视觉证据：') and red['evidence_id'] in part['text'])
                with Image.open(io.BytesIO(base64.b64decode(content[position + 1]['image_url']['url'].split(',', 1)[1]))) as sent:
                    assert sent.getpixel((2300 - red['crop_bbox'][0], 1150 - red['crop_bbox'][1])) == (255, 0, 0)
            normal = [item for item in evidence if item['source_sha256'] != target_raw[0]['source_sha256']
                      and item['representation'] == 'raw']
            comparisons.update(item['evidence_id'] for item in normal)
            earlier = [judgment for child in payload['child_results'] for judgment in child['result']['findings']]
            supported = red is not None or any(item['status'] == 'supported' for item in earlier)
            cited = [red['evidence_id'] if red else target_raw[0]['evidence_id']]
            cited.extend(item['evidence_id'] for item in normal)
            cited.extend(eid for judgment in earlier for eid in judgment['evidence_ids'])
            result = {'findings': [{'finding_id': target['finding_id'], 'status': 'supported' if supported else 'insufficient',
                'affected_check_titles': ['表面形态'], 'description': '右下角有可见红色覆盖' if supported else '当前分块不足以排除其他部位异常',
                'normal_explanation': '需排除有色反光', 'limitations': ['部分分块未见异常不表示整体已排除'],
                'evidence_ids': list(dict.fromkeys(cited)), 'conflicts': []}]}
            if responses['scenario'] == 'lossy_parent' and payload['child_results']:
                result['findings'][0].update(status='refuted', affected_check_titles=[], limitations=[],
                    evidence_ids=[target_raw[0]['evidence_id']])
            if responses['scenario'] == 'child_conflict' and red and not payload['child_results']:
                result['findings'][0]['conflicts'] = ['局部颜色与正常比较存在未消解分歧']
        else:
            defect = '已核验异常' in content[0]['text']
            result = {'summary': '可观察的表面形态', 'checks': [{
                'title': '局部覆盖' if defect else '表面形态', 'subject': '主体', 'location': '全表面',
                'criterion': '表面存在局部覆盖区域' if defect else '表面为连续背景', 'allowed_variations': ['亮度变化'],
                'support_evidence_ids': [item['evidence_id'] for item in evidence if item['representation'] == 'raw'
                                         and (defect or item['role'] == 'normal' or with_reference_mask)],
                'counter_evidence_ids': [], 'limitations': [], 'status': 'supported',
            }], 'suspects': [], 'limitations': []}
        return httpx.Response(200, json={'choices': [{'message': {'content': json.dumps(result)}}]})

    service = KnowledgeService(Database(db_path), VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        initial = service.start(dataset_id=dataset['dataset_id'], kind='normal')
        service.wait(initial['run_id'], 15)
        assert service.status(initial['run_id'])['status'] == 'COMPLETED'
        normal = knowledge_get({'dataset_id': dataset['dataset_id'], 'kind': 'normal'}, db_path)['knowledge']
        yield service, dataset, target_id, original, normal, actual, comparisons, rejected, responses, db_path
    finally:
        service.close()


@pytest.mark.parametrize('large_mask_dataset,scenario', [(False, 'complete'), (False, 'lossy_parent'),
    (False, 'child_conflict'), (True, 'complete')], indirect=['large_mask_dataset'])
def test_one_large_mask_finding_is_verified_in_full_without_splitting_mask_from_pixels(large_mask_mining, scenario):
    service, dataset, target_id, original, normal, actual, comparisons, rejected, responses, db_path = large_mask_mining
    responses['scenario'] = scenario
    mining = service.start(dataset_id=dataset['dataset_id'], kind='defect', sample_ids=[target_id], normal_version_id=normal['version_id'])
    service.wait(mining['run_id'], 30)
    status = service.status(mining['run_id'])
    assert status['status'] == 'COMPLETED', status
    snapshot = knowledge_get({'version_id': status['knowledge_version_id']}, db_path)['knowledge']
    finding, = snapshot['findings']
    assert finding['bbox'] == [0, 0, 2400, 1200]
    assert finding['judgment']['status'] == ('supported' if scenario == 'complete' else 'insufficient')
    expected = {(0, 0, 1024, 1024), (688, 0, 1712, 1024), (1376, 0, 2400, 1024),
                (0, 176, 1024, 1200), (688, 176, 1712, 1200), (1376, 176, 2400, 1200)}
    observed = {tuple(region['crop_bbox']) for payload, evidence in actual for target in payload['findings']
                for region in target['regions'] if region['image']['representation'] == 'raw'}
    assert observed == expected
    assert {tuple(region['crop_bbox']) for region in finding['regions']} == expected
    assert len(rejected) > 0 and len(actual) > 1
    assert all(len(evidence) <= (5 if normal['sources'][0]['qualification'] == 'human_pass' else 4) for _, evidence in actual)
    if normal['sources'][0]['qualification'] == 'human_pass':
        masked_sha = normal['sources'][0]['sha256']
        for _, supplied in actual:
            for item in supplied:
                if item['role'] == 'roi' and item['source_sha256'] == masked_sha:
                    assert {view['representation'] for view in supplied if view['source_sha256'] == masked_sha
                            and view['crop_bbox'] == item['crop_bbox']} == {'raw', 'annotation_mask'}
    assert len(comparisons) >= 2
    assert any(step['child_step_ids'] for step in snapshot['verification_steps'])
    assert snapshot['checks'][0]['status'] == ('supported' if scenario == 'complete' else 'provisional')
    assert finding['judgment']['affected_check_titles'] == ['表面形态']
    assert '部分分块未见异常不表示整体已排除' in finding['judgment']['limitations']
    assert comparisons <= set(finding['judgment']['evidence_ids'])
    if scenario == 'child_conflict':
        assert '局部颜色与正常比较存在未消解分歧' in finding['judgment']['conflicts']
    if scenario == 'lossy_parent':
        assert snapshot['verification_steps'][-1]['result']['findings'][0]['affected_check_titles'] == []
    for region in finding['regions']:
        assert knowledge_evidence({'version_id': snapshot['version_id'], 'evidence_id': region['image']['evidence_id']}, db_path)['path']
    after = sample_get({'sample_id': target_id}, db_path)
    assert after['annotations'] == original['annotations']
    assert after['review_decision'] == original['review_decision']
    assert knowledge_get({'version_id': normal['version_id']}, db_path)['knowledge'] == normal


@pytest.mark.skipif(os.environ.get('IAD_RUN_LIVE_MLLM') != '1', reason='Explicit live MLLM opt-in required')
def test_live_tiled_mask_knowledge_uses_real_joint_evidence(large_mask_dataset):
    db_path, dataset, target_id, original, with_reference_mask = large_mask_dataset
    service = KnowledgeService(Database(db_path))
    try:
        initial = service.start(dataset_id=dataset['dataset_id'], kind='normal')
        service.wait(initial['run_id'], 180)
        first_status = service.status(initial['run_id'])
        assert first_status['status'] == 'COMPLETED', first_status
        normal = knowledge_get({'version_id': first_status['knowledge_version_id']}, db_path)['knowledge']
        assert any(check['status'] == 'supported' for check in normal['checks'])
        job = service.start(dataset_id=dataset['dataset_id'], kind='defect', normal_version_id=normal['version_id'])
        service.wait(job['run_id'], 240)
        status = service.status(job['run_id'])
        assert status['status'] == 'COMPLETED', status
        snapshot = knowledge_get({'version_id': status['knowledge_version_id']}, db_path)['knowledge']
        finding, = snapshot['findings']
        raw = [region['image'] for region in finding['regions'] if region['image']['representation'] == 'raw']
        binary = [region['image'] for region in finding['regions'] if region['image']['representation'] == 'annotation_mask']
        assert len(raw) == len(binary) == 6
        viewed = {eid for step in snapshot['verification_steps'] for eid in step['input_evidence_ids']}
        assert {item['evidence_id'] for item in raw + binary} <= viewed
        assert finding['judgment']['evidence_ids']
        for evidence in raw + binary:
            media = knowledge_evidence({'version_id': snapshot['version_id'], 'evidence_id': evidence['evidence_id']}, db_path)
            with Image.open(media['path']) as sent:
                assert list(sent.size) == evidence['sent_size']
                assert max(sent.size) <= 1024
        assert knowledge_get({'version_id': normal['version_id']}, db_path)['knowledge'] == normal
        after = sample_get({'sample_id': target_id}, db_path)
        assert after['annotations'] == original['annotations']
        assert after['review_decision'] == original['review_decision']
        Path(db_path).with_suffix('.verification.json').write_text(json.dumps({
            'normal': normal, 'defect': snapshot, 'jobs': [first_status, status],
            'quality': 'unassessed; synthetic MLLM contract test, not an accuracy evaluation'}, ensure_ascii=False))
    finally:
        service.close()


def test_uncombinable_partial_mask_observations_are_retained_without_publishing_knowledge(large_mask_mining):
    service, dataset, target_id, original, normal, actual, _, _, responses, db_path = large_mask_mining
    responses['scenario'] = 'no_combine'
    mining = service.start(dataset_id=dataset['dataset_id'], kind='defect', normal_version_id=normal['version_id'])
    service.wait(mining['run_id'], 30)
    status = service.status(mining['run_id'])
    assert status['status'] == 'FAILED', status
    assert any('cannot combine knowledge verification results' in error['message'] for error in status['errors'])
    assert status['completed'] == 0
    assert len(status['verification_steps']) >= 2
    assert actual
    assert knowledge_get({'dataset_id': dataset['dataset_id'], 'kind': 'defect'}, db_path)['knowledge'] is None
    assert knowledge_get({'version_id': normal['version_id']}, db_path)['knowledge'] == normal
    after = sample_get({'sample_id': target_id}, db_path)
    assert after['annotations'] == original['annotations']
    assert after['review_decision'] == original['review_decision']
