from typing import Callable, Optional
from contextlib import nullcontext
from sqlite3 import Connection

from iad_core.knowledge.models import KnowledgeSnapshot, KnowledgeVersion
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

    def current(self, dataset_id: str) -> Optional[KnowledgeSnapshot]:
        with self.db.connection() as conn:
            row = conn.execute("""SELECT v.snapshot_json FROM knowledge_heads h
                JOIN knowledge_versions v ON v.version_id=h.version_id WHERE h.dataset_id=?""",
                               (dataset_id,)).fetchone()
        return KnowledgeSnapshot.model_validate_json(row[0]) if row else None

    def versions(self, dataset_id: str) -> list[KnowledgeVersion]:
        with self.db.connection() as conn:
            rows = conn.execute("""SELECT version_id,dataset_id,parent_version_id,created_at,
                json_extract(snapshot_json,'$.kind') AS kind,
                json_extract(snapshot_json,'$.run_id') AS source_run_id,
                json_extract(snapshot_json,'$.normal_version_id') AS normal_version_id,
                json_extract(snapshot_json,'$.model_name') AS model_name,
                json_array_length(snapshot_json,'$.sources') AS source_count,
                json_array_length(snapshot_json,'$.checks') AS check_count,
                (SELECT COUNT(*) FROM json_each(snapshot_json,'$.checks') c
                    WHERE json_extract(c.value,'$.status')='supported') AS supported_check_count,
                (json_type(snapshot_json,'$.manual_edit')='object') AS manually_edited
                FROM knowledge_versions WHERE dataset_id=? ORDER BY created_at DESC,version_id""",
                (dataset_id,)).fetchall()
        return [KnowledgeVersion.model_validate(dict(row, manually_edited=bool(row['manually_edited']))) for row in rows]

    def publish(self, snapshot: KnowledgeSnapshot, connection: Optional[Connection] = None, *,
                expected_head_version_id: Optional[str], validate: Callable[[], None]) -> None:
        with (nullcontext(connection) if connection else self.db.connection()) as conn:
            if not connection:
                conn.execute("BEGIN IMMEDIATE")
            validate()
            row = conn.execute("SELECT version_id FROM knowledge_heads WHERE dataset_id=?",
                               (snapshot.dataset_id,)).fetchone()
            if (row[0] if row else None) != expected_head_version_id:
                raise ValueError("Knowledge head changed during mining; restart with the current version")
            conn.execute("""INSERT INTO knowledge_versions(version_id,dataset_id,parent_version_id,
                signature,snapshot_json,created_at) VALUES(?,?,?,?,?,?)""",
                         (snapshot.version_id, snapshot.dataset_id, snapshot.parent_version_id,
                          snapshot.signature, snapshot.model_dump_json(), snapshot.created_at))
            conn.execute("""INSERT INTO knowledge_heads(dataset_id,version_id) VALUES(?,?)
                ON CONFLICT(dataset_id) DO UPDATE SET version_id=excluded.version_id""",
                         (snapshot.dataset_id, snapshot.version_id))
