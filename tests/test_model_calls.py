import base64
import json
import os
import sqlite3
import zlib
import threading
from pathlib import Path

import httpx
import pytest
from PIL import Image

from iad_core.workbench.calls import ModelCalls
from iad_core.storage.database import Database
from iad_core.storage.call_payloads import CallPayloads


@pytest.fixture
def record_call(dataset):
    db, _, config = dataset

    def record(run_id, body, respond=lambda request: httpx.Response(200, json={'choices': []})):
        with db.connection() as conn:
            conn.execute("INSERT INTO job_runs(job_id,task_id,job_type,status,payload_json) VALUES(?,?,'MODEL_AUDIT','COMPLETED',?)",
                (run_id, config.task.task_id, json.dumps({'request': {'dataset_id': config.dataset.id}})))
        recorder = ModelCalls(db)
        with httpx.Client(transport=httpx.MockTransport(respond)) as client:
            request = client.build_request('POST', 'https://model.invalid/generate', content=body)
            with recorder.bind(run_id), ModelCalls.exchange(client, request, 'generate', 'HistoryTest') as response:
                response.read()
                response.raise_for_status()
        return recorder

    return record


def test_large_call_history_is_deleted_without_reading_request_bodies(dataset, record_call):
    db, registry, config = dataset
    body = json.dumps({'image': base64.b64encode(os.urandom(4 * 1024 * 1024)).decode()}).encode()
    recorder = record_call('large-history', body)
    call = recorder.list('large-history')[0]
    assert recorder.get('large-history', call.call_id).request_body.encode() == body

    def read_count():
        return int(Path('/proc/self/io').read_text().split('rchar: ')[1].splitlines()[0])

    before = read_count()
    registry.delete(config.dataset.id)
    assert read_count() - before < 1_000_000, '删除历史不应读取整个图像请求'
    with pytest.raises(LookupError):
        recorder.get('large-history', call.call_id)
    assert sum(path.stat().st_size for path in Path(db.db_path).parent.rglob('*') if path.is_file()) < 2_000_000


def test_recorded_payloads_survive_a_rolled_back_dataset_delete(dataset, tmp_path, record_call):
    db, registry, config = dataset
    recorder = record_call('rollback', b'{"original":true}')
    call = recorder.list('rollback')[0]
    images = tmp_path / 'dependent'; images.mkdir()
    Image.new('RGB', (32, 32), 'green').save(images / 'other.png')
    other = registry.import_dataset({'format': 'labelme', 'name': '保留', 'image_dir': str(images), 'annotation_dir': str(images)})
    with db.connection() as conn:
        conn.execute("INSERT INTO knowledge_versions VALUES('source',?,NULL,'signature','{}','now')", (config.dataset.id,))
        conn.execute("INSERT INTO knowledge_versions VALUES('dependent',?,'source','signature','{}','now')", (other.dataset.id,))
    with pytest.raises(sqlite3.IntegrityError):
        registry.delete(config.dataset.id)
    assert recorder.get('rollback', call.call_id).request_body == '{"original":true}'
    assert registry.get(config.dataset.id).dataset.id == config.dataset.id


def test_committed_payload_retirement_is_recovered_when_database_reopens(dataset, record_call):
    db, _, _ = dataset
    record_call('recovery', b'{"recover":true}')
    with sqlite3.connect(db.db_path) as conn:
        conn.execute('PRAGMA foreign_keys=ON')
        conn.execute("DELETE FROM model_calls WHERE run_id='recovery'")
        conn.execute("DELETE FROM job_runs WHERE job_id='recovery'")
    assert any(db.call_payloads.root.rglob('*.request'))
    reopened = Database(db.db_path)
    assert not any(reopened.call_payloads.root.rglob('*.request'))
    with reopened.connection() as conn:
        assert conn.execute('SELECT count(*) FROM call_payload_deletions').fetchone()[0] == 0


def test_uncommitted_job_artifacts_are_reclaimed_on_reopen(dataset, record_call):
    db, _, _ = dataset
    record_call('orphan', b'{"original":true}')
    kept = record_call('kept', b'{"preserved":true}')
    call = kept.list('kept')[0]
    before = sum(path.stat().st_size for path in db.call_payloads.root.rglob('*') if path.is_file())
    with sqlite3.connect(db.db_path) as conn:
        conn.execute('DROP TRIGGER retire_call_payloads')
        conn.execute("DELETE FROM model_calls WHERE run_id='orphan'")
        conn.execute("DELETE FROM job_runs WHERE job_id='orphan'")
    reopened = Database(db.db_path)
    assert ModelCalls(reopened).get('kept', call.call_id).request_body == '{"preserved":true}'
    assert sum(path.stat().st_size for path in reopened.call_payloads.root.rglob('*') if path.is_file()) < before


def test_database_backup_keeps_call_bodies_independent(dataset, tmp_path, record_call):
    db, _, config = dataset
    calls = record_call('backup', b'{"original":true}')
    call = calls.list('backup')[0]
    destination = tmp_path / 'backup' / 'snapshot.db'
    db.backup(str(destination))
    copied = Database(str(destination))
    assert ModelCalls(copied).get('backup', call.call_id) == calls.get('backup', call.call_id)
    with pytest.raises(FileExistsError):
        db.backup(str(destination))
    from iad_core.dataset.registry import DatasetRegistry
    DatasetRegistry(copied).delete(config.dataset.id)
    assert calls.get('backup', call.call_id).request_body == '{"original":true}'


