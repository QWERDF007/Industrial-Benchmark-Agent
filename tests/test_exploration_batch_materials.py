import json
from uuid import uuid4

from PIL import Image

from iad_core.analysis.evidence import AnalysisEvidence
from iad_core.dataset.registry import DatasetImport, DatasetRegistry


def test_batch_preserves_original_pixels_and_each_annotation_instance(agent_jobs, tmp_path):
    jobs, _, role = agent_jobs
    source = tmp_path / 'batch-originals'
    source.mkdir()
    pixels = Image.new('RGB', (2400, 1300), 'gray')
    pixels.putpixel((300, 300), (7, 19, 251))
    shapes = [dict(label='1', shape_type='polygon', points=[[100, 100], [1400, 100], [1400, 1100], [100, 1100]])] * 2
    for name in ['a', 'b']:
        pixels.save(source / f'{name}.png')
        (source / f'{name}.json').write_text(json.dumps(dict(imageWidth=2400, imageHeight=1300, shapes=shapes)))
    config = DatasetRegistry(jobs.db).import_labelme(DatasetImport(format='labelme', name='原像素批次',
        image_dir=str(source), annotation_dir=str(source)))
    selected = [config.dataset.id + ':' + name + '.png' for name in ['a', 'b']]
    job = jobs.start(dict(submission_id=str(uuid4()), analysis_kind='exploration', dataset_ids=[config.dataset.id],
        defect_images=selected, prompt=dict(text='观察所有原图及局部。')), agent=role)
    materials = AnalysisEvidence(jobs).batch(job['run_id'])
    assert [target.sample_id for target in materials.context.round.targets] == selected
    assert [page.sample_id for page in materials.registrations] == selected
    ids = []
    for page in materials.registrations:
        assert page.error is None
        assert page.total == 3
        whole, first, second = page.images
        assert whole.image.sent_size == [2400, 1300]
        assert all(item.image.representation == 'raw' for item in page.images)
        assert first.image.crop_bbox == second.image.crop_bbox == [0, 0, 1530, 1200]
        assert first.image.sent_size == [1530, 1200]
        assert len(first.model_context['annotations']) == len(second.model_context['annotations']) == 1
        assert first.model_context['annotations'][0]['polygon'] == [[100.0, 100.0], [1400.0, 100.0], [1400.0, 1100.0], [100.0, 1100.0]]
        assert first.image.annotation_ids != second.image.annotation_ids
        assert first.image.evidence_id != second.image.evidence_id
        assert first.image.sha256 == second.image.sha256
        for item in page.images:
            with Image.open(item.path) as actual:
                expected = pixels.crop(tuple(item.image.crop_bbox))
                assert actual.size == expected.size
                assert actual.tobytes() == expected.tobytes()
        ids.extend(item.image.evidence_id for item in page.images)
    assert len(set(ids)) == 6
    assert jobs.jobs.status(job['run_id'])['completed'] == 0
    crop = AnalysisEvidence(jobs).crop(job['run_id'], dict(sample_id=selected[0], bbox=[0, 0, 2400, 1300]))
    assert len(crop.images) == 1
    assert crop.images[0].image.sent_size == [2400, 1300]
    assert crop.images[0].required is False


def test_okng_batch_contains_only_true_image_labels_without_required_rois(agent_jobs, tmp_path):
    from iad_core.dataset.folder_preview import preview_folder_dataset
    jobs, _, role = agent_jobs
    source = tmp_path / 'image-labels'
    for name in ['OK', 'NG']:
        (source / name).mkdir(parents=True)
        Image.new('RGB', (1600, 1200), 'gray').save(source / name / 'same.png')
    preview = preview_folder_dataset(str(source))
    config = DatasetRegistry(jobs.db).import_dataset(DatasetImport(format='folder_classification', name='OKNG材料',
        root_dir=str(source), rules=[dict(path='OK', role='normal'), dict(path='NG', role='anomaly')],
        preview_fingerprint=preview.preview_fingerprint))
    ids = [config.dataset.id + ':' + name + '/same.png' for name in ['OK', 'NG']]
    job = jobs.start(dict(submission_id=str(uuid4()), analysis_kind='exploration', dataset_ids=[config.dataset.id],
        normal_images=ids[:1], defect_images=ids[1:], prompt=dict(text='观察可见关系。')), agent=role)
    batch = AnalysisEvidence(jobs).batch(job['run_id'])
    assert [len(page.images) for page in batch.registrations] == [1, 1]
    assert [page.images[0].model_context['image_label'] for page in batch.registrations] == ['OK', 'NG']
    assert all(not record.annotations for record in batch.context.registrations)
    assert all('annotations' not in page.images[0].model_context for page in batch.registrations)
    assert all(page.images[0].image.sent_size == [1600, 1200] for page in batch.registrations)
    assert len({page.evidence_id for page in batch.registrations}) == 2
