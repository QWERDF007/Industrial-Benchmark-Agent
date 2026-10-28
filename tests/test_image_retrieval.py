import json
from pathlib import Path
import time
import subprocess
import sys
import os

import numpy as np
import pytest

from PIL import Image, PngImagePlugin

from iad_core.consistency.models import ImageRetrieve
from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.storage.database import Database
from iad_core.duplicate.index import PixelIndex
from iad_core.feature.profiles import EmbeddingProfile, ImageEncoders
from iad_core.storage.features import FeatureRepository
from iad_core.storage.models import FeatureRecord


@pytest.fixture
def retrieval_vectors(dataset, tmp_path):
    db, registry, config = dataset
    weights = tmp_path / 'index-math.pt'
    weights.write_bytes(b'Known retrieval-ranking vectors; not a model-effectiveness test')
    profile = EmbeddingProfile.create('sscd_disc_mixup', str(weights))
    ImageEncoders(db).register(profile)
    for name, values in [('dent', (1, 0)), ('normal', (.8, .6)), ('normal2', (0, 1))]:
        vector = np.zeros(profile.dim, dtype=np.float32)
        vector[:2] = values
        group = PixelIndex(db).get(config.dataset.id + ':' + name + '.png').content_group_id
        FeatureRepository(db).upsert(FeatureRecord(content_group_id=group, profile_id=profile.profile_id,
            dim=profile.dim, dtype='float32', embedding_blob=vector.tobytes()))
    yield db, registry, config, profile
    from iad_core.workbench.runtime import close_workbenches
    close_workbenches()


def test_exact_retrieval_checks_the_eightieth_member_before_pagination(tmp_path):
    from iad_core.consistency.service import ConsistencyService

    db = Database(str(tmp_path / 'retrieval.db'))
    registry = DatasetRegistry(db)
    policy = {'policy_id': 'surface-v1', 'annotation_role': 'REFERENCE',
        'annotation_coverage': 'EXHAUSTIVE'}
    configs = []
    for name, count in [('query', 1), ('corpus', 80)]:
        root = tmp_path / name
        root.mkdir()
        for index in range(count):
            metadata = PngImagePlugin.PngInfo()
            metadata.add_text('copy', name + str(index))
            Image.new('RGB', (32, 32), 'blue').save(root / f'{index:03}.png', pnginfo=metadata)
        if name == 'corpus':
            (root / '079.json').write_text(json.dumps({'imageWidth': 32, 'imageHeight': 32,
                'shapes': [{'label': 'dent', 'shape_type': 'rectangle', 'points': [[2, 2], [10, 10]]}]}))
        configs.append(registry.import_labelme(DatasetImport(format='labelme', name=name,
            image_dir=str(root), annotation_dir=str(root), annotation_policy=policy)))
    service = ConsistencyService(db)
    request = ImageRetrieve(query={'kind': 'sample', 'sample_id': configs[0].dataset.id + ':000.png'},
        corpus_scope={'kind': 'datasets', 'dataset_ids': [configs[1].dataset.id]}, mode='exact', top_k=1)
    result = service.retrieve(request)
    assert result.retrieval_completeness == 'EXACT_SCOPE'
    assert result.group_count == result.exact.group_count == 1
    assert result.member_count == result.exact.member_count == 80
    assert result.coverage.corpus.completed == result.coverage.corpus.total == 80
    assert result.coverage.verification.completed == result.coverage.annotation.completed == 80
    group = result.exact.groups[0]
    assert group.member_count == 80 and len(group.members) == 24
    assert group.conflict_count == 1
    assert all(member.relation == 'EXACT' for member in group.members)
    assert not any(member.annotation.confirmed_conflict for member in group.members)
    for _ in range(3):
        assert group.next_member_cursor
        page = service.retrieve(request.model_copy(update={'cursor': group.next_member_cursor}))
        assert page.exact.member_count == 80 and page.coverage.annotation.completed == 80
        group = page.exact.groups[0]
    assert len(group.members) == 8 and group.next_member_cursor is None
    assert group.members[-1].sample_id == configs[1].dataset.id + ':079.png'
    assert group.members[-1].annotation.confirmed_conflict
    assert result.visual.status == 'NOT_REQUESTED'


