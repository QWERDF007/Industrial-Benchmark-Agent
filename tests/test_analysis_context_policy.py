from uuid import uuid4

from iad_core.analysis.commits import AnalysisCommits
from iad_core.analysis.evidence import AnalysisEvidence
from iad_core.analysis.models import AnalysisWorkflowSnapshot
from iad_core.analysis.jobs import AnalysisAgentJobs
from iad_core.workbench.calls import ModelCalls, NativeModelCallEnd, NativeModelCallStart


def test_new_jobs_freeze_on_demand_policy_and_derive_complete_evidence_from_argument_deltas(agent_jobs):
    jobs, dataset_id, role = agent_jobs
    run_id = AnalysisAgentJobs.start(jobs, dict(submission_id=str(uuid4()), analysis_kind='exploration', dataset_ids=[dataset_id],
        normal_images=[dataset_id + ':normal.png'], prompt=dict(text='核对可见外缘。')), agent=role)['run_id']
    snapshot = jobs.snapshot(run_id)
    assert snapshot.context_policy == 'evidence-on-demand-v1'
    legacy = snapshot.model_dump(exclude={'context_policy'})
    assert AnalysisWorkflowSnapshot.model_validate(legacy).context_policy == 'legacy'
    page = AnalysisEvidence(jobs).batch(run_id).registrations[0]
    call = NativeModelCallStart(call_id='call_' + uuid4().hex, started_at='2026-11-11T12:00:00Z', request={})
    ModelCalls(jobs.db).start_native(run_id, call, sample_id=None, session_id=jobs.state(run_id).session_id, attempt=1)
    AnalysisEvidence(jobs).delivered(run_id, call.call_id, [image.image.evidence_id for image in page.images])
    ModelCalls(jobs.db).finish_native(run_id, None, NativeModelCallEnd(call_id=call.call_id,
        finished_at='2026-11-11T12:00:01Z', elapsed_ms=1000, finish_reason='tool-calls'))
    evidence_id = page.evidence_id
    submission = dict(commit_key='initial', base_revision=0, round_id=1, directions=[dict(direction_id='edge',
        title='外缘连续性', instruction='沿可辨外缘核对连续关系。', rationale='外缘结构可辨。',
        applies_to='both', dataset_ids=[dataset_id], limitations=[])],
        arguments=[dict(entry_id='edge', evidence_id=evidence_id, role='support', reason='外缘可见连续结构。')],
        selections=[dict(entry_id='edge', key_evidence=[dict(evidence_id=evidence_id, role='support', reason='外缘清晰。')])],
        summary='外缘可按连续关系核对。', limitations=[], unresolved_questions=[])
    receipt = AnalysisCommits(jobs).accept(run_id, submission)
    assert AnalysisCommits(jobs).accept(run_id, submission) == receipt
    entry = jobs.state(run_id).catalog.directions[0]
    assert entry.evidence_ids == [evidence_id]
    assert entry.key_evidence[0].reason == '外缘清晰。'
    assert len(AnalysisEvidence(jobs).reference(run_id, dict(evidence_id=evidence_id)).images) == 1


def test_observer_candidates_keep_reasons_without_automatically_publishing_or_attaching_images(agent_jobs):
    from iad_core.analysis.delegation import AnalysisDelegation
    jobs, dataset_id, role = agent_jobs
    run_id = AnalysisAgentJobs.start(jobs, dict(submission_id=str(uuid4()), analysis_kind='exploration', dataset_ids=[dataset_id],
        normal_images=[dataset_id + ':normal.png'], prompt=dict(text='核对外缘。')), agent=role)['run_id']
    evidence = AnalysisEvidence(jobs)
    page = evidence.batch(run_id).registrations[0]
    def deliver(pages, session_id):
        call = NativeModelCallStart(call_id='call_' + uuid4().hex, started_at='2026-11-11T12:00:00Z', request={})
        ModelCalls(jobs.db).start_native(run_id, call, sample_id=None, session_id=session_id, attempt=1)
        evidence.delivered(run_id, call.call_id, [image.image.evidence_id for page in pages for image in page.images])
        ModelCalls(jobs.db).finish_native(run_id, None, NativeModelCallEnd(call_id=call.call_id,
            finished_at='2026-11-11T12:00:01Z', elapsed_ms=1000, finish_reason='tool-calls'))
    deliver([page], jobs.state(run_id).session_id)
    AnalysisCommits(jobs).accept(run_id, dict(commit_key='seed', base_revision=0, round_id=1, directions=[],
        summary='尚无可靠方向。', limitations=[], unresolved_questions=[]))
    delegation = AnalysisDelegation(jobs)
    task = delegation.wave(run_id).tasks[0]
    pages = delegation.materials(run_id, task.session_id).registrations
    deliver(pages, task.session_id)
    report = dict(assessments=[], discoveries=[], discovery_summary='已核对外缘，尚无新候选。',
        selected_evidence=[dict(evidence_id=pages[0].evidence_id, reason='外缘可辨，可按需复核。')])
    saved = delegation.report(run_id, task.session_id, report)
    assert saved.report.selected_evidence[0].reason == '外缘可辨，可按需复核。'
    assert 'key_evidence_ids' not in saved.report.model_dump()
    assert delegation.report(run_id, task.session_id, report) == saved
    assert jobs.state(run_id).catalog.directions == []


import pytest


