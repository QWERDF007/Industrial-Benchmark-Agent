import json
from datetime import datetime, timezone
from uuid import NAMESPACE_URL, uuid5

from iad_core.analysis.models import AnalysisCatalog, AnalysisPublication, AnalysisWorkflowSnapshot
from iad_core.analysis.coverage import AnalysisCoverageReader


class AnalysisPublications:
    """Publish a terminal job's accepted state without making a model request."""

    def __init__(self, db):
        self.db = db

    def get(self, version_id: str) -> AnalysisPublication:
        with self.db.connection() as connection:
            row = connection.execute('SELECT publication_json FROM analysis_publications WHERE version_id=?', (version_id,)).fetchone()
        if row is None:
            raise LookupError('分析发布版本不存在')
        return AnalysisPublication.model_validate_json(row[0])

    def recover(self):
        with self.db.connection() as connection:
            rows = connection.execute('''SELECT r.job_id FROM analysis_workflow_runs r JOIN job_runs j ON j.job_id=r.job_id
                WHERE j.status NOT IN ('PENDING','RUNNING')
                AND EXISTS(SELECT 1 FROM analysis_sample_observations o WHERE o.job_id=r.job_id)
                AND NOT EXISTS(SELECT 1 FROM analysis_publications p WHERE p.job_id=r.job_id AND p.revision=r.revision AND p.execution_status=j.status)''').fetchall()
        for row in rows:
            self.publish(row['job_id'])

    def publish(self, run_id: str) -> AnalysisPublication | None:
        with self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            row = connection.execute('''SELECT r.snapshot_json,r.session_id,r.revision,r.catalog_json,j.status,j.payload_json
                FROM analysis_workflow_runs r JOIN job_runs j ON j.job_id=r.job_id WHERE r.job_id=?''', (run_id,)).fetchone()
            if row is None:
                raise LookupError('原生分析作业不存在')
            if row['status'] in ('PENDING', 'RUNNING'):
                raise ValueError('作业尚未结束，目录仍为运行中版本')
            observations = connection.execute('SELECT sample_id,observation_json FROM analysis_sample_observations WHERE job_id=?', (run_id,)).fetchall()
            if not observations:
                return None
            version_id = 'analysis_version_' + uuid5(NAMESPACE_URL, json.dumps([run_id, row['revision'], row['status']])).hex
            if previous := connection.execute('SELECT publication_json FROM analysis_publications WHERE version_id=?', (version_id,)).fetchone():
                return AnalysisPublication.model_validate_json(previous[0])
            snapshot = AnalysisWorkflowSnapshot.model_validate_json(row['snapshot_json'])
            payload = json.loads(row['payload_json'])
            publication = AnalysisPublication(version_id=version_id, job_id=run_id, module=snapshot.module, session_id=row['session_id'],
                revision=row['revision'], execution_status=row['status'], execution_error=payload.get('execution_error'),
                created_at=datetime.now(timezone.utc).isoformat(), catalog=AnalysisCatalog.model_validate_json(row['catalog_json']),
                coverage=AnalysisCoverageReader(self.db).read(run_id,connection),
                model_call_ids=[item[0] for item in connection.execute('SELECT call_id FROM model_calls WHERE run_id=? ORDER BY rowid',(run_id,))])
            connection.execute('INSERT INTO analysis_publications(version_id,job_id,revision,execution_status,publication_json) VALUES(?,?,?,?,?)',
                (version_id, run_id, row['revision'], row['status'], publication.model_dump_json()))
            payload['analysis_version_id'] = version_id
            connection.execute('UPDATE job_runs SET payload_json=? WHERE job_id=?', (json.dumps(payload, ensure_ascii=False), run_id))
            return publication