def test_combined_retrieval_preserves_exact_matches_when_no_profile_is_configured(dataset):
    from iad_core.consistency.service import ConsistencyService

    db, _, config = dataset
    result = ConsistencyService(db).retrieve(ImageRetrieve(
        query={'kind': 'sample', 'sample_id': config.dataset.id + ':dent.png'}, mode='combined'))
    assert {member.sample_id for group in result.exact.groups for member in group.members} == {config.dataset.id + ':scratch.png'}
    assert result.exact.status == 'READY'
    assert result.visual.status == 'NOT_READY' and result.visual.error_code == 'PROFILE_NOT_CONFIGURED'
    assert result.visual.corpus_coverage.total == result.visual.corpus_coverage.pending == 4
    assert result.retrieval_completeness == 'PARTIAL'


@pytest.mark.parametrize('mode', ['visual', 'combined'])
def test_visual_groups_reuse_cached_vectors_and_combined_deduplicates_branch_hits(retrieval_vectors, mode):
    from iad_core.consistency.service import ConsistencyService

    db, _, config, profile = retrieval_vectors
    result = ConsistencyService(db).retrieve(ImageRetrieve(query={'kind': 'sample',
        'sample_id': config.dataset.id + ':dent.png'}, mode=mode, profile_id=profile.profile_id, top_k=2))
    assert result.profile_id == profile.profile_id
    assert result.visual.status == 'READY' and result.visual.corpus_coverage.completed == 4
    assert result.group_count == result.member_count == 2
    assert result.retrieval_completeness == 'TOP_K'
    members = [member for branch in [result.exact, result.visual] for group in branch.groups for member in group.members]
    assert {member.sample_id for member in members} == {config.dataset.id + ':scratch.png', config.dataset.id + ':normal.png'}
    assert next(member for member in members if member.sample_id.endswith(':scratch.png')).relation == 'EXACT'
    assert next(member for member in members if member.sample_id.endswith(':normal.png')).relation == 'VISUAL_REFERENCE'
    if mode == 'combined':
        assert result.exact.group_count == 1 and result.visual.group_count == 1
        origins = result.exact.groups[0].origins
        assert [origin.branch for origin in origins] == ['exact', 'visual']
        assert origins[1].score == pytest.approx(1)
        assert result.visual.groups[0].origins[0].score == pytest.approx(.8)
    else:
        assert result.exact.status == 'NOT_REQUESTED' and result.visual.group_count == 2


def test_retrieval_retains_original_region_statistics_and_near_processing(retrieval_vectors):
    from iad_core.consistency.service import ConsistencyService

    db,_,config,profile=retrieval_vectors
    result=ConsistencyService(db).retrieve(ImageRetrieve(query={'kind':'sample','sample_id':config.dataset.id+':dent.png'},
        mode='visual',profile_id=profile.profile_id,top_k=2))
    members={member.sample_id:member for group in result.visual.groups for member in group.members}
    exact=members[config.dataset.id+':scratch.png']
    reference=members[config.dataset.id+':normal.png']
    assert exact.local.compared_pixels==400 and exact.local.changed_pixels==0
    assert exact.near is None
    assert reference.local.compared_pixels==400 and reference.local.changed_pixels==400
    assert reference.local.max_abs_diff==55
    assert reference.near.details['config']['target_size']==[256,256]
    assert reference.registration.status=='UNSUPPORTED'
    assert reference.annotation is None


def test_managed_temporary_image_is_owner_scoped_releasable_and_never_imported(dataset):
    from iad_core.consistency.errors import ConsistencyError
    from iad_core.consistency.service import ConsistencyService
    from iad_core.workbench.query import SampleQuery, WorkbenchQuery
    from iad_core.workbench.runtime import close_workbenches, workbench

    db, _, config = dataset
    source = Path(config.root) / 'dent.png'
    runtime = workbench(db.db_path)
    try:
        image = runtime.temporary_images.accept(source.read_bytes(), owner_id='session-a')
        request = ImageRetrieve(query={'kind': 'temporary', 'image_ref': image.image_ref}, mode='exact')
        result = ConsistencyService(db).retrieve(request, owner_id='session-a')
        assert result.member_count == result.exact.member_count == 2
        assert result.coverage.verification.completed == result.coverage.annotation.pending == 2
        assert all(member.annotation is None for member in result.exact.groups[0].members)
        assert WorkbenchQuery(db).samples(SampleQuery(dataset_id=config.dataset.id))['total'] == 4
        for reference, owner in [(image.image_ref, 'session-b'), (str(source), 'session-a')]:
            with pytest.raises(ConsistencyError) as missing:
                ConsistencyService(db).retrieve(ImageRetrieve(**{**request.model_dump(),
                    'query': {'kind': 'temporary', 'image_ref': reference}}), owner_id=owner)
            assert missing.value.code == 'REFERENCE_NOT_FOUND'
        runtime.temporary_images.release(image.image_ref, owner_id='session-a')
        with pytest.raises(ConsistencyError) as released:
            ConsistencyService(db).retrieve(request, owner_id='session-a')
        assert released.value.code == 'REFERENCE_NOT_FOUND'
        assert runtime.temporary_images.stats().image_count == runtime.temporary_images.stats().source_bytes == 0
    finally:
        close_workbenches()


