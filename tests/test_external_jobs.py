from iad_core.workbench.jobs import JobRunner


def test_execution_context_uses_current_progress_and_cancellation_without_diagnostics(dataset):
    import pytest

    database, _, config = dataset
    runner = JobRunner(database, ('ANALYSIS_WORKFLOW',))
    try:
        sample_id = config.dataset.id + ':dent.png'
        run = runner.start('ANALYSIS_WORKFLOW', config.task.task_id,
            {'dataset_id': config.dataset.id, 'sample_ids': [sample_id]}, None, '等待宿主执行')['run_id']
        runner.update(run, phase='VERIFYING_CONTENT')
        context = runner.context(run)
        assert context.payload['phase'] == 'VERIFYING_CONTENT'
        assert context.payload['sample_ids'] == [sample_id]
        assert 'model_calls' not in context.payload
        context.checkpoint()
        context.record(sample_id)
        assert context.payload['completed'] == 1
        runner.cancel(run, ('ANALYSIS_WORKFLOW',))
        with pytest.raises(InterruptedError):
            context.checkpoint()
    finally:
        runner.close()


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


def test_phase_times_follow_real_transitions_and_exclude_stopped_time(dataset, monkeypatch):
    from datetime import datetime, timedelta, timezone
    import iad_core.workbench.jobs as jobs

    database, _, config = dataset
    start = datetime(2026, 11, 9, 12, tzinfo=timezone.utc)
    elapsed = 0

    class Clock(datetime):
        @classmethod
        def now(cls, tz=None):
            return start + timedelta(seconds=elapsed)

    monkeypatch.setattr(jobs, 'datetime', Clock)
    runner = JobRunner(database, ('ANALYSIS_WORKFLOW',))
    try:
        sid = config.dataset.id + ':dent.png'
        job = runner.start('ANALYSIS_WORKFLOW', config.task.task_id,
            {'dataset_id': config.dataset.id, 'sample_ids': [sid]}, None, '等待宿主执行')
        run = job['run_id']
        assert runner.status(run)['phase_timings'] == []
        runner.update(run, phase='PREPARING_EXPLORATION')
        elapsed = 3.25
        runner.update(run, phase='ANALYZING_SCOPE')
        elapsed = 4
        runner.update(run, phase='ANALYZING_SCOPE', prepared_sources=1)
        active = runner.status(run)['phase_timings']
        assert len(active) == 2
        assert active[1]['started_at'] == (start + timedelta(seconds=3.25)).isoformat()
        assert active[1]['finished_at'] is None
        elapsed = 6
        runner.interrupt_external(run)
        elapsed = 100
        runner.resume_external(run)
        elapsed = 102
        runner.update(run, phase='FINALIZING_SCOPE')
        elapsed = 104
        runner.record(run, sid)
        finished = runner.finish_external(run)
        intervals = finished['phase_timings']
        assert [item['phase'] for item in intervals] == [
            'PREPARING_EXPLORATION', 'ANALYZING_SCOPE', 'ANALYZING_SCOPE', 'FINALIZING_SCOPE']
        assert [(datetime.fromisoformat(item['started_at']) - start).total_seconds() for item in intervals] == [0, 3.25, 100, 102]
        assert [(datetime.fromisoformat(item['finished_at']) - datetime.fromisoformat(item['started_at'])).total_seconds()
            for item in intervals] == [3.25, 2.75, 2, 2]
        elapsed = 200
        assert runner.status(run)['phase_timings'] == intervals
    finally:
        runner.close()
