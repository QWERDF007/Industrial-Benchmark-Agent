from tests.knowledge_scenarios import selected_group
from uuid import uuid4
import base64
import io
import json
from pathlib import Path

from PIL import Image
import pytest

from iad_core.entry import dataset_import, dataset_scan, sample_get
from iad_core.tools.image_tools import sample_view


def mask_dataset(tmp_path, points=None, mask=None):
    images, labels = tmp_path / 'images', tmp_path / 'labels'
    images.mkdir()
    labels.mkdir()
    Image.new('RGB', (80, 60), '#404040').save(images / 'part.png')
    pixels = mask if mask is not None else Image.new('L', (11, 11), 0)
    if mask is None:
        for x, y in [(0, 0), (10, 10), (2, 3), (3, 3)]:
            pixels.putpixel((x, y), 1)
    buffer = io.BytesIO()
    pixels.save(buffer, 'PNG')
    shape = {'label': '待核实区域', 'shape_type': 'mask', 'points': points or [[20, 15], [30, 25]],
             'mask': base64.b64encode(buffer.getvalue()).decode()}
    (labels / 'part.json').write_text(json.dumps({'imageWidth': 80, 'imageHeight': 60, 'shapes': [shape]}))
    db_path = str(tmp_path / 'workbench.db')
    config = dataset_import({'format': 'labelme', 'name': '部件', 'image_dir': str(images), 'annotation_dir': str(labels)}, db_path)
    return db_path, config['dataset_id'], shape


def test_operator_can_import_reopen_and_view_actual_labelme_mask_pixels(tmp_path):
    db_path, dataset_id, _ = mask_dataset(tmp_path)
    sample_id = dataset_id + ':part.png'
    original = sample_get({'sample_id': sample_id}, db_path)
    annotation = original['annotations'][0]
    assert annotation['annotation_type'] == 'mask'
    assert annotation['bbox'] == [20, 15, 31, 26]
    assert annotation['geometry_status'] == 'VALID'
    assert len(annotation['mask_sha256']) == 64
    with Image.open(annotation['mask_path']) as image:
        assert image.size == (80, 60)
        assert image.getpixel((22, 18)) == 255
        assert image.getpixel((25, 20)) == 0
        assert image.getpixel((30, 25)) == 255
        assert image.getpixel((19, 15)) == 0
    viewed = sample_view(dataset_id, sample_id, view='annotation_overlay', db_path=db_path)
    assert viewed.status.value == 'OK', viewed
    with Image.open(viewed.metrics['view_path']) as image:
        assert image.getpixel((22, 18)) != (64, 64, 64)
        assert image.getpixel((25, 20)) == (64, 64, 64)
        assert image.getpixel((20, 20)) == (64, 64, 64)
    dataset_scan({'dataset_id': dataset_id}, db_path)
    assert sample_get({'sample_id': sample_id}, db_path)['annotations'] == original['annotations']


