from iad_core.audit.delegation_models import AuditObservationNote
from iad_core.audit.evidence import AuditEvidence
from iad_core.audit.reports import AuditReports


class AuditObservationNotes:
    def __init__(self, db):
        self.db = db

    def read(self, run_id: str, session_id: str) -> list[AuditObservationNote]:
        with self.db.connection() as connection:
            return [AuditObservationNote.model_validate_json(row[0]) for row in connection.execute(
                'SELECT note_json FROM audit_observation_notes WHERE job_id=? AND session_id=? ORDER BY ordinal', (run_id, session_id))]

    def save(self, run_id: str, session_id: str, request: dict) -> dict:
        note = AuditObservationNote.model_validate(request)
        reports = AuditReports(self.db)
        samples = reports.state.samples(run_id)
        sample = next((sample for sample in samples if sample.session_id == session_id), None)
        if sample:
            observed = AuditEvidence(reports.state).observed(run_id, sample.sample_id)
        elif reports.session(run_id).session_id == session_id:
            observed = reports.observed(run_id)
        else:
            raise ValueError('观察记录不属于本场审计会话')
        if set(note.evidence_ids) - observed:
            raise ValueError('只能保存已实际观察图像的事实')
        with self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            status = connection.execute('SELECT status FROM job_runs WHERE job_id=?', (run_id,)).fetchone()
            if status is None or status[0] != 'RUNNING':
                raise ValueError('审计已停止，不能保存观察')
            ordinal = connection.execute('SELECT COALESCE(MAX(ordinal),0)+1 FROM audit_observation_notes WHERE job_id=? AND session_id=?', (run_id, session_id)).fetchone()[0]
            connection.execute('INSERT INTO audit_observation_notes VALUES(?,?,?,?)', (run_id, session_id, ordinal, note.model_dump_json()))
        return {'saved':True, 'ordinal':ordinal}
