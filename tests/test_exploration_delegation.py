from uuid import uuid4

import pytest

from iad_core.analysis.commits import AnalysisCommits
from iad_core.analysis.evidence import AnalysisEvidence
from iad_core.workbench.calls import ModelCalls, NativeModelCallEnd, NativeModelCallStart
from iad_core.workbench.module_settings import ModuleSettings


@pytest.fixture
def delegated_job(agent_jobs):
    jobs, dataset_id, role = agent_jobs
    ModuleSettings(jobs.db).save(dict(module='exploration', expected_revision=1,
        settings=dict(batch_size=2)))
    run_id = jobs.start(dict(submission_id=str(uuid4()), analysis_kind='exploration', dataset_ids=[dataset_id],
        normal_images=[dataset_id + ':normal.png'], prompt=dict(text='独立观察并比较可见现象。')), agent=role)['run_id']
    page = AnalysisEvidence(jobs).batch(run_id).registrations[0]
    call = NativeModelCallStart(call_id='call_' + uuid4().hex, started_at='2026-11-10T12:00:00Z', request={})
    ModelCalls(jobs.db).start_native(run_id, call, sample_id=None, session_id=jobs.state(run_id).session_id, attempt=1)
    AnalysisEvidence(jobs).delivered(run_id, call.call_id, [image.image.evidence_id for image in page.images])
    ModelCalls(jobs.db).finish_native(run_id, None, NativeModelCallEnd(call_id=call.call_id,
        finished_at='2026-11-10T12:00:01Z', elapsed_ms=1000, finish_reason='tool-calls'))
    AnalysisCommits(jobs).accept(run_id, dict(commit_key='manual', base_revision=0, round_id=1, directions=[],
        observations=[dict(sample_id=page.sample_id, dataset_id=dataset_id, description='首批原图边缘可见。', evidence_ids=[page.evidence_id])],
        summary='尚无可靠方向。', limitations=[], unresolved_questions=[]))
    return jobs, dataset_id, run_id


def test_native_delegation_reserves_disjoint_batches_at_one_catalog_revision(delegated_job):
    from iad_core.exploration.delegation import ExplorationDelegation
    jobs, dataset_id, run_id = delegated_job
    snapshot = jobs.snapshot(run_id)
    assert snapshot.execution_mode == 'dsh-subagents'
    assert snapshot.settings.concurrency == 2
    delegation = ExplorationDelegation(jobs)
    wave = delegation.wave(run_id)
    assert [task.round.round_id for task in wave.tasks] == [2, 3]
    assert {task.catalog_revision for task in wave.tasks} == {1}
    assert len({task.session_id for task in wave.tasks}) == 2
    assert len({target.sample_id for task in wave.tasks for target in task.round.targets}) == 3
    assert delegation.wave(run_id) == wave
    assert jobs.state(run_id).revision == 1
    assert all(task.catalog.directions == [] for task in wave.tasks)
    for task in wave.tasks:
        materials = delegation.materials(run_id, task.session_id)
        assert [page.sample_id for page in materials.registrations] == [target.sample_id for target in task.round.targets]
        assert [source.sample.sample_id for source in materials.sources] == [target.sample_id for target in task.round.targets]
        assert all(source.sampling_group is not None for source in materials.sources)
        assert jobs.session_location(task.session_id).round_id == task.round.round_id
    with pytest.raises(ValueError, match='本批'):
        delegation.materials(run_id, 'not-a-child')


def test_worker_reports_require_their_own_visual_delivery_and_do_not_write_catalog(delegated_job):
    from iad_core.exploration.delegation import ExplorationDelegation
    jobs, dataset_id, run_id = delegated_job
    delegation = ExplorationDelegation(jobs)
    task = delegation.wave(run_id).tasks[0]
    materials = delegation.materials(run_id, task.session_id)
    wholes = [page.evidence_id for page in materials.registrations]
    report = dict(observations=[dict(sample_id=page.sample_id, dataset_id=dataset_id,
        description='本图可辨主体边缘。', evidence_ids=[page.evidence_id]) for page in materials.registrations],
        assessments=[], discoveries=[dict(candidate_id='edge', title='边缘检查', instruction='沿外缘逐段核对连续性。',
            rationale='外缘局部变化可见。', applies_to='both', evidence_ids=[wholes[0]], limitations=[])],
        discovery_summary='已独立检查外缘和开放板面，发现外缘局部变化。', key_evidence_ids=wholes)
    with pytest.raises(ValueError, match='实际.*请求'):
        delegation.report(run_id, task.session_id, report)
    call = NativeModelCallStart(call_id='call_' + uuid4().hex, started_at='2026-11-10T12:00:00Z', request={})
    ModelCalls(jobs.db).start_native(run_id, call, sample_id=None, session_id=task.session_id, attempt=1)
    AnalysisEvidence(jobs).delivered(run_id, call.call_id,
        [image.image.evidence_id for page in materials.registrations for image in page.images])
    ModelCalls(jobs.db).finish_native(run_id, None, NativeModelCallEnd(call_id=call.call_id,
        finished_at='2026-11-10T12:00:01Z', elapsed_ms=1000, finish_reason='tool-calls'))
    saved = delegation.report(run_id, task.session_id, report)
    assert saved.report.discovery_summary == report['discovery_summary']
    assert delegation.report(run_id, task.session_id, report) == saved
    assert jobs.state(run_id).revision == 1
    assert jobs.state(run_id).catalog.directions == []
    assert jobs.jobs.status(run_id)['completed'] == 1
    assert not saved.reviewed
    second = delegation.wave(run_id).tasks[1]
    with pytest.raises(ValueError, match='本批'):
        delegation.report(run_id, second.session_id, report)


