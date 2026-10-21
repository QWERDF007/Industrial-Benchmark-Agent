from tests.knowledge_scenarios import selected_group
import json
import re
from pathlib import Path

import httpx
from PIL import Image, ImageDraw

from iad_core.entry import knowledge_get
from iad_core.knowledge.service import KnowledgeService
from iad_core.workbench.vision import VlmClient


def test_defect_mining_separates_frozen_normal_references_from_current_visual_citations(knowledge_dataset):
    db, config = knowledge_dataset
    path = Path(config.root) / 'part-5.png'
    with Image.open(path) as image:
        ImageDraw.Draw(image).rectangle((90, 110, 110, 130), fill='red')
        image.save(path)
    observed = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 4000, 'max_model_len': 262144})
        body = json.loads(request.content)
        content = body['messages'][0]['content']
        evidence = [json.loads(item['text'].removeprefix('视觉证据：')) for item in content
                    if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        if body['response_format']['json_schema']['name'] == 'KnowledgeVerification':
            payload = json.loads(content[0]['text'].split('待核验疑点：', 1)[1].split('\n请根据图像', 1)[0])
            roi = next(e for e in evidence if e['role'] == 'roi' and e['representation'] == 'raw')
            comparison = next(e for e in evidence if e['role'] == 'normal' and e['source_sha256'] != roi['source_sha256'])
            result = {'findings': [{'finding_id': target['finding_id'], 'status': 'supported',
                'affected_check_titles': ['全图外轮廓'] if payload['normal_version_id'] else ['孔内外观'], 'description': '孔内出现红色覆盖', 'normal_explanation': '需排除有色反光',
                'limitations': [], 'evidence_ids': [roi['evidence_id'], comparison['evidence_id']], 'conflicts': []}
                for target in payload['findings']]}
        else:
            defect = '已核验异常' in content[0]['text']
            if defect:
                supplied = {e['evidence_id'] for e in evidence}
                mentioned = set(re.findall(r'img_[a-f0-9]{64}', content[0]['text']))
                assert mentioned <= supplied, f'历史图像引用混入本轮视觉上下文：{mentioned - supplied}'
                observed.append(supplied)
            support = [e['evidence_id'] for e in evidence if e['representation'] == 'raw'
                       and e['role'] == ('roi' if defect else 'normal')]
            result = {'summary': '孔内可见外观', 'checks': [{
                'title': '孔内遮挡' if defect else '孔内外观', 'subject': '孔', 'location': '主体左侧',
                'criterion': '孔内出现局部覆盖' if defect else '孔内可见背景', 'allowed_variations': [],
                'support_evidence_ids': support, 'counter_evidence_ids': [], 'limitations': [], 'status': 'supported',
            }], 'suspects': [] if defect else [{'evidence_id': evidence[-1]['evidence_id'],
                'bbox_1000': [250, 375, 375, 625], 'description': '孔内红色区域', 'normal_explanation': '可能反光'}], 'limitations': []}
        if body['response_format']['json_schema']['name'] == 'KnowledgeDraft' and not defect:
            result['checks'].append(dict(result['checks'][0], title='全图外轮廓', location='外轮廓', criterion='主体轮廓完整', counter_evidence_ids=[]))
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = service.start(request=selected_group(db, config.dataset.id, 'normal'), kind='normal', model_name='test-mllm')
        service.wait(job['run_id'], 5)
        assert service.status(job['run_id'])['status'] == 'COMPLETED'
        normal = knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge']
        assert normal['checks'][0]['counter_evidence_ids']
        assert normal['findings'][0]['proposal']['evidence_id']
        job = service.start(request=selected_group(db, config.dataset.id, 'defect', knowledge_preset=[normal['version_id']]), kind='defect', model_name='test-mllm')
        service.wait(job['run_id'], 5)
        assert service.status(job['run_id'])['status'] == 'COMPLETED', service.status(job['run_id'])['errors']
        assert observed
        defect = knowledge_get({'dataset_id': config.dataset.id, 'kind': 'defect'}, db.db_path)['knowledge']
        assert defect['checks'][0]['status'] == 'provisional', '单个异常来源不能提供多来源支持'
        assert defect['findings'][0]['proposal'] == normal['findings'][0]['proposal'], 'Published provenance remains intact'
        assert knowledge_get({'version_id': normal['version_id']}, db.db_path)['knowledge'] == normal
    finally:
        service.close()
