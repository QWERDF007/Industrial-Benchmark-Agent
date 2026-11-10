import pytest

from iad_core.analysis.commits import AnalysisCommits
from iad_core.analysis.publications import AnalysisPublications
from iad_core.analysis.queries import AnalysisQueries


def test_finalization_reviews_all_entries_in_pages_and_publishes_once(observed_claim):
    from iad_core.analysis.finalization import AnalysisFinalizations
    jobs, run_id, submission, whole_ids = observed_claim
    first = submission['checks'][0]
    second = {**first, 'check_id':'inner', 'title':'内缘关系', 'location':'内缘',
        'criterion':'内缘可辨时，比较亮暗交界的连续关系。', 'support_evidence_ids':[whole_ids[0]]}
    context = jobs.context(run_id)
    AnalysisCommits(jobs).accept(run_id, {**submission, 'commit_key':'late-inner', 'base_revision':context.revision,
        'observations':[], 'checks':[second]})
    finalized = AnalysisFinalizations(jobs)
    context = finalized.context(run_id)
    assert context.phase == 'finalize'
    assert context.base_revision == 5 and context.revision == 5
    assert context.session_id == jobs.state(run_id).session_id
    assert [item.entry_id for item in context.entries] == ['edge', 'inner']
    assert context.pending_entry_ids == ['edge', 'inner']
    assert context.coverage.completed == 4
    assert context.directions[0].applicable == 4
    assert context.directions[0].entry_ids == ['edge', 'inner']
    assert 'round_id' not in context.model_dump() and 'round' not in context.model_dump()
    common = dict(base_revision=context.base_revision, summary='主体外缘与内缘可在各自可辨条件下复核。',
        limitations=[], unresolved_questions=[])
    page = {**common, 'commit_key':'early-entry', 'checks':[{**first,
        'key_evidence':[dict(evidence_id=whole_ids[0], role='support', reason='外缘完整，复核连续关系。')]}],
        'arguments':[dict(entry_id='edge', evidence_id=eid, role='support', reason='外缘在原图中可辨，支持该比较动作。') for eid in whole_ids]}
    with pytest.raises(ValueError, match='未定稿') as rejected:
        finalized.accept(run_id, {**page, 'complete':True})
    assert all('"'+entry_id+'"' in str(rejected.value) for entry_id in ['edge','inner'])
    assert '未保存' in str(rejected.value)
    assert finalized.context(run_id).revision == 5
    assert AnalysisQueries(jobs.db).versions(first['dataset_ids'][0], 'knowledge') == []
    receipt = finalized.accept(run_id, page)
    assert receipt.pending_entry_ids == ['inner'] and receipt.version_id is None
    assert receipt.revision == 6
    assert finalized.accept(run_id, page) == receipt
    resumed = AnalysisFinalizations(jobs).context(run_id)
    assert resumed.base_revision == 5 and resumed.revision == 6
    assert resumed.reviewed_entry_ids == ['edge'] and resumed.pending_entry_ids == ['inner']
    final = {**common, 'commit_key':'finish', 'complete':True, 'checks':[{**second,
        'key_evidence':[dict(evidence_id=whole_ids[0],role='support',reason='内缘亮暗交界可直接复核。')]}],
        'arguments':[dict(entry_id='inner', evidence_id=whole_ids[0], role='support', reason='内缘可辨，支持比较亮暗交界的动作。')],
        'direction_reviews':[dict(direction_ref='D1', reason='已核对全部登记，形成外缘和内缘两个有条件的比较方法。')]}
    accepted = finalized.accept(run_id, final)
    assert accepted.complete and accepted.pending_entry_ids == []
    publication = AnalysisPublications(jobs.db).get(accepted.version_id)
    assert publication.finalization.complete
    assert publication.finalization.reviewed_entry_ids == ['edge', 'inner']
    assert publication.coverage.completed == 4
    assert publication.catalog.checks[0].independent_source_count == 3
    jobs.jobs.finish_external(run_id)
    assert finalized.accept(run_id, final) == accepted
    assert AnalysisPublications(jobs.db).publish(run_id) == publication
    assert len(AnalysisQueries(jobs.db).versions(first['dataset_ids'][0], 'knowledge')) == 1
    assert len(jobs.jobs.status(run_id)['model_calls']) == 4


def test_full_coverage_without_finalization_is_partial_and_resumes_only_pending_review(observed_claim):
    from iad_core.analysis.finalization import AnalysisFinalizations
    jobs, run_id, submission, whole_ids = observed_claim
    finalizations = AnalysisFinalizations(jobs)
    context = finalizations.context(run_id)
    page = dict(commit_key='reviewed',base_revision=context.base_revision,summary='主体边缘在可辨条件下可复核。',
        limitations=[],unresolved_questions=[],checks=[{**submission['checks'][0],
            'key_evidence':[dict(evidence_id=whole_ids[0],role='support',reason='完整边缘可复查。')]}],
        arguments=[dict(entry_id='edge',evidence_id=eid,role='support',reason='该原图的外缘可辨，支持比较动作。') for eid in whole_ids])
    finalizations.accept(run_id,page)
    jobs.jobs.update(run_id,execution_error={'type':'LlmError','message':'controlled finalization capacity exhausted'})
    assert jobs.jobs.finish_external(run_id)['status'] == 'PARTIAL'
    from iad_core.workbench.analysis_job_views import AnalysisJobViews
    assert AnalysisJobViews(jobs.db).view(run_id)['status'] == 'PARTIAL'
    partial = AnalysisPublications(jobs.db).publish(run_id)
    assert partial.coverage.completed == 4 and partial.coverage.unprocessed == 0
    assert not partial.finalization.complete and partial.finalization.reviewed_entry_ids == ['edge']
    assert partial.execution_error.message == 'controlled finalization capacity exhausted'
    jobs.resume(run_id)
    resumed = finalizations.context(run_id)
    assert resumed.base_revision == context.base_revision and resumed.pending_entry_ids == []
    receipt = finalizations.accept(run_id,{**page,'commit_key':'summary','checks':[],'arguments':[],
        'direction_reviews':[dict(direction_ref='D1',reason='已遍历全部登记，保留一条有条件的边缘检查。')], 'complete':True})
    assert receipt.complete and receipt.version_id != partial.version_id
    assert AnalysisPublications(jobs.db).get(partial.version_id) == partial
    assert len(jobs.jobs.status(run_id)['model_calls']) == 4


