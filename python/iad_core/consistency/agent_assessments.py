from sqlite3 import Connection

from iad_core.consistency.agent_review_models import AnchorAssessmentRecord, AnchorAssessmentSubmission


class AnchorAssessments:
    @staticmethod
    def list(connection: Connection, run_id: str, anchor_id: str) -> list[AnchorAssessmentRecord]:
        rows = connection.execute('''SELECT id,submission_json FROM consistency_candidate_assessments
            WHERE job_id=? AND anchor_id=? AND id IN (
                SELECT MAX(id) FROM consistency_candidate_assessments WHERE job_id=? AND anchor_id=? GROUP BY candidate_id)
            ORDER BY id''', (run_id, anchor_id, run_id, anchor_id)).fetchall()
        return [AnchorAssessmentRecord(assessment_id=row['id'],
            submission=AnchorAssessmentSubmission.model_validate_json(row['submission_json'])) for row in rows]

    @staticmethod
    def append(connection: Connection, run_id: str, anchor_id: str, submission: AnchorAssessmentSubmission) -> AnchorAssessmentRecord:
        row = connection.execute('''INSERT INTO consistency_candidate_assessments(job_id,anchor_id,candidate_id,submission_json)
            VALUES(?,?,?,?) RETURNING id''', (run_id, anchor_id, submission.assessment.candidate_id, submission.model_dump_json())).fetchone()
        return AnchorAssessmentRecord(assessment_id=row['id'], submission=submission)
