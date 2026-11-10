import json
from pathlib import Path
from uuid import uuid4

import pytest
from PIL import Image

from iad_core.dataset.registry import DatasetImport
from iad_core.entry import dataset_delete, dataset_list
from iad_core.workbench.review import HumanReview, ReviewSubmission


@pytest.fixture
def sqlite_work(dataset, monkeypatch):
    db = dataset[0]
    work = {'instructions': 0}
    connect = db.get_connection

    def observed_connection():
        conn = connect()

        def count_instructions():
            work['instructions'] += 1000
            return 0

        conn.set_progress_handler(count_instructions, 1000)
        return conn

    monkeypatch.setattr(db, 'get_connection', observed_connection)
    return work


def test_delete_removes_owned_records_and_preserves_other_dataset_and_sources(dataset, native_knowledge_versions, tmp_path):
    db, registry, config = dataset
    images, labels = tmp_path / 'other-images', tmp_path / 'other-labels'
    images.mkdir(); labels.mkdir()
    Image.new('RGB', (32, 32), 'green').save(images / 'other.png')
    (labels / 'other.json').write_text(json.dumps({'imageWidth':32,'imageHeight':32,'shapes':[{'label':'保留标注','shape_type':'rectangle','points':[[5,5],[10,10]]}]}))
    other = registry.import_labelme(DatasetImport(format='labelme', name='保留数据集', image_dir=str(images), annotation_dir=str(labels)))
    target = config.dataset.id + ':dent.png'
    HumanReview(db).submit(ReviewSubmission(dataset_id=config.dataset.id, sample_id=target,
        submission_id=uuid4(), reviewer='复核人', decision='PASS'))
    source_files = {p: p.read_bytes() for root in (config.root, config.annotations.root) for p in Path(root).rglob('*') if p.is_file()}
    with db.connection() as conn:
        other_samples = [tuple(r) for r in conn.execute('SELECT * FROM samples WHERE dataset_id=?', (other.dataset.id,))]
        other_annotations = [tuple(r) for r in conn.execute('SELECT a.* FROM annotations a JOIN samples s ON a.sample_id=s.sample_id WHERE s.dataset_id=?', (other.dataset.id,))]
        assert conn.execute('SELECT count(*) FROM model_calls').fetchone()[0] > 0
        assert conn.execute('SELECT count(*) FROM analysis_publications').fetchone()[0] == 2
    assert dataset_delete({'dataset_id':config.dataset.id}, db.db_path) == {'deleted_dataset_id':config.dataset.id}
    assert [d['dataset_id'] for d in dataset_list({}, db.db_path)['datasets']] == [other.dataset.id]
    with db.connection() as conn:
        assert [tuple(r) for r in conn.execute('SELECT * FROM samples')] == other_samples
        assert [tuple(r) for r in conn.execute('SELECT * FROM annotations')] == other_annotations
        for table in ('review_decisions','review_sessions','analysis_workflow_runs','analysis_publications','analysis_sample_media','analysis_sample_observations','model_calls','job_runs'):
            assert conn.execute(f'SELECT count(*) FROM {table}').fetchone()[0] == 0, table
        assert conn.execute('PRAGMA foreign_key_check').fetchall() == []
    assert all(p.read_bytes() == content for p, content in source_files.items())
    assert (images / 'other.png').exists()
    with pytest.raises(LookupError):
        registry.get(config.dataset.id)


@pytest.mark.parametrize('status', ['PENDING', 'RUNNING'])
def test_delete_rejects_active_jobs_atomically(dataset, status):
    db, registry, config = dataset
    with db.connection() as conn:
        conn.execute("INSERT INTO job_runs(job_id,task_id,job_type,status,payload_json) VALUES(?,?,?,?,?)",
            ('active',config.task.task_id,'NORMAL_KNOWLEDGE',status,json.dumps({'request':{'dataset_id':config.dataset.id}})))
        original = {table:[tuple(r) for r in conn.execute(f'SELECT * FROM {table}')] for table in ('datasets','samples','annotations','job_runs')}
    with pytest.raises(ValueError, match='作业'):
        dataset_delete({'dataset_id':config.dataset.id}, db.db_path)
    with db.connection() as conn:
        assert original == {table:[tuple(r) for r in conn.execute(f'SELECT * FROM {table}')] for table in original}


