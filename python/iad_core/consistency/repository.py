import hashlib

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.evidence_models import FrozenEvidence
from iad_core.storage.database import Database


class ConsistencyRepository:
    def __init__(self, db: Database):
        self.db=db

    def get(self, evidence_id: str) -> FrozenEvidence:
        with self.db.connection() as connection:
            row=connection.execute('SELECT snapshot_json,snapshot_sha256 FROM consistency_results WHERE evidence_id=?',(evidence_id,)).fetchone()
        if row is None:raise ConsistencyError('REFERENCE_NOT_FOUND','Consistency evidence does not exist')
        return self.deserialize(row['snapshot_json'],row['snapshot_sha256'])

    @staticmethod
    def deserialize(payload: str,checksum: str) -> FrozenEvidence:
        if hashlib.sha256(payload.encode()).hexdigest()!=checksum:
            raise ConsistencyError('SOURCE_UNAVAILABLE','Frozen consistency evidence metadata changed')
        return FrozenEvidence.model_validate_json(payload)

    def save(self, evidence: FrozenEvidence) -> FrozenEvidence:
        payload=evidence.model_dump_json()
        with self.db.connection() as connection:
            connection.execute('''INSERT INTO consistency_results(evidence_id,result_id,snapshot_json,snapshot_sha256)
                VALUES(?,?,?,?) ON CONFLICT(evidence_id) DO NOTHING''',
                (evidence.result.evidence_id,evidence.result.result_id,payload,hashlib.sha256(payload.encode()).hexdigest()))
        saved=self.get(evidence.result.evidence_id)
        if saved.model_dump(exclude={'checked_at'})!=evidence.model_dump(exclude={'checked_at'}):
            raise ConsistencyError('SOURCE_UNAVAILABLE','Evidence identity conflicts with immutable stored facts')
        return saved