def test_temporary_visual_query_encodes_only_itself_once_and_releases_its_vector(retrieval_vectors, monkeypatch):
    from iad_core.consistency.service import ConsistencyService
    from iad_core.workbench.runtime import workbench

    db, _, config, profile = retrieval_vectors
    runtime = workbench(db.db_path)
    image = runtime.temporary_images.accept((Path(config.root) / 'dent.png').read_bytes(), owner_id='session')
    calls = []
    def encode(selection, images):
        calls.append((selection.profile.profile_id, len(images), images[0].size))
        vector = np.zeros((1, profile.dim), dtype=np.float32)
        vector[0, 0] = 1
        return vector
    monkeypatch.setattr(runtime.images, 'encode', encode)
    request = ImageRetrieve(query={'kind': 'temporary', 'image_ref': image.image_ref},
        mode='combined', profile_id=profile.profile_id, top_k=2)
    for _ in range(2):
        result = ConsistencyService(db).retrieve(request, owner_id='session')
        assert result.visual.status == 'READY' and result.member_count == 3
        assert result.exact.member_count == 2 and result.visual.member_count == 1
    assert calls == [(profile.profile_id, 1, (320, 240))]
    assert runtime.temporary_images.stats().vector_bytes == profile.dim * 4
    assert len(FeatureRepository(db).records([PixelIndex(db).get(config.dataset.id + ':dent.png').content_group_id], profile.profile_id)) == 1
    runtime.temporary_images.release_owner('session')
    assert runtime.temporary_images.stats().vector_bytes == runtime.temporary_images.stats().image_count == 0


def test_failed_visual_source_does_not_downgrade_the_successful_exact_branch(retrieval_vectors):
    from iad_core.consistency.service import ConsistencyService

    db, _, config, profile = retrieval_vectors
    (Path(config.root) / 'normal.png').unlink()
    result = ConsistencyService(db).retrieve(ImageRetrieve(query={'kind': 'sample',
        'sample_id': config.dataset.id + ':dent.png'}, mode='combined', profile_id=profile.profile_id, top_k=2))
    assert result.exact.status == 'READY' and result.visual.status == 'PARTIAL'
    assert result.coverage.verification.total == 2
    assert result.coverage.verification.completed == result.coverage.verification.failed == 1
    assert result.exact.groups[0].members[0].relation == 'EXACT'
    assert result.visual.groups[0].members[0].relation == 'UNCHECKED'
    assert result.visual.groups[0].members[0].error_code == 'SOURCE_UNAVAILABLE'
    assert result.retrieval_completeness == 'PARTIAL'


def test_failed_query_encoder_keeps_real_corpus_coverage_and_exact_results(retrieval_vectors, monkeypatch):
    from iad_core.consistency.errors import ConsistencyError
    from iad_core.consistency.service import ConsistencyService
    from iad_core.workbench.runtime import workbench

    db, _, config, profile = retrieval_vectors
    runtime = workbench(db.db_path)
    image = runtime.temporary_images.accept((Path(config.root) / 'dent.png').read_bytes(), owner_id='session')
    def unavailable(*args):
        raise ConsistencyError('ENCODER_UNAVAILABLE', 'External encoder failed')
    monkeypatch.setattr(runtime.images, 'encode', unavailable)
    result = ConsistencyService(db).retrieve(ImageRetrieve(query={'kind': 'temporary', 'image_ref': image.image_ref},
        mode='combined', profile_id=profile.profile_id), owner_id='session')
    assert result.visual.status == 'NOT_READY' and result.visual.error_code == 'ENCODER_UNAVAILABLE'
    assert result.visual.corpus_coverage.completed == 4 and result.visual.corpus_coverage.pending == 0
    assert result.profile_id == profile.profile_id and result.exact.member_count == 2
    assert result.coverage.verification.completed == 2


