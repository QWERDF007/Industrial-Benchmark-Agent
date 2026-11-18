import base64
import io
import json

import httpx
import numpy as np
import pytest
from PIL import Image

from iad_core.consistency.annotation_views import annotation_views
from iad_core.evidence.images import EvidenceImages
from iad_core.storage.models import Annotation, Sample
from iad_core.consistency.agent_review import ConsistencyAgentReview
from iad_core.workbench.vision import VlmClient
from tests.test_consistency_identity import identity_response, similar_job


@pytest.mark.parametrize('size,bbox,expected', [
    ((400, 300), [190, 140, 210, 160], [150, 100, 250, 200]),
    ((400, 300), [190, 50, 210, 250], [150, 30, 250, 270]),
    ((400, 300), [100, 50, 300, 250], [80, 30, 320, 270]),
    ((400, 300), [0, 100, 10, 120], [0, 60, 100, 160]),
    ((400, 300), [390, 290, 400, 300], [300, 200, 400, 300]),
    ((80, 70), [35, 30, 45, 40], [0, 0, 80, 70]),
    ((400, 300), [0, 0, 200, 200], [0, 0, 220, 220]),
])
def test_annotation_crop_keeps_source_pixels_and_coordinates(tmp_path, size, bbox, expected):
    path = tmp_path / 'source.png'
    Image.fromarray(np.random.default_rng(17).integers(0, 256,
        (size[1], size[0], 3), dtype=np.uint8)).save(path)
    sample = Sample(sample_id='crop:source', task_id='crop', dataset_id='crop',
        image_path=str(path), relative_path=path.name, width=size[0], height=size[1], quality_status='FAIL')
    annotation = Annotation(annotation_id='crop:source:a', sample_id=sample.sample_id,
        annotation_type='bbox', raw_label='dent', bbox=bbox)

    region, = annotation_views(sample, [annotation])
    assert region.crop_bbox == expected
    assert region.origins[0].bbox == bbox
    prepared = EvidenceImages(str(tmp_path / 'test.db')).capture(sample, 'roi', 'annotation',
        region.crop_bbox, full_resolution=True).with_source(sample, 'labelme', [annotation])
    with Image.open(prepared.path) as crop, Image.open(path) as original:
        assert crop.size == (expected[2] - expected[0], expected[3] - expected[1])
        assert crop.tobytes() == original.crop(tuple(expected)).tobytes()
    assert prepared.model_context()['annotations'][0]['bbox'] == bbox


@pytest.mark.parametrize('similar_job', ['registered_mixed'], indirect=True)
def test_identity_expands_mapped_windows_without_resampling(similar_job):
    runtime, _, run_id, anchor = similar_job
    sent_crops = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        content = json.loads(request.content)['messages'][-1]['content']
        context = json.loads(content[1]['text'])
        metadata = None
        for part in content:
            if part['type'] == 'text' and part['text'].startswith('图像视图：'):
                metadata = json.loads(part['text'].split('：', 1)[1])
            elif part['type'] == 'image_url' and metadata['role'] == 'roi':
                image = Image.open(io.BytesIO(base64.b64decode(part['image_url']['url'].split(',', 1)[1])))
                sent_crops.append((metadata, image.size))
        answer = identity_response(context, 'unverified', '记录窗口中的实际纹理。')
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop',
            'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        state = ConsistencyAgentReview(runtime, client).verify(run_id, anchor)
    finally:
        client.close()
    assert state.completed and sent_crops
    for metadata, size in sent_crops:
        assert size[0] >= 100 and size[1] >= 100
        x1, y1, x2, y2 = metadata['crop_bbox']
        assert size == (x2 - x1, y2 - y1)
        assert metadata['original_size'] == [320, 240]


@pytest.mark.parametrize('shape_type,polygon', [
    ('bbox', None),
    ('polygon', [[10, 10], [30, 10], [10, 30]]),
])
def test_raw_annotation_registration_uses_the_same_crop_policy(dataset, shape_type, polygon):
    from iad_core.evidence.registrations import RegistrationImages
    from iad_core.storage.repositories import SampleRepository
    from iad_core.workbench.analysis_manifest import AnalysisRegistration

    database, _, config = dataset
    sample = SampleRepository(database).get(config.dataset.id + ':dent.png')
    annotation = Annotation(annotation_id=sample.sample_id + ':small', sample_id=sample.sample_id,
        annotation_type=shape_type, raw_label='dent', bbox=[10, 10, 30, 30], polygon=polygon)
    record = AnalysisRegistration(sample=sample, source_fingerprint=None,
        dataset_format='labelme', annotations=[annotation])
    prepared = RegistrationImages(database.db_path).prepare(record, None,
        raw_annotations=True, preserve_annotation_instances=True)
    assert prepared.error is None
    crop, = [view for view in prepared.images if view.image.role == 'roi']
    assert crop.image.crop_bbox == [0, 0, 100, 100]
    with Image.open(crop.path) as pixels:
        assert pixels.size == (100, 100)
    assert crop.model_context['annotations'][0]['bbox'] == [10, 10, 30, 30]
    assert crop.model_context['annotations'][0]['polygon'] == polygon