def test_job_cannot_start_for_deleted_dataset(dataset):
    from iad_core.workbench.jobs import JobRunner
    db, registry, config = dataset
    registry.delete(config.dataset.id)
    runner = JobRunner(db, ('MODEL_AUDIT',))
    try:
        with pytest.raises(LookupError, match='数据集'):
            runner.start('MODEL_AUDIT', config.task.task_id,
                {'dataset_id':config.dataset.id,'sample_ids':[config.dataset.id+':dent.png']}, lambda context:None, '准备')
    finally:
        runner.close()
    with db.connection() as conn:
        assert conn.execute('SELECT count(*) FROM job_runs').fetchone()[0] == 0


def test_delete_is_scoped_when_datasets_share_task(dataset, tmp_path):
    from iad_core.dataset.scanner import scan_dataset
    db, registry, config = dataset
    images, labels = tmp_path / 'shared-images', tmp_path / 'shared-labels'
    images.mkdir(); labels.mkdir()
    Image.new('RGB', (32, 32), 'green').save(images / 'kept.png')
    other = config.model_copy(deep=True)
    other.dataset.id = 'shared-dataset'
    other.dataset.name = '同任务保留'
    other.root, other.annotations.root = str(images), str(labels)
    scan_dataset(config=other, db_path=db.db_path)
    with db.connection() as conn:
        for item in (config, other):
            conn.execute("INSERT INTO job_runs(job_id,task_id,job_type,status,payload_json) VALUES(?,?,?,?,?)",
                (item.dataset.id, config.task.task_id, 'MODEL_AUDIT', 'COMPLETED', json.dumps({'request':{'dataset_id':item.dataset.id}})))
            conn.execute("INSERT INTO model_calls(call_id,run_id,summary_json) VALUES(?,?,?)",
                (item.dataset.id,item.dataset.id,'{}'))
        expected = {table:[tuple(r) for r in conn.execute(f'SELECT * FROM {table} WHERE {column}=?', (other.dataset.id,))]
            for table,column in [('datasets','dataset_id'),('samples','dataset_id'),('job_runs','job_id'),('model_calls','call_id')]}
    dataset_delete({'dataset_id':config.dataset.id}, db.db_path)
    with db.connection() as conn:
        for table in expected:
            assert [tuple(r) for r in conn.execute(f'SELECT * FROM {table}')] == expected[table], table
        assert conn.execute('SELECT count(*) FROM inspection_tasks WHERE task_id=?',(config.task.task_id,)).fetchone()[0] == 1
        assert conn.execute('PRAGMA foreign_key_check').fetchall() == []


def test_delete_collects_owned_jobs_once_with_large_unrelated_history(dataset, tmp_path, sqlite_work):
    db, registry, config = dataset
    images, labels = tmp_path / 'kept-images', tmp_path / 'kept-labels'
    images.mkdir(); labels.mkdir()
    Image.new('RGB', (32, 32), 'green').save(images / 'kept.png')
    other = registry.import_labelme(DatasetImport(format='labelme', name='保留数据集', image_dir=str(images), annotation_dir=str(labels)))
    rows = [('owner', config.task.task_id, 'MODEL_AUDIT', 'COMPLETED', json.dumps({
        'request': {'dataset_id': config.dataset.id}, 'batch_runs': ['child-0']}))]
    for index in range(100):
        rows.append((f'child-{index}', other.task.task_id, 'MODEL_AUDIT_SAMPLE', 'COMPLETED', json.dumps({
            'parent_run_id': None if index in (0, 99) else 'owner' if index == 1 else f'child-{index-2}',
            'batch_runs': ['owner'] if index == 99 else [], 'frozen': 'evidence ' * 500})))
    for index in range(1200):
        rows.append((f'kept-{index}', other.task.task_id, 'MODEL_AUDIT_SAMPLE', 'COMPLETED', json.dumps({
            'request': {'dataset_id': other.dataset.id}, 'frozen': 'evidence ' * 500})))
    with db.connection() as conn:
        conn.executemany('INSERT INTO job_runs(job_id,task_id,job_type,status,payload_json) VALUES(?,?,?,?,?)', rows)
        conn.execute("UPDATE job_runs SET payload_json=json_set(payload_json,'$.parent_run_id','child-97') WHERE job_id='child-99'")
        conn.executemany('INSERT INTO model_calls(call_id,run_id,summary_json) VALUES(?,?,?)',
            [(identity, identity, '{}') for identity in ['owner', 'child-99', 'kept-0']])

    sqlite_work['instructions'] = 0
    bytes_before = int(Path('/proc/self/io').read_text().split('rchar: ')[1].splitlines()[0])
    registry.delete(config.dataset.id)
    bytes_read = int(Path('/proc/self/io').read_text().split('rchar: ')[1].splitlines()[0]) - bytes_before
    assert bytes_read < 2_000_000, f'删除不应读取无关任务的冻结正文：{bytes_read}'
    deletion_instructions = sqlite_work['instructions']
    assert deletion_instructions < 500_000, f'删除不应逐个作业扫描无关历史：{deletion_instructions} SQLite VM instructions'
    assert [item.dataset.id for item in registry.list()] == [other.dataset.id]
    with db.connection() as conn:
        assert conn.execute('SELECT count(*) FROM job_runs').fetchone()[0] == 1200
        assert conn.execute('SELECT run_id FROM model_calls').fetchall()[0][0] == 'kept-0'
        assert conn.execute('PRAGMA foreign_key_check').fetchall() == []
    assert (images / 'kept.png').is_file()
    assert (Path(config.root) / 'dent.png').is_file()