@pytest.fixture
def reported_wave(delegated_job):
    from iad_core.exploration.delegation import ExplorationDelegation
    jobs, dataset_id, run_id = delegated_job
    delegation = ExplorationDelegation(jobs)
    tasks = delegation.wave(run_id).tasks
    for task in tasks:
        pages = delegation.materials(run_id, task.session_id).registrations
        call = NativeModelCallStart(call_id='call_' + uuid4().hex, started_at='2026-11-10T12:00:00Z', request={})
        ModelCalls(jobs.db).start_native(run_id, call, sample_id=None, session_id=task.session_id, attempt=1)
        AnalysisEvidence(jobs).delivered(run_id, call.call_id, [image.image.evidence_id for page in pages for image in page.images])
        ModelCalls(jobs.db).finish_native(run_id, None, NativeModelCallEnd(call_id=call.call_id,
            finished_at='2026-11-10T12:00:01Z', elapsed_ms=1000, finish_reason='tool-calls'))
        delegation.report(run_id, task.session_id, dict(observations=[dict(sample_id=page.sample_id, dataset_id=dataset_id,
            description='主体边缘可定位。', evidence_ids=[page.evidence_id]) for page in pages], assessments=[],
            discoveries=[dict(candidate_id='candidate', title='外缘检查', instruction='沿外缘核对连续性。',
                rationale='外缘具备可重复定位动作。', applies_to='both', evidence_ids=[pages[0].evidence_id], limitations=[])],
            discovery_summary='已独立检视部位，外缘需要新检查动作。', key_evidence_ids=[page.evidence_id for page in pages]))
    return jobs, dataset_id, run_id, delegation


def test_main_review_commits_the_whole_wave_and_preserves_each_source_round(reported_wave):
    jobs, dataset_id, run_id, delegation = reported_wave
    tasks = delegation.wave(run_id).tasks
    eid = tasks[0].report.discoveries[0].evidence_ids[0]
    review = dict(commit_key='review-wave', base_revision=1, round_id=tasks[0].round.round_id,
        observations=[], directions=[dict(direction_id='edge', dataset_ids=[dataset_id], applies_to='both', title='外缘检查',
            instruction='沿外缘核对连续性。', rationale='外缘可定位。', evidence_ids=[eid], limitations=[])],
        summary='外缘可按限定动作复核。', limitations=[], unresolved_questions=[], report_reviews=[])
    with pytest.raises(ValueError, match='全部.*报告|不能遗漏'):
        AnalysisCommits(jobs).accept(run_id, review)
    assert jobs.state(run_id).revision == 1
    review['report_reviews'] = [dict(round_id=task.round.round_id, discovery_decisions=[dict(
        candidate_id='candidate', action='new' if index == 0 else 'merge', direction_id='edge',
        reason='相同部位及检查动作，可保留为同一方向。')]) for index, task in enumerate(tasks)]
    incomplete = {**review, 'report_reviews': review['report_reviews'][:1]}
    with pytest.raises(ValueError, match='全部.*报告|不能遗漏'):
        AnalysisCommits(jobs).accept(run_id, incomplete)
    receipt = AnalysisCommits(jobs).accept(run_id, review)
    assert receipt.completed_delta == 3
    assert receipt.revision == 2
    assert receipt.round_complete
    assert AnalysisCommits(jobs).accept(run_id, review) == receipt
    assert all(delegation.task(run_id, task.session_id).reviewed for task in tasks)
    assert jobs.context(run_id).round is None
    from iad_core.analysis.queries import AnalysisQueries
    for task in tasks:
        observations = AnalysisQueries(jobs.db).observation_history(run_id, dict(round_id=task.round.round_id)).items
        assert [item.description for item in observations] == [item.description for item in task.report.observations]
        assert {item.round_id for item in observations} == {task.round.round_id}
        assert {item.revision for item in observations} == {2}
    assert delegation.wave(run_id).tasks == []




def test_prompt_view_shows_main_and_observer_system_and_user_texts_separately(delegated_job):
    from iad_core.analysis.queries import AnalysisQueries
    jobs, _, run_id = delegated_job
    before = jobs.snapshot(run_id)
    prompts = AnalysisQueries(jobs.db).prompts(run_id)
    assert prompts.main.system_prompt == before.system_prompt
    assert prompts.main.user_prompt == before.instruction
    assert prompts.observer.system_prompt == before.system_prompt
    assert prompts.observer.user_prompt == before.instruction
    assert set(prompts.model_dump()) == {'main', 'observer'}
    assert jobs.snapshot(run_id) == before


def test_independent_observer_prompts_are_frozen_and_shown_verbatim(agent_jobs):
    from iad_core.analysis.queries import AnalysisQueries
    jobs, dataset_id, role = agent_jobs
    observer = dict(system_prompt=' 子代理系统：只记录实际可见事实。\n',
        user_prompt=' 子代理任务：核对旧方向并独立发现新现象。\n')
    run_id = jobs.start(dict(submission_id=str(uuid4()), analysis_kind='exploration', dataset_ids=[dataset_id],
        normal_images=[dataset_id + ':normal.png'], system_prompt='主系统：统一复核。',
        prompt=dict(text='主任务：建立并定稿方向。'), observer_prompt=observer), agent=role)['run_id']
    frozen = jobs.snapshot(run_id)
    assert frozen.observer_prompt.model_dump() == observer
    prompts = AnalysisQueries(jobs.db).prompts(run_id)
    assert prompts.main.system_prompt == '主系统：统一复核。'
    assert prompts.main.user_prompt == '主任务：建立并定稿方向。'
    assert prompts.observer.model_dump() == observer
    assert jobs.snapshot(run_id) == frozen
