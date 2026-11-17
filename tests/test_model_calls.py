import base64
import hashlib
import json
import multiprocessing
import os
import sqlite3
import stat
import zlib
import threading
import time
from pathlib import Path

import httpx
import pytest
from PIL import Image

from iad_core.workbench.calls import ModelCalls, NativeModelCallEnd, NativeModelCallStart
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


@pytest.mark.parametrize('source', ['http', 'native'])
@pytest.mark.parametrize('kind', ['request', 'response'])
@pytest.mark.parametrize('blocked_operation', ['compress', 'file_sync'])
def test_payload_preparation_does_not_lock_unrelated_progress_writes(
        dataset, record_call, monkeypatch, source, kind, blocked_operation):
    db, _, config = dataset
    entered, release = threading.Event(), threading.Event()
    errors = []
    operations = 0
    compress, fsync = zlib.compress, os.fsync
    run_id = 'payload-concurrency'

    def pause():
        nonlocal operations
        operations += 1
        if operations == (1 if kind == 'request' else 2):
            entered.set()
            assert release.wait(10), '等待并发进度写入'

    def prepare_body(body):
        pause()
        return compress(body)

    def sync_file(descriptor):
        if stat.S_ISREG(os.fstat(descriptor).st_mode):
            pause()
        return fsync(descriptor)

    if blocked_operation == 'compress':
        monkeypatch.setattr(zlib, 'compress', prepare_body)
    else:
        monkeypatch.setattr(os, 'fsync', sync_file)

    def record():
        try:
            if source == 'http':
                record_call(run_id, b'{"original":true}')
            else:
                with db.connection() as connection:
                    connection.execute("INSERT INTO job_runs(job_id,task_id,job_type,status,payload_json) VALUES(?,?,'MODEL_AUDIT','RUNNING','{}')",
                                       (run_id, config.task.task_id))
                calls = ModelCalls(db)
                calls.start_native(run_id, NativeModelCallStart(call_id='native-call',
                    started_at='2026-11-14T08:00:00Z', request={'original': True}),
                    sample_id=None, session_id='session', attempt=1)
                calls.finish_native(run_id, None, NativeModelCallEnd(call_id='native-call',
                    finished_at='2026-11-14T08:00:01Z', elapsed_ms=1000, finish_reason='stop'))
        except Exception as error:
            errors.append(error)

    worker = threading.Thread(target=record)
    worker.start()
    try:
        assert entered.wait(5)
        with sqlite3.connect(db.db_path, timeout=.1) as connection:
            assert connection.execute("UPDATE job_runs SET status=status WHERE job_id=?", (run_id,)).rowcount == 1
    finally:
        release.set()
        worker.join(10)
    assert not worker.is_alive() and not errors
    calls = ModelCalls(db)
    summary = calls.list(run_id)[0]
    detail = calls.get(run_id, summary.call_id)
    assert json.loads(detail.request_body) == {'original': True}
    assert detail.response_body and summary.finished_at


@pytest.mark.parametrize('replace_existing', [False, True])
def test_failed_metadata_commit_restores_prepared_payloads(dataset, record_call, replace_existing):
    db, _, _ = dataset
    calls = record_call('payload-rollback', b'{"original":true}')
    call = calls.list('payload-rollback')[0]
    before = calls.get('payload-rollback', call.call_id)
    call_id = call.call_id if replace_existing else 'uncommitted-call'
    with pytest.raises(sqlite3.IntegrityError):
        with db.call_payloads.prepare('payload-rollback', call_id, 'response', b'{"replacement":true}') as prepared:
            with db.connection() as connection:
                connection.execute('PRAGMA defer_foreign_keys=ON')
                connection.execute("INSERT INTO model_calls VALUES('uncommitted-metadata','missing-job','{}')")
                prepared.publish()
    assert calls.get('payload-rollback', call.call_id) == before
    assert not any(db.call_payloads.root.parent.glob(db.call_payloads.root.name + '.pending-*'))
    if not replace_existing:
        assert len(list(db.call_payloads.root.rglob('*.response'))) == 1


@pytest.mark.parametrize('kind', ['request', 'response'])
def test_committed_payload_survives_later_retirement_failure(dataset, record_call, kind):
    db, _, _ = dataset
    db.call_payloads.root.mkdir(parents=True, exist_ok=True)
    retired = db.call_payloads.root / hashlib.sha256(b'broken-retirement').hexdigest()
    retired.write_text('无法作为目录删除')
    event = 'INSERT' if kind == 'request' else 'UPDATE'
    with sqlite3.connect(db.db_path) as connection:
        connection.execute(f'''CREATE TRIGGER fail_retirement_after_record AFTER {event} ON model_calls
            BEGIN INSERT INTO call_payload_deletions VALUES('broken-retirement'); END''')
    with pytest.raises(NotADirectoryError):
        record_call('post-commit-retirement', b'{"original":true}')
    calls = ModelCalls(db)
    summary = calls.list('post-commit-retirement')[0]
    detail = calls.get(summary.run_id, summary.call_id)
    assert detail.request_body == '{"original":true}'
    if kind == 'response':
        assert detail.response_body and detail.finished_at


