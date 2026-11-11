from uuid import uuid4

import pytest

from iad_core.analysis.commits import AnalysisCommits
from iad_core.analysis.coverage import AnalysisCoverageReader
from iad_core.analysis.evidence import AnalysisEvidence
from iad_core.analysis.queries import AnalysisQueries
from iad_core.workbench.calls import ModelCalls, NativeModelCallEnd, NativeModelCallStart
from iad_core.workbench.module_settings import ModuleSettings


def deliver(jobs, run_id, session_id, pages, *, omit=(), failed=False):
    call_id = 'call_' + uuid4().hex
    calls = ModelCalls(jobs.db)
    calls.start_native(run_id, NativeModelCallStart(call_id=call_id, started_at='2026-11-11T12:00:00Z', request={}),
        sample_id=None, session_id=session_id, attempt=1)
    AnalysisEvidence(jobs).delivered(run_id, call_id,
        [image.image.evidence_id for page in pages for image in page.images if image.image.evidence_id not in omit])
    calls.finish_native(run_id, None, NativeModelCallEnd(call_id=call_id,
        finished_at='2026-11-11T12:00:01Z', elapsed_ms=1000,
        finish_reason='error' if failed else 'tool-calls', **({'error': {'type':'ProviderError', 'message':'请求失败'}} if failed else {})))


def test_first_batch_can_complete_without_per_image_text_or_invented_observations(agent_jobs):
    jobs, dataset_id, role = agent_jobs
    run_id = jobs.start(dict(submission_id=str(uuid4()), analysis_kind='exploration', dataset_ids=[dataset_id],
        normal_images=[dataset_id + ':normal.png'], prompt=dict(text='整批联合比较。')), agent=role)['run_id']
    pages = AnalysisEvidence(jobs).batch(run_id).registrations
    deliver(jobs, run_id, jobs.state(run_id).session_id, pages)
    receipt = AnalysisCommits(jobs).accept(run_id, dict(commit_key='batch', base_revision=0, round_id=1,
        observations=[], directions=[], summary='当前没有可靠方向。', limitations=[], unresolved_questions=[]))
    assert receipt.completed_delta == 1
    assert receipt.observation_ids == []
    assert AnalysisQueries(jobs.db).observation_history(run_id, {}).items == []
    coverage = AnalysisCoverageReader(jobs.db).read(run_id)
    assert coverage.completed == coverage.whole_images_observed == 1
    assert jobs.context(run_id).round.round_id == 2


def test_sparse_child_report_covers_the_batch_but_only_saves_cited_facts(agent_jobs):
    from iad_core.analysis.delegation import AnalysisDelegation
    jobs, dataset_id, role = agent_jobs
    ModuleSettings(jobs.db).save(dict(module='exploration', expected_revision=1, settings=dict(batch_size=2)))
    run_id = jobs.start(dict(submission_id=str(uuid4()), analysis_kind='exploration', dataset_ids=[dataset_id],
        normal_images=[dataset_id + ':normal.png'], prompt=dict(text='整批联合比较。')), agent=role)['run_id']
    pages = AnalysisEvidence(jobs).batch(run_id).registrations
    deliver(jobs, run_id, jobs.state(run_id).session_id, pages)
    eid = pages[0].evidence_id
    AnalysisCommits(jobs).accept(run_id, dict(commit_key='first', base_revision=0, round_id=1, observations=[],
        directions=[dict(direction_id='edge', title='外缘', instruction='沿外缘核对连续性。',
            rationale='外缘轮廓连续可辨。', applies_to='both', dataset_ids=[dataset_id], evidence_ids=[eid], limitations=[])],
        summary='外缘可检查。', limitations=[], unresolved_questions=[]))
    delegation = AnalysisDelegation(jobs)
    tasks = delegation.wave(run_id).tasks
    for index, task in enumerate(tasks):
        pages = delegation.materials(run_id, task.session_id).registrations
        if index == 0:
            deliver(jobs, run_id, jobs.state(run_id).session_id, pages)
            with pytest.raises(ValueError, match='自身实际模型请求'):
                delegation.report(run_id, task.session_id, dict(assessments=[], discoveries=[],
                    discovery_summary='无新现象。', key_evidence_ids=[]))
        deliver(jobs, run_id, task.session_id, pages)
        report = dict(assessments=[], discoveries=[], discovery_summary='整批联合比较后无独立新方向。', key_evidence_ids=[])
        if index == 0:
            report['assessments'] = [dict(direction_id='edge', role='support', evidence_ids=[pages[0].evidence_id],
                reason='原图外缘有连续可定位的轮廓。')]
        delegation.report(run_id, task.session_id, report)
    assert jobs.jobs.status(run_id)['completed'] == 1
    receipt = AnalysisCommits(jobs).accept(run_id, dict(commit_key='review', base_revision=1, round_id=2,
        observations=[], directions=[], report_reviews=[dict(round_id=task.round.round_id, discovery_decisions=[]) for task in tasks],
        summary='外缘可检查。', limitations=[], unresolved_questions=[]))
    assert receipt.completed_delta == 3
    assert len(receipt.observation_ids) == 1
    facts = AnalysisQueries(jobs.db).observation_history(run_id, dict(round_id=2)).items
    assert [item.description for item in facts] == ['原图外缘有连续可定位的轮廓。']
    coverage = AnalysisCoverageReader(jobs.db).read(run_id)
    assert coverage.completed == coverage.whole_images_observed == 4


