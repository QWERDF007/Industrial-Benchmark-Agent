from uuid import uuid4

import pytest


def test_create_freezes_one_manifest_plan_model_and_session_without_child_jobs(agent_jobs):
    jobs, dataset_id, role = agent_jobs
    request = {'submission_id': str(uuid4()), 'analysis_kind': 'exploration', 'dataset_ids': [dataset_id],
        'normal_images': [dataset_id + ':normal.png'], 'defect_images': [],
        'system_prompt': '按原生工具流程检查并提交观察。', 'prompt': {'text': '观察所选图像并提出可执行检查动作。'}}
    created = jobs.start(request, agent=role)
    snapshot = jobs.snapshot(created['run_id'])
    assert snapshot.system_prompt == request['system_prompt']
    assert snapshot.instruction == request['prompt']['text']
    assert created['created'] is True
    assert created['total_samples'] == 4
    assert created['batch_runs'] == []
    assert snapshot.agent.profile.endpoint == 'http://127.0.0.1:30003/v1/chat/completions'
    assert [len(round.targets) for round in snapshot.plan.rounds] == [1, 1, 1, 1]
    assert snapshot.plan.rounds[0].targets[0].sample_id == dataset_id + ':normal.png'
    state = jobs.state(created['run_id'])
    assert state.revision == 0
    assert state.session_created is False
    assert state.catalog.directions == state.catalog.checks == []
    assert jobs.context(created['run_id']).round.round_id == 1
    assert jobs.start(request, agent=role)['created'] is False
    from iad_core.workbench.module_settings import ModuleSettings
    ModuleSettings(jobs.db).save({'module': 'exploration', 'expected_revision': 1, 'settings': {
        'batch_size': 4, 'sampling_ratio':{'normal':3,'abnormal':1}}})
    assert snapshot.plan.sampling_ratio.model_dump() == dict(normal=1, abnormal=1)
    assert jobs.snapshot(created['run_id']) == snapshot
    assert jobs.start(request, agent=role)['run_id'] == created['run_id']
    location = jobs.session_location(state.session_id)
    assert location.module == 'exploration'
    assert location.job_id == created['run_id']
    assert location.submitted_at == created['submitted_at']


def test_empty_exploration_does_not_allocate_a_job_or_session(agent_jobs):
    jobs, dataset_id, role = agent_jobs
    with pytest.raises(ValueError, match='至少选择一张'):
        jobs.start({'submission_id': str(uuid4()), 'analysis_kind': 'exploration', 'dataset_ids': [dataset_id],
            'normal_images': [], 'defect_images': [], 'prompt': {'text': '观察图像。'}}, agent=role)
    assert jobs.jobs.list(dataset_id, ('ANALYSIS_WORKFLOW',)) == []


def test_new_job_has_its_own_empty_catalog_and_session_after_cancel(agent_jobs):
    jobs, dataset_id, role = agent_jobs
    request = {'submission_id': str(uuid4()), 'analysis_kind': 'exploration', 'dataset_ids': [dataset_id],
        'normal_images': [], 'defect_images': [dataset_id + ':dent.png'], 'prompt': {'text': '观察边缘。'}}
    first = jobs.start(request, agent=role)
    first_session = jobs.state(first['run_id']).session_id
    jobs.cancel(first['run_id'])
    second = jobs.start({**request, 'submission_id': str(uuid4())}, agent=role)
    assert jobs.state(second['run_id']).session_id != first_session
    assert jobs.context(second['run_id']).catalog.directions == []
    with pytest.raises(ValueError, match='提交ID'):
        jobs.start({**request, 'prompt': {'text': '不同正文。'}}, agent=role)


def test_repeated_direction_choices_keep_the_first_source_once(agent_jobs):
    from iad_core.knowledge.instructions import default_directions
    from iad_core.workbench.module_settings import ModuleSettings
    jobs, dataset_id, role = agent_jobs
    ModuleSettings(jobs.db).save({'module':'knowledge', 'expected_revision':0,
        'settings':{'model':{'provider_id':'swift-30003', 'model_id':'fixture'}}})
    direction = default_directions()[0].model_dump(mode='json')
    job = jobs.start(dict(submission_id=str(uuid4()), analysis_kind='knowledge', dataset_ids=[dataset_id],
        system_prompt='使用知识工具逐图观察并提交。',
        mining_prompt=dict(objective='逐登记观察。', instruction='保留用户正文。',
            directions=[direction, {**direction, 'title':'重复勾选的后项'}])), agent=role)
    snapshot = jobs.snapshot(job['run_id'])
    assert snapshot.system_prompt == '使用知识工具逐图观察并提交。'
    assert snapshot.instruction == '保留用户正文。'
    assert len(snapshot.selected_directions) == 1
    assert snapshot.selected_directions[0].title == direction['title']
    assert snapshot.selected_directions[0].source == default_directions()[0].source
    assert len(snapshot.mining_prompt.configuration.directions) == 1


def test_new_mining_requires_the_selected_preset_revision_before_allocating_a_job(agent_jobs):
    from iad_core.knowledge.instructions import default_directions
    from iad_core.workbench.module_settings import ModuleSettings
    jobs, dataset_id, role = agent_jobs
    ModuleSettings(jobs.db).save({'module':'knowledge', 'expected_revision':0,
        'settings':{'model':{'provider_id':'swift-30003', 'model_id':'fixture'}}})
    direction = default_directions()[0].model_dump(mode='json', exclude={'source'})
    with pytest.raises(ValueError, match='版本'):
        jobs.start(dict(submission_id=str(uuid4()), analysis_kind='knowledge', dataset_ids=[dataset_id],
            mining_prompt=dict(objective='逐登记观察。', instruction='保留用户正文。', directions=[direction])), agent=role)
    assert jobs.jobs.list(dataset_id, ('ANALYSIS_WORKFLOW',)) == []