def test_delete_does_not_scan_unrelated_evidence_references(dataset, tmp_path, sqlite_work):
    from iad_core.consistency.evidence_models import ConsistencyCompare
    from iad_core.consistency.service import ConsistencyService

    db, registry, config = dataset
    images = tmp_path / 'independent-images'
    images.mkdir()
    for name in ('one', 'two'):
        Image.new('RGB', (32, 32), 'green').save(images / f'{name}.png')
    other = registry.import_dataset({'format': 'labelme', 'name': '保留集',
        'image_dir': str(images), 'annotation_dir': str(images)})
    service = ConsistencyService(db)
    service.compare(ConsistencyCompare(sample_a=config.dataset.id + ':dent.png', sample_b=config.dataset.id + ':scratch.png'))
    kept = service.compare(ConsistencyCompare(sample_a=other.dataset.id + ':one.png', sample_b=other.dataset.id + ':two.png'))
    with db.connection() as conn:
        plan = json.dumps({'scopes': {'subjects': {'dataset_ids': [other.dataset.id]}, 'corpus': {'dataset_ids': [other.dataset.id]}}})
        conn.execute("INSERT INTO consistency_runs(batch_id,request_id,fingerprint,root_batch_id,plan_json) VALUES('kept','kept','kept','kept',?)", (plan,))
        conn.executemany('INSERT INTO consistency_batch_results(batch_id,sample_a,sample_b,result_id,evidence_id) VALUES(?,?,?,?,?)',
            [('kept', f'frozen-{index}', 'reference', kept.result_id, kept.evidence_id) for index in range(10_000)])

    sqlite_work['instructions'] = 0
    registry.delete(config.dataset.id)
    assert sqlite_work['instructions'] < 100_000, '删除证据不应扫描其他数据集的历史引用'
    assert service.evidence(kept.evidence_id).result == kept
    with db.connection() as conn:
        assert conn.execute('SELECT count(*) FROM consistency_batch_results').fetchone()[0] == 10_000
        assert conn.execute('PRAGMA foreign_key_check').fetchall() == []


def test_delete_rolls_back_all_records_if_a_dependency_blocks_removal(dataset, tmp_path):
    import sqlite3
    db, registry, config = dataset
    images, labels = tmp_path/'linked-images', tmp_path/'linked-labels'
    images.mkdir(); labels.mkdir()
    Image.new('RGB',(32,32),'green').save(images/'linked.png')
    other = registry.import_labelme(DatasetImport(format='labelme', name='依赖方', image_dir=str(images), annotation_dir=str(labels)))
    from iad_core.consistency.service import ConsistencyService
    from iad_core.consistency.evidence_models import ConsistencyCompare
    ConsistencyService(db).compare(ConsistencyCompare(sample_a=config.dataset.id + ':dent.png', sample_b=config.dataset.id + ':scratch.png'))
    with db.connection() as conn:
        conn.execute("INSERT INTO knowledge_versions(version_id,dataset_id,signature,snapshot_json,created_at) VALUES('normal',?,'sig','{}','now')", (config.dataset.id,))
        conn.execute("INSERT INTO knowledge_versions(version_id,dataset_id,parent_version_id,signature,snapshot_json,created_at) VALUES('dependent',?,'normal','sig','{}','now')", (other.dataset.id,))
        before = {table:[tuple(r) for r in conn.execute(f'SELECT * FROM {table}')] for table in ('datasets','samples','annotations','knowledge_versions','consistency_results')}
    with pytest.raises(sqlite3.IntegrityError):
        dataset_delete({'dataset_id':config.dataset.id}, db.db_path)
    with db.connection() as conn:
        assert before == {table:[tuple(r) for r in conn.execute(f'SELECT * FROM {table}')] for table in before}


