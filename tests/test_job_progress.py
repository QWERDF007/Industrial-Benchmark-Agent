import threading
import time
import json
import pytest

from iad_core.workbench.jobs import JobRunner


def test_job_summaries_do_not_materialize_large_frozen_image_inputs(dataset):
    import tracemalloc
    from iad_core.workbench.analysis_job_views import AnalysisJobViews

    db, _, config = dataset
    runner = JobRunner(db, ('ANALYSIS_WORKFLOW',))
    sid = config.dataset.id + ':normal.png'
    assets = [{'sample_id': f'image-{index}', 'source_fingerprint': 'a' * 64} for index in range(5000)]
    try:
        for _ in range(18):
            job = runner.start('ANALYSIS_WORKFLOW', config.task.task_id,
                dict(dataset_id=config.dataset.id, sample_ids=[sid], analysis_kind='consistency', frozen_assets=assets), None, '分析')
            runner.record(job['run_id'], sid)
            runner.finish_external(job['run_id'])
        tracemalloc.start()
        for _ in range(2):
            summaries = AnalysisJobViews(db).list(config.dataset.id, 'consistency', summary=True)
        _, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        assert len(summaries) == 18 and all(job['completed'] == 1 for job in summaries)
        assert all('request' not in job and 'sample_ids' not in job for job in summaries)
        assert peak < 8 * 1024 * 1024, f'摘要不应构造冻结图片列表：峰值 {peak / 1024 / 1024:.1f}MB'
    finally:
        tracemalloc.stop()
        runner.close()


def test_execution_context_cannot_mutate_the_frozen_request(dataset):
    db, _, config = dataset
    runner = JobRunner(db, ('MODEL_AUDIT',))
    sid = config.dataset.id + ':normal.png'
    try:
        job = runner.start('MODEL_AUDIT', config.task.task_id,
            dict(dataset_id=config.dataset.id, sample_ids=[sid], settings={'labels': ['划痕']}), None, '分析')
        context = runner.context(job['run_id'])
        with pytest.raises((TypeError, AttributeError)):
            context.payload['request']['sample_ids'].append('foreign-sample')
        with pytest.raises((TypeError, AttributeError)):
            context.payload['request']['settings']['labels'].append('外来类别')
        with pytest.raises(TypeError):
            context.payload['request']['dataset_id'] = 'foreign-dataset'
        assert list(runner.context(job['run_id']).payload['sample_ids']) == [sid]
        assert list(runner.context(job['run_id']).payload['settings']['labels']) == ['划痕']
    finally:
        runner.close()


def test_progress_updates_do_not_rewrite_large_immutable_job_requests(dataset):
    from pathlib import Path

    db, _, config = dataset
    runner = JobRunner(db, ('MODEL_AUDIT',))
    sid = config.dataset.id + ':normal.png'
    instruction = '按原始标注核对图像。' * 150000
    try:
        job = runner.start('MODEL_AUDIT', config.task.task_id,
            dict(dataset_id=config.dataset.id, sample_ids=[sid], instruction=instruction), None, '分析')
        with db.connection() as connection:
            connection.execute('PRAGMA wal_checkpoint(TRUNCATE)')
        for index in range(12):
            runner.update(job['run_id'], phase='OBSERVING_IMAGE', inspected_regions=index)
        assert Path(db.db_path + '-wal').stat().st_size < 1024 * 1024
        assert runner.context(job['run_id']).payload['instruction'] == instruction
        runner.context(job['run_id']).record(sid)
        assert runner.status(job['run_id'])['completed'] == 1
    finally:
        runner.close()


