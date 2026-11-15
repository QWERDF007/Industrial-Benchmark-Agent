import json
import hashlib
import threading
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

from PIL import Image

from iad_core.dataset.scanner import scan_dataset
from iad_core.consistency.scopes import ConsistencyScopes
from iad_core.duplicate.index import PixelIndex
from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository
from iad_core.storage.repositories import AnnotationRepository
from iad_core.evidence.sources import SampleContent
from iad_core.task.config import DatasetConfig
from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_preparation import ConsistencyAgentPreparation
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.query import WorkbenchQuery
from iad_core.entry import dataset_get


def test_import_registers_real_dimensions_and_annotations_without_preparing_pixels(tmp_path):
    images, labels = tmp_path / 'images', tmp_path / 'labels'
    images.mkdir()
    labels.mkdir()
    path = images / 'part.png'
    Image.new('RGB', (64, 48), 'red').save(path)
    labels.joinpath('part.json').write_text(json.dumps({
        'imageWidth': 64, 'imageHeight': 48,
        'shapes': [{'label': 'dent', 'shape_type': 'rectangle', 'points': [[2, 3], [12, 13]]}],
    }))
    config = DatasetConfig.model_validate({
        'dataset': {'id': 'parts', 'name': '零件', 'format': 'labelme'}, 'root': str(images),
        'task': {'task_id': 'parts', 'inspection_target': 'surface'},
        'annotations': {'format': 'labelme', 'root': str(labels)},
    })
    db = Database(str(tmp_path / 'parts.db'))

    result = scan_dataset(config=config, db_path=db.db_path)

    assert result.image_count == result.annotation_count == 1
    assert result.pixel_index.coverage.pending == 1
    assert result.pixel_index.decoded_images == 0
    sample = SampleRepository(db).get('parts:part.png')
    assert (sample.width, sample.height) == (64, 48)
    assert PixelIndex(db).get(sample.sample_id) is None


def test_first_preparation_is_cached_and_does_not_change_the_frozen_source(dataset):
    db, _, config = dataset
    index = PixelIndex(db)
    sample_ids = [config.dataset.id + ':' + name for name in ('normal.png', 'normal2.png', 'dent.png', 'scratch.png')]
    scope = ConsistencyScopes(db).resolve({'kind': 'datasets', 'dataset_ids': [config.dataset.id]})

    first = index.prepare(sample_ids)

    assert first.coverage.completed == first.coverage.total == 4
    assert first.decoded_images >= 4
    assert index.get(sample_ids[2]).content_group_id == index.get(sample_ids[3]).content_group_id
    ConsistencyScopes(db).assert_current(scope)
    again = PixelIndex(Database(db.db_path)).prepare(sample_ids)
    assert again.reused_samples == 4
    assert again.decoded_images == 0
    ConsistencyScopes(db).assert_current(scope)


def test_cached_preparation_reports_completed_images_together(dataset):
    db, _, config = dataset
    sample_ids = [sample.sample_id for sample in ConsistencyScopes(db).resolve(
        {'kind': 'datasets', 'dataset_ids': [config.dataset.id]}).samples]
    index = PixelIndex(db)
    index.prepare(sample_ids)
    updates = []

    result = index.prepare(sample_ids, record=lambda identities, error: updates.append((identities, error)))

    assert result.reused_samples == len(sample_ids)
    assert updates == [(sorted(sample_ids), None)]


