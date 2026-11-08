from uuid import uuid4
import threading
import pytest

from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_results import ConsistencyAgentResults
from iad_core.consistency.agent_preparation import ConsistencyAgentPreparation
from iad_core.consistency.job_models import ConsistencyBatch
from iad_core.feature.profiles import ImageEncoderEdit, ImageEncoders
from iad_core.workbench.runtime import WorkbenchRuntime
from tests.feature_fixtures import MockFeatureExtractor, configure_test_encoder


def wait_for_preparation(preparation: ConsistencyAgentPreparation, run_id: str) -> ConsistencyBatch:
    batch = preparation.prepare(run_id)
    assert batch is not None
    while batch.status in ('PENDING', 'RUNNING'):
        for child in batch.children:
            if child.status in ('PENDING', 'RUNNING'):
                preparation.runtime.jobs.wait(child.run_id, 5)
                assert preparation.runtime.jobs.status(child.run_id)['status'] not in ('PENDING', 'RUNNING')
        batch = preparation.prepare(run_id)
        assert batch is not None
    return batch


def test_preparation_returns_a_live_batch_before_the_encoder_finishes(dataset, tmp_path, monkeypatch):
    from concurrent.futures import ThreadPoolExecutor

    db, _, config = dataset
    encoder = configure_test_encoder(db, tmp_path)
    runtime = WorkbenchRuntime(db)
    entered, release = threading.Event(), threading.Event()

    def encode(selection, images):
        entered.set()
        assert release.wait(5)
        return MockFeatureExtractor(profile=selection.profile).encode_batch(images)

    monkeypatch.setattr(runtime.images, 'encode', encode)
    try:
        checks = ConsistencyAgentJobs(runtime)
        run = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'combined'})['run_id']
        with ThreadPoolExecutor(max_workers=1) as executor:
            pending = executor.submit(ConsistencyAgentPreparation(runtime).prepare, run)
            assert entered.wait(5)
            try:
                batch = pending.result(timeout=1)
                assert batch.status in ('PENDING', 'RUNNING')
                assert runtime.jobs.status(run)['status'] == 'RUNNING'
                assert set(runtime.jobs.status(run)['batch_runs']) == {child.run_id for child in batch.children}
            finally:
                release.set()
        checks.cancel(run)
    finally:
        release.set();runtime.close()


def test_combined_prepares_frozen_subjects_and_corpus_once_and_reuses_shared_vectors(dataset, tmp_path, monkeypatch):
    db, _, config = dataset
    encoder = configure_test_encoder(db, tmp_path)
    runtime = WorkbenchRuntime(db)
    encoded = []

    def encode(selection, images):
        encoded.extend(images)
        assert selection == encoder
        return MockFeatureExtractor(profile=selection.profile).encode_batch(images)

    monkeypatch.setattr(runtime.images, 'encode', encode)
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchor = config.dataset.id + ':normal.png'
        job = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'combined',
            'subjects': {'kind': 'samples', 'sample_ids': [anchor]}})
        frozen = checks.snapshot(job['run_id'])
        # A later settings edit must not select a different encoder for this job.
        settings = ImageEncoders(db)
        settings.save(ImageEncoderEdit(expected_revision=settings.read().revision, selection=None))
        prepared = wait_for_preparation(ConsistencyAgentPreparation(runtime), job['run_id'])
        assert prepared.status == 'COMPLETED'
        assert {item.phase for item in checks.anchors(job['run_id'])} == {'SHARED_INDEX_READY'}
        assert prepared.total == prepared.completed == 4
        assert runtime.jobs.status(job['run_id'])['prepared_sources'] == 4
        assert len(encoded) == 3
        assert all(child.job_type == 'IMAGE_INDEX' and child.model_calls == [] for child in prepared.children)
        assert all(child.embedding_profile == encoder.profile for child in prepared.children)
        assert ConsistencyAgentPreparation(runtime).prepare(job['run_id']).batch_id == prepared.batch_id
        assert len(encoded) == 3
        checks.session_created(job['run_id'], anchor)
        candidates = checks.retrieve(job['run_id'], anchor)
        assert candidates.similar.state == 'done'
        assert checks.snapshot(job['run_id']) == frozen
        assert ConsistencyAgentResults(db).diagnostics(job['run_id'], anchor).calls == []
        checks.cancel(job['run_id'])
        next_job = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'combined',
            'subjects': {'kind': 'samples', 'sample_ids': [anchor]}})
        assert checks.snapshot(next_job['run_id']).image_encoder is None
    finally:
        runtime.close()