def test_mining_sends_raw_and_binary_mask_evidence_and_retains_prior_pixels(tmp_path):
    import httpx
    from iad_core.entry import knowledge_get, knowledge_evidence
    from iad_core.knowledge.service import KnowledgeService
    from iad_core.storage.database import Database
    from iad_core.workbench.review import HumanReview, ReviewSubmission
    from iad_core.workbench.vision import VlmClient

    db_path, dataset_id, shape = mask_dataset(tmp_path)
    sample_id = dataset_id + ':part.png'
    db = Database(db_path)
    review = HumanReview(db)
    review.submit(ReviewSubmission(submission_id=uuid4(), dataset_id=dataset_id, reviewer='operator', sample_id=sample_id, decision='PASS'))
    sent = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 2000, 'max_model_len': 262144})
        body = json.loads(request.content)
        content = body['messages'][0]['content']
        sent.append([(json.loads(item['text'].removeprefix('视觉证据：')),
                      base64.b64decode(content[index+1]['image_url']['url'].split(',', 1)[1]))
                     for index, item in enumerate(content) if item['type']=='text' and item['text'].startswith('视觉证据：')])
        result = {'summary': '依据实际标注范围观察', 'checks': [], 'suspects': [], 'limitations': ['单一来源不能证明通用规律']}
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(result)}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = service.start(request=selected_group(service.db, dataset_id, kind='normal'), kind='normal', model_name='test-mllm')
        service.wait(job['run_id'], 5)
        finished = service.status(job['run_id'])
        assert finished['status']=='COMPLETED', finished
        snapshot = knowledge_get({'version_id':finished['knowledge_version_id']},db_path)['knowledge']
        assert len(snapshot['evidence']) == 3
        mask_view, = [item for item in snapshot['evidence'] if item['image']['representation']=='annotation_mask']
        raw, = [item for item in snapshot['evidence'] if item['image']['role']=='roi' and item['image']['representation']=='raw']
        assert mask_view['image']['annotation_ids'] == [sample_id + ':ann_0']
        assert mask_view['image']['crop_bbox'] == raw['image']['crop_bbox'] == [18, 13, 33, 28]
        assert mask_view['image']['source_sha256']==raw['image']['source_sha256']
        media = knowledge_evidence({'version_id':snapshot['version_id'],'evidence_id':mask_view['image']['evidence_id']},db_path)
        with Image.open(media['path']) as image:
            assert image.size == (15, 15)
            assert image.getpixel((4, 5)) == (255, 255, 255)
            assert image.getpixel((7, 7)) == (0, 0, 0)
        for metadata, payload in sent[0]:
            if metadata['role'] != 'roi':
                continue
            with Image.open(io.BytesIO(payload)) as image:
                if metadata['representation']=='raw':
                    assert image.getpixel((4, 5)) == (64,64,64)
                else:
                    assert image.getpixel((4, 5)) != (64,64,64)
        previous_pixels = Path(media['path']).read_bytes()
        pixels = Image.new('L', (11, 11), 0)
        pixels.putpixel((10, 10), 1)
        buffer = io.BytesIO()
        pixels.save(buffer, 'PNG')
        shape['mask'] = base64.b64encode(buffer.getvalue()).decode()
        (tmp_path/'labels'/'part.json').write_text(json.dumps({'imageWidth':80,'imageHeight':60,'shapes':[shape]}))
        dataset_scan({'dataset_id':dataset_id},db_path)
        again = service.start(request=selected_group(service.db, dataset_id, kind='normal'), kind='normal', model_name='test-mllm')
        service.wait(again['run_id'],5)
        assert service.status(again['run_id'])['status']=='COMPLETED'
        successor = knowledge_get({'dataset_id':dataset_id,'kind':'normal'},db_path)['knowledge']
        assert successor['parent_version_id'] is None, '未明确选择预设不隐式继承'
        assert successor['version_id']!=snapshot['version_id']
        assert successor['sources'][0]['annotations_sha256']!=snapshot['sources'][0]['annotations_sha256']
        assert Path(media['path']).read_bytes()==previous_pixels
        assert sample_get({'sample_id':sample_id},db_path)['review_decision']['decision']=='PASS'
        annotation = sample_get({'sample_id':sample_id},db_path)['annotations'][0]
        Image.new('L',(80,60),255).save(annotation['mask_path'],'PNG')
        with pytest.raises(ValueError, match='Mask pixels changed after import'):
            service.start(request=selected_group(service.db, dataset_id, kind='normal'), kind='normal', model_name='test-mllm')
        assert knowledge_get({'dataset_id':dataset_id,'kind':'normal'},db_path)['knowledge']['version_id']==successor['version_id']
    finally:
        service.close()