def test_listing_a_workflow_does_not_rescan_all_owned_batches_per_job(dataset, monkeypatch):
    db, _, config = dataset
    runner = JobRunner(db, ('MODEL_AUDIT',))
    sample_id = config.dataset.id + ':normal.png'
    try:
        root = runner.start('MODEL_AUDIT', config.task.task_id,
            dict(dataset_id=config.dataset.id, sample_ids=[sample_id]),
            lambda context: context.record(sample_id), '分析')
        runner.wait(root['run_id'], 5)
        children = [f'internal_{index}' for index in range(1200)]
        with db.connection() as connection:
            connection.executemany("""INSERT INTO job_runs(job_id,task_id,job_type,status,progress,message,payload_json)
                SELECT ?,task_id,job_type,status,progress,message,json_set(payload_json,'$.root_run_id',?)
                FROM job_runs WHERE job_id=?""", [(child, child, root['run_id']) for child in children])
            connection.execute("UPDATE job_runs SET payload_json=json_set(payload_json,'$.batch_runs',json(?)) WHERE job_id=?",
                (json.dumps(children), root['run_id']))
        connect = db.get_connection
        instructions = 0

        def budget():
            nonlocal instructions
            instructions += 1000
            return instructions > 250000

        def connection():
            value = connect()
            value.set_progress_handler(budget, 1000)
            return value

        monkeypatch.setattr(db, 'get_connection', connection)
        listed = runner.list(config.dataset.id, ('MODEL_AUDIT',))
        assert [job['run_id'] for job in listed] == [root['run_id']]
        assert listed[0]['batch_runs'] == children
    finally:
        monkeypatch.undo()
        runner.close()


def test_failed_remaining_scope_is_persisted_atomically(dataset, monkeypatch):
    db, _, config = dataset
    failures = []
    connect = db.get_connection

    def connection():
        value = connect()
        value.create_function('observe_failure_count', 1, failures.append)
        return value

    monkeypatch.setattr(db, 'get_connection', connection)
    with db.connection() as value:
        value.execute("""CREATE TRIGGER capture_failure_update AFTER UPDATE OF payload_json ON job_runs
            WHEN json_array_length(NEW.payload_json,'$.errors')>0
            BEGIN SELECT observe_failure_count(json_array_length(NEW.payload_json,'$.errors')); END""")
    runner = JobRunner(db, ('MODEL_AUDIT',))
    ids = [config.dataset.id + ':' + name + '.png' for name in ('normal', 'normal2', 'dent', 'scratch')]

    def execute(context):
        context.record(ids[0])
        raise ValueError('整批模型请求失败')

    try:
        job = runner.start('MODEL_AUDIT', config.task.task_id, dict(dataset_id=config.dataset.id, sample_ids=ids), execute, '分析')
        runner.wait(job['run_id'], 5)
        state = runner.status(job['run_id'])
        assert state['status'] == 'PARTIAL'
        assert state['completed_sample_ids'] == ids[:1]
        assert state['failed_sample_ids'] == ids[1:]
        assert failures == [3]
    finally:
        runner.close()


def test_child_progress_is_published_only_when_its_state_changes(dataset):
    db, _, config = dataset
    runner = JobRunner(db, ('MODEL_AUDIT', 'ANALYSIS_WORKFLOW'))
    entered, release = threading.Event(), threading.Event()
    observed = []
    sid = config.dataset.id + ':normal.png'
    request = dict(dataset_id=config.dataset.id, sample_ids=[sid])

    def child_execute(context):
        assert release.wait(5)
        context.record(sid)

    def parent_execute(context):
        child = runner.start('MODEL_AUDIT', config.task.task_id, request, child_execute, '分析')

        def observe(state):
            marker = (state['status'], state['progress'], state['message'])
            assert not observed or marker != observed[-1], '不得重复发布未变化的进度'
            observed.append(marker)
            entered.set()

        child = context.join(child, on_progress=observe)
        assert child['status'] == 'COMPLETED'
        context.record(sid)

    try:
        parent = runner.start('ANALYSIS_WORKFLOW', config.task.task_id, request, parent_execute, '分析')
        assert entered.wait(3)
        time.sleep(.6)
        release.set()
        runner.wait(parent['run_id'], 5)
        state = runner.status(parent['run_id'])
        assert state['status'] == 'COMPLETED', state['errors']
        assert observed[-1][0] == 'COMPLETED'
    finally:
        release.set()
        runner.close()
