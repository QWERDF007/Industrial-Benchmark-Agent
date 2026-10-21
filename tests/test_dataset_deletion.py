import json
from pathlib import Path
from uuid import uuid4

import pytest
from PIL import Image

from iad_core.dataset.registry import DatasetImport
from iad_core.entry import dataset_delete, dataset_list
from iad_core.workbench.audit import AuditService, VlmClient
from iad_core.workbench.review import HumanReview, ReviewSubmission


def test_delete_removes_owned_records_and_preserves_other_dataset_and_sources(dataset, mllm_api, tmp_path):
    db, registry, config = dataset
    images, labels = tmp_path / 'other-images', tmp_path / 'other-labels'
    images.mkdir(); labels.mkdir()
    Image.new('RGB', (32, 32), 'green').save(images / 'other.png')
    (labels / 'other.json').write_text(json.dumps({'imageWidth':32,'imageHeight':32,'shapes':[{'label':'保留标注','shape_type':'rectangle','points':[[5,5],[10,10]]}]}))
    other = registry.import_labelme(DatasetImport(name='保留数据集', image_dir=str(images), annotation_dir=str(labels)))
    client, _, _ = mllm_api
    service = AuditService(db, VlmClient(http_client=client))
    target = config.dataset.id + ':dent.png'
    try:
        job = service.start(dataset_id=config.dataset.id, sample_ids=[target])
        service.wait(job['run_id'], 15)
        assert service.status(job['run_id'])['status'] == 'COMPLETED'
    finally:
        service.close()
    HumanReview(db).submit(ReviewSubmission(dataset_id=config.dataset.id, sample_id=target,
        submission_id=uuid4(), reviewer='复核人', decision='PASS'))
    source_files = {p: p.read_bytes() for root in (config.root, config.annotations.root) for p in Path(root).rglob('*') if p.is_file()}
    with db.connection() as conn:
        other_samples = [tuple(r) for r in conn.execute('SELECT * FROM samples WHERE dataset_id=?', (other.dataset.id,))]
        other_annotations = [tuple(r) for r in conn.execute('SELECT a.* FROM annotations a JOIN samples s ON a.sample_id=s.sample_id WHERE s.dataset_id=?', (other.dataset.id,))]
        assert conn.execute('SELECT count(*) FROM model_calls').fetchone()[0] > 0
        assert conn.execute('SELECT count(*) FROM knowledge_versions').fetchone()[0] > 0
    assert dataset_delete({'dataset_id':config.dataset.id}, db.db_path) == {'deleted_dataset_id':config.dataset.id}
    assert [d['dataset_id'] for d in dataset_list({}, db.db_path)['datasets']] == [other.dataset.id]
    with db.connection() as conn:
        assert [tuple(r) for r in conn.execute('SELECT * FROM samples')] == other_samples
        assert [tuple(r) for r in conn.execute('SELECT * FROM annotations')] == other_annotations
        for table in ('review_decisions','review_sessions','knowledge_heads','knowledge_versions','model_calls','job_runs','audit_suggestions'):
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
            conn.execute("INSERT INTO model_calls(call_id,run_id,summary_json,request_body) VALUES(?,?,?,?)",
                (item.dataset.id,item.dataset.id,'{}',b'{}'))
        expected = {table:[tuple(r) for r in conn.execute(f'SELECT * FROM {table} WHERE {column}=?', (other.dataset.id,))]
            for table,column in [('datasets','dataset_id'),('samples','dataset_id'),('job_runs','job_id'),('model_calls','call_id')]}
    dataset_delete({'dataset_id':config.dataset.id}, db.db_path)
    with db.connection() as conn:
        for table in expected:
            assert [tuple(r) for r in conn.execute(f'SELECT * FROM {table}')] == expected[table], table
        assert conn.execute('SELECT count(*) FROM inspection_tasks WHERE task_id=?',(config.task.task_id,)).fetchone()[0] == 1
        assert conn.execute('PRAGMA foreign_key_check').fetchall() == []


def test_delete_rolls_back_all_records_if_a_dependency_blocks_removal(dataset, tmp_path):
    import sqlite3
    db, registry, config = dataset
    images, labels = tmp_path/'linked-images', tmp_path/'linked-labels'
    images.mkdir(); labels.mkdir()
    Image.new('RGB',(32,32),'green').save(images/'linked.png')
    other = registry.import_labelme(DatasetImport(name='依赖方', image_dir=str(images), annotation_dir=str(labels)))
    with db.connection() as conn:
        conn.execute("INSERT INTO knowledge_versions VALUES('normal',?,'normal',NULL,NULL,'sig','{}','now')", (config.dataset.id,))
        conn.execute("INSERT INTO knowledge_versions VALUES('dependent',?,'defect',NULL,'normal','sig','{}','now')", (other.dataset.id,))
        before = {table:[tuple(r) for r in conn.execute(f'SELECT * FROM {table}')] for table in ('datasets','samples','annotations','knowledge_versions')}
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
