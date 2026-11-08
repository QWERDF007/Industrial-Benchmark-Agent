from iad_core.workbench.jobs import JobRunner


def test_external_executor_uses_the_existing_job_progress_and_completion(dataset):
    database, _, config = dataset
    runner = JobRunner(database, ('ANALYSIS_WORKFLOW',))
    try:
        job = runner.start('ANALYSIS_WORKFLOW', config.task.task_id,
            {'dataset_id': config.dataset.id, 'sample_ids': [config.dataset.id + ':dent.png']},
            None, '等待宿主执行')
        assert job['status'] == 'RUNNING'
        runner.record(job['run_id'], config.dataset.id + ':dent.png')
        finished = runner.finish_external(job['run_id'])
        assert finished['status'] == 'COMPLETED'
        assert finished['completed'] == 1 and finished['progress'] == 1
    finally:
        runner.close()


def test_external_job_cancellation_rejects_a_late_completion(dataset):
    import pytest

    database, _, config = dataset
    runner = JobRunner(database, ('ANALYSIS_WORKFLOW',))
    try:
        job = runner.start('ANALYSIS_WORKFLOW', config.task.task_id,
            {'dataset_id': config.dataset.id, 'sample_ids': [config.dataset.id + ':dent.png']},
            None, '等待宿主执行')
        assert runner.cancel(job['run_id'], ('ANALYSIS_WORKFLOW',))['status'] == 'CANCELLED'
        with pytest.raises(InterruptedError):
            runner.record(job['run_id'], config.dataset.id + ':dent.png')
        assert runner.status(job['run_id'])['completed'] == 0
    finally:
        runner.close()


def test_closing_the_worker_interrupts_an_external_job(dataset):
    database, _, config = dataset
    runner = JobRunner(database, ('ANALYSIS_WORKFLOW',))
    job = runner.start('ANALYSIS_WORKFLOW', config.task.task_id,
        {'dataset_id': config.dataset.id, 'sample_ids': [config.dataset.id + ':dent.png']},
        None, '等待宿主执行')
    cancellation = runner.cancelled[job['run_id']]
    runner.close()
    assert runner.status(job['run_id'])['status'] == 'INTERRUPTED'
    assert cancellation.is_set(), '停止外部宿主时，已在途模型流也必须观察到停止信号'


def test_resuming_an_external_job_keeps_its_identity_and_completed_samples(dataset):
    database, _, config = dataset
    runner = JobRunner(database, ('ANALYSIS_WORKFLOW',))
    try:
        sample_ids = [config.dataset.id + ':' + name + '.png' for name in ('dent', 'scratch')]
        job = runner.start('ANALYSIS_WORKFLOW', config.task.task_id,
            {'dataset_id': config.dataset.id, 'sample_ids': sample_ids}, None, '等待宿主执行')
        runner.record(job['run_id'], sample_ids[0])
        old_cancellation = runner.cancelled[job['run_id']]
        runner.cancel(job['run_id'], ('ANALYSIS_WORKFLOW',))
        resumed = runner.resume_external(job['run_id'])
        assert resumed['run_id'] == job['run_id'] and resumed['status'] == 'RUNNING'
        assert resumed['completed'] == 1 and resumed['failed'] == 0
        assert old_cancellation.is_set() and not runner.cancelled[job['run_id']].is_set()
        runner.record(job['run_id'], sample_ids[1])
        assert runner.finish_external(job['run_id'])['completed'] == 2
    finally:
        runner.close()