def test_payload_recovery_preserves_live_staging_and_reclaims_a_killed_writer(dataset):
    db, _, _ = dataset
    processes = multiprocessing.get_context('fork')
    entered = processes.Event()

    def stage():
        with CallPayloads(db.db_path).prepare('staging-owner', 'pending-call', 'request', b'{"original":true}'):
            entered.set()
            time.sleep(30)

    worker = processes.Process(target=stage)
    worker.start()
    try:
        assert entered.wait(5)
        stages = list(db.call_payloads.root.parent.glob(db.call_payloads.root.name + '.pending-*'))
        assert stages
        with db.connection() as connection:
            db.call_payloads.recover(connection)
        assert all(path.exists() for path in stages), '不能删除存活进程尚未发布的正文'
        worker.kill()
        worker.join(5)
        assert worker.exitcode is not None
        with db.connection() as connection:
            db.call_payloads.recover(connection)
        assert not any(db.call_payloads.root.parent.glob(db.call_payloads.root.name + '.pending-*'))
    finally:
        if worker.is_alive():
            worker.kill()
        worker.join(5)


def test_failed_payload_commit_cannot_overwrite_a_later_committed_response(dataset, record_call, monkeypatch):
    db, _, _ = dataset
    calls = record_call('concurrent-response', b'{"original":true}')
    call = calls.list('concurrent-response')[0]
    restoring, release, committed = threading.Event(), threading.Event(), threading.Event()
    errors = []
    replace = os.replace

    def restore(source, destination):
        if Path(source).name == 'previous':
            restoring.set()
            assert release.wait(10)
        return replace(source, destination)

    monkeypatch.setattr(os, 'replace', restore)

    def write(fail):
        try:
            body = b'{"writer":"failed"}' if fail else b'{"writer":"committed"}'
            with db.call_payloads.prepare(call.run_id, call.call_id, 'response', body) as prepared:
                with db.connection(after_commit=prepared.commit) as connection:
                    connection.execute('BEGIN IMMEDIATE')
                    if fail:
                        connection.execute('PRAGMA defer_foreign_keys=ON')
                        connection.execute("INSERT INTO model_calls VALUES('bad-commit','missing-job','{}')")
                    prepared.publish()
            if not fail:
                committed.set()
        except sqlite3.IntegrityError:
            if not fail:
                raise
        except Exception as error:
            errors.append(error)

    failing = threading.Thread(target=write, args=(True,))
    following = threading.Thread(target=write, args=(False,))
    failing.start()
    try:
        assert restoring.wait(5)
        following.start()
        assert not committed.wait(.1), '回滚正文前不能让后续提交被旧正文覆盖'
    finally:
        release.set()
        failing.join(10)
        if following.ident is not None:
            following.join(10)
    assert not failing.is_alive() and not following.is_alive() and not errors and committed.is_set()
    assert json.loads(calls.get(call.run_id, call.call_id).response_body) == {'writer': 'committed'}


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


@pytest.mark.parametrize('purpose,error,http_status,expected', [
    ('compaction', None, None, 'accepted'),
    (None, {'type': 'JOB_CONTEXT_BUDGET', 'message': '输入超过容量预算'}, None, 'local_rejection'),
    (None, {'type': 'CONTEXT_LENGTH', 'message': 'Pi-ai detected context overflow'}, None, 'sdk_rejection'),
    (None, {'type': 'HTTP_ERROR', 'message': 'maximum context length exceeded'}, 400, 'provider_rejection'),
])
def test_native_capacity_ledger_distinguishes_summary_and_admission_sources(dataset, purpose, error, http_status, expected):
    db, _, config = dataset
    with db.connection() as connection:
        connection.execute("INSERT INTO job_runs(job_id,task_id,job_type,status,payload_json) VALUES('capacity-ledger',?,'MODEL_AUDIT','RUNNING','{}')",
            (config.task.task_id,))
    calls = ModelCalls(db)
    request = {'sessionId': 'master', 'messages': []}
    if purpose:
        request['purpose'] = purpose
    calls.start_native('capacity-ledger', NativeModelCallStart(call_id='capacity-call',
        started_at='2026-11-17T08:00:00Z', request=request), sample_id=None, session_id='master', attempt=1)
    calls.finish_native('capacity-ledger', None, NativeModelCallEnd(call_id='capacity-call',
        finished_at='2026-11-17T08:00:01Z', elapsed_ms=1000, finish_reason='stop' if error is None else None,
        error=error, http_status=http_status))
    summary = calls.list('capacity-ledger')[0]
    assert summary.purpose == (purpose or 'business')
    assert summary.context_capacity == expected
