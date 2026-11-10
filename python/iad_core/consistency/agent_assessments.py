from sqlite3 import Connection
from uuid import uuid4

from iad_core.consistency.agent_review_models import AnchorAssessmentRecord, AnchorAssessmentSubmission
from iad_core.consistency.candidate_records import CandidateRecords


class AnchorAssessments:
    @staticmethod
    def list(connection: Connection, run_id: str, anchor_id: str) -> list[AnchorAssessmentRecord]:
        if CandidateRecords.enabled(connection, run_id):
            return CandidateRecords.audits(connection, run_id, anchor_id)
        rows = connection.execute('''SELECT id,submission_json FROM consistency_candidate_assessments
            WHERE job_id=? AND anchor_id=? AND id IN (
                SELECT MAX(id) FROM consistency_candidate_assessments WHERE job_id=? AND anchor_id=? GROUP BY candidate_id)
            ORDER BY id''', (run_id, anchor_id, run_id, anchor_id)).fetchall()
        return [AnchorAssessmentRecord(assessment_id=row['id'],
            submission=AnchorAssessmentSubmission.model_validate_json(row['submission_json'])) for row in rows]

    @staticmethod
    def append(connection: Connection, run_id: str, anchor_id: str, submission: AnchorAssessmentSubmission, *, request_id: str | None = None) -> AnchorAssessmentRecord:
        if CandidateRecords.enabled(connection, run_id):
            candidate_id = submission.assessment.candidate_id
            gate = next(gate for gate in CandidateRecords.gates(connection, run_id, anchor_id) if gate.candidate_id == candidate_id)
            submission = submission.model_copy(update={'gate_revision': submission.gate_revision or gate.revision})
            row = CandidateRecords.append(connection, run_id, anchor_id, candidate_id, 'audit', submission.gate_revision,
                request_id or 'audit-' + uuid4().hex, submission)
            return AnchorAssessmentRecord(assessment_id=row['id'], submission=AnchorAssessmentSubmission.model_validate_json(row['record_json']))
        raise ValueError('历史一致性作业只读保留')
