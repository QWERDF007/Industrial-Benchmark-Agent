import hashlib
from functools import lru_cache
from pathlib import Path
from sqlite3 import Connection


class SchemaRevision:
    @staticmethod
    @lru_cache(maxsize=1)
    def source_digest() -> str:
        root = Path(__file__).parent
        sources = set(root.glob('*schema*.py')) | {root / name for name in
            ('database.py', 'deletion_indexes.py', 'call_payloads.py')}
        digest = hashlib.sha256()
        for source in sorted(sources):
            digest.update(source.name.encode())
            digest.update(source.read_bytes())
        return digest.hexdigest()

    @classmethod
    def current(cls, connection: Connection) -> bool:
        if connection.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_revision'").fetchone() is None:
            return False
        row = connection.execute('SELECT source_digest,sqlite_revision FROM schema_revision WHERE singleton=1').fetchone()
        return row is not None and row[0] == cls.source_digest() and row[1] == connection.execute('PRAGMA schema_version').fetchone()[0]

    @classmethod
    def save(cls, connection: Connection) -> None:
        connection.execute('''CREATE TABLE IF NOT EXISTS schema_revision(
            singleton INTEGER PRIMARY KEY CHECK(singleton=1),source_digest TEXT NOT NULL,sqlite_revision INTEGER NOT NULL)''')
        revision = connection.execute('PRAGMA schema_version').fetchone()[0]
        connection.execute('''INSERT INTO schema_revision VALUES(1,?,?) ON CONFLICT(singleton) DO UPDATE
            SET source_digest=excluded.source_digest,sqlite_revision=excluded.sqlite_revision''', (cls.source_digest(), revision))