def test_preparation_cancellation_keeps_cached_content_and_resumes_only_unfinished_work(dataset, tmp_path, monkeypatch):
    db, _, config = dataset
    encoder = configure_test_encoder(db, tmp_path).model_copy(update={'batch_size': 1})
    encoders = ImageEncoders(db)
    encoders.save(ImageEncoderEdit(expected_revision=encoders.read().revision, selection=encoder))
    runtime = WorkbenchRuntime(db)
    entered, release = threading.Event(), threading.Event()
    colors = []

    def encode(selection, images):
        colors.extend(image.getpixel((0, 0)) for image in images)
        if len(colors) == 2:
            entered.set()
            assert release.wait(5)
        return MockFeatureExtractor(profile=selection.profile).encode_batch(images)

    monkeypatch.setattr(runtime.images, 'encode', encode)
    try:
        checks = ConsistencyAgentJobs(runtime)
        run = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'combined'})['run_id']
        preparation = ConsistencyAgentPreparation(runtime)
        pending = preparation.prepare(run)
        assert entered.wait(5)
        batch_id = pending.batch_id
        checks.cancel(run)
        release.set()
        for child in pending.children:
            runtime.jobs.wait(child.run_id, 5)
        assert runtime.consistency.status(batch_id).status == 'CANCELLED'
        checks.resume(run)
        prepared = wait_for_preparation(preparation, run)
        assert prepared.status == 'COMPLETED'
        assert prepared.batch_id != batch_id
        assert prepared.root_batch_id == batch_id
        assert colors.count((0, 0, 255)) == 1
        assert runtime.jobs.status(run)['completed'] == 0
    finally:
        release.set()
        runtime.close()


def test_query_subject_outside_the_corpus_gets_a_vector_without_expanding_the_corpus(dataset, tmp_path, monkeypatch):
    from PIL import Image
    from iad_core.dataset.registry import DatasetImport

    db, registry, config = dataset
    encoder = configure_test_encoder(db, tmp_path)
    reference = tmp_path / 'reference'
    reference.mkdir()
    Image.new('RGB', (32, 32), 'red').save(reference / 'reference.png')
    other = registry.import_labelme(DatasetImport(format='labelme', name='独立检索库',
        image_dir=str(reference), annotation_dir=str(reference)))
    runtime = WorkbenchRuntime(db)
    monkeypatch.setattr(runtime.images, 'encode', lambda selection, images: MockFeatureExtractor(profile=selection.profile).encode_batch(images))
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchor = config.dataset.id + ':dent.png'
        run = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'combined',
            'subjects': {'kind': 'samples', 'sample_ids': [anchor]},
            'corpus_scope': {'kind': 'datasets', 'dataset_ids': [other.dataset.id]}})['run_id']
        prepared = wait_for_preparation(ConsistencyAgentPreparation(runtime), run)
        assert prepared.total == prepared.completed == 2
        frozen = checks.snapshot(run)
        with runtime.indexes.acquire(frozen.scopes.corpus, encoder.profile.profile_id) as index:
            assert index.info.member_count == index.info.vector_count == 1
        checks.session_created(run, anchor)
        candidates = checks.retrieve(run, anchor)
        assert candidates.similar.state == 'done'
        assert all(item.sample_id.startswith(other.dataset.id + ':') for item in candidates.candidates)
    finally:
        runtime.close()


def test_index_failure_does_not_retry_encoding_until_the_job_is_explicitly_resumed(dataset, tmp_path, monkeypatch):
    from iad_core.consistency.errors import ConsistencyError
    from iad_core.workbench.job_models import JobExecutionError

    db, _, config = dataset
    encoder = configure_test_encoder(db, tmp_path)
    runtime = WorkbenchRuntime(db)
    calls, fail = [], True

    def encode(selection, images):
        calls.append(len(images))
        if fail:
            raise ConsistencyError('ENCODER_UNAVAILABLE', '实际编码器请求失败')
        return MockFeatureExtractor(profile=encoder.profile).encode_batch(images)

    monkeypatch.setattr(runtime.images, 'encode', encode)
    try:
        checks = ConsistencyAgentJobs(runtime)
        run = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'combined'})['run_id']
        preparation = ConsistencyAgentPreparation(runtime)
        for _ in range(2):
            with pytest.raises(JobExecutionError) as failure:
                wait_for_preparation(preparation, run)
            assert failure.value.code == 'ENCODER_UNAVAILABLE'
            assert len(calls) == 1
        checks.cancel(run)
        checks.resume(run)
        fail = False
        result = wait_for_preparation(preparation, run)
        assert result.status == 'COMPLETED'
        assert len(calls) == 2
        assert ConsistencyAgentResults(db).diagnostics(run, checks.anchors(run)[0].anchor_id).calls == []
    finally:
        runtime.close()