def test_capacity_grouping_keeps_each_raw_region_with_its_binary_mask(tmp_path):
    import httpx
    from iad_core.knowledge.service import KnowledgeService
    from iad_core.storage.database import Database
    from iad_core.workbench.review import HumanReview, ReviewSubmission
    from iad_core.workbench.vision import VlmClient

    db_path, dataset_id, shape = mask_dataset(tmp_path)
    shapes = [{**shape, 'points': [[x, 15], [x+10, 25]]} for x in [10,30,50]]
    (tmp_path/'labels'/'part.json').write_text(json.dumps({'imageWidth':80,'imageHeight':60,'shapes':shapes}))
    dataset_scan({'dataset_id':dataset_id},db_path)
    db = Database(db_path)
    review = HumanReview(db)
    review.submit(ReviewSubmission(submission_id=uuid4(), dataset_id=dataset_id, reviewer='operator', sample_id=dataset_id+':part.png',decision='PASS'))
    sent = []

    def respond(request):
        content = json.loads(request.content)['messages'][0]['content']
        evidence = [json.loads(item['text'].removeprefix('视觉证据：')) for item in content
                    if item['type']=='text' and item['text'].startswith('视觉证据：')]
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':len(evidence)*2000,'max_model_len':20000})
        sent.append(evidence)
        result = {'summary':'按标注范围观察','checks':[],'suspects':[],'limitations':['仅一个来源']}
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(result)}}]})

    service = KnowledgeService(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = service.start(request=selected_group(service.db, dataset_id, kind='normal'), kind='normal', model_name='test-mllm')
        service.wait(job['run_id'],5)
        assert service.status(job['run_id'])['status']=='COMPLETED'
        viewed = set()
        for evidence in sent:
            if not evidence:
                continue
            assert any(item['role']=='normal' for item in evidence)
            boxes = {tuple(item['crop_bbox']) for item in evidence if item['role']=='roi'}
            for box in boxes:
                assert {item['representation'] for item in evidence if tuple(item['crop_bbox'])==box} == {'raw','annotation_mask'}
                viewed.add(box)
        assert viewed=={(8,13,23,28),(28,13,43,28),(48,13,63,28)}
    finally:
        service.close()


@pytest.mark.parametrize('problem', ['missing', 'corrupt', 'empty', 'rgb', 'too_small', 'nonfinite', 'unknown_type', 'polygon_short', 'rectangle_short'])
def test_unusable_mask_is_reported_and_cannot_enter_the_normal_pool(tmp_path, problem):
    from iad_core.dataset.registry import DatasetRegistry
    from iad_core.storage.database import Database

    db_path, dataset_id, shape = mask_dataset(tmp_path)
    if problem == 'missing':
        shape.pop('mask')
    elif problem == 'corrupt':
        shape['mask'] = 'invalid-base64'
    elif problem == 'nonfinite':
        shape['points'][0][0] = float('nan')
    elif problem == 'unknown_type':
        shape['shape_type'] = 'unknown'
    elif problem == 'polygon_short':
        shape['shape_type'] = 'polygon'
    elif problem == 'rectangle_short':
        shape['shape_type'] = 'rectangle'
        shape['points'] = shape['points'][:1]
    else:
        pixels = Image.new('RGB' if problem=='rgb' else 'L', (2,2) if problem=='too_small' else (11,11), 0 if problem=='empty' else 1)
        buffer = io.BytesIO()
        pixels.save(buffer,'PNG')
        shape['mask'] = base64.b64encode(buffer.getvalue()).decode()
    (tmp_path/'labels'/'part.json').write_text(json.dumps({'imageWidth':80,'imageHeight':60,'shapes':[shape]}))
    dataset_scan({'dataset_id':dataset_id},db_path)
    detail = sample_get({'sample_id':dataset_id+':part.png'},db_path)
    assert not detail['annotations']
    assert any(issue['issue_type']=='ANNOTATION_PARSE_ERROR' and issue['severity']=='ERROR' for issue in detail['technical_issues'])
    assert DatasetRegistry(Database(db_path)).references(dataset_id,limit=None)==[]


def test_fractional_mask_bounds_use_the_stored_patch_extent(tmp_path):
    db_path, dataset_id, _ = mask_dataset(tmp_path, points=[[20.6,15.4],[50.2,40.2]])
    annotation, = sample_get({'sample_id':dataset_id+':part.png'},db_path)['annotations']
    assert annotation['bbox']==[21,15,32,26]
    with Image.open(annotation['mask_path']) as image:
        assert image.getpixel((21,15))==255
        assert image.getpixel((31,25))==255
        assert image.getpixel((50,40))==0


def test_mask_and_polygon_follow_the_explicit_source_size_scaling_policy(tmp_path):
    from iad_core.dataset.registry import DatasetRegistry
    from iad_core.storage.database import Database

    db_path, dataset_id, shape = mask_dataset(tmp_path)
    data = {'imageWidth':40,'imageHeight':30,'shapes':[shape,
            {'label':'另一处','shape_type':'polygon','points':[[2,2],[8,2],[2,8]]}]}
    (tmp_path/'labels'/'part.json').write_text(json.dumps(data))
    registry = DatasetRegistry(Database(db_path))
    config = registry.get(dataset_id)
    config.annotations.bbox_policy.source_size_mismatch='scale'
    registry.save(config)
    dataset_scan({'dataset_id':dataset_id},db_path)
    detail = sample_get({'sample_id':dataset_id+':part.png'},db_path)
    mask, polygon = detail['annotations']
    assert mask['geometry_status']==polygon['geometry_status']=='SCALED'
    assert mask['bbox']==[40,30,62,52]
    assert polygon['bbox']==[4,4,16,16]
    assert polygon['polygon']==[[4,4],[16,4],[4,16]]
    with Image.open(mask['mask_path']) as image:
        assert image.size==(80,60)
        assert image.getpixel((44,36))==image.getpixel((45,37))==255
        assert image.getpixel((50,40))==0
        assert set(image.tobytes())=={0,255}


def test_mask_clipping_retains_only_the_actual_in_frame_foreground(tmp_path):
    from iad_core.dataset.registry import DatasetRegistry
    from iad_core.storage.database import Database

    db_path,dataset_id,_ = mask_dataset(tmp_path,points=[[-2,15],[8,25]])
    annotation, = sample_get({'sample_id':dataset_id+':part.png'},db_path)['annotations']
    assert annotation['geometry_status']=='INVALID'
    registry = DatasetRegistry(Database(db_path))
    config = registry.get(dataset_id)
    config.annotations.bbox_policy.out_of_bounds='clip'
    registry.save(config)
    dataset_scan({'dataset_id':dataset_id},db_path)
    annotation, = sample_get({'sample_id':dataset_id+':part.png'},db_path)['annotations']
    assert annotation['bbox']==[0,15,9,26]
    assert annotation['geometry_status']=='CLIPPED'
    with Image.open(annotation['mask_path']) as image:
        assert image.getpixel((0,18))==255
        assert image.getpixel((8,25))==255
        assert image.getpixel((9,25))==0


def test_rejected_mask_source_dimensions_are_visible_as_an_import_error(tmp_path):
    db_path, dataset_id, shape = mask_dataset(tmp_path)
    (tmp_path/'labels'/'part.json').write_text(json.dumps({'imageWidth':40,'imageHeight':30,'shapes':[shape]}))
    dataset_scan({'dataset_id':dataset_id},db_path)
    detail = sample_get({'sample_id':dataset_id+':part.png'},db_path)
    assert detail['annotations'][0]['geometry_status']=='INVALID'
    assert any(issue['severity']=='ERROR' and '40x30' in issue['message'] and '80x60' in issue['message']
               for issue in detail['technical_issues'])


def test_scaling_that_erases_all_mask_pixels_is_reported_without_aborting_import(tmp_path):
    from iad_core.dataset.registry import DatasetRegistry
    from iad_core.storage.database import Database

    db_path, dataset_id, shape = mask_dataset(tmp_path)
    (tmp_path/'labels'/'part.json').write_text(json.dumps({'imageWidth':800,'imageHeight':600,'shapes':[shape]}))
    registry = DatasetRegistry(Database(db_path))
    config = registry.get(dataset_id)
    config.annotations.bbox_policy.source_size_mismatch='scale'
    registry.save(config)
    dataset_scan({'dataset_id':dataset_id},db_path)
    detail = sample_get({'sample_id':dataset_id+':part.png'},db_path)
    assert detail['annotations'][0]['geometry_status']=='INVALID'
    assert any(issue['severity']=='ERROR' and 'foreground' in issue['message'] for issue in detail['technical_issues'])


def test_existing_workbench_database_can_rescan_and_keep_mask_provenance(tmp_path):
    import sqlite3

    db_path, dataset_id, _ = mask_dataset(tmp_path)
    original = sample_get({'sample_id':dataset_id+':part.png'},db_path)['annotations'][0]
    with sqlite3.connect(db_path) as conn:
        conn.execute('ALTER TABLE annotations DROP COLUMN mask_sha256')
    dataset_scan({'dataset_id':dataset_id},db_path)
    reopened = sample_get({'sample_id':dataset_id+':part.png'},db_path)['annotations'][0]
    assert reopened==original


@pytest.mark.parametrize('shape_type,points,inside,outside', [
    ('rectangle', [[20,15],[30,25]], (25,20), (18,20)),
    ('polygon', [[20,15],[30,15],[30,25]], (28,18), (20,23)),
])
def test_mining_preserves_the_actual_annotation_shape_in_its_binary_view(tmp_path,shape_type,points,inside,outside):
    import httpx
    from iad_core.entry import knowledge_get, knowledge_evidence
    from iad_core.knowledge.service import KnowledgeService
    from iad_core.storage.database import Database
    from iad_core.workbench.review import HumanReview, ReviewSubmission
    from iad_core.workbench.vision import VlmClient

    db_path,dataset_id,shape = mask_dataset(tmp_path)
    shape.update(shape_type=shape_type,points=points)
    shape.pop('mask')
    (tmp_path/'labels'/'part.json').write_text(json.dumps({'imageWidth':80,'imageHeight':60,'shapes':[shape]}))
    dataset_scan({'dataset_id':dataset_id},db_path)
    db = Database(db_path)
    review = HumanReview(db)
    review.submit(ReviewSubmission(submission_id=uuid4(), dataset_id=dataset_id, reviewer='operator', sample_id=dataset_id+':part.png',decision='PASS'))

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':2000,'max_model_len':262144})
        result={'summary':'观察实际标注形状','checks':[],'suspects':[],'limitations':[]}
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(result)}}]})

    service = KnowledgeService(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job=service.start(request=selected_group(service.db, dataset_id, kind='normal'), kind='normal', model_name='test-mllm')
        service.wait(job['run_id'],5)
        assert service.status(job['run_id'])['status']=='COMPLETED'
        snapshot=knowledge_get({'dataset_id':dataset_id,'kind':'normal'},db_path)['knowledge']
        view, = [item['image'] for item in snapshot['evidence'] if item['image']['representation']=='annotation_mask']
        assert view['crop_bbox']==[18,13,32,27]
        media=knowledge_evidence({'version_id':snapshot['version_id'],'evidence_id':view['evidence_id']},db_path)
        with Image.open(media['path']) as image:
            assert image.getpixel((inside[0]-18,inside[1]-13))==(255,255,255)
            assert image.getpixel((outside[0]-18,outside[1]-13))==(0,0,0)
    finally:
        service.close()
