import os
import sqlite3
import shutil
import tempfile
import threading
from functools import partial
from weakref import finalize
from contextlib import contextmanager, closing
from pathlib import Path
from typing import cast
from collections.abc import Iterator

from filelock import FileLock
from sqlalchemy.pool import QueuePool, PoolProxiedConnection

from iad_core.storage.schema import initialize_schema
from iad_core.storage.call_payloads import CallPayloads
from iad_core.storage.schema_revision import SchemaRevision


class Database:
    """Pooled SQLite operations and isolated temporary schemas."""
    _schema_lock = threading.RLock()
    _schema_revisions: dict[Path, tuple[int, int, int]] = {}

    def __init__(self, db_path: str = "data/benchmark.db"):
        self.db_path = db_path
        self.call_payloads = CallPayloads(db_path)
        os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
        self._pool: QueuePool | None = QueuePool(partial(self._connect, db_path))
        self._release_pool = finalize(self, self._pool.dispose)
        canonical = Path(db_path).resolve()
        with self._schema_lock, self.connection() as conn:
            file = canonical.stat()
            identity = (file.st_dev, file.st_ino)
            revision = (*identity, conn.execute('PRAGMA schema_version').fetchone()[0])
            if self._schema_revisions.get(canonical) != revision:
                with FileLock(str(canonical) + '.schema.lock'):
                    if not SchemaRevision.current(conn):
                        conn.execute("PRAGMA journal_mode = WAL")
                        self.init_schema()
                    self.call_payloads.recover(conn)
                self._schema_revisions[canonical] = (*identity, conn.execute('PRAGMA schema_version').fetchone()[0])
            self.call_payloads.collect(conn)

    @staticmethod
    def _connect(db_path: str) -> sqlite3.Connection:
        conn = sqlite3.connect(db_path, check_same_thread=False)
        try:
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA synchronous = NORMAL")
            conn.execute("PRAGMA secure_delete = FAST")
            conn.execute("PRAGMA foreign_keys = ON")
        except BaseException:
            conn.close()
            raise
        return conn

    def get_connection(self) -> PoolProxiedConnection:
        if self._pool is None:
            raise RuntimeError('数据库已关闭')
        return self._pool.connect()

    def close(self) -> None:
        self._release_pool()
        self._pool = None

    @contextmanager
    def connection(self, *, temporary: bool = False) -> Iterator[sqlite3.Connection]:
        with closing(self.get_connection()) as lease:
            conn = self._connect(self.db_path) if temporary else cast(sqlite3.Connection, lease.driver_connection)
            changes = conn.total_changes
            try:
                yield conn
                conn.commit()
                if conn.total_changes != changes:
                    self.call_payloads.collect(conn)
            except Exception:
                conn.rollback()
                raise
            finally:
                if temporary:
                    conn.close()

    def init_schema(self):
        with self.connection() as conn:
            externalized_calls = initialize_schema(conn)
        if externalized_calls:
            with self.connection() as conn:
                conn.execute('VACUUM')
        with self.connection() as conn:
            SchemaRevision.save(conn)

    def backup(self, destination: str) -> None:
        target = Path(destination).resolve()
        payloads = CallPayloads(str(target)).root
        target.parent.mkdir(parents=True, exist_ok=True)
        with FileLock(str(target) + '.backup.lock'), self.call_payloads.reading():
            if target.exists() or payloads.exists():
                raise FileExistsError('备份目标已存在')
            with tempfile.TemporaryDirectory(dir=target.parent) as directory:
                snapshot = Path(directory) / target.name
                with self.connection() as source, sqlite3.connect(snapshot) as copy:
                    source.backup(copy)
                copied_payloads = CallPayloads(str(snapshot)).root
                if self.call_payloads.root.exists():
                    self.call_payloads.copy_to(CallPayloads(str(snapshot)))
                    os.rename(copied_payloads, payloads)
                try:
                    os.rename(snapshot, target)
                    CallPayloads._sync_directory(target.parent)
                except BaseException:
                    target.unlink(missing_ok=True)
                    if payloads.exists():
                        shutil.rmtree(payloads)
                    raise
