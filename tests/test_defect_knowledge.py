from uuid import uuid4
import base64
import io
import json
import threading

import httpx
import pytest
from PIL import Image

from iad_core.entry import dataset_import, dataset_scan, knowledge_evidence, knowledge_get, sample_get
from iad_core.knowledge.service import KnowledgeService
from iad_core.storage.database import Database
from iad_core.workbench.vision import VlmClient
from iad_core.workbench.review import HumanReview, ReviewSubmission


@pytest.mark.parametrize('judgment_status,independent,capacity,cite_mask,foreign_lineage,expected', [
    ('supported', True, 262144, False, False, 'supported'),
    ('refuted', True, 262144, False, False, 'refuted'),
    ('insufficient', True, 262144, False, False, 'insufficient'),
    ('supported', False, 262144, False, False, 'insufficient'),
    ('supported', True, 17600, False, False, 'supported'),
    ('supported', True, 262144, True, False, 'invalid'),
    ('supported', True, 262144, False, True, 'invalid_lineage'),
])
def test_operator_verifies_annotated_defect_against_frozen_normal_knowledge(
        defect_dataset, judgment_status, independent, capacity, cite_mask, foreign_lineage, expected):
    db, dataset, original, images = defect_dataset
    db_path = db.db_path
    target_id = original['sample']['sample_id']
    calls = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            body = json.loads(request.content)
            content = body['messages'][0]['content']
            is_verification = '待核验疑点：' in content[0]['text']
            count = sum(item['type'] == 'image_url' for item in content) * 2000 if is_verification else 4000
            return httpx.Response(200, json={'count': count, 'max_model_len': capacity if is_verification else 262144})
        body = json.loads(request.content)
        content = body['messages'][0]['content']
        evidence = [json.loads(item['text'].removeprefix('视觉证据：')) for item in content
                    if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        kind = body['response_format']['json_schema']['name']
        calls.append((kind, evidence))
        if kind == 'KnowledgeVerification':
            payload = json.loads(content[0]['text'].split('待核验疑点：', 1)[1].split('\n请根据图像', 1)[0])
            assert payload['normal_version_id'] == normal['version_id']
            assert payload['checks'][0]['criterion'] == '孔内部可见背景'
            target, = payload['findings']
            assert target['proposal'] is None
            assert target['origins'][0]['annotation_id'] == original['annotations'][0]['annotation_id']
            raw, = [item for item in evidence if item['role'] == 'roi' and item['representation'] == 'raw']
            binary, = [item for item in evidence if item['representation'] == 'annotation_mask']
            assert binary['crop_bbox'] == raw['crop_bbox'] == [72, 78, 129, 163]
            assert len([item for item in evidence if item['role'] == 'overview']) == 1
            if capacity == 262144:
                assert len([item for item in evidence if item['role'] == 'normal']) == 3
            for index, item in enumerate(content):
                if item['type'] == 'text' and item['text'].startswith('视觉证据：'):
                    metadata = json.loads(item['text'].removeprefix('视觉证据：'))
                    with Image.open(io.BytesIO(base64.b64decode(content[index + 1]['image_url']['url'].split(',', 1)[1]))) as sent:
                        if metadata['evidence_id'] == raw['evidence_id']:
                            assert sent.getpixel((28, 42)) == (255, 0, 0)
                        if metadata['evidence_id'] == binary['evidence_id']:
                            assert sent.getpixel((28, 42)) == (255, 255, 255)
                            assert sent.getpixel((10, 10)) == (0, 0, 0)
            comparison = [item['evidence_id'] for item in evidence if item['role'] == 'normal']
            comparison += [eid for child in payload['child_results'] for finding in child['result']['findings']
                           for eid in finding['evidence_ids'] if eid in {item['image']['evidence_id'] for item in normal['evidence']}]
            cited = [binary['evidence_id'] if cite_mask else raw['evidence_id']]
            if independent and comparison:
                cited.append(comparison[0])
            result = {'findings': [{
                'finding_id': target['finding_id'], 'status': judgment_status, 'affected_check_titles': ['孔内外观'],
                'description': '孔内红色区域遮挡背景', 'normal_explanation': '不能仅凭红色认定材料缺陷',
                'limitations': ['合成数据'], 'evidence_ids': cited, 'conflicts': [],
            }]}
        else:
            is_defect = '已核验异常' in content[0]['text']
            support = [item['evidence_id'] for item in evidence if item['role'] == 'roi' and item['representation'] == 'raw'] if is_defect else [item['evidence_id'] for item in evidence]
            result = {'summary': '可见遮挡' if is_defect else '孔内可见背景', 'checks': [{
                'title': '孔内遮挡' if is_defect else '孔内外观', 'subject': '孔', 'location': '主体左侧',
                'criterion': '孔内出现覆盖背景的实体区域' if is_defect else '孔内部可见背景',
                'allowed_variations': ['整体亮度变化'], 'support_evidence_ids': support,
                'counter_evidence_ids': [], 'limitations': ['不能推断材料'], 'status': 'supported',
            }], 'suspects': [], 'limitations': []}
            if is_defect and foreign_lineage:
                result['revisions'] = [{'previous_check_id': normal['checks'][0]['check_id'],
                    'current_check_titles': ['孔内遮挡'], 'reason': '错误地将正常比较规则作为不良规则的父项'}]
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    service = KnowledgeService(Database(db_path), VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        first = service.start(dataset_id=dataset['dataset_id'], kind='normal', model_name='test-mllm')
        service.wait(first['run_id'], 5)
        assert service.status(first['run_id'])['status'] == 'COMPLETED'
        normal = knowledge_get({'dataset_id': dataset['dataset_id'], 'kind': 'normal'}, db_path)['knowledge']
        job = service.start(dataset_id=dataset['dataset_id'], kind='defect', normal_version_id=normal['version_id'], model_name='test-mllm')
        service.wait(job['run_id'], 5)
        finished = service.status(job['run_id'])
        if expected in ('invalid', 'invalid_lineage'):
            assert finished['status'] == 'FAILED', finished
            assert ('raw ROI' if expected == 'invalid' else 'Knowledge revisions') in finished['errors'][0]['message']
            assert knowledge_get({'dataset_id': dataset['dataset_id'], 'kind': 'defect'}, db_path)['knowledge'] is None
            return
        assert finished['status'] == 'COMPLETED', finished
        assert finished['completed'] == finished['total_samples'] == 1
        defect = knowledge_get({'version_id': finished['knowledge_version_id']}, db_path)['knowledge']
        assert defect['kind'] == 'defect'
        assert defect['normal_version_id'] == normal['version_id']
        assert defect['sources'][0]['qualification'] == 'annotated_candidate'
        finding, = defect['findings']
        assert finding['bbox'] == [80, 90, 121, 151]
        assert finding['judgment']['status'] == expected
        assert finding['affected_check_ids'] == [normal['checks'][0]['check_id']]
        check, = defect['checks']
        if expected == 'supported':
            assert check['finding_ids'] == [finding['finding_id']]
            assert check['normal_check_ids'] == [normal['checks'][0]['check_id']]
            assert check['status'] == 'supported'
        else:
            assert check['support_evidence_ids'] == []
            assert check['status'] == 'provisional'
            assert check['finding_ids'] == []
            assert defect['mining_steps'][-1]['result']['checks'][0]['status'] == 'supported'
            assert defect['mining_steps'][-1]['result']['checks'][0]['support_evidence_ids']
        if capacity == 262144:
            assert [kind for kind, _ in calls] == ['KnowledgeDraft', 'KnowledgeVerification', 'KnowledgeDraft']
        else:
            assert len(defect['verification_steps']) > 1
        for item in defect['evidence']:
            assert knowledge_evidence({'version_id': defect['version_id'], 'evidence_id': item['image']['evidence_id']}, db_path)['path']
        assert knowledge_get({'version_id': normal['version_id']}, db_path)['knowledge'] == normal
        detail = sample_get({'sample_id': target_id}, db_path)
        assert detail['annotations'] == original['annotations']
        assert detail['review_decision'] == original['review_decision']
    finally:
        service.close()


def test_defect_mining_keeps_frozen_normal_lineage_when_normal_head_changes(defect_dataset):
    db, dataset, original, images = defect_dataset
    entered, release = threading.Event(), threading.Event()
    requests = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 4000, 'max_model_len': 262144})
        body = json.loads(request.content)
        content = body['messages'][0]['content']
        evidence = [json.loads(item['text'].removeprefix('视觉证据：')) for item in content
                    if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        requests.append((body['response_format']['json_schema']['name'], evidence))
        if body['response_format']['json_schema']['name'] == 'KnowledgeVerification':
            entered.set()
            assert release.wait(5)
            payload = json.loads(content[0]['text'].split('待核验疑点：', 1)[1].split('\n请根据图像', 1)[0])
            raw = next(item for item in evidence if item['role'] == 'roi' and item['representation'] == 'raw')
            reference = next(item for item in evidence if item['role'] == 'normal')
            result = {'findings': [{'finding_id': target['finding_id'], 'status': 'supported',
                      'affected_check_titles': ['孔内外观'], 'description': '孔内遮挡', 'normal_explanation': '需排除反光',
                      'limitations': [], 'evidence_ids': [raw['evidence_id'], reference['evidence_id']], 'conflicts': []}
                      for target in payload['findings']]}
        else:
            result = {'summary': '孔内外观', 'checks': [] if '已核验异常' in content[0]['text'] else [{
                'title': '孔内外观', 'subject': '孔', 'location': '主体左侧', 'criterion': '孔内部可见背景',
                'allowed_variations': [], 'support_evidence_ids': [item['evidence_id'] for item in evidence],
                'counter_evidence_ids': [], 'limitations': [], 'status': 'supported',
            }], 'suspects': [], 'limitations': []}
            if '冻结父版本候选：' in content[0]['text']:
                parent = json.loads(content[0]['text'].split('冻结父版本候选：')[1].split('\n')[0])
                result['revisions'] = [{'previous_check_id': check['check_id'],
                    'current_check_titles': ['孔内外观'], 'reason': '重新观察后仍为同一孔内判据'} for check in parent['checks']]
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = service.start(dataset_id=dataset['dataset_id'], kind='normal', model_name='test-mllm')
        service.wait(job['run_id'], 5)
        normal = knowledge_get({'dataset_id': dataset['dataset_id'], 'kind': 'normal'}, db.db_path)['knowledge']
        foreign_images, foreign_labels = images.parent / 'other-images', images.parent / 'other-labels'
        foreign_images.mkdir()
        foreign_labels.mkdir()
        Image.new('RGB', (100, 100), 'gray').save(foreign_images / 'part.png')
        foreign = dataset_import({'name': '另一数据集', 'image_dir': str(foreign_images), 'annotation_dir': str(foreign_labels)}, db.db_path)
        with pytest.raises(ValueError, match='same dataset'):
            service.start(dataset_id=foreign['dataset_id'], kind='defect', normal_version_id=normal['version_id'])
        with pytest.raises(ValueError, match='normal_version_id'):
            service.start(dataset_id=dataset['dataset_id'], kind='defect')
        with pytest.raises(ValueError, match='normal_version_id'):
            service.start(dataset_id=dataset['dataset_id'], kind='normal', normal_version_id=normal['version_id'])
        with pytest.raises(ValueError, match='eligible'):
            service.start(dataset_id=dataset['dataset_id'], kind='defect', normal_version_id=normal['version_id'],
                          sample_ids=[dataset['dataset_id'] + ':part-0.png'])
        defect_job = service.start(dataset_id=dataset['dataset_id'], kind='defect', normal_version_id=normal['version_id'], model_name='test-mllm')
        assert entered.wait(3)
        Image.new('RGB', (320, 240), 'white').save(images / 'part-0.png')
        changed_job = service.start(dataset_id=dataset['dataset_id'], kind='normal', model_name='test-mllm')
        service.wait(changed_job['run_id'], 5)
        changed = knowledge_get({'dataset_id': dataset['dataset_id'], 'kind': 'normal'}, db.db_path)['knowledge']
        assert changed['version_id'] != normal['version_id']
        release.set()
        service.wait(defect_job['run_id'], 5)
        status = service.status(defect_job['run_id'])
        assert status['status'] == 'COMPLETED', status
        defect = knowledge_get({'version_id': status['knowledge_version_id']}, db.db_path)['knowledge']
        assert defect['normal_version_id'] == normal['version_id']
        assert {item['image']['evidence_id'] for item in normal['evidence']} <= {item['image']['evidence_id'] for item in defect['evidence']}
        previous_count = len(requests)
        again = service.start(dataset_id=dataset['dataset_id'], kind='defect', normal_version_id=normal['version_id'], model_name='test-mllm')
        service.wait(again['run_id'], 5)
        assert service.status(again['run_id'])['knowledge_version_id'] == defect['version_id']
        assert len(requests) == previous_count
        next_job = service.start(dataset_id=dataset['dataset_id'], kind='defect', normal_version_id=changed['version_id'], model_name='test-mllm')
        service.wait(next_job['run_id'], 5)
        next_status = service.status(next_job['run_id'])
        assert next_status['status'] == 'COMPLETED', next_status
        successor = knowledge_get({'version_id': next_status['knowledge_version_id']}, db.db_path)['knowledge']
        assert successor['parent_version_id'] == defect['version_id']
        assert successor['normal_version_id'] == changed['version_id']
        assert successor['signature'] != defect['signature']
        assert knowledge_get({'version_id': defect['version_id']}, db.db_path)['knowledge'] == defect
        with pytest.raises(ValueError, match='usable normal'):
            service.start(dataset_id=dataset['dataset_id'], kind='defect', normal_version_id=defect['version_id'])
    finally:
        release.set()
        service.close()


def test_defect_mining_rejects_normal_version_without_usable_checks(defect_dataset):
    db, dataset, _, _ = defect_dataset

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 2000, 'max_model_len': 262144})
        result = {'summary': '不能建立正常共识', 'checks': [], 'suspects': [], 'limitations': ['需补充独立来源']}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = service.start(dataset_id=dataset['dataset_id'], kind='normal', model_name='test-mllm')
        service.wait(job['run_id'], 5)
        status = service.status(job['run_id'])
        assert status['status'] == 'COMPLETED', status
        with pytest.raises(ValueError, match='usable normal'):
            service.start(dataset_id=dataset['dataset_id'], kind='defect', normal_version_id=status['knowledge_version_id'])
        assert all(job['kind'] == 'normal' for job in service.list(dataset['dataset_id']))
    finally:
        service.close()


