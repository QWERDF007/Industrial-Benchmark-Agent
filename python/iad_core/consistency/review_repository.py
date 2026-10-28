import hashlib
from sqlite3 import Connection
from contextlib import nullcontext

from iad_core.consistency.review_models import ConsistencyDecision, ConsistencyReviewSubmission, CorrectionCheck, CorrectionVerification
from iad_core.storage.database import Database


class ConsistencyDecisionRepository:
    def __init__(self, db: Database):
        self.db = db

    def request(self, request: ConsistencyReviewSubmission, connection: Connection) -> ConsistencyDecision | None:
        row = connection.execute('SELECT record_json,request_sha256 FROM consistency_decisions WHERE client_request_id=?',
            (str(request.client_request_id),)).fetchone()
        if row is None:
            return None
        if row['request_sha256'] != hashlib.sha256(request.model_dump_json().encode()).hexdigest():
            raise ValueError('client_request_id 已用于不同处置内容')
        return ConsistencyDecision.model_validate_json(row['record_json'])

    def save(self, record: ConsistencyDecision, connection: Connection) -> None:
        connection.execute('''INSERT INTO consistency_decisions(decision_id,client_request_id,evidence_id,request_sha256,record_json)
            VALUES(?,?,?,?,?)''', (record.decision_id, str(record.request.client_request_id), record.request.evidence_id,
            hashlib.sha256(record.request.model_dump_json().encode()).hexdigest(), record.model_dump_json()))

    def history(self, evidence_id: str, connection: Connection | None = None, *, watermark: int | None = None) -> list[ConsistencyDecision]:
        with nullcontext(connection) if connection is not None else self.db.connection() as connection:
            return [ConsistencyDecision.model_validate_json(row[0]) for row in connection.execute(
                'SELECT record_json FROM consistency_decisions WHERE evidence_id=?' + (' AND id<=?' if watermark is not None else '') + ' ORDER BY id',
                (evidence_id, watermark) if watermark is not None else (evidence_id,))]

    def get(self, decision_id: str, connection: Connection) -> ConsistencyDecision:
        row = connection.execute('SELECT record_json FROM consistency_decisions WHERE decision_id=?', (decision_id,)).fetchone()
        if row is None:
            raise LookupError('Consistency decision does not exist')
        return ConsistencyDecision.model_validate_json(row[0])

    def corrections(self, evidence_id: str, connection: Connection | None = None, *, watermark: int | None = None) -> list[CorrectionCheck]:
        with nullcontext(connection) if connection is not None else self.db.connection() as connection:
            return [CorrectionCheck.model_validate_json(row[0]) for row in connection.execute('''SELECT c.record_json
                FROM consistency_correction_checks c JOIN consistency_decisions d ON d.decision_id=c.decision_id
                WHERE d.evidence_id=?''' + (' AND c.id<=?' if watermark is not None else '') + ' ORDER BY c.id',
                (evidence_id, watermark) if watermark is not None else (evidence_id,))]

    def verification(self, request: CorrectionVerification, connection: Connection) -> CorrectionCheck | None:
        row = connection.execute('SELECT record_json,request_sha256 FROM consistency_correction_checks WHERE client_request_id=?',
            (str(request.client_request_id),)).fetchone()
        if row is None:
            return None
        if row['request_sha256'] != hashlib.sha256(request.model_dump_json().encode()).hexdigest():
            raise ValueError('client_request_id 已用于不同验证内容')
        return CorrectionCheck.model_validate_json(row['record_json'])

    def save_verification(self, record: CorrectionCheck, connection: Connection) -> None:
        request = record.request
        connection.execute('''INSERT INTO consistency_correction_checks(check_id,client_request_id,decision_id,
            evidence_id,request_sha256,record_json) VALUES(?,?,?,?,?,?)''', (record.check_id, str(request.client_request_id),
            request.decision_id, request.evidence_id, hashlib.sha256(request.model_dump_json().encode()).hexdigest(), record.model_dump_json()))
