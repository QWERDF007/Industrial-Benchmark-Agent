import os
import sqlite3
import threading
from contextlib import contextmanager
from pathlib import Path

from filelock import FileLock

from iad_core.storage.schema import initialize_schema


class Database:
    """SQLite connections with schema initialization once per file and schema revision."""
    _schema_lock = threading.RLock()
    _schema_revisions: dict[Path, tuple[int, int, int]] = {}

    def __init__(self, db_path: str = "data/benchmark.db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
        canonical = Path(db_path).resolve()
        with self._schema_lock, self.connection() as conn:
            file = canonical.stat()
            identity = (file.st_dev, file.st_ino)
            revision = (*identity, conn.execute('PRAGMA schema_version').fetchone()[0])
            if self._schema_revisions.get(canonical) == revision:
                return
            with FileLock(str(canonical) + '.schema.lock'):
                conn.execute("PRAGMA journal_mode = WAL")
                self.init_schema()
            self._schema_revisions[canonical] = (*identity, conn.execute('PRAGMA schema_version').fetchone()[0])

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA synchronous = NORMAL")
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    @contextmanager
    def connection(self):
        conn = self.get_connection()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def init_schema(self):
        with self.connection() as conn:
            initialize_schema(conn)