def test_final_receipt_and_version_survive_owner_restart_without_more_observations(observed_claim):
    from iad_core.analysis.finalization import AnalysisFinalizations
    from iad_core.analysis.jobs import AnalysisAgentJobs
    from iad_core.workbench.runtime import WorkbenchRuntime
    jobs, run_id, submission, whole_ids = observed_claim
    context = AnalysisFinalizations(jobs).context(run_id)
    final = dict(commit_key='published',base_revision=context.base_revision,summary='主体边缘可在可辨条件下复核。',
        limitations=[],unresolved_questions=[],complete=True,checks=[{**submission['checks'][0],
            'key_evidence':[dict(evidence_id=whole_ids[0],role='support',reason='完整外缘可辨。')]}],
        direction_reviews=[dict(direction_ref='D1',reason='全部登记已观察，形成有条件的边缘比较方法。')],
        arguments=[dict(entry_id='edge',evidence_id=eid,role='support',reason='外缘可辨，支持检查动作。') for eid in whole_ids])
    receipt = AnalysisFinalizations(jobs).accept(run_id,final)
    version = AnalysisPublications(jobs.db).get(receipt.version_id)
    jobs.runtime.close()
    restored = WorkbenchRuntime(jobs.db)
    try:
        jobs = AnalysisAgentJobs(restored)
        context = AnalysisFinalizations(jobs).context(run_id)
        assert context.complete and context.version_id == receipt.version_id
        assert AnalysisFinalizations(jobs).accept(run_id,final) == receipt
        assert AnalysisPublications(jobs.db).publish(run_id) == version
        assert len(AnalysisQueries(jobs.db).versions(submission['checks'][0]['dataset_ids'][0],'knowledge')) == 1
        assert len(jobs.jobs.status(run_id)['model_calls']) == 4
    finally:
        restored.close()


@pytest.mark.parametrize('observed_claim',['empty'],indirect=True)
def test_complete_empty_catalog_requires_direction_reasons_and_publishes_formally(observed_claim):
    from iad_core.analysis.finalization import AnalysisFinalizations
    jobs, run_id, _, _ = observed_claim
    finalizations = AnalysisFinalizations(jobs)
    context = finalizations.context(run_id)
    assert context.entries == [] and context.coverage.completed == 4
    assert context.directions[0].applicable == 4 and context.directions[0].entry_ids == []
    final = dict(commit_key='empty',base_revision=context.base_revision,checks=[],complete=True,
        summary='已检查主体边缘，现有对照不足以形成可复用判据。',limitations=[],unresolved_questions=[])
    with pytest.raises(ValueError,match='未核对'):
        finalizations.accept(run_id,final)
    final['direction_reviews'] = [dict(direction_ref='D1',reason='目标可观察，但未得到支撑可复用判据的同条件对照。')]
    receipt = finalizations.accept(run_id,final)
    assert receipt.complete
    publication = AnalysisPublications(jobs.db).get(receipt.version_id)
    assert publication.catalog.checks == [] and publication.finalization.complete
    assert publication.coverage.completed == 4 and publication.coverage.failed == 0
    assert jobs.jobs.finish_external(run_id)['status'] == 'COMPLETED'


@pytest.mark.parametrize('title',['本轮新增主体外缘','核对 N1、N2、A1 的外缘','核对 img_abcdef123 的外缘'])
def test_finalization_reports_stage_wording_and_keeps_pending_entry(observed_claim, title):
    from iad_core.analysis.finalization import AnalysisFinalizations
    jobs, run_id, submission, whole_ids = observed_claim
    finalizations = AnalysisFinalizations(jobs)
    context = finalizations.context(run_id)
    page = dict(commit_key='global-wording',base_revision=context.base_revision,summary='主体外缘可沿原图复核。',
        limitations=[],unresolved_questions=[],checks=[{**submission['checks'][0], 'title':title,
            'key_evidence':[dict(evidence_id=whole_ids[0],role='support',reason='完整外缘可辨。')]}],
        arguments=[dict(entry_id='edge',evidence_id=eid,role='support',reason='外缘可辨，支持比较动作。') for eid in whole_ids])
    with pytest.raises(ValueError,match='发现顺序'):
        finalizations.accept(run_id,page)
    assert finalizations.context(run_id).pending_entry_ids == ['edge']
    assert jobs.state(run_id).catalog.checks[0].title == submission['checks'][0]['title']
    page['checks'][0]['title'] = '沿可辨外缘核对连续关系'
    receipt = finalizations.accept(run_id,page)
    assert receipt.pending_entry_ids == [] and not receipt.complete