def test_stale_dataset_edit_cannot_recreate_deleted_dataset(dataset):
    db, registry, config = dataset
    registry.delete(config.dataset.id)
    config.dataset.name = '过期编辑'
    with pytest.raises(LookupError, match='数据集'):
        registry.save(config, require_existing=True)
    assert dataset_list({}, db.db_path)['datasets'] == []


def test_delete_removes_consistency_batches_and_frozen_results(dataset):
    import time
    from iad_core.consistency.models import ConsistencyStart
    from iad_core.workbench.runtime import WorkbenchRuntime

    db, registry, config = dataset
    runtime = WorkbenchRuntime(db)
    try:
        started = runtime.consistency.start(ConsistencyStart(
            subjects={'kind': 'datasets', 'dataset_ids': [config.dataset.id]},
            mode='exact', request_id='deleted-dataset'))
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            batch = runtime.consistency.status(started.batch_id)
            if batch.status not in ('PENDING', 'RUNNING'):
                break
            time.sleep(.01)
        assert batch.status == 'COMPLETED'
        assert runtime.consistency.results(batch.batch_id)
        dataset_delete({'dataset_id': config.dataset.id}, db.db_path)
        assert runtime.consistency.list().items == []
        with db.connection() as conn:
            for table in ('consistency_runs', 'consistency_children', 'consistency_batch_results',
                          'consistency_results', 'job_runs'):
                assert conn.execute(f'SELECT count(*) FROM {table}').fetchone()[0] == 0, table
            assert conn.execute('PRAGMA foreign_key_check').fetchall() == []
    finally:
        runtime.close()


def test_delete_invalidates_cross_dataset_evidence_and_preserves_independent_history(dataset, tmp_path):
    from iad_core.consistency.evidence_models import ConsistencyCompare
    from iad_core.consistency.errors import ConsistencyError
    from iad_core.consistency.result_models import ConsistencyQuery
    from iad_core.consistency.result_queries import ResultQueries
    from iad_core.consistency.review import ConsistencyReview
    from iad_core.consistency.review_models import ConsistencyReviewSubmission
    from iad_core.consistency.service import ConsistencyService

    db, registry, config = dataset
    directory = tmp_path / 'independent'; directory.mkdir()
    for name in ('one', 'two'):
        Image.open(Path(config.root) / 'dent.png').save(directory / f'{name}.png')
    other = registry.import_dataset({'format': 'labelme', 'name': '保留集',
        'image_dir': str(directory), 'annotation_dir': str(directory)})
    service = ConsistencyService(db)
    owned = service.compare(ConsistencyCompare(sample_a=config.dataset.id + ':dent.png', sample_b=config.dataset.id + ':scratch.png'))
    shared = service.compare(ConsistencyCompare(sample_a=config.dataset.id + ':dent.png', sample_b=other.dataset.id + ':one.png'))
    kept = service.compare(ConsistencyCompare(sample_a=other.dataset.id + ':one.png', sample_b=other.dataset.id + ':two.png'))
    difference = owned.annotation.differences[0]
    ConsistencyReview(db).submit(ConsistencyReviewSubmission(client_request_id=uuid4(), evidence_id=owned.evidence_id,
        result_id=owned.result_id, difference_ids=[difference.difference_id], reviewer='删除验收',
        action={'kind': 'EXPECTED_POLICY_DIFFERENCE'}, comment='按规范保留差异'))
    queries = ResultQueries(db)
    removed_query = queries.query(ConsistencyQuery(selection={'kind': 'scope', 'subjects': {'kind': 'all_registered'}}))
    kept_query = queries.query(ConsistencyQuery(selection={'kind': 'scope',
        'subjects': {'kind': 'datasets', 'dataset_ids': [other.dataset.id]},
        'corpus_scope': {'kind': 'datasets', 'dataset_ids': [other.dataset.id]}}))
    assert kept_query.total == 1
    from iad_core.entry import direction_exploration_presets
    expected_presets = direction_exploration_presets({}, db.db_path)
    with db.connection() as conn:
        expected = {table: [tuple(row) for row in conn.execute(f'SELECT * FROM {table}')]
            for table in ('workbench_image_settings', 'image_embedding_profiles')}
    dataset_delete({'dataset_id': config.dataset.id}, db.db_path)
    for result in (owned, shared):
        with pytest.raises(ConsistencyError, match='does not exist'):
            service.evidence(result.evidence_id)
    assert service.evidence(kept.evidence_id).result == kept
    with pytest.raises(ConsistencyError, match='unavailable'):
        queries.page(removed_query.query_id)
    assert queries.page(kept_query.query_id).total == 1
    assert direction_exploration_presets({}, db.db_path) == expected_presets
    with db.connection() as conn:
        assert conn.execute('SELECT count(*) FROM consistency_decisions').fetchone()[0] == 0
        for table, rows in expected.items():
            assert [tuple(row) for row in conn.execute(f'SELECT * FROM {table}')] == rows
        assert conn.execute('PRAGMA foreign_key_check').fetchall() == []


