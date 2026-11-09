from pathlib import Path

import pytest
from PIL import Image

from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.storage.database import Database
from iad_core.workbench.analysis_manifest import AnalysisManifests


@pytest.fixture
def registered_scope(tmp_path):
    database = Database(str(tmp_path / 'analysis.db'))
    registry = DatasetRegistry(database)
    datasets = []
    for name, count, normal_count in [('甲', 11, 8), ('乙', 8, 4)]:
        directory = tmp_path / name
        directory.mkdir()
        for index in range(count):
            Image.new('RGB', (32, 24), 'gray').save(directory / f'{index:02}.png')
        config=registry.import_labelme(DatasetImport(format='labelme', name=name,
            image_dir=str(directory), annotation_dir=str(directory)))
        config.quality.source='filename_regex'
        config.quality.pattern='^([0-9]+)'
        config.quality.mapping={f'{index:02}':'PASS' if index<normal_count else 'FAIL' for index in range(count)}
        registry.save(config)
        registry.rescan(config.dataset.id)
        datasets.append(config.dataset.id)
    return database, datasets


def test_one_manifest_plans_hand_selected_exploration_then_full_scope_mining(registered_scope):
    database, datasets = registered_scope
    manifest = AnalysisManifests(database).freeze(datasets)
    selected = [record.sample.sample_id for record in manifest.records[:10]]
    exploration = manifest.plan('exploration', batch_size=4, normal_images=selected)
    mining = manifest.plan('knowledge', batch_size=4)

    assert [len(round.targets) for round in exploration.rounds] == [10, 4, 4, 1]
    assert [len(round.targets) for round in mining.rounds] == [4, 4, 4, 4, 3]
    assert [target.sample_id for target in exploration.rounds[0].targets] == selected
    assert {target.dataset_id for round in exploration.rounds for target in round.targets} == set(datasets)
    assert [round.sampling_counts.model_dump() for round in exploration.rounds] == [
        dict(normal=8, abnormal=2, unclassified=0), dict(normal=2, abnormal=2, unclassified=0),
        dict(normal=2, abnormal=2, unclassified=0), dict(normal=0, abnormal=1, unclassified=0)]
    assert [round.sampling_counts.model_dump() for round in mining.rounds] == [
        dict(normal=2, abnormal=2, unclassified=0), dict(normal=2, abnormal=2, unclassified=0),
        dict(normal=2, abnormal=2, unclassified=0), dict(normal=3, abnormal=1, unclassified=0),
        dict(normal=3, abnormal=0, unclassified=0)]
    assert [target.sample_id for target in mining.rounds[0].targets] == [
        datasets[0]+':00.png', datasets[0]+':01.png', datasets[0]+':08.png', datasets[0]+':09.png']
    assert len({(target.dataset_id, target.sample_id) for round in exploration.rounds for target in round.targets}) == 19
    assert all(target.candidate_role == 'normal' for target in exploration.rounds[0].targets)
    assert all(target.candidate_role is None for round in exploration.rounds[1:] for target in round.targets)


@pytest.mark.parametrize('batch_size,ratio,inventory,expected', [
    (8, (1,1), (16,16,0), [(4,4,0)]*4),
    (8, (3,1), (18,6,0), [(6,2,0)]*3),
    (5, (1,1), (5,5,0), [(3,2,0),(2,3,0)]),
    (4, (9,1), (9,3,0), [(3,1,0)]*3),
    (4, (1,1), (7,1,0), [(3,1,0),(4,0,0)]),
    (4, (1,1), (1,7,0), [(1,3,0),(0,4,0)]),
    (1, (1,1), (2,2,0), [(1,0,0),(0,1,0),(1,0,0),(0,1,0)]),
    (1, (3,1), (6,2,0), [(1,0,0),(1,0,0),(0,1,0),(1,0,0),(1,0,0),(1,0,0),(0,1,0),(1,0,0)]),
    (4, (1,1), (5,0,0), [(4,0,0),(1,0,0)]),
    (4, (1,1), (0,5,0), [(0,4,0),(0,1,0)]),
    (4, (1,1), (0,0,7), [(0,0,4),(0,0,3)]),
    (4, (1,1), (1,1,5), [(1,1,2),(0,0,3)]),
])
def test_mixed_batches_follow_exact_rounding_exhaustion_and_unclassified_rules(tmp_path, batch_size, ratio, inventory, expected):
    database = Database(str(tmp_path/'mixed.db'))
    images = tmp_path/'images'
    images.mkdir()
    identities = {}
    for prefix, count, status in zip(('n','a','u'), inventory, ('PASS','FAIL','UNCERTAIN')):
        for index in range(count):
            name = f'{prefix}{index:02}.png'
            Image.new('RGB', (16,16), 'gray').save(images/name)
            identities[name] = status
    config = DatasetRegistry(database).import_labelme(DatasetImport(format='labelme', name='混合范围',
        image_dir=str(images), annotation_dir=str(images)))
    config.quality.source='filename_regex'
    config.quality.pattern='^([nau])'
    config.quality.mapping={'n':'PASS','a':'FAIL','u':'UNCERTAIN'}
    DatasetRegistry(database).save(config)
    DatasetRegistry(database).rescan(config.dataset.id)
    manifest = AnalysisManifests(database).freeze([config.dataset.id])
    plan = manifest.plan('knowledge', batch_size=batch_size, sampling_ratio=dict(normal=ratio[0],abnormal=ratio[1]))
    assert [(round.sampling_counts.normal, round.sampling_counts.abnormal, round.sampling_counts.unclassified)
        for round in plan.rounds] == expected
    targets = [target.sample_id for round in plan.rounds for target in round.targets]
    assert len(targets) == len(set(targets)) == sum(inventory)
    assert set(targets) == {record.sample.sample_id for record in manifest.records}
    assert manifest.plan('knowledge', batch_size=batch_size, sampling_ratio=plan.sampling_ratio) == plan
    for group, prefix in [('normal','n'),('abnormal','a'),('unclassified','u')]:
        assert [sid for sid in targets if sid.split(':')[-1].startswith(prefix)] == [
            record.sample.sample_id for record in manifest.records if record.sampling_group == group]


