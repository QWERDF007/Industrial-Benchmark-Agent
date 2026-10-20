import base64
import io
import json

import httpx
import pytest
from PIL import Image, ImageDraw

from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.storage.database import Database
from iad_core.entry import dataset_import, sample_get


@pytest.fixture
def knowledge_dataset(tmp_path, request):
    images, labels = tmp_path / "images", tmp_path / "labels"
    images.mkdir()
    labels.mkdir()
    for index in range(6):
        size = getattr(request, "param", (320, 240))
        image = Image.new("RGB", size, "#cccccc")
        draw = ImageDraw.Draw(image)
        draw.rectangle((40, 60, 280, 180), fill="#333333")
        for x in (100, 220):
            draw.ellipse((x - 15, 105, x + 15, 135), fill="#cccccc")
        if size[0] > 1800:
            image.putpixel((1800, 220), (255, 0, 0))
        image.save(images / f"part-{index}.png")
    db = Database(str(tmp_path / "knowledge.db"))
    config = DatasetRegistry(db).import_labelme(DatasetImport(
        name="双孔部件", image_dir=str(images), annotation_dir=str(labels),
    ))
    return db, config


@pytest.fixture
def defect_dataset(tmp_path):
    images, labels = tmp_path / 'images', tmp_path / 'labels'
    images.mkdir()
    labels.mkdir()
    for index in range(4):
        image = Image.new('RGB', (320, 240), (200 + index, 200 + index, 200 + index))
        draw = ImageDraw.Draw(image)
        draw.rectangle((40, 60, 280, 180), fill='#333333')
        draw.ellipse((85, 105, 115, 135), fill='#cccccc')
        if index == 3:
            draw.rectangle((90, 110, 110, 130), fill='red')
        image.save(images / f'part-{index}.png')
    mask = Image.new('L', (41, 61), 0)
    ImageDraw.Draw(mask).rectangle((10, 20, 30, 40), fill=255)
    buffer = io.BytesIO()
    mask.save(buffer, 'PNG')
    (labels / 'part-3.json').write_text(json.dumps({'imageWidth': 320, 'imageHeight': 240, 'shapes': [{
        'shape_type': 'mask', 'label': '待核实遮挡', 'points': [[80, 90], [120, 150]],
        'mask': base64.b64encode(buffer.getvalue()).decode(),
    }]}))
    db_path = str(tmp_path / 'workbench.db')
    dataset = dataset_import({'name': '孔板', 'image_dir': str(images), 'annotation_dir': str(labels)}, db_path)
    target_id = dataset['dataset_id'] + ':part-3.png'
    original = sample_get({'sample_id': target_id}, db_path)
    return Database(db_path), dataset, original, images


@pytest.fixture
def dataset(tmp_path):
    images = tmp_path / "images"
    labels = tmp_path / "labels"
    images.mkdir()
    labels.mkdir()
    for name in ["normal", "normal2", "dent", "scratch"]:
        Image.new("RGB", (320, 240), (0, 0, 200) if name == "normal" else (0, 0, 220) if name == "normal2" else "blue").save(images / f"{name}.png")
    for name in ["dent", "scratch"]:
        (labels / f"{name}.json").write_text(json.dumps({
            "imageWidth": 320, "imageHeight": 240,
            "shapes": [{"label": name, "shape_type": "rectangle", "points": [[10, 10], [30, 30]]}],
        }))
    db = Database(str(tmp_path / "test.db"))
    registry = DatasetRegistry(db)
    config = registry.import_labelme(DatasetImport(name="生产线 A", image_dir=str(images), annotation_dir=str(labels)))
    return db, registry, config


@pytest.fixture
def mllm_api(dataset):
    bodies = []
    patterns = {"summary": "可见蓝色表面", "checks": [{"title": "表面外观", "subject": "主体", "location": "全图", "criterion": "可见蓝色表面", "allowed_variations": ["亮度变化"], "support_evidence_ids": [], "counter_evidence_ids": [], "limitations": [], "status": "supported"}], "suspects": [], "limitations": []}
    view = {"description": "可观察证据", "position_analysis": "位置合理", "illumination_analysis": "反光已核实"}
    responses = {"KnowledgeDraft": patterns, "GlobalAnalysis": view, "ViewAnalysis": view,
                 "VlmResult": {**view, "suggested_label": "PASS", "reason_category": "NORMAL", "confidence": 0.8}}
    def respond(request):
        body = json.loads(request.content)
        if request.url.path.endswith('/tokenize'):
            capacity = responses.get('Tokenize', {'count':1000,'max_model_len':262144})
            count = capacity.get('count', sum(part['type']=='image_url' for part in body['messages'][0]['content']) * capacity.get('tokens_per_image', 1000))
            return httpx.Response(200,json={'count':count,'max_model_len':capacity['max_model_len']})
        bodies.append(body)
        schema = json.loads(body['messages'][0]['content'][0]['text'].split("JSON Schema 的 JSON，不要 Markdown：\n")[1])
        if schema['title'] == 'KnowledgeDraft':
            answer = {**patterns, 'checks': [{**check, 'support_evidence_ids': [json.loads(part['text'][5:])['evidence_id'] for part in body['messages'][0]['content'] if part['type']=='text' and part['text'].startswith('视觉证据：')]} for check in patterns['checks']]}
        elif schema['title'] == 'JointAnalysis':
            metadata=[json.loads(part['text'].split('视觉证据：')[1]) for part in body['messages'][0]['content'] if part['type']=='text' and part['text'].startswith('视觉证据：')]
            answer={**responses['VlmResult'],'global_view':responses['GlobalAnalysis'],
                    'region_observations':[{**responses['ViewAnalysis'],'region_index':index} for index, image in enumerate(
                        [image for image in metadata if image['role'] == 'roi' and image['representation'] == 'raw'], 1)]}
            answer.setdefault('evidence_ids',[image['evidence_id'] for image in metadata])
            criteria = json.loads(body['messages'][0]['content'][0]['text'].split('冻结知识：')[1].split('\n')[0])
            answer['check_assessments'] = responses.get('CheckAssessments', [{**responses['ViewAnalysis'], 'check_id': check['check_id'],
                'status': 'anomaly' if answer['suggested_label'] == 'FAIL' else 'normal' if answer['suggested_label'] == 'PASS' else 'insufficient',
                'evidence_ids': [metadata[0]['evidence_id']]} for check in criteria['checks']])
        else:
            answer = dict(responses[schema['title']])
            if schema['title'] == 'VlmResult':
                answer.setdefault('evidence_ids', [json.loads(c['text'].split('视觉证据：')[1])['evidence_id'] for c in body['messages'][0]['content'] if c['type']=='text' and c['text'].startswith('视觉证据：')])
        return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(answer)}}]})
    client = httpx.Client(transport=httpx.MockTransport(respond))
    from iad_core.knowledge.service import KnowledgeService
    from iad_core.workbench.vision import VlmClient
    db, _, config = dataset
    mining = KnowledgeService(db, VlmClient(http_client=client))
    job = mining.start(dataset_id=config.dataset.id, kind='normal')
    mining.wait(job['run_id'], 5)
    assert mining.status(job['run_id'])['status'] == 'COMPLETED', mining.status(job['run_id'])
    mining.jobs.close()
    return client, bodies, responses
