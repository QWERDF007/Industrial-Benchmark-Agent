from pathlib import Path
from uuid import uuid4

import numpy as np
import pytest
from PIL import Image

from iad_core.consistency.models import ConsistencyRetrievalSettings, ImageRetrieve
from iad_core.consistency.scopes import ConsistencyScopes
from iad_core.consistency.service import ConsistencyService
from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.duplicate.index import PixelIndex
from iad_core.storage.database import Database
from iad_core.storage.features import FeatureRepository
from iad_core.storage.models import FeatureRecord
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.module_settings import ModuleSettings
from tests.feature_fixtures import configure_test_encoder


def test_anchor_candidates_count_samples_and_exclude_all_exact_overflow(tmp_path):
    from iad_core.consistency.candidate_selection import AnchorCandidates

    root = tmp_path / 'images'
    root.mkdir()
    Image.new('RGB', (24, 24), 'blue').save(root / 'anchor.png')
    for i in range(12):
        Image.new('RGB', (24, 24), 'blue').save(root / f'exact-{i:02}.png')
    for i in range(24):
        Image.new('RGB', (24, 24), (i // 7 + 10, 30, 180)).save(root / f'similar-{i:02}.png')
    database = Database(str(tmp_path / 'candidates.db'))
    config = DatasetRegistry(database).import_labelme(DatasetImport(format='labelme', name='候选配额',
        image_dir=str(root), annotation_dir=str(root)))
    encoder = configure_test_encoder(database, tmp_path)
    repository = FeatureRepository(database)
    for image in sorted(root.iterdir()):
        group = PixelIndex(database).get(config.dataset.id + ':' + image.name).content_group_id
        vector = np.zeros(encoder.profile.dim, dtype=encoder.profile.storage_dtype)
        vector[:2] = (1, 0) if image.name.startswith(('anchor', 'exact')) else (.99, np.sqrt(1 - .99 ** 2))
        repository.upsert(FeatureRecord(content_group_id=group, profile_id=encoder.profile.profile_id,
            dim=encoder.profile.dim, dtype=encoder.profile.storage_dtype, embedding_blob=vector.tobytes()))
    runtime = WorkbenchRuntime(database)
    try:
        scope = ConsistencyScopes(database).resolve({'kind': 'datasets', 'dataset_ids': [config.dataset.id]})
        anchor = config.dataset.id + ':anchor.png'
        request = ImageRetrieve(query={'kind': 'sample', 'sample_id': anchor}, corpus_scope=scope.selector,
            mode='combined', profile_id=encoder.profile.profile_id, top_k=10, min_similarity=.98)
        retrieved = ConsistencyService(database, runtime=runtime).retrieve_full(request, frozen_scope=scope)
        selected = AnchorCandidates.select(retrieved, ConsistencyRetrievalSettings())
        assert selected.anchor_id == anchor
        assert selected.exact.matched == 12 and selected.exact.selected == 5 and selected.exact.truncated
        assert selected.similar.matched == 24 and selected.similar.selected == 10 and selected.similar.truncated
        assert [Path(candidate.sample_id.rsplit(':', 1)[1]).name for candidate in selected.candidates] == [
            *[f'exact-{i:02}.png' for i in range(5)], *[f'similar-{i:02}.png' for i in range(10)]]
        limited = AnchorCandidates.select(retrieved,
            ConsistencyRetrievalSettings(max_exact_candidates=3, max_similar_candidates=7))
        assert limited.exact.selected == 3 and limited.similar.selected == 7
        assert [item.rank for item in limited.candidates if item.kind == 'similar'] == list(range(1, 8))

        from iad_core.consistency.agent_jobs import ConsistencyAgentJobs

        modules, checks = ModuleSettings(database), ConsistencyAgentJobs(runtime)
        original = None
        for revision, mode, exact_limit, similar_limit, expected in [
                (0, 'combined', 3, 7, (3, 7)),
                (1, 'exact', 3, 7, (3, 0)),
                (2, 'combined', 11, 22, (11, 22))]:
            modules.save({'module': 'consistency', 'expected_revision': revision,
                'settings': {'mode': mode, 'min_similarity': .98,
                    'max_exact_candidates': exact_limit, 'max_similar_candidates': similar_limit}})
            job = checks.start({'dataset_ids': [config.dataset.id], 'submission_id': str(uuid4()),
                'subjects': {'kind': 'samples', 'sample_ids': [anchor]}})
            checks.session_created(job['run_id'], anchor)
            frozen = checks.retrieve(job['run_id'], anchor)
            assert (frozen.exact.selected, frozen.similar.selected) == expected
            if revision == 0:
                original = (job['run_id'], checks.snapshot(job['run_id']), checks.anchor(job['run_id'], anchor))
                checks.cancel(job['run_id'])
            elif mode == 'exact':
                assert checks.snapshot(job['run_id']).retrieval.min_similarity is None
                assert frozen.similar.state == 'disabled'
        original_id, snapshot, previous = original
        continued = checks.resume(original_id)
        assert continued['run_id'] == original_id
        assert checks.snapshot(original_id) == snapshot
        assert checks.anchor(original_id, anchor).session_id == previous.session_id
        assert checks.retrieve(original_id, anchor) == previous.candidates
        assert (previous.candidates.exact.selected, previous.candidates.similar.selected) == (3, 7)
    finally:
        runtime.close()


def test_exact_candidates_work_without_an_encoder_and_empty_is_a_complete_result(dataset):
    from iad_core.consistency.candidate_selection import AnchorCandidates
    from iad_core.feature.profiles import ImageEncoders

    database, _, config = dataset
    assert ImageEncoders(database).read().selection is None
    runtime = WorkbenchRuntime(database)
    try:
        scope = ConsistencyScopes(database).resolve({'kind': 'datasets', 'dataset_ids': [config.dataset.id]})
        settings = ConsistencyRetrievalSettings(mode='exact', max_exact_candidates=3, max_similar_candidates=7)
        service = ConsistencyService(database, runtime=runtime)
        for anchor, expected in [('dent', ['scratch']), ('normal', [])]:
            retrieved = service.retrieve_full(ImageRetrieve(query={'kind': 'sample',
                'sample_id': config.dataset.id + ':' + anchor + '.png'}, corpus_scope=scope.selector, mode='exact'),
                frozen_scope=scope)
            selected = AnchorCandidates.select(retrieved, settings)
            assert [candidate.sample_id for candidate in selected.candidates] == [config.dataset.id + ':' + name + '.png' for name in expected]
            assert selected.min_similarity is None
            assert selected.exact.state == 'done'
            assert selected.similar.model_dump() == {'state': 'disabled', 'limit': 0, 'matched': None,
                'selected': 0, 'truncated': False}
        assert ImageEncoders(database).read().selection is None
    finally:
        runtime.close()


def test_combined_retrieval_without_vectors_cannot_be_selected_as_an_empty_success(dataset):
    from iad_core.consistency.candidate_selection import AnchorCandidates
    from iad_core.consistency.errors import ConsistencyError

    database, _, config = dataset
    runtime = WorkbenchRuntime(database)
    try:
        retrieved = ConsistencyService(database, runtime=runtime).retrieve_full(ImageRetrieve(
            query={'kind': 'sample', 'sample_id': config.dataset.id + ':normal.png'},
            corpus_scope={'kind': 'datasets', 'dataset_ids': [config.dataset.id]},
            mode='combined', top_k=10, min_similarity=.98))
        assert retrieved.visual.status != 'READY'
        with pytest.raises(ConsistencyError) as failure:
            AnchorCandidates.select(retrieved, ConsistencyRetrievalSettings())
        assert failure.value.code == retrieved.visual.error_code
    finally:
        runtime.close()
