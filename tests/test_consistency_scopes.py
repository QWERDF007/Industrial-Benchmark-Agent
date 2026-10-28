import json

import pytest
from PIL import Image

from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.storage.database import Database
from iad_core.workbench.query import SampleQuery, WorkbenchQuery


def test_filtered_subjects_freeze_all_results_without_filtering_the_corpus(tmp_path):
    from iad_core.consistency.models import ConsistencyStart
    from iad_core.consistency.scopes import ConsistencyScopes

    db = Database(str(tmp_path / 'scopes.db'))
    datasets = []
    for name, count, annotated in [('NG', 120, True), ('OK', 1, False)]:
        directory = tmp_path / name
        directory.mkdir()
        for index in range(count):
            Image.new('RGB', (8, 8), 'blue').save(directory / f'{index:03}.png')
            if annotated:
                (directory / f'{index:03}.json').write_text(json.dumps({
                    'imageWidth': 8, 'imageHeight': 8,
                    'shapes': [{'label': 'dent', 'shape_type': 'rectangle', 'points': [[1, 1], [4, 4]]}],
                }))
        config = DatasetRegistry(db).import_dataset(DatasetImport.model_validate({
            'format': 'labelme', 'name': name, 'image_dir': str(directory), 'annotation_dir': str(directory),
        }).root)
        datasets.append(config.dataset.id)
    assert WorkbenchQuery(db).samples(SampleQuery(dataset_id=datasets[0]))['total'] == 120
    assert len(WorkbenchQuery(db).samples(SampleQuery(dataset_id=datasets[0]))['items']) == 24
    request = ConsistencyStart.model_validate({
        'subjects': {'kind': 'filtered', 'dataset_id': datasets[0], 'filters': {'annotation_filters': ['present']}},
        'request_id': 'complete-scope',
    })
    scopes = ConsistencyScopes(db).freeze(request.subjects, request.corpus_scope)
    assert scopes.subjects.sample_count == 120
    assert scopes.corpus.sample_count == 121
    assert set(scopes.corpus.dataset_ids) == set(datasets)
    assert len(scopes.subjects.samples) == 120
    assert {sample.dataset_id for sample in scopes.subjects.samples} == {datasets[0]}
    assert len(scopes.corpus.scans) == 2
    assert all(scan.scan_ref for scan in scopes.corpus.scans)
    assert scopes.subjects.frozen_at.utcoffset() is not None
    assert type(scopes).model_validate_json(scopes.model_dump_json()) == scopes
    frozen = scopes.model_dump(mode='json')
    # A later source publication cannot change an already frozen work plan.
    directory = tmp_path / 'NG'
    Image.new('RGB', (8, 8), 'red').save(directory / 'new.png')
    DatasetRegistry(db).rescan(datasets[0])
    assert scopes.model_dump(mode='json') == frozen
    updated = ConsistencyScopes(db).freeze(request.subjects, request.corpus_scope)
    assert updated.corpus.sample_count == 122
    assert updated.corpus.scope_id != scopes.corpus.scope_id


def test_scopes_report_missing_references_and_allow_an_empty_filtered_plan(dataset):
    from iad_core.consistency.models import ConsistencyStart
    from iad_core.consistency.scopes import ConsistencyScopes
    from iad_core.consistency.errors import ConsistencyError

    db, _, config = dataset
    scopes = ConsistencyScopes(db)
    request = ConsistencyStart.model_validate({
        'subjects': {'kind': 'filtered', 'dataset_id': config.dataset.id, 'filters': {'search': 'missing.png'}},
        'request_id': 'empty',
    })
    frozen = scopes.freeze(request.subjects, request.corpus_scope)
    assert frozen.subjects.sample_count == 0
    assert frozen.corpus.sample_count == 4
    assert frozen.subjects.dataset_ids == [config.dataset.id]
    for selector in [
        {'kind': 'datasets', 'dataset_ids': ['does-not-exist']},
        {'kind': 'samples', 'sample_ids': [config.dataset.id + ':normal.png', 'does-not-exist']},
    ]:
        with pytest.raises(ConsistencyError) as error:
            scopes.resolve(selector)
        assert error.value.code == 'REFERENCE_NOT_FOUND'
    assert scopes.resolve({'kind': 'samples', 'sample_ids': [config.dataset.id + ':normal.png']}).sample_count == 1


def test_ng_selection_keeps_ok_copies_in_the_other_registered_dataset(tmp_path):
    from iad_core.consistency.scopes import ConsistencyScopes
    from iad_core.dataset.folder_preview import preview_folder_dataset
    from iad_core.task.config import FolderRule

    db = Database(str(tmp_path / 'quality.db'))
    configs = []
    for label, role in [('NG', 'anomaly'), ('OK', 'normal')]:
        root = tmp_path / label
        root.mkdir()
        Image.new('RGB', (20, 20), 'red').save(root / 'same.png')
        rules = [{'path': '.', 'role': role}]
        preview = preview_folder_dataset(str(root), rules=[FolderRule.model_validate(rule) for rule in rules])
        configs.append(DatasetRegistry(db).import_dataset({'format': 'folder_classification', 'name': label,
            'root_dir': str(root), 'rules': rules, 'preview_fingerprint': preview.preview_fingerprint}))
    scopes = ConsistencyScopes(db).freeze({'kind': 'filtered', 'dataset_id': configs[0].dataset.id,
        'filters': {'raw_label_filters': ['NG']}}, {'kind': 'all_registered'})
    assert [sample.quality_status for sample in scopes.subjects.samples] == ['FAIL']
    assert {sample.quality_status for sample in scopes.corpus.samples} == {'PASS', 'FAIL'}