def test_group_cursors_are_independent_and_stale_or_invalid_cursors_are_rejected(retrieval_vectors):
    from iad_core.consistency.errors import ConsistencyError
    from iad_core.consistency.retrieval_models import RetrievalPaging
    from iad_core.consistency.service import ConsistencyService

    db, registry, config, profile = retrieval_vectors
    service = ConsistencyService(db, paging=RetrievalPaging(group_page_size=1))
    request = ImageRetrieve(query={'kind': 'sample', 'sample_id': config.dataset.id + ':dent.png'},
        mode='combined', profile_id=profile.profile_id, top_k=3)
    first = service.retrieve(request)
    assert first.group_count == 3 and first.exact.group_count == 1 and first.visual.group_count == 2
    assert len(first.visual.groups) == 1 and first.visual.next_cursor
    second = service.retrieve(request.model_copy(update={'cursor': first.visual.next_cursor}))
    assert second.exact == first.exact
    assert second.visual.groups[0].members[0].sample_id.endswith(':normal2.png')
    assert second.visual.next_cursor is None and second.coverage == first.coverage
    with pytest.raises(ConsistencyError) as invalid:
        service.retrieve(request.model_copy(update={'cursor': 'not a cursor'}))
    assert invalid.value.code == 'INVALID_SCOPE'
    registry.rescan(config.dataset.id)
    with pytest.raises(ConsistencyError) as stale:
        service.retrieve(request.model_copy(update={'cursor': first.visual.next_cursor}))
    assert stale.value.code == 'SOURCE_UNAVAILABLE'


def test_temporary_images_enforce_capacity_expiry_and_close(dataset):
    from iad_core.consistency.errors import ConsistencyError
    from iad_core.consistency.temporary_images import TemporaryImageLimits, TemporaryImages

    _, _, config = dataset
    payload = (Path(config.root) / 'dent.png').read_bytes()
    images = TemporaryImages(TemporaryImageLimits(max_images=1, ttl_seconds=.05))
    image = images.accept(payload, owner_id='owner')
    with pytest.raises(ConsistencyError) as full:
        images.accept(payload, owner_id='owner')
    assert full.value.code == 'RESOURCE_LIMIT'
    time.sleep(.06)
    with pytest.raises(ConsistencyError) as expired:
        images.read(image.image_ref, owner_id='owner')
    assert expired.value.code == 'REFERENCE_NOT_FOUND' and images.stats().source_bytes == 0
    assert images.accept(payload, owner_id='owner').image_ref != image.image_ref
    images.close()
    assert images.stats().image_count == 0
    with pytest.raises(RuntimeError, match='closed'):
        images.accept(payload, owner_id='owner')


@pytest.mark.parametrize('top_k', [0, 201, True])
def test_visual_search_validates_the_requested_budget_before_applying_result_filters(retrieval_vectors, top_k):
    from pydantic import ValidationError
    from iad_core.feature.search import search_by_sample

    db, _, config, profile = retrieval_vectors
    with pytest.raises(ValidationError):
        search_by_sample(config.dataset.id + ':dent.png', top_k=top_k, profile_id=profile.profile_id,
            filter_quality_status='PASS', db_path=db.db_path)


def test_exact_service_in_a_fresh_process_does_not_load_models_or_faiss(dataset):
    db, _, config = dataset
    script = '''
import sys
from iad_core.storage.database import Database
from iad_core.consistency.service import ConsistencyService
from iad_core.consistency.models import ImageRetrieve
result = ConsistencyService(Database(sys.argv[1])).retrieve(ImageRetrieve(
    query={'kind':'sample','sample_id':sys.argv[2]}, mode='exact'))
assert result.exact.member_count == 1 and result.visual.status == 'NOT_REQUESTED'
assert not any(name in sys.modules for name in ('torch','faiss','transformers','iad_core.workbench.vision'))
print('exact retrieval without model or FAISS imports')
'''
    completed = subprocess.run([sys.executable, '-c', script, db.db_path, config.dataset.id + ':dent.png'],
        env={**os.environ, 'PYTHONPATH': str(Path(__file__).resolve().parents[1] / 'python')},
        capture_output=True, text=True, timeout=20)
    assert completed.returncode == 0, completed.stderr
    assert 'without model or FAISS imports' in completed.stdout


