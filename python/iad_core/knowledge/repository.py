from typing import Callable, Optional
from contextlib import nullcontext
from sqlite3 import Connection

from iad_core.knowledge.models import KnowledgeKind, KnowledgeSnapshot, KnowledgeVersion
from iad_core.storage.database import Database


class KnowledgeRepository:
    def __init__(self, db: Database):
        self.db = db

    def get(self, version_id: str) -> KnowledgeSnapshot:
        with self.db.connection() as conn:
            row = conn.execute("SELECT snapshot_json FROM knowledge_versions WHERE version_id=?", (version_id,)).fetchone()
        if row is None:
            raise LookupError("Knowledge version not found")
        return KnowledgeSnapshot.model_validate_json(row[0])

    def current(self, dataset_id: str, kind: KnowledgeKind) -> Optional[KnowledgeSnapshot]:
        with self.db.connection() as conn:
            row = conn.execute("""SELECT v.snapshot_json FROM knowledge_heads h
                JOIN knowledge_versions v ON v.version_id=h.version_id WHERE h.dataset_id=? AND h.kind=?""",
                               (dataset_id, kind)).fetchone()
        return KnowledgeSnapshot.model_validate_json(row[0]) if row else None

    def versions(self, dataset_id: str, kind: KnowledgeKind) -> list[KnowledgeVersion]:
        with self.db.connection() as conn:
            rows = conn.execute("""SELECT version_id,dataset_id,kind,parent_version_id,normal_version_id,created_at,
                json_extract(snapshot_json,'$.model_name') AS model_name,
                json_array_length(snapshot_json,'$.sources') AS source_count,
                json_array_length(snapshot_json,'$.checks') AS check_count
                FROM knowledge_versions WHERE dataset_id=? AND kind=? ORDER BY created_at DESC,version_id""",
                (dataset_id, kind)).fetchall()
        return [KnowledgeVersion.model_validate(dict(row)) for row in rows]

    def publish(self, snapshot: KnowledgeSnapshot, connection: Optional[Connection] = None, *,
                expected_head_version_id: Optional[str], validate: Callable[[], None]) -> None:
        with (nullcontext(connection) if connection else self.db.connection()) as conn:
            if not connection:
                conn.execute("BEGIN IMMEDIATE")
            validate()
            row = conn.execute("SELECT version_id FROM knowledge_heads WHERE dataset_id=? AND kind=?",
                               (snapshot.dataset_id, snapshot.kind)).fetchone()
            if (row[0] if row else None) != expected_head_version_id:
                raise ValueError("Knowledge head changed during mining; restart with the current version")
            conn.execute("""INSERT INTO knowledge_versions(version_id,dataset_id,kind,parent_version_id,normal_version_id,
                signature,snapshot_json,created_at) VALUES(?,?,?,?,?,?,?,?)""",
                         (snapshot.version_id, snapshot.dataset_id, snapshot.kind, snapshot.parent_version_id,
                          snapshot.normal_version_id, snapshot.signature, snapshot.model_dump_json(), snapshot.created_at))
            conn.execute("""INSERT INTO knowledge_heads(dataset_id,kind,version_id) VALUES(?,?,?)
                ON CONFLICT(dataset_id,kind) DO UPDATE SET version_id=excluded.version_id""",
                         (snapshot.dataset_id, snapshot.kind, snapshot.version_id))
