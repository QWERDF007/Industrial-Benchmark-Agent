import hashlib
import os
import shutil
import tempfile
import zlib
from contextlib import AbstractContextManager, contextmanager
from dataclasses import dataclass
from pathlib import Path
from sqlite3 import Connection
from typing import Iterator, Literal
from filelock import FileLock, Timeout


CallBodyKind = Literal['request', 'response']


@dataclass
class PreparedCallPayload:
    path: Path
    temporary: Path
    durable: bool
    lock: FileLock
    previous: Path | None = None
    published: bool = False
    committed: bool = False
    locked: bool = False

    def commit(self) -> None:
        self.committed = True
        if self.locked:
            self.lock.release()
            self.locked = False

    def publish(self) -> None:
        self.lock.acquire()
        self.locked = True
        created = not self.path.parent.exists()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if self.path.exists():
            previous = self.temporary.parent / 'previous'
            os.link(self.path, previous)
            self.previous = previous
        os.replace(self.temporary, self.path)
        self.published = True
        if self.durable:
            CallPayloads._sync_directory(self.path.parent)
            if created:
                CallPayloads._sync_directory(self.path.parent.parent)
                CallPayloads._sync_directory(self.path.parent.parent.parent)


class CallPayloads:
    """Job-owned payload files; SQLite commits their retirement before removal."""

    def __init__(self, db_path: str):
        self.root = Path(str(Path(db_path).resolve()) + '.calls')
        self._read_lock = FileLock(str(self.root) + '.lock')

    def _directory(self, run_id: str) -> Path:
        return self.root / hashlib.sha256(run_id.encode()).hexdigest()

    def reading(self) -> FileLock:
        return self._read_lock

    def _path(self, run_id: str, call_id: str, kind: CallBodyKind) -> Path:
        return self._directory(run_id) / (hashlib.sha256(call_id.encode()).hexdigest() + '.' + kind)

    @staticmethod
    def _sync_directory(directory: Path) -> None:
        descriptor = os.open(directory, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)

    def _sync_all(self) -> None:
        if not self.root.exists():
            return
        for directory in self.root.iterdir():
            if directory.is_dir():
                for path in directory.iterdir():
                    with path.open('rb') as file:
                        os.fsync(file.fileno())
                self._sync_directory(directory)
        self._sync_directory(self.root)
        self._sync_directory(self.root.parent)

    @contextmanager
    def _stage(self, path: Path, compressed: bytes, *, durable: bool = True) -> Iterator[PreparedCallPayload]:
        with self.reading():
            directory = Path(tempfile.mkdtemp(dir=self.root.parent, prefix=self.root.name + '.pending-'))
            lease = FileLock(str(directory) + '.lock')
            lease.acquire()
        prepared = None
        try:
            temporary = directory / 'payload'
            with temporary.open('xb') as file:
                file.write(compressed)
                file.flush()
                if durable:
                    os.fsync(file.fileno())
            prepared = PreparedCallPayload(path, temporary, durable, self._read_lock)
            yield prepared
        except BaseException:
            if prepared is not None and prepared.published and not prepared.committed:
                if prepared.previous is not None:
                    os.replace(prepared.previous, path)
                else:
                    path.unlink(missing_ok=True)
                if durable:
                    self._sync_directory(path.parent)
            raise
        finally:
            with self.reading():
                if prepared is not None and prepared.locked:
                    prepared.lock.release()
                    prepared.locked = False
                shutil.rmtree(directory)
                lease.release()
                Path(lease.lock_file).unlink(missing_ok=True)

    def _save(self, path: Path, compressed: bytes, *, durable: bool = True) -> None:
        with self._stage(path, compressed, durable=durable) as prepared:
            prepared.publish()

    def prepare(self, run_id: str, call_id: str, kind: CallBodyKind, body: bytes) -> AbstractContextManager[PreparedCallPayload]:
        """Prepare outside SQLite; publish in the metadata transaction and retain after commit."""
        return self._stage(self._path(run_id, call_id, kind), zlib.compress(body))

    def read(self, run_id: str, call_id: str) -> tuple[bytes, bytes | None]:
        try:
            request = zlib.decompress(self._path(run_id, call_id, 'request').read_bytes())
        except FileNotFoundError as error:
            raise RuntimeError('模型调用请求正文缺失') from error
        response = self._path(run_id, call_id, 'response')
        return request, zlib.decompress(response.read_bytes()) if response.exists() else None

    def copy_to(self, destination: 'CallPayloads') -> None:
        with self.reading():
            destination.root.mkdir(parents=True, exist_ok=True)
            shared_device = self.root.stat().st_dev == destination.root.stat().st_dev
            for path in self.root.glob('*/*'):
                if path.suffix in ('.request', '.response'):
                    output = destination.root / path.relative_to(self.root)
                    if shared_device:
                        output.parent.mkdir(parents=True, exist_ok=True)
                        os.link(path, output)
                    else:
                        destination._save(output, path.read_bytes(), durable=False)
            destination._sync_all()

    def collect(self, connection: Connection) -> None:
        if not connection.execute("SELECT 1 FROM sqlite_master WHERE name='call_payload_deletions' AND type='table'").fetchone():
            return
        if not connection.execute('SELECT 1 FROM call_payload_deletions LIMIT 1').fetchone():
            return
        connection.execute('BEGIN IMMEDIATE')
        with self.reading():
            for row in connection.execute('SELECT run_id FROM call_payload_deletions').fetchall():
                directory = self._directory(row[0])
                if directory.exists():
                    shutil.rmtree(directory)
                connection.execute('DELETE FROM call_payload_deletions WHERE run_id=?', (row[0],))
            if self.root.exists():
                self._sync_directory(self.root)
        connection.commit()

    def initialize(self, connection: Connection) -> bool:
        migrated = 'request_body' in {row[1] for row in connection.execute('PRAGMA table_info(model_calls)')}
        if migrated:
            for row in connection.execute('SELECT call_id,run_id,request_body,response_body FROM model_calls'):
                bodies: tuple[tuple[CallBodyKind, bytes | None], ...] = (('request', row[2]), ('response', row[3]))
                for kind, compressed in bodies:
                    if compressed is not None:
                        path = self._path(row[1], row[0], kind)
                        if not path.exists() or path.read_bytes() != compressed:
                            self._save(path, compressed, durable=False)
            self._sync_all()
            connection.execute('''CREATE TABLE model_calls_metadata(
                call_id TEXT PRIMARY KEY,run_id TEXT NOT NULL REFERENCES job_runs(job_id),summary_json TEXT NOT NULL)''')
            connection.execute('INSERT INTO model_calls_metadata SELECT call_id,run_id,summary_json FROM model_calls')
            connection.execute('DROP TABLE model_calls')
            connection.execute('ALTER TABLE model_calls_metadata RENAME TO model_calls')
            connection.execute('CREATE INDEX idx_model_calls_run ON model_calls(run_id)')
        connection.execute('CREATE TABLE IF NOT EXISTS call_payload_deletions(run_id TEXT PRIMARY KEY)')
        connection.execute('''CREATE TRIGGER IF NOT EXISTS retire_call_payloads AFTER DELETE ON job_runs
            BEGIN INSERT OR IGNORE INTO call_payload_deletions(run_id) VALUES(OLD.job_id); END''')
        return migrated

    def recover(self, connection: Connection) -> None:
        with self.reading():
            for directory in self.root.parent.glob(self.root.name + '.pending-*'):
                if not directory.is_dir():
                    continue
                lease = FileLock(str(directory) + '.lock')
                try:
                    lease.acquire(timeout=0)
                except Timeout:
                    continue
                try:
                    shutil.rmtree(directory)
                finally:
                    lease.release()
                    Path(lease.lock_file).unlink(missing_ok=True)
        if not self.root.exists():
            return
        with self.reading():
            owners = {hashlib.sha256(row[0].encode()).hexdigest()
                for row in connection.execute('SELECT job_id FROM job_runs')}
            if not any(directory.is_dir() and directory.name not in owners for directory in self.root.iterdir()):
                return
        connection.execute('BEGIN IMMEDIATE')
        with self.reading():
            owners = {hashlib.sha256(row[0].encode()).hexdigest()
                for row in connection.execute('SELECT job_id FROM job_runs')}
            for directory in self.root.iterdir():
                if directory.is_dir() and directory.name not in owners:
                    shutil.rmtree(directory)
            self._sync_directory(self.root)
        connection.commit()
