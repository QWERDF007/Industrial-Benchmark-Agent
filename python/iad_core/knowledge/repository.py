from typing import Optional

from iad_core.knowledge.models import KnowledgeKind, KnowledgeSnapshot
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

    def publish(self, snapshot: KnowledgeSnapshot) -> None:
        with self.db.connection() as conn:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute("SELECT version_id FROM knowledge_heads WHERE dataset_id=? AND kind=?",
                               (snapshot.dataset_id, snapshot.kind)).fetchone()
            if (row[0] if row else None) != snapshot.parent_version_id:
                raise ValueError("Knowledge head changed during mining; restart with the current version")
            conn.execute("""INSERT INTO knowledge_versions(version_id,dataset_id,kind,parent_version_id,normal_version_id,
                signature,snapshot_json,created_at) VALUES(?,?,?,?,?,?,?,?)""",
                         (snapshot.version_id, snapshot.dataset_id, snapshot.kind, snapshot.parent_version_id,
                          snapshot.normal_version_id, snapshot.signature, snapshot.model_dump_json(), snapshot.created_at))
            conn.execute("""INSERT INTO knowledge_heads(dataset_id,kind,version_id) VALUES(?,?,?)
                ON CONFLICT(dataset_id,kind) DO UPDATE SET version_id=excluded.version_id""",
                         (snapshot.dataset_id, snapshot.kind, snapshot.version_id))