def test_preserving_file_size_and_mtime_cannot_reuse_a_stale_query_vector(retrieval_vectors):
    from iad_core.consistency.errors import ConsistencyError
    from iad_core.consistency.service import ConsistencyService

    db, _, config, profile = retrieval_vectors
    path = Path(config.root) / 'dent.png'
    stat = path.stat()
    payload = bytearray(path.read_bytes())
    payload[-1] ^= 1
    path.write_bytes(payload)
    os.utime(path, ns=(stat.st_atime_ns, stat.st_mtime_ns))
    with pytest.raises(ConsistencyError) as changed:
        ConsistencyService(db).retrieve(ImageRetrieve(query={'kind': 'sample',
            'sample_id': config.dataset.id + ':dent.png'}, mode='combined', profile_id=profile.profile_id))
    assert changed.value.code == 'SOURCE_UNAVAILABLE'


def test_visual_tool_preserves_partial_verification_and_unchecked_relationships(retrieval_vectors):
    from iad_core.tools.feature_tools import visual_search

    db, _, config, profile = retrieval_vectors
    (Path(config.root) / 'normal.png').unlink()
    result = visual_search(config.dataset.id + ':dent.png', profile_id=profile.profile_id, top_k=2, db_path=db.db_path)
    assert result.status == 'PARTIAL'
    assert result.metrics['verification_coverage']['failed'] == 1
    assert result.metrics['verification_coverage']['completed'] == 1
    unavailable = next(item for item in result.metrics['results'] if item['sample_id'].endswith(':normal.png'))
    assert unavailable['relation'] == 'UNCHECKED' and unavailable['error_code'] == 'SOURCE_UNAVAILABLE'


def test_unsupported_raw_pixels_remain_unknown_in_exact_mode(retrieval_vectors):
    from iad_core.consistency.service import ConsistencyService
    from iad_core.workbench.runtime import workbench

    import io
    db, _, _, _ = retrieval_vectors
    encoded = io.BytesIO()
    Image.new('CMYK', (20, 20), (1, 2, 3, 4)).save(encoded, format='JPEG')
    image = workbench(db.db_path).temporary_images.accept(encoded.getvalue(), owner_id='owner')
    result = ConsistencyService(db).retrieve(ImageRetrieve(query={'kind': 'temporary', 'image_ref': image.image_ref},
        mode='exact'), owner_id='owner')
    assert result.exact.status == 'UNSUPPORTED' and result.exact.error_code == 'UNSUPPORTED_IMAGE'
    assert result.coverage.verification.completed == result.member_count == 0
    assert result.retrieval_completeness == 'PARTIAL'
def test_exact_retrieval_reports_a_decode_budget_limit_without_claiming_equal_pixels(dataset, tmp_path):
    from tests.feature_fixtures import configure_test_encoder
    from iad_core.consistency.models import ImageRetrieve
    from iad_core.consistency.service import ConsistencyService
    from PIL import Image
    from pathlib import Path

    db, registry, config = dataset
    for name in ('dent', 'scratch'):
        Image.new('RGB', (512, 512), 'blue').save(Path(config.root) / (name + '.png'))
    registry.rescan(config.dataset.id)
    encoder = configure_test_encoder(db, tmp_path).model_copy(update={'decode_memory_mb': 1})
    page = ConsistencyService(db).retrieve_full(ImageRetrieve(query={'kind': 'sample', 'sample_id': config.dataset.id + ':dent.png'},
        corpus_scope={'kind': 'datasets', 'dataset_ids': [config.dataset.id]}, mode='exact'), encoder=encoder)
    assert page.exact.status == 'PARTIAL'
    member = page.exact.groups[0].members[0]
    assert member.error_code == 'RESOURCE_LIMIT' and member.pixel.exact_equal is None
    assert page.coverage.verification.unsupported == 1


def test_batch_retrieval_searches_each_content_once_and_preserves_per_sample_results(retrieval_vectors):
    from contextlib import closing
    from iad_core.workbench.runtime import WorkbenchRuntime

    db, _, config, profile = retrieval_vectors
    names = ('dent', 'scratch', 'normal', 'normal2')
    requests = [ImageRetrieve(query={'kind': 'sample', 'sample_id': config.dataset.id + ':' + name + '.png'},
        corpus_scope={'kind': 'all_registered'}, profile_id=profile.profile_id, top_k=2) for name in names]
    with closing(WorkbenchRuntime(db)) as runtime:
        service = runtime.consistency_service
        expected = [service.retrieve_full(request, prepare_query=False) for request in requests]
        before = runtime.indexes.stats()
        actual = list(service.retrieve_many(requests, prepare_query=False))
        after = runtime.indexes.stats()
        assert all(item.error is None for item in actual)
        assert [item.page for item in actual] == expected
        assert after.search_batches - before.search_batches == 1
        assert after.queries - before.queries == 3
        assert runtime.images.stats().encode_calls == 0


