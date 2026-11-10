from uuid import uuid4

import pytest

from iad_core.workbench.module_settings import ModuleSettings
from iad_core.workbench.runtime import WorkbenchRuntime


def test_check_freezes_validated_concurrency_independently_of_later_settings(dataset):
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs

    database, _, config = dataset
    modules = ModuleSettings(database)
    assert modules.read('consistency').settings.concurrency == 1
    configured = modules.save({'module': 'consistency', 'expected_revision': 0,
        'settings': {'concurrency': 3}})
    for invalid in [0, -1, True, 1.5, '2']:
        with pytest.raises(ValueError):
            modules.save({'module': 'consistency', 'expected_revision': 1,
                'settings': {'concurrency': invalid}})
    assert modules.read('consistency') == configured
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        started = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id]})
        assert checks.snapshot(started['run_id']).concurrency == 3
        modules.save({'module': 'consistency', 'expected_revision': 1, 'settings': {'concurrency': 2}})
        assert checks.snapshot(started['run_id']).concurrency == 3
        assert modules.read('audit').settings.concurrency == 1
    finally:
        runtime.close()


def test_check_requires_a_stable_submission_id(dataset):
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs

    database, _, config = dataset
    runtime = WorkbenchRuntime(database)
    try:
        missing_submission = {'dataset_ids': [config.dataset.id]}
        with pytest.raises(ValueError, match='submission_id'):
            ConsistencyAgentJobs(runtime).start(missing_submission)
    finally:
        runtime.close()


def test_new_check_freezes_five_exact_and_ten_similar_at_ninety_eight_percent(dataset):
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs

    database, _, config = dataset
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        job = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id]})
        frozen = checks.snapshot(job['run_id'])
        assert frozen.retrieval.mode == 'combined'
        assert frozen.retrieval.min_similarity == .98
        assert frozen.retrieval.max_exact_candidates == 5
        assert frozen.retrieval.max_similar_candidates == 10
    finally:
        runtime.close()


def test_check_submission_freezes_the_configuration_once_without_requiring_models(dataset):
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs

    database, _, config = dataset
    modules = ModuleSettings(database)
    modules.save({'module': 'consistency', 'expected_revision': 0,
        'settings': {'mode': 'exact', 'min_similarity': .90, 'max_exact_candidates': 3, 'max_similar_candidates': 7}})
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        request = {'analysis_kind': 'consistency', 'submission_id': str(uuid4()),
            'dataset_ids': [config.dataset.id], 'system_prompt':'使用审核工具逐候选记录。', 'instruction': '核对当前原始标注'}
        started = checks.start(request)
        assert checks.snapshot(started['run_id']).system_prompt == request['system_prompt']
        assert started['created'] is True
        frozen = checks.snapshot(started['run_id'])
        assert frozen.schema_version == 1 and frozen.settings_revision == 1
        assert frozen.retrieval.mode == 'exact' and frozen.retrieval.min_similarity is None
        assert frozen.retrieval.max_exact_candidates == 3 and frozen.retrieval.max_similar_candidates is None
        assert frozen.model is None and 'agent_model' not in frozen.model_dump()
        assert frozen.instruction == request['instruction']
        assert frozen.scopes.subjects.sample_count == frozen.scopes.corpus.sample_count == 4
        modules.save({'module': 'consistency', 'expected_revision': 1,
            'settings': {'mode': 'combined', 'min_similarity': .99, 'max_exact_candidates': 11, 'max_similar_candidates': 22}})
        replayed = checks.start(request)
        assert replayed['run_id'] == started['run_id'] and replayed['created'] is False
        assert checks.snapshot(started['run_id']) == frozen
        with pytest.raises(ValueError, match='提交ID'):
            checks.start({**request, 'min_similarity': .95})
        anchors = checks.anchors(started['run_id'])
        assert len(anchors) == 4
        assert len({anchor.session_id for anchor in anchors}) == 4
        assert all(not anchor.session_created and anchor.state == 'PENDING' for anchor in anchors)
    finally:
        runtime.close()


def test_an_empty_anchor_result_is_submitted_once_through_the_existing_job_progress(dataset):
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs

    database, _, config = dataset
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchor_id = config.dataset.id + ':normal.png'
        started = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact',
            'subjects': {'kind': 'samples', 'sample_ids': [anchor_id]}})
        created = checks.session_created(started['run_id'], anchor_id)
        assert created.session_created
        selected = checks.retrieve(started['run_id'], anchor_id)
        assert selected.candidates == []
        result = checks.submit_empty(started['run_id'], anchor_id)
        assert result.verdict == 'EQUIVALENT' and result.reason == 'NO_CANDIDATES'
        assert checks.submit_empty(started['run_id'], anchor_id) == result
        finished = runtime.jobs.finish_external(started['run_id'])
        assert finished['completed'] == 1 and finished['total_samples'] == 1
        assert finished['status'] == 'COMPLETED'
        assert checks.anchors(started['run_id'])[0].result == result
    finally:
        runtime.close()


def test_check_uses_the_single_server_configuration_resolved_for_its_submission(dataset):
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs

    database, _, config = dataset
    modules = ModuleSettings(database)
    modules.save({'module': 'consistency', 'expected_revision': 0, 'settings': {
        'mode': 'exact', 'max_exact_candidates': 3,
        'model': {'provider_id': 'vision', 'model_id': 'see'}}})
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        configuration = checks.configuration()
        modules.save({'module': 'consistency', 'expected_revision': 1, 'settings': {
            'mode': 'combined', 'max_exact_candidates': 8,
            'model': {'provider_id': 'other', 'model_id': 'new'}}})
        started = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id]}, configuration=configuration)
        frozen = checks.snapshot(started['run_id'])
        assert frozen.settings_revision == 1
        assert frozen.retrieval.mode == 'exact' and frozen.retrieval.max_exact_candidates == 3
        assert frozen.model.provider_id == 'vision'
    finally:
        runtime.close()


def test_continue_keeps_the_frozen_check_and_session_but_rejects_a_cancelled_attempt(dataset):
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs

    database, _, config = dataset
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        identity = config.dataset.id + ':normal.png'
        job_id = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact',
            'subjects': {'kind': 'samples', 'sample_ids': [identity]}})['run_id']
        first = checks.session_created(job_id, identity)
        checks.retrieve(job_id, identity)
        frozen = checks.snapshot(job_id)
        checks.cancel(job_id)
        assert checks.anchor(job_id, identity).state == 'CANCELLED'
        continued = checks.resume(job_id)
        second = checks.anchor(job_id, identity)
        assert continued['run_id'] == job_id
        assert second.session_id == first.session_id and second.attempt == first.attempt + 1
        assert checks.snapshot(job_id) == frozen
        with pytest.raises(ValueError, match='过期'):
            checks.submit_empty(job_id, identity, attempt=first.attempt)
        checks.submit_empty(job_id, identity, attempt=second.attempt)
        assert runtime.jobs.finish_external(job_id)['completed'] == 1
    finally:
        runtime.close()
