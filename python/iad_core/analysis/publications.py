import json
from contextlib import nullcontext
from datetime import datetime, timezone
from uuid import NAMESPACE_URL, uuid5
from sqlite3 import Connection

from iad_core.analysis.models import AnalysisCatalog, AnalysisPublication, AnalysisWorkflowSnapshot
from iad_core.analysis.coverage import AnalysisCoverageReader
from iad_core.analysis.finalization_state import AnalysisFinalizationState


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
                AND (json_array_length(j.payload_json,'$.completed_sample_ids')>0
                    OR EXISTS(SELECT 1 FROM analysis_sample_observations o WHERE o.job_id=r.job_id
                        AND json_array_length(o.observation_json,'$.evidence_ids')>0))
                AND NOT EXISTS(SELECT 1 FROM analysis_publications p WHERE p.job_id=r.job_id AND p.revision=r.revision AND p.execution_status=j.status)''').fetchall()
        for row in rows:
            self.publish(row['job_id'])

    def publish(self, run_id: str, *, connection: Connection | None = None) -> AnalysisPublication | None:
        with nullcontext(connection) if connection is not None else self.db.connection() as conn:
            if connection is None:
                conn.execute('BEGIN IMMEDIATE')
            connection = conn
            row = connection.execute('''SELECT r.snapshot_json,r.session_id,r.revision,r.catalog_json,j.status,j.payload_json
                FROM analysis_workflow_runs r JOIN job_runs j ON j.job_id=r.job_id WHERE r.job_id=?''', (run_id,)).fetchone()
            if row is None:
                raise LookupError('原生分析作业不存在')
            snapshot = AnalysisWorkflowSnapshot.model_validate_json(row['snapshot_json'])
            catalog = AnalysisCatalog.model_validate_json(row['catalog_json'])
            finalization = AnalysisFinalizationState.progress(connection,run_id,catalog.entry_ids) if snapshot.schema_version == 2 else None
            payload = json.loads(row['payload_json'])
            execution_status = row['status']
            if execution_status in ('PENDING', 'RUNNING'):
                if finalization is None or not finalization.complete:
                    raise ValueError('作业尚未结束，目录仍为运行中版本')
                from iad_core.workbench.jobs import JobRunner
                execution_status = JobRunner.terminal_status(payload)
            version_id = 'analysis_version_' + uuid5(NAMESPACE_URL, json.dumps([run_id, row['revision'], execution_status])).hex
            if previous := connection.execute('SELECT publication_json FROM analysis_publications WHERE version_id=?', (version_id,)).fetchone():
                return AnalysisPublication.model_validate_json(previous[0])
            coverage = AnalysisCoverageReader(self.db).read(run_id,connection)
            if not coverage.observed_visuals:
                return None
            if finalization is not None and finalization.complete:
                finalization.version_id = version_id
            parent = connection.execute('SELECT publication_json FROM analysis_publications WHERE job_id=? ORDER BY rowid DESC LIMIT 1',
                (run_id,)).fetchone()
            parent = AnalysisPublication.model_validate_json(parent[0]) if parent is not None else None
            inherited_reviews = {}
            if parent is not None and snapshot.module == 'knowledge':
                from iad_core.knowledge.check_reviews import KnowledgeCheckReviews
                inherited_reviews = KnowledgeCheckReviews(self.db).inherit(parent,row['revision'],
                    {check.check_id for check in catalog.checks},connection=connection)
            publication = AnalysisPublication(version_id=version_id, job_id=run_id, module=snapshot.module, session_id=row['session_id'],
                revision=row['revision'], execution_status=execution_status, execution_error=payload.get('execution_error'),
                created_at=datetime.now(timezone.utc).isoformat(), catalog=catalog, finalization=finalization,
                coverage=coverage, parent_version_id=parent.version_id if parent else None, inherited_reviews=inherited_reviews,
                model_call_ids=[item[0] for item in connection.execute('SELECT call_id FROM model_calls WHERE run_id=? ORDER BY rowid',(run_id,))])
            if snapshot.execution_mode == 'dsh-subagents':
                from iad_core.exploration.observation_models import ExplorationBatchArchive
                publication.delegations = [ExplorationBatchArchive(round_id=task['round_id'], wave_id=task['wave_id'],
                    session_id=task['session_id'], catalog_revision=task['catalog_revision'],
                    report=json.loads(task['report_json']) if task['report_json'] else None,
                    review_revision=json.loads(task['review_json'])['revision'] if task['review_json'] else None,
                    discovery_decisions=json.loads(task['review_json'])['decisions'] if task['review_json'] else [])
                    for task in connection.execute('SELECT * FROM exploration_batch_tasks WHERE job_id=? ORDER BY round_id', (run_id,))]
            connection.execute('INSERT INTO analysis_publications(version_id,job_id,revision,execution_status,publication_json) VALUES(?,?,?,?,?)',
                (version_id, run_id, row['revision'], execution_status, publication.model_dump_json()))
            payload['analysis_version_id'] = version_id
            connection.execute('UPDATE job_runs SET payload_json=? WHERE job_id=?', (json.dumps(payload, ensure_ascii=False), run_id))
            return publication