def test_batch_retrieval_retains_source_errors_and_cancels_before_another_search_chunk(retrieval_vectors):
    import threading
    from contextlib import closing
    from iad_core.workbench.runtime import WorkbenchRuntime

    db, _, config, profile = retrieval_vectors
    missing = Path(config.root) / 'normal2.png'
    missing.unlink()
    request = ImageRetrieve(query={'kind': 'sample', 'sample_id': config.dataset.id + ':dent.png'},
        corpus_scope={'kind': 'all_registered'}, profile_id=profile.profile_id, top_k=3)
    broken = request.model_copy(update={'query': request.query.model_copy(update={'sample_id': config.dataset.id + ':normal2.png'})})
    with closing(WorkbenchRuntime(db)) as runtime:
        outcomes = list(runtime.consistency_service.retrieve_many([request, broken, request], prepare_query=False))
        assert outcomes[0].error is outcomes[2].error is None
        assert outcomes[1].error.code == 'SOURCE_UNAVAILABLE'
        assert outcomes[1].page is None
        assert outcomes[0].page.coverage.verification.failed == 1
        before = runtime.indexes.stats()
        cancelled = threading.Event()
        def checkpoint():
            if cancelled.is_set():
                raise InterruptedError('Stop between streamed retrieval subjects')
        stream = runtime.consistency_service.retrieve_many([request] * 129, prepare_query=False, checkpoint=checkpoint)
        assert next(stream).page is not None
        cancelled.set()
        with pytest.raises(InterruptedError):
            next(stream)
        after = runtime.indexes.stats()
        assert after.search_batches - before.search_batches == 1
        assert after.queries - before.queries == 1
        assert after.pinned_entries == 0


def test_batch_retrieval_rejects_a_rescanned_frozen_corpus_between_subjects(retrieval_vectors):
    from contextlib import closing
    from iad_core.consistency.errors import ConsistencyError
    from iad_core.consistency.scopes import ConsistencyScopes
    from iad_core.workbench.runtime import WorkbenchRuntime

    db, registry, config, profile = retrieval_vectors
    scope = ConsistencyScopes(db).resolve({'kind': 'all_registered'})
    request = ImageRetrieve(query={'kind': 'sample', 'sample_id': config.dataset.id + ':dent.png'},
        corpus_scope=scope.selector, profile_id=profile.profile_id, top_k=2)
    with closing(WorkbenchRuntime(db)) as runtime:
        stream = runtime.consistency_service.retrieve_many([request, request], frozen_scope=scope, prepare_query=False)
        assert next(stream).page is not None
        Image.new('RGB', (320, 240), 'green').save(Path(config.root) / 'normal2.png')
        registry.rescan(config.dataset.id)
        stale = next(stream)
        assert stale.page is None and stale.error.code == 'SOURCE_UNAVAILABLE'
        with pytest.raises(ConsistencyError, match='one corpus'):
            list(runtime.consistency_service.retrieve_many([request, request.model_copy(update={'top_k': 1})]))


def test_missing_one_query_vector_does_not_discard_other_batch_results(retrieval_vectors):
    from contextlib import closing
    from iad_core.workbench.runtime import WorkbenchRuntime

    db, _, config, profile = retrieval_vectors
    missing = config.dataset.id + ':normal2.png'
    group = PixelIndex(db).get(missing).content_group_id
    FeatureRepository(db).upsert(FeatureRecord(content_group_id=group, profile_id=profile.profile_id,
        dim=profile.dim, dtype=profile.storage_dtype, status='FAILED', error_code='ENCODER_UNAVAILABLE', error_message='Unavailable query vector'))
    requests = [ImageRetrieve(query={'kind': 'sample', 'sample_id': config.dataset.id + ':' + name + '.png'},
        corpus_scope={'kind': 'all_registered'}, profile_id=profile.profile_id, top_k=2) for name in ('dent', 'normal2', 'scratch')]
    with closing(WorkbenchRuntime(db)) as runtime:
        results = list(runtime.consistency_service.retrieve_many(requests, prepare_query=False))
        assert all(item.error is None for item in results)
        assert results[0].page.exact.member_count == results[2].page.exact.member_count == 1
        assert results[1].page.visual.status == 'NOT_READY'
        assert results[1].page.visual.error_code == 'INDEX_NOT_READY'
        assert runtime.indexes.stats().search_batches == runtime.indexes.stats().queries == 1