@pytest.fixture
def on_demand_claim(agent_jobs):
    jobs, dataset_id, role = agent_jobs
    run_id = AnalysisAgentJobs.start(jobs, dict(submission_id=str(uuid4()), analysis_kind='exploration', dataset_ids=[dataset_id],
        normal_images=[dataset_id+':normal.png', dataset_id+':normal2.png'],
        defect_images=[dataset_id+':dent.png', dataset_id+':scratch.png'], prompt=dict(text='核对可见外缘。')), agent=role)['run_id']
    evidence = AnalysisEvidence(jobs)
    pages = evidence.batch(run_id).registrations
    call = NativeModelCallStart(call_id='call_' + uuid4().hex, started_at='2026-11-11T12:00:00Z', request={})
    ModelCalls(jobs.db).start_native(run_id, call, sample_id=None, session_id=jobs.state(run_id).session_id, attempt=1)
    evidence.delivered(run_id, call.call_id, [image.image.evidence_id for page in pages for image in page.images])
    ModelCalls(jobs.db).finish_native(run_id, None, NativeModelCallEnd(call_id=call.call_id,
        finished_at='2026-11-11T12:00:01Z', elapsed_ms=1000, finish_reason='tool-calls'))
    ids = [page.evidence_id for page in pages]
    body = dict(direction_id='edge',title='外缘连续性',instruction='沿可辨外缘核对连续关系。',
        rationale='可比外缘具有连续与不连续的变化。',applies_to='both',dataset_ids=[dataset_id],limitations=[])
    selections = [dict(entry_id='edge',key_evidence=[dict(evidence_id=ids[0],role='support',reason='连续外缘可辨。'),
        dict(evidence_id=ids[2],role='counter',reason='不连续外缘改变比较解释。')])]
    common = dict(summary='外缘可在可辨条件下比较。',limitations=[],unresolved_questions=[])
    AnalysisCommits(jobs).accept(run_id,dict(**common,commit_key='seed',base_revision=0,round_id=1,directions=[body],
        arguments=[dict(entry_id='edge',evidence_id=eid,role='counter' if index==2 else 'support',reason='外缘局部可见连续关系。')
            for index,eid in enumerate(ids)],selections=selections))
    return jobs,run_id,body,selections,common,ids,pages


def test_argument_and_selection_deltas_preserve_catalog_and_finalize_without_repeating_bodies(on_demand_claim):
    from iad_core.analysis.finalization import AnalysisFinalizations
    from iad_core.analysis.queries import AnalysisQueries
    from iad_core.analysis.publications import AnalysisPublications
    jobs,run_id,body,selections,common,ids,_ = on_demand_claim
    entry = jobs.state(run_id).catalog.directions[0]
    assert entry.evidence_ids == [ids[0],ids[1],ids[3]]
    commits = AnalysisCommits(jobs)
    commits.accept(run_id,dict(**common,commit_key='add-context',base_revision=1,round_id=1,directions=[],
        arguments=[dict(entry_id='edge',evidence_id=ids[0],role='context',reason='可观察外缘提供定位参照。')]))
    unchanged = jobs.state(run_id).catalog.directions[0]
    assert unchanged == entry
    assert AnalysisQueries(jobs.db).arguments(run_id,dict(entry_id='edge')).total == 5
    with pytest.raises(ValueError,match='复核全部既有有效论据'):
        commits.accept(run_id,dict(**common,commit_key='unreviewed-rewrite',base_revision=2,round_id=1,
            directions=[{**body,'instruction':'沿内缘比较连续关系。','change_reason':'改为内缘检查。'}]))
    assert jobs.state(run_id).revision == 2
    finalized = AnalysisFinalizations(jobs)
    context = finalized.context(run_id)
    final = dict(**common,commit_key='review',base_revision=context.base_revision,directions=[],selections=selections,complete=True)
    receipt = finalized.accept(run_id,final)
    assert receipt.complete
    assert finalized.accept(run_id,final) == receipt
    assert AnalysisPublications(jobs.db).get(receipt.version_id).catalog.directions[0] == entry


def test_explicit_whole_roi_and_historical_crop_reads_do_not_expand_each_other(on_demand_claim):
    jobs,run_id,_,_,_,ids,pages = on_demand_claim
    evidence = AnalysisEvidence(jobs)
    page = evidence.reference(run_id,dict(evidence_id=ids[2]))
    assert len(page.images)==1 and page.images[0].image.is_whole_image
    roi = evidence.reference(run_id,dict(evidence_id=ids[2],view='annotation_rois'))
    assert len(roi.images)==1 and not roi.images[0].image.is_whole_image
    assert evidence.reference(run_id,dict(evidence_id=roi.images[0].image.evidence_id)).images == roi.images
    crop = evidence.crop(run_id,dict(sample_id=pages[2].sample_id,bbox=[5,5,40,40]))
    assert len(crop.images)==1 and crop.images[0].required is False
    assert len(evidence.reference(run_id,dict(evidence_id=ids[2])).images)==1
    assert len(evidence.read(run_id,dict(sample_id=pages[2].sample_id)).images)==1
    assert evidence.read(run_id,dict(sample_id=pages[2].sample_id,view='annotation_rois')).images==roi.images
    assert jobs.state(run_id).revision==1


@pytest.mark.parametrize('text',['外缘 source.png 可见。','外缘 [img_'+'a'*64+'] 可见。','异常 A1 外缘可见。'])
def test_new_direction_prose_rejects_image_identity_markers_atomically(on_demand_claim,text):
    jobs,run_id,body,_,common,_,_ = on_demand_claim
    with pytest.raises(ValueError,match='正文'):
        AnalysisCommits(jobs).accept(run_id,dict(**common,commit_key='bad-prose',base_revision=1,round_id=1,
            directions=[{**body,'title':text}]))
    assert jobs.state(run_id).revision==1
