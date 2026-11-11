import json
from uuid import uuid4

from PIL import Image

from iad_core.analysis.queries import AnalysisQueries
from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.workbench.analysis_manifest import AnalysisManifests
from iad_core.workbench.module_settings import ModuleSettings


def test_exploration_sampling_uses_the_same_labelme_roles_as_source_selection(agent_jobs, tmp_path):
    jobs, _, role = agent_jobs
    source = tmp_path / 'role-source'
    source.mkdir()
    for index in range(8):
        Image.new('RGB', (64, 48), 'gray').save(source / f'{index}.png')
        shapes = [] if index < 4 else [dict(label='18', shape_type='rectangle', points=[[10, 10], [30, 30]])]
        (source / f'{index}.json').write_text(json.dumps(dict(imageWidth=64, imageHeight=48, shapes=shapes)))
    dataset = DatasetRegistry(jobs.db).import_labelme(DatasetImport(format='labelme', name='标注分组',
        image_dir=str(source), annotation_dir=str(source)))
    ids = [dataset.dataset.id]
    catalog = AnalysisQueries(jobs.db).sources(ids)
    roles = {item.sample_id:item.candidate_role for item in catalog.items}
    assert list(roles.values()) == ['normal'] * 4 + ['defect'] * 4
    legacy = AnalysisManifests(jobs.db).freeze(ids)
    assert {record.sample.quality_status for record in legacy.records} == {'UNCERTAIN'}
    assert {record.sampling_group for record in legacy.records} == {'unclassified'}
    ModuleSettings(jobs.db).save(dict(module='exploration', expected_revision=1, settings=dict(batch_size=4)))
    normal = [sid for sid, kind in roles.items() if kind == 'normal'][:2]
    defect = [sid for sid, kind in roles.items() if kind == 'defect'][:2]
    job = jobs.start(dict(submission_id=str(uuid4()), analysis_kind='exploration', dataset_ids=ids,
        normal_images=normal, defect_images=defect, prompt=dict(text='比较原图。')), agent=role)
    snapshot = jobs.snapshot(job['run_id'])
    assert [round.sampling_counts.model_dump() for round in snapshot.plan.rounds] == [
        dict(normal=2, abnormal=2, unclassified=0), dict(normal=2, abnormal=2, unclassified=0)]
    assert [target.sample_id for target in snapshot.plan.rounds[0].targets] == normal + defect
    assert len({target.sample_id for round in snapshot.plan.rounds for target in round.targets}) == 8
    assert {record.sample.sample_id:record.sampling_group for record in snapshot.manifest.records} == {
        sid:'normal' if kind == 'normal' else 'abnormal' for sid,kind in roles.items()}
    assert AnalysisManifests(jobs.db).freeze(ids).model_dump(exclude={'frozen_at'}) == legacy.model_dump(exclude={'frozen_at'})