def test_failed_backup_publication_leaves_no_partial_backup(dataset, tmp_path, record_call, monkeypatch):
    db, _, _ = dataset
    calls = record_call('backup-failure', b'{"original":true}')
    call = calls.list('backup-failure')[0]
    destination = tmp_path / 'backup' / 'snapshot.db'
    sync = CallPayloads._sync_directory

    def fail_publish(directory):
        if directory == destination.parent:
            raise OSError('模拟备份发布失败')
        sync(directory)

    with monkeypatch.context() as patch:
        patch.setattr(CallPayloads, '_sync_directory', staticmethod(fail_publish))
        with pytest.raises(OSError, match='发布失败'):
            db.backup(str(destination))
    assert not destination.exists()
    assert sum(path.stat().st_size for path in destination.parent.rglob('*') if path.is_file()) == 0
    assert calls.get('backup-failure', call.call_id).request_body == '{"original":true}'


@pytest.mark.parametrize('kind', ['request', 'response'])
def test_missing_recorded_payload_is_reported_as_integrity_failure(dataset, record_call, kind):
    db, _, _ = dataset
    calls = record_call('missing-payload', b'{"original":true}')
    call = calls.list('missing-payload')[0]
    next(db.call_payloads.root.rglob('*.' + kind)).unlink()
    with pytest.raises(RuntimeError, match='正文缺失'):
        calls.get('missing-payload', call.call_id)


def test_late_response_cannot_recreate_deleted_payloads(dataset, record_call):
    db, registry, config = dataset
    entered, release = threading.Event(), threading.Event()
    errors = []

    def respond(request):
        entered.set()
        assert release.wait(10)
        return httpx.Response(200, json={'choices': []})

    def record():
        try:
            record_call('late', b'{"late":true}', respond)
        except Exception as error:
            errors.append(error)

    worker = threading.Thread(target=record)
    worker.start()
    try:
        assert entered.wait(5)
        registry.delete(config.dataset.id)
    finally:
        release.set()
        worker.join(10)
    assert not worker.is_alive() and not errors
    assert sum(path.stat().st_size for path in db.call_payloads.root.rglob('*') if path.is_file()) == 0


@pytest.mark.parametrize('interrupted', ['', 'replace', 'fsync'])
def test_existing_call_bodies_are_migrated_without_losing_details(dataset, monkeypatch, interrupted):
    db, _, config = dataset
    request = b'{"model":"original","messages":[]}'
    response = b'{"choices":[],"usage":{"total_tokens":7}}'
    summary = json.dumps({'call_id': 'old-call', 'run_id': 'old-run', 'operation': 'generate',
        'schema_name': 'OldTest', 'phase': None, 'sample_id': None, 'started_at': '2026-01-01'})
    with sqlite3.connect(db.db_path) as conn:
        conn.execute("INSERT INTO job_runs(job_id,task_id,job_type,status,payload_json) VALUES('old-run',?,'MODEL_AUDIT','COMPLETED','{}')", (config.task.task_id,))
        conn.execute('DROP TABLE model_calls')
        conn.execute('CREATE TABLE model_calls(call_id TEXT PRIMARY KEY,run_id TEXT NOT NULL REFERENCES job_runs(job_id),summary_json TEXT NOT NULL,request_body BLOB NOT NULL,response_body BLOB)')
        conn.execute('INSERT INTO model_calls VALUES(?,?,?,?,?)', ('old-call', 'old-run', summary, zlib.compress(request), zlib.compress(response)))
    if interrupted:
        def fail_replace(*args):
            raise OSError('模拟正文迁移落盘失败')

        with monkeypatch.context() as patch:
            patch.setattr(os, interrupted, fail_replace)
            with pytest.raises(OSError, match='落盘失败'):
                Database(db.db_path)
        with sqlite3.connect(db.db_path) as conn:
            assert zlib.decompress(conn.execute('SELECT request_body FROM model_calls').fetchone()[0]) == request
    reopened = Database(db.db_path)
    saved = ModelCalls(reopened).get('old-run', 'old-call')
    assert saved.request_body.encode() == request
    assert saved.response_body.encode() == response
    with reopened.connection() as conn:
        assert {row[1] for row in conn.execute('PRAGMA table_info(model_calls)')} == {'call_id', 'run_id', 'summary_json'}
        assert conn.execute('PRAGMA foreign_key_check').fetchall() == []


@pytest.mark.parametrize('failure', ['http', 'timeout'])
def test_recorded_payloads_preserve_provider_failures(dataset, record_call, failure):
    db, _, _ = dataset

    def respond(request):
        if failure == 'timeout':
            raise httpx.ReadTimeout('original timeout', request=request)
        return httpx.Response(500, content=b'original provider error')

    with pytest.raises(httpx.HTTPError):
        record_call('failed', b'{"original":true}', respond)
    recorder = ModelCalls(db)
    call = recorder.list('failed')[0]
    detail = recorder.get('failed', call.call_id)
    assert detail.request_body == '{"original":true}'
    assert detail.response_body == ('original provider error' if failure == 'http' else None)
    assert detail.error.type == ('HTTPStatusError' if failure == 'http' else 'ReadTimeout')
