import json

from iad_core.consistency.models import ModelAssessmentState
from iad_core.storage.database import Database


class GroupAnalysisStates:
    """Project the latest joint model conclusion for each frozen group."""

    def __init__(self, db: Database):
        self.db = db

    def read(self, fingerprints: set[str]) -> dict[str, ModelAssessmentState]:
        with self.db.connection() as connection:
            rows = connection.execute('''WITH attempts AS (
                SELECT json_extract(payload_json,'$.request.group_fingerprint') fingerprint,status,
                    json_extract(payload_json,'$.group_analysis.overall.verdict') verdict,
                    ROW_NUMBER() OVER (PARTITION BY json_extract(payload_json,'$.request.group_fingerprint') ORDER BY id DESC) rank
                FROM job_runs WHERE job_type='CONSISTENCY_ANALYSIS' AND deleted_at IS NULL
                    AND json_extract(payload_json,'$.request.group_fingerprint') IN (SELECT value FROM json_each(?)))
                SELECT fingerprint,status,verdict FROM attempts WHERE rank=1''',
                (json.dumps(sorted(fingerprints)),)).fetchall()
        return {row['fingerprint']:row['verdict'] if row['status']=='COMPLETED' else
            'RUNNING' if row['status'] in ('RUNNING','PENDING') else 'FAILED' for row in rows}
