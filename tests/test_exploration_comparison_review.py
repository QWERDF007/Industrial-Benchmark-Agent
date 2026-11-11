import json
from uuid import uuid4

import pytest
from PIL import Image, ImageDraw

from iad_core.analysis.commits import AnalysisCommits
from iad_core.analysis.evidence import AnalysisEvidence
from iad_core.analysis.finalization import AnalysisFinalizations
from iad_core.analysis.publications import AnalysisPublications
from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.workbench.calls import ModelCalls, NativeModelCallEnd, NativeModelCallStart
from iad_core.workbench.module_settings import ModuleSettings


@pytest.fixture
def comparison_job(agent_jobs, tmp_path, request):
    jobs, _, role = agent_jobs
    has_normal = getattr(request, 'param', True)
    source = tmp_path / 'comparison'
    source.mkdir()
    for index in range(4):
        image = Image.new('RGB', (100, 80), (30 + index, 40, 50))
        ImageDraw.Draw(image).rectangle([10, 10, 90, 70], outline='white')
        image.save(source / f'{index}.png')
        (source / f'{index}.json').write_text(json.dumps(dict(imageWidth=100, imageHeight=80,
            shapes=[] if has_normal and index < 2 else [dict(label='18', shape_type='rectangle', points=[[10, 10], [30, 30]])])))
    dataset = DatasetRegistry(jobs.db).import_labelme(DatasetImport(format='labelme', name='正常对照',
        image_dir=str(source), annotation_dir=str(source)))
    did = dataset.dataset.id
    ids = [did + f':{index}.png' for index in range(4)]
    ModuleSettings(jobs.db).save(dict(module='exploration', expected_revision=1, settings=dict(batch_size=4)))
    run_id = jobs.start(dict(submission_id=str(uuid4()), analysis_kind='exploration', dataset_ids=[did],
        normal_images=ids[:2] if has_normal else [], defect_images=ids[2:] if has_normal else ids, prompt=dict(text='观察可见部位和比较关系。')), agent=role)['run_id']
    materials = AnalysisEvidence(jobs).batch(run_id)
    call = NativeModelCallStart(call_id='call_' + uuid4().hex, started_at='2026-11-10T12:00:00Z', request=dict(fixture='complete batch'))
    ModelCalls(jobs.db).start_native(run_id, call, sample_id=None, session_id=materials.context.session_id, attempt=1)
    AnalysisEvidence(jobs).delivered(run_id, call.call_id,
        [item.image.evidence_id for page in materials.registrations for item in page.images])
    ModelCalls(jobs.db).finish_native(run_id, None, NativeModelCallEnd(call_id=call.call_id,
        finished_at='2026-11-10T12:00:01Z', elapsed_ms=1000, finish_reason='tool-calls'))
    wholes = [page.evidence_id for page in materials.registrations]
    entry = dict(direction_id='edge', title='边缘连续性', instruction='沿可辨外缘逐段比较连续关系。',
        rationale='对比同一部位的连续边缘与局部缺口。', applies_to='both', evidence_ids=[wholes[0], wholes[2]],
        counter_evidence_ids=[], limitations=[], dataset_ids=[did])
    submission = dict(commit_key='observed', base_revision=0, round_id=1, summary='边缘可在同位条件下比较。',
        limitations=[], unresolved_questions=[], directions=[entry],
        observations=[dict(dataset_id=did, sample_id=page.sample_id, description='完整主体边缘可辨。',
            evidence_ids=[page.evidence_id]) for page in materials.registrations],
        arguments=[dict(entry_id='edge', evidence_id=eid, role='support', reason='同位边缘可辨，支持比较连续性。')
            for eid in [wholes[0], wholes[2]]])
    return jobs, run_id, submission, wholes


@pytest.mark.parametrize('comparison_job', [True, False], indirect=True, ids=['comparable-normal', 'no-normal'])
def test_finalization_accepts_representative_without_requiring_normal_image(comparison_job):
    jobs, run_id, submission, wholes = comparison_job
    AnalysisCommits(jobs).accept(run_id, submission)
    finalizations = AnalysisFinalizations(jobs)
    context = finalizations.context(run_id)
    final = dict(commit_key='representative', base_revision=context.base_revision, complete=True,
        summary=submission['summary'], limitations=[], unresolved_questions=[], directions=[{
            **submission['directions'][0], 'key_evidence':[
                dict(evidence_id=wholes[2], role='support', reason='该原图呈现可复核的边缘现象。')]}])
    accepted = finalizations.accept(run_id, final)
    published = AnalysisPublications(jobs.db).get(accepted.version_id)
    assert accepted.complete
    assert [item.evidence_id for item in published.catalog.directions[0].key_evidence] == [wholes[2]]


def test_selected_image_role_error_names_the_actual_argument_role(comparison_job):
    jobs, run_id, submission, wholes = comparison_job
    submission['directions'][0]['key_evidence'] = [dict(evidence_id=wholes[0], role='context', reason='正常部位对照。')]
    with pytest.raises(ValueError, match='精选.*角色.*context.*不一致.*support'):
        AnalysisCommits(jobs).accept(run_id, submission)
    assert jobs.state(run_id).revision == 0