@pytest.mark.parametrize('failure', ['missing_roi', 'failed_call'])
def test_batch_commit_requires_successful_delivery_in_its_own_session(agent_jobs, failure):
    jobs, dataset_id, role = agent_jobs
    run_id = jobs.start(dict(submission_id=str(uuid4()), analysis_kind='exploration', dataset_ids=[dataset_id],
        defect_images=[dataset_id + ':dent.png'], prompt=dict(text='整批比较。')), agent=role)['run_id']
    pages = AnalysisEvidence(jobs).batch(run_id).registrations
    session = jobs.state(run_id).session_id
    roi = next(item.image.evidence_id for item in pages[0].images if item.image.role == 'roi')
    deliver(jobs, run_id, session, pages, omit=[roi] if failure == 'missing_roi' else [], failed=failure == 'failed_call')
    with pytest.raises(ValueError, match='自身实际模型请求'):
        AnalysisCommits(jobs).accept(run_id, dict(commit_key='batch', base_revision=0, round_id=1,
            directions=[], summary='无可靠方向。', limitations=[], unresolved_questions=[]))
    assert jobs.state(run_id).revision == 0
    assert jobs.jobs.status(run_id)['completed'] == 0
    assert AnalysisQueries(jobs.db).observation_history(run_id, {}).items == []


def test_historical_snapshot_without_stage_tasks_keeps_original_coverage_and_prompt_text(agent_jobs):
    import json
    jobs, dataset_id, role = agent_jobs
    run_id = jobs.start(dict(submission_id=str(uuid4()), analysis_kind='exploration', dataset_ids=[dataset_id],
        normal_images=[dataset_id + ':normal.png'], system_prompt='历史系统正文。',
        prompt=dict(text='历史用户正文。')), agent=role)['run_id']
    # A stored snapshot predating stage tasks is the historical protocol fixture.
    with jobs.db.connection() as connection:
        snapshot = json.loads(connection.execute('SELECT snapshot_json FROM analysis_workflow_runs WHERE job_id=?', (run_id,)).fetchone()[0])
        snapshot.pop('exploration_tasks')
        original = json.dumps(snapshot, ensure_ascii=False)
        connection.execute('UPDATE analysis_workflow_runs SET snapshot_json=? WHERE job_id=?', (original, run_id))
    pages = AnalysisEvidence(jobs).batch(run_id).registrations
    deliver(jobs, run_id, jobs.state(run_id).session_id, pages)
    submission = dict(commit_key='empty', base_revision=0, round_id=1, observations=[], directions=[],
        summary='没有可靠方向。', limitations=[], unresolved_questions=[])
    assert AnalysisCommits(jobs).accept(run_id, submission).completed_delta == 0
    prompt = AnalysisQueries(jobs.db).prompts(run_id)
    assert prompt.main.system_prompt == '历史系统正文。'
    assert prompt.main.user_prompt == '历史用户正文。'
    with jobs.db.connection() as connection:
        assert connection.execute('SELECT snapshot_json FROM analysis_workflow_runs WHERE job_id=?', (run_id,)).fetchone()[0] == original


def test_empty_batch_analysis_can_finalize_without_per_image_text(agent_jobs):
    from iad_core.analysis.finalization import AnalysisFinalizations
    from iad_core.analysis.publications import AnalysisPublications
    jobs, dataset_id, role = agent_jobs
    run_id = jobs.start(dict(submission_id=str(uuid4()), analysis_kind='exploration', dataset_ids=[dataset_id],
        normal_images=[dataset_id + ':' + name + '.png' for name in ['normal', 'normal2', 'dent', 'scratch']],
        prompt=dict(text='没有可靠方向可以为空。')), agent=role)['run_id']
    pages = AnalysisEvidence(jobs).batch(run_id).registrations
    deliver(jobs, run_id, jobs.state(run_id).session_id, pages)
    AnalysisCommits(jobs).accept(run_id, dict(commit_key='empty', base_revision=0, round_id=1,
        directions=[], summary='没有可靠检查方向。', limitations=[], unresolved_questions=[]))
    finalizations = AnalysisFinalizations(jobs)
    context = finalizations.context(run_id)
    receipt = finalizations.accept(run_id, dict(commit_key='final', base_revision=context.base_revision,
        complete=True, directions=[], summary='没有可靠检查方向。', limitations=[], unresolved_questions=[]))
    assert receipt.complete
    publication = AnalysisPublications(jobs.db).get(receipt.version_id)
    assert publication.coverage.completed == publication.coverage.whole_images_observed == 4
    assert publication.catalog.directions == []
    assert AnalysisQueries(jobs.db).observation_history(run_id, {}).total == 0


def test_terminal_batch_without_per_image_text_recovers_its_publication(agent_jobs):
    from iad_core.analysis.publications import AnalysisPublications
    jobs, dataset_id, role = agent_jobs
    run_id = jobs.start(dict(submission_id=str(uuid4()), analysis_kind='exploration', dataset_ids=[dataset_id],
        normal_images=[dataset_id + ':normal.png'], prompt=dict(text='没有可靠方向可以为空。')), agent=role)['run_id']
    pages = AnalysisEvidence(jobs).batch(run_id).registrations
    deliver(jobs, run_id, jobs.state(run_id).session_id, pages)
    AnalysisCommits(jobs).accept(run_id, dict(commit_key='empty', base_revision=0, round_id=1,
        directions=[], summary='没有可靠检查方向。', limitations=[], unresolved_questions=[]))
    jobs.jobs.finish_external(run_id)
    queries = AnalysisQueries(jobs.db)
    assert queries.versions(dataset_id, 'exploration') == []
    AnalysisPublications(jobs.db).recover()
    version, = queries.versions(dataset_id, 'exploration')
    assert AnalysisPublications(jobs.db).get(version.version_id).coverage.whole_images_observed == 1
    assert queries.observation_history(run_id, {}).total == 0
