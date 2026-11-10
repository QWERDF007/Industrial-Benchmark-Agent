from sqlite3 import Connection
from urllib.parse import quote

from iad_core.consistency.agent_result_models import AnchorEvidenceReference
from iad_core.consistency.evidence_models import ConsistencyResult


class AnchorEvidenceRecords:
    @staticmethod
    def list(connection: Connection, run_id: str, anchor_id: str) -> list[AnchorEvidenceReference]:
        rows = connection.execute('''SELECT captured.candidate_id,captured.evidence_id,result.result_id
            FROM consistency_anchor_evidence captured JOIN consistency_results result USING(evidence_id)
            WHERE captured.job_id=? AND captured.anchor_id=? ORDER BY captured.rowid''', (run_id, anchor_id))
        return [AnchorEvidenceReference(**dict(row),
            detail_ref='/api/iad/consistency/evidence/' + quote(row['evidence_id'], safe='')) for row in rows]

    @staticmethod
    def capture(connection: Connection, run_id: str, anchor_id: str, candidate_id: str, result: ConsistencyResult) -> None:
        connection.execute('''INSERT INTO consistency_anchor_evidence(job_id,anchor_id,candidate_id,evidence_id)
            VALUES(?,?,?,?) ON CONFLICT(job_id,anchor_id,candidate_id,evidence_id) DO NOTHING''',
            (run_id, anchor_id, candidate_id, result.evidence_id))