@pytest.mark.parametrize('source_kind', ['normal_suspect', 'human_fail'])
def test_operator_can_mine_unannotated_suspects_without_inventing_annotation_provenance(defect_dataset, source_kind):
    db, dataset, original, images = defect_dataset
    (images.parent / 'labels' / 'part-3.json').unlink()
    dataset_scan({'dataset_id': dataset['dataset_id']}, db.db_path)
    target_id = original['sample']['sample_id']
    if source_kind == 'human_fail':
        review = HumanReview(db)
        review.submit(ReviewSubmission(submission_id=uuid4(), dataset_id=dataset['dataset_id'], reviewer='operator', sample_id=target_id, decision='FAIL'))
    baseline = sample_get({'sample_id': target_id}, db.db_path)

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 4000, 'max_model_len': 262144})
        body = json.loads(request.content)
        content = body['messages'][0]['content']
        evidence = [json.loads(item['text'].removeprefix('视觉证据：')) for item in content
                    if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        if body['response_format']['json_schema']['name'] == 'KnowledgeVerification':
            payload = json.loads(content[0]['text'].split('待核验疑点：', 1)[1].split('\n请根据图像', 1)[0])
            raw = next(item for item in evidence if item['role'] == 'roi')
            reference = next(item for item in evidence if item['role'] == 'normal' and item['source_sha256'] != raw['source_sha256'])
            result = {'findings': [{'finding_id': target['finding_id'], 'status': 'supported',
                      'affected_check_titles': ['孔内外观'], 'description': '孔内遮挡', 'normal_explanation': '需排除反光',
                      'limitations': [], 'evidence_ids': [raw['evidence_id'], reference['evidence_id']], 'conflicts': []}
                      for target in payload['findings']]}
        else:
            is_defect = '已核验异常' in content[0]['text']
            result = {'summary': '孔内外观', 'checks': [] if is_defect else [{
                'title': '孔内外观', 'subject': '孔', 'location': '主体左侧', 'criterion': '孔内部可见背景',
                'allowed_variations': [], 'support_evidence_ids': [item['evidence_id'] for item in evidence],
                'counter_evidence_ids': [], 'limitations': [], 'status': 'supported',
            }], 'suspects': [{'evidence_id': evidence[-1]['evidence_id'], 'bbox_1000': [250,375,375,625],
                              'description': '红色区域', 'normal_explanation': '可能为反光'}]
                            if not is_defect and source_kind == 'normal_suspect' else [], 'limitations': []}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        normal_job = service.start(dataset_id=dataset['dataset_id'], kind='normal', model_name='test-mllm')
        service.wait(normal_job['run_id'], 5)
        normal_status = service.status(normal_job['run_id'])
        assert normal_status['status'] == 'COMPLETED', normal_status
        normal = knowledge_get({'version_id': normal_status['knowledge_version_id']}, db.db_path)['knowledge']
        job = service.start(dataset_id=dataset['dataset_id'], kind='defect', normal_version_id=normal['version_id'], model_name='test-mllm')
        service.wait(job['run_id'], 5)
        status = service.status(job['run_id'])
        assert status['status'] == 'COMPLETED', status
        defect = knowledge_get({'version_id': status['knowledge_version_id']}, db.db_path)['knowledge']
        assert [(item['sample_id'], item['qualification']) for item in defect['sources']] == [(target_id, source_kind)]
        finding, = defect['findings']
        assert finding['judgment']['status'] == 'supported'
        if source_kind == 'normal_suspect':
            assert finding['origin_finding_id'] == normal['findings'][0]['finding_id']
            assert finding['bbox'] == [80, 90, 120, 150]
            assert finding['proposal'] == normal['findings'][0]['proposal']
        else:
            assert finding['proposal'] is None
            assert finding['origins'][0]['source'] == 'coverage'
        assert all(item['annotation_id'] is None for item in finding['origins'])
        assert sample_get({'sample_id': target_id}, db.db_path)['review_decision'] == baseline['review_decision']
        assert sample_get({'sample_id': target_id}, db.db_path)['annotations'] == []
    finally:
        service.close()