@pytest.mark.parametrize('status', ['PENDING', 'RUNNING'])
def test_delete_rejects_active_batch_when_dataset_is_only_in_corpus(dataset, tmp_path, status):
    import time
    from iad_core.consistency.models import ConsistencyStart
    from iad_core.workbench.runtime import WorkbenchRuntime

    db, registry, config = dataset
    directory = tmp_path / 'query'; directory.mkdir()
    Image.new('RGB', (32, 32), 'green').save(directory / 'query.png')
    other = registry.import_dataset({'format': 'labelme', 'name': '检查集',
        'image_dir': str(directory), 'annotation_dir': str(directory)})
    runtime = WorkbenchRuntime(db)
    try:
        started = runtime.consistency.start(ConsistencyStart(subjects={'kind': 'datasets', 'dataset_ids': [other.dataset.id]},
            corpus_scope={'kind': 'datasets', 'dataset_ids': [config.dataset.id]}, request_id='corpus-only', mode='exact'))
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            batch = runtime.consistency.status(started.batch_id)
            if batch.status not in ('PENDING', 'RUNNING'):
                break
            time.sleep(.01)
        assert batch.status == 'COMPLETED'
        runtime.close()
        with db.connection() as conn:
            conn.execute('UPDATE job_runs SET status=? WHERE job_id=?', (status, batch.children[0].run_id))
            before = {table: [tuple(row) for row in conn.execute(f'SELECT * FROM {table}')]
                for table in ('datasets', 'samples', 'consistency_runs', 'consistency_children', 'job_runs')}
        with pytest.raises(ValueError, match='关联审核作业'):
            dataset_delete({'dataset_id': config.dataset.id}, db.db_path)
        with db.connection() as conn:
            for table, rows in before.items():
                assert [tuple(row) for row in conn.execute(f'SELECT * FROM {table}')] == rows
            conn.execute("UPDATE job_runs SET status='COMPLETED' WHERE job_id=?", (batch.children[0].run_id,))
        dataset_delete({'dataset_id': config.dataset.id}, db.db_path)
        assert runtime.consistency.list().items == []
        assert registry.get(other.dataset.id).dataset.name == '检查集'
    finally:
        runtime.close()


def test_deleted_corpus_cannot_be_reintroduced_by_a_stale_batch_plan(dataset):
    from datetime import datetime, timezone
    from iad_core.consistency.batch_repository import BatchRepository
    from iad_core.consistency.job_models import BatchPlan
    from iad_core.consistency.models import ConsistencyStart
    from iad_core.consistency.scopes import ConsistencyScopes
    from iad_core.consistency.errors import ConsistencyError

    db, registry, config = dataset
    scopes = ConsistencyScopes(db).freeze({'kind': 'all_registered'}, {'kind': 'all_registered'})
    registry.delete(config.dataset.id)
    plan = BatchPlan(batch_id='stale', root_batch_id='stale', fingerprint='stale', kind='consistency',
        request=ConsistencyStart(subjects={'kind': 'all_registered'}, request_id='stale'), scopes=scopes,
        selected_ids=[sample.sample_id for sample in scopes.subjects.samples], steps=[], created_at=datetime.now(timezone.utc))
    with pytest.raises(ConsistencyError, match='数据集'):
        BatchRepository(db).save(plan)
    assert BatchRepository(db).recent() == []
