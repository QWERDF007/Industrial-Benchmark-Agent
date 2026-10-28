from contextlib import nullcontext
from sqlite3 import Connection

from iad_core.consistency.audit_models import AuditConsistencyRecord, AuditConsistencyView
from iad_core.consistency.repository import ConsistencyRepository
from iad_core.storage.database import Database


class AuditConsistencyRepository:
    def __init__(self, db: Database):
        self.db = db

    def save(self, record: AuditConsistencyRecord, connection: Connection | None = None) -> None:
        with nullcontext(connection) if connection is not None else self.db.connection() as conn:
            conn.execute('''INSERT INTO audit_consistency_checks(check_id,run_id,sample_id,record_json)
                VALUES(?,?,?,?)''', (record.check_id, record.run_id, record.sample_id, record.model_dump_json()))

    def latest(self, sample_id: str) -> AuditConsistencyView | None:
        with self.db.connection() as conn:
            row = conn.execute('''SELECT record_json FROM audit_consistency_checks
                WHERE sample_id=? ORDER BY id DESC LIMIT 1''', (sample_id,)).fetchone()
        if row is None:
            return None
        record = AuditConsistencyRecord.model_validate_json(row[0])
        results = [ConsistencyRepository(self.db).get(ref.evidence_id).result for ref in record.references]
        return AuditConsistencyView(**record.model_dump(), results=results)