def test_existing_index_upgrades_unchanged_images_without_replacing_content_groups(indexed_dataset):
    from iad_core.feature.cache import ContentFeatureCache
    from iad_core.storage.features import FeatureRepository
    from tests.feature_fixtures import configure_test_encoder, MockFeatureExtractor

    db, _, config = indexed_dataset
    sample_id = config.dataset.id + ':dent.png'
    index = PixelIndex(db)
    before = index.get(sample_id)
    encoder = configure_test_encoder(db, config.root)
    cache = ContentFeatureCache(db)
    cache.prepare([sample_id], encoder, extractor=MockFeatureExtractor(profile=encoder.profile))
    feature = FeatureRepository(db).get_for_sample(sample_id, encoder.profile.profile_id)
    sample = SampleRepository(db).get(sample_id)
    annotations = AnnotationRepository(db).list_by_sample(sample_id)
    content = SampleContent.describe(sample, annotations, before.image_sha256)
    old_fingerprint = hashlib.sha256(json.dumps(content.model_dump(mode='json',
        exclude={'annotation_availability'}), separators=(',', ':')).encode()).hexdigest()
    descriptor = before.descriptor.model_copy(update={'compare_profile': 'raw-decoded-v1',
        'pixel_key': hashlib.sha256(b'published raw pixels').hexdigest()})
    with db.connection() as connection:
        connection.execute('''UPDATE samples SET source_revision=NULL,source_file_json=NULL,
            source_sha256=NULL,source_fingerprint=? WHERE sample_id=?''', (old_fingerprint, sample_id))
        connection.execute('''UPDATE sample_pixel_index SET compare_profile=?,pixel_key=?,
            descriptor_json=?,file_revision_json=NULL WHERE sample_id=?''',
            (descriptor.compare_profile, descriptor.pixel_key, descriptor.model_dump_json(), sample_id))

    result = index.prepare([sample_id])

    assert result.coverage.completed == 1
    after = index.get(sample_id)
    assert after.content_group_id == before.content_group_id
    assert after.descriptor == before.descriptor
    assert index.prepare([sample_id]).reused_samples == 1
    reused = cache.prepare([sample_id], encoder, extractor=MockFeatureExtractor(profile=encoder.profile))
    assert reused.cache_hit_count == 1 and reused.encoded_content_count == 0
    assert FeatureRepository(db).get_for_sample(sample_id, encoder.profile.profile_id) == feature


def test_exact_check_prepares_pixels_without_an_image_encoder(dataset):
    from tests.test_consistency_agent_preparation import wait_for_preparation

    db, _, config = dataset
    runtime = WorkbenchRuntime(db)
    try:
        checks = ConsistencyAgentJobs(runtime)
        run_id = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact'})['run_id']
        snapshot = checks.snapshot(run_id)

        prepared = wait_for_preparation(ConsistencyAgentPreparation(runtime), run_id)

        assert prepared.status == 'COMPLETED'
        assert prepared.completed == 4
        assert {child.job_type for child in prepared.children} == {'PIXEL_INDEX'}
        assert checks.snapshot(run_id) == snapshot
        checks.cancel(run_id)
    finally:
        runtime.close()


def test_import_reads_headers_concurrently_with_at_most_eight_readers(dataset, monkeypatch):
    db, registry, config = dataset
    entered, release, mutex = threading.Event(), threading.Event(), threading.Lock()
    active = peak = 0
    real_open = Image.open

    def open_image(path, *args, **kwargs):
        nonlocal active, peak
        with mutex:
            active += 1
            peak = max(peak, active)
            if active >= 4:
                entered.set()
        try:
            assert release.wait(5)
            return real_open(path, *args, **kwargs)
        finally:
            with mutex:
                active -= 1

    monkeypatch.setattr(Image, 'open', open_image)
    with ThreadPoolExecutor(max_workers=1) as executor:
        scanning = executor.submit(registry.rescan, config.dataset.id)
        try:
            assert entered.wait(2), 'Image headers were read serially'
        finally:
            release.set()
        assert scanning.result(timeout=5).image_count == 4
    assert 4 <= peak <= 8


def test_single_dataset_projection_matches_the_dataset_list(dataset):
    db, _, config = dataset
    query = WorkbenchQuery(db)

    detail = query.dataset(config.dataset.id)

    detail.pop('generated_at')
    for entry in (query.datasets()['datasets'][0], dataset_get({'dataset_id': config.dataset.id}, db.db_path)):
        entry.pop('generated_at')
        assert entry == detail
