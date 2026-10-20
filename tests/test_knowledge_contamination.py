import base64
import io
import json
from pathlib import Path

import httpx
import pytest
from PIL import Image, ImageDraw

from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.entry import knowledge_evidence, knowledge_get, sample_get
from iad_core.knowledge.service import KnowledgeService
from iad_core.storage.database import Database
from iad_core.storage.models import ReviewDecisionRecord
from iad_core.storage.repositories import ReviewRepository
from iad_core.workbench.vision import VlmClient


@pytest.mark.parametrize('judgment_status,independent,expected_status,support_count,has_counter,rule_status,capacity,annotated_roi', [
    ('supported', True, 'supported', 3, True, 'supported', 262144, False),
    ('refuted', True, 'refuted', 4, False, 'supported', 262144, False),
    ('insufficient', True, 'insufficient', 3, True, 'conflicted', 262144, False),
    ('refuted', False, 'insufficient', 3, True, 'conflicted', 262144, False),
    ('supported', True, 'supported', 3, True, 'supported', 15600, False),
    ('supported', True, 'supported', 3, True, 'supported', 262144, True),
])
def test_operator_can_locate_contaminated_normal_source_without_changing_human_truth(
        tmp_path, judgment_status, independent, expected_status, support_count, has_counter, rule_status, capacity, annotated_roi):
    images, labels = tmp_path / 'images', tmp_path / 'labels'
    images.mkdir()
    labels.mkdir()
    for index in range(4):
        image = Image.new('RGB', (320, 240), '#cccccc')
        draw = ImageDraw.Draw(image)
        draw.rectangle((40, 60, 280, 180), fill='#333333')
        for x in (100, 220):
            draw.ellipse((x-15, 105, x+15, 135), fill='#cccccc')
        if index == 3:
            draw.rectangle((90, 110, 110, 130), fill='red')
        image.save(images / f'part-{index}.png')
    if annotated_roi:
        (labels/'part-3.json').write_text(json.dumps({'imageWidth':320,'imageHeight':240,'shapes':[
            {'label':'待观察区域','shape_type':'rectangle','points':[[80,90],[120,150]]}]}))
    db = Database(str(tmp_path / 'knowledge.db'))
    config = DatasetRegistry(db).import_labelme(DatasetImport(name='孔板', image_dir=str(images), annotation_dir=str(labels)))
    target_id = config.dataset.id+':part-3.png'
    if annotated_roi:
        ReviewRepository(db).append_decision(ReviewDecisionRecord(sample_id=target_id, decision='PASS', reviewer='operator'))
    original = sample_get({'sample_id':target_id}, db.db_path)
    calls = []
    initial = []

    def respond(request):
        body = json.loads(request.content)
        if request.url.path.endswith('/tokenize'):
            content = body['messages'][0]['content']
            if '待核验疑点：' in content[0]['text']:
                count = sum(item['type']=='image_url' for item in content)*2000
                return httpx.Response(200, json={'count':count, 'max_model_len':capacity})
            return httpx.Response(200, json={'count': 4000, 'max_model_len': 262144})
        content = body['messages'][0]['content']
        evidence = [json.loads(item['text'].removeprefix('视觉证据：')) for item in content
                    if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        kind = body['response_format']['json_schema']['name']
        calls.append((kind, evidence))
        if kind == 'KnowledgeDraft':
            initial.extend(evidence)
            result = {'summary': '孔内出现与共识不同的区域', 'checks': [{
                'title': '孔内外观', 'subject': '孔', 'location': '主体中部', 'criterion': '孔内部为背景色',
                'allowed_variations': ['整体亮度改变'], 'support_evidence_ids': [e['evidence_id'] for e in evidence],
                'counter_evidence_ids': [], 'limitations': [], 'status': 'supported',
            }], 'suspects': [{'evidence_id': evidence[-1]['evidence_id'],
                             'bbox_1000': [250,375,750,625] if annotated_roi else [250,375,375,625],
                             'description': '孔内红色区域', 'normal_explanation': '可能是有色反射'}], 'limitations': []}
        else:
            assert kind == 'KnowledgeVerification'
            payload = json.loads(content[0]['text'].split('待核验疑点：', 1)[1].split('\n请根据图像', 1)[0])
            assert len(payload['findings']) == 1
            rois = [e for e in evidence if e['role'] == 'roi']
            assert len(rois) == 1
            assert rois[0]['crop_bbox'] == ([81,105,119,135] if annotated_roi else [72,78,128,162])
            position = next(i for i, item in enumerate(content) if item['type']=='text' and rois[0]['evidence_id'] in item['text'] and item['text'].startswith('视觉证据：'))
            encoded = content[position+1]['image_url']['url'].split(',',1)[1]
            with Image.open(io.BytesIO(base64.b64decode(encoded))) as image:
                assert image.size == ((38,30) if annotated_roi else (56,84))
                assert image.getpixel((19,15) if annotated_roi else (28,42)) == (255,0,0)
            normal = [e for e in evidence if e['role']=='normal']
            if capacity==262144:
                assert len(normal)==4
            available = [e['evidence_id'] for e in normal if e['source_sha256'] != initial[-1]['source_sha256']]
            available += [eid for child in payload['child_results'] for item in child['result']['findings']
                          for eid in item['evidence_ids'] if eid in {e['evidence_id'] for e in initial[:-1]}]
            cited = [rois[0]['evidence_id'], available[0]] if independent and available else [rois[0]['evidence_id']]
            result = {'findings': [{'finding_id': payload['findings'][0]['finding_id'], 'status': judgment_status,
                       'affected_check_titles': ['孔内外观'], 'description': '红色区域遮挡孔内背景',
                       'normal_explanation': '有色反射仍需人工排除', 'limitations': ['合成图验证'],
                       'evidence_ids': cited, 'conflicts': []}]}
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(result)}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = service.start(dataset_id=config.dataset.id, kind='normal', model_name='test-mllm')
        service.wait(job['run_id'],5)
        result = service.status(job['run_id'])
        assert result['status']=='COMPLETED', result
        snapshot = knowledge_get({'version_id':result['knowledge_version_id']},db.db_path)['knowledge']
        if capacity==262144:
            assert len(calls)==2
        else:
            assert len(calls)>2
        assert len(snapshot['verification_steps'])==len(calls)-1
        assert len(snapshot['findings'])==1
        finding = snapshot['findings'][0]
        assert finding['sample_id'].endswith(':part-3.png')
        assert finding['bbox']==([86,109,114,131] if annotated_roi else [80,90,120,150])
        assert finding['judgment']['status']==expected_status
        rule = snapshot['checks'][0]
        assert finding['affected_check_ids']==[rule['check_id']]
        assert (initial[-1]['evidence_id'] in rule['counter_evidence_ids'])==has_counter
        assert len(rule['support_evidence_ids'])==support_count
        assert rule['status']==rule_status
        if expected_status=='refuted':
            assert finding['judgment']['normal_explanation'] in rule['allowed_variations']
        roi = finding['regions'][0]['image']
        media = knowledge_evidence({'version_id':snapshot['version_id'],'evidence_id':roi['evidence_id']},db.db_path)
        with Image.open(media['path']) as image:
            assert image.getpixel((19,15) if annotated_roi else (28,42))==(255,0,0)
        detail = sample_get({'sample_id':finding['sample_id']},db.db_path)
        assert detail['review_decision']==original['review_decision']
        assert detail['annotations']==original['annotations']
        assert detail['sample']['quality_status']==original['sample']['quality_status']
    finally:
        service.close()