def test_manifest_keeps_distinct_registration_and_source_states_without_decoding_or_filtering(registered_scope):
    database, datasets = registered_scope
    service = AnalysisManifests(database)
    before = service.freeze(datasets)
    with database.connection() as connection:
        connection.execute('UPDATE samples SET is_excluded=1 WHERE sample_id=?', (before.records[0].sample.sample_id,))
    Path(before.records[-1].sample.image_path).unlink()

    frozen = service.freeze(datasets)
    assert len(frozen.records) == 19
    assert frozen.records[0].sample.is_excluded
    assert frozen.records[0].source_fingerprint == before.records[0].source_fingerprint
    assert frozen.records[0].sample.relative_path == frozen.records[11].sample.relative_path == '00.png'
    assert frozen.records[0].sample.sample_id != frozen.records[11].sample.sample_id
    assert frozen.records[0].sample.annotation_availability == before.records[0].sample.annotation_availability
    assert frozen.records[0].annotations == []
    assert len(frozen.plan('knowledge', batch_size=4).rounds[-1].targets) == 3


@pytest.mark.parametrize('normal_count,defect_count', [(1, 0), (0, 1), (1, 1)])
def test_exploration_uses_only_hand_selection_first_and_all_registered_images_afterwards(registered_scope, normal_count, defect_count):
    database, datasets = registered_scope
    manifest = AnalysisManifests(database).freeze(datasets)
    ids = [record.sample.sample_id for record in manifest.records]
    normals, defects = ids[:normal_count], ids[normal_count:normal_count + defect_count]
    plan = manifest.plan('exploration', batch_size=1, normal_images=normals + normals, defect_images=defects)
    assert [target.sample_id for target in plan.rounds[0].targets] == normals + defects
    assert len(plan.rounds) == 1 + 19 - normal_count - defect_count
    assert len(manifest.plan('exploration', batch_size=1, normal_images=ids).rounds) == 1


def test_empty_selection_and_invalid_roles_cannot_produce_a_plan(registered_scope):
    database, datasets = registered_scope
    manifest = AnalysisManifests(database).freeze(datasets)
    ids = [record.sample.sample_id for record in manifest.records]
    with pytest.raises(ValueError, match='至少选择一张'):
        manifest.plan('exploration', batch_size=4)
    with pytest.raises(ValueError, match='两个角色'):
        manifest.plan('exploration', batch_size=4, normal_images=ids[:1], defect_images=ids[:1])
    with pytest.raises(ValueError, match='所选范围'):
        manifest.plan('exploration', batch_size=4, normal_images=['other:00.png'])


def test_empty_subset_is_kept_in_mixed_scope_but_all_empty_scope_cannot_produce_a_manifest(registered_scope, tmp_path):
    database, datasets = registered_scope
    empty_directory = tmp_path / 'empty'
    empty_directory.mkdir()
    registry = DatasetRegistry(database)
    empty_config = registry.get(datasets[0]).model_copy(deep=True)
    empty_config.dataset.id = 'empty'
    empty_config.root = str(empty_directory)
    empty_config.annotations.root = str(empty_directory)
    registry.save(empty_config)
    empty = empty_config.dataset.id
    manifests = AnalysisManifests(database)
    with pytest.raises(ValueError, match='所选范围没有登记样本'):
        manifests.freeze([empty])
    manifest = manifests.freeze([empty, *datasets])
    assert manifest.dataset_ids == [empty, *datasets]
    assert len(manifest.records) == 19
    assert len(manifest.plan('knowledge', batch_size=1).rounds) == 19