@pytest.mark.parametrize('later_status', ['supported', 'refuted'])
def test_successor_rechecks_unresolved_contamination_even_when_new_draft_omits_it(knowledge_dataset, later_status):
    db, config = knowledge_dataset
    images = Path(config.root)
    with Image.open(images / 'part-1.png') as image:
        ImageDraw.Draw(image).rectangle((90, 110, 110, 130), fill='red')
        image.save(images / 'part-1.png')
    previous = None
    verifications = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 4000, 'max_model_len': 262144})
        body = json.loads(request.content)
        content = body['messages'][0]['content']
        evidence = [json.loads(item['text'].removeprefix('视觉证据：')) for item in content
                    if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        if body['response_format']['json_schema']['name'] == 'KnowledgeVerification':
            verifications.append(evidence)
            payload = json.loads(content[0]['text'].split('待核验疑点：')[1].split('\n请根据图像')[0])
            raw = next(item for item in evidence if item['role'] == 'roi')
            normal = next(item for item in evidence if item['source_sha256'] != raw['source_sha256'])
            result = {'findings': [{'finding_id': target['finding_id'],
                'status': later_status if previous else 'supported', 'affected_check_titles': ['孔内外观'],
                'description': '孔内红色区域', 'normal_explanation': '后续证据支持有色反射的正常解释',
                'limitations': [], 'evidence_ids': [raw['evidence_id'], normal['evidence_id']], 'conflicts': [],
            } for target in payload['findings']]}
        else:
            result = {'summary': '新图未提出疑点', 'checks': [{
                'title': '孔内外观', 'subject': '孔', 'location': '中部', 'criterion': '孔内部可见背景',
                'allowed_variations': [], 'support_evidence_ids': [item['evidence_id'] for item in evidence],
                'counter_evidence_ids': [], 'limitations': [], 'status': 'supported',
            }], 'suspects': [] if previous else [{
                'evidence_id': evidence[-1]['evidence_id'], 'bbox_1000': [250, 375, 375, 625],
                'description': '孔内红色区域', 'normal_explanation': '可能为有色反射',
            }], 'limitations': [], 'revisions': [] if previous is None else [{
                'previous_check_id': previous['checks'][0]['check_id'], 'current_check_titles': ['孔内外观'],
                'reason': '追加来源重新核验同一孔内外观判据',
            }]}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = service.start(dataset_id=config.dataset.id, kind='normal', sample_ids=[config.dataset.id + ':part-0.png', config.dataset.id + ':part-1.png'])
        service.wait(job['run_id'], 5)
        status = service.status(job['run_id'])
        assert status['status'] == 'COMPLETED', status
        previous = knowledge_get({'version_id': status['knowledge_version_id']}, db.db_path)['knowledge']
        job = service.start(dataset_id=config.dataset.id, kind='normal', sample_ids=[config.dataset.id + ':part-2.png'])
        service.wait(job['run_id'], 5)
        status = service.status(job['run_id'])
        assert status['status'] == 'COMPLETED', status
        current = knowledge_get({'version_id': status['knowledge_version_id']}, db.db_path)['knowledge']
        assert len(verifications) == 2
        finding, = current['findings']
        assert finding['origin_finding_id'] == previous['findings'][0]['finding_id']
        assert finding['bbox'] == previous['findings'][0]['bbox']
        assert finding['judgment']['status'] == later_status
        affected_source = next(item for item in current['evidence'] if item['sample_id'].endswith(':part-1.png') and item['image']['role'] == 'normal')
        check, = current['checks']
        if later_status == 'supported':
            assert affected_source['image']['evidence_id'] not in check['support_evidence_ids']
            assert finding['regions'][0]['image']['evidence_id'] in check['counter_evidence_ids']
        else:
            assert affected_source['image']['evidence_id'] in check['support_evidence_ids']
            assert finding['judgment']['normal_explanation'] in check['allowed_variations']
        assert knowledge_get({'version_id': previous['version_id']}, db.db_path)['knowledge'] == previous
    finally:
        service.close()
