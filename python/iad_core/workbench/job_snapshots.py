import json
import threading
from contextlib import nullcontext
from sqlite3 import Connection
from typing import Optional,Sequence,get_args

from iad_core.storage.database import Database
from iad_core.workbench.calls import ModelCalls
from iad_core.workbench.job_models import JobKind,JobSample,JobSnapshot


class JobSnapshots:
    def __init__(self,db: Database):
        self.db=db
        self.lock=threading.RLock()
        self.job_types=get_args(JobKind)

    def queue_size(self, dataset_id: str, job_type: JobKind) -> int:
        with self.db.connection() as connection:
            return connection.execute("""SELECT COUNT(*) FROM job_runs WHERE job_type=? AND status='PENDING'
                AND json_extract(payload_json,'$.request.dataset_id')=?""", (job_type,dataset_id)).fetchone()[0]

    def identities(self, dataset_id: str, job_types: Sequence[JobKind]) -> dict[str, str]:
        """Map visible attempt IDs to root IDs without loading frozen snapshots."""
        with self.lock:
            placeholders = ",".join("?" for _ in job_types)
            with self.db.connection() as conn:
                rows = conn.execute(f"""WITH owned AS MATERIALIZED (
                    SELECT child.value AS job_id FROM job_runs owner,json_each(owner.payload_json,'$.batch_runs') child
                    WHERE child.type='text'), visible AS (
                    SELECT id,job_id,job_type,status,deleted_at,
                        json_extract(payload_json,'$.root_run_id') root_run_id,
                        COALESCE(json_extract(payload_json,'$.request.dataset_id'),json_extract(payload_json,'$.dataset_id')) dataset_id,
                        json_extract(payload_json,'$.request.dataset_ids') dataset_ids
                    FROM job_runs WHERE job_id NOT IN (SELECT job_id FROM owned))
                    SELECT job_id,root_run_id FROM visible WHERE id IN (
                    SELECT id FROM visible WHERE job_type IN ({placeholders}) AND deleted_at IS NULL
                    AND (dataset_id=? OR EXISTS (SELECT 1 FROM json_each(dataset_ids) WHERE value=?))
                    ORDER BY id DESC LIMIT 30) OR (job_type='DIRECTION_EXPLORATION' AND job_type IN ({placeholders})
                    AND status='RUNNING' AND dataset_id=?) ORDER BY id DESC""",
                    (*job_types, dataset_id, dataset_id, *job_types, dataset_id)).fetchall()
            return {row['job_id']: row['root_run_id'] for row in rows}

    def list(self, dataset_id: str, job_types: Sequence[JobKind]) -> list:
        with self.lock:
            jobs = [self.snapshot(run_id, job_types).model_dump() for run_id in self.identities(dataset_id, job_types)]
            if 'DIRECTION_EXPLORATION' in job_types:
                jobs.sort(key=lambda job: (0 if job['status'] == 'RUNNING' else 1 if job['status'] == 'PENDING' else 2,
                                          job['queue_position'] or 0))
            return jobs

    def samples(self, dataset_id: str, sample_ids: Sequence[str], connection: Optional[Connection] = None) -> dict[str, JobSample]:
        with nullcontext(connection) if connection is not None else self.db.connection() as conn:
            rows = conn.execute("""SELECT sample_id,relative_path FROM samples WHERE dataset_id=?
                AND sample_id IN (SELECT value FROM json_each(?))""", (dataset_id, json.dumps(list(sample_ids)))).fetchall()
        paths = {row['sample_id']: row['relative_path'] for row in rows}
        return {sid: JobSample(sample_id=sid, relative_path=paths.get(sid)) for sid in sample_ids}

    def snapshot(self, run_id: str, job_types: Optional[Sequence[JobKind]] = None, connection: Optional[Connection] = None) -> JobSnapshot:
        with self.lock, (nullcontext(connection) if connection is not None else self.db.connection()) as conn:
            row = conn.execute("SELECT * FROM job_runs WHERE job_id=?", (run_id,)).fetchone()
            position = None
            if row and row['job_type'] == 'DIRECTION_EXPLORATION' and row['status'] == 'PENDING':
                position = conn.execute("""SELECT COUNT(*) FROM job_runs WHERE job_type=? AND status='PENDING'
                    AND id<=? AND json_extract(payload_json,'$.request.dataset_id')=json_extract(?,'$.request.dataset_id')""",
                    (row['job_type'], row['id'], row['payload_json'])).fetchone()[0]
        if not row or row["job_type"] not in (job_types or self.job_types):
            raise LookupError("Job not found")
        payload = json.loads(row["payload_json"])
        values = {**payload.get('request', {}), **payload, "run_id": run_id, "task_id": row["task_id"], "job_type": row["job_type"],
                "status": row["status"], "message": row["message"], "started_at": row["started_at"],
                "submitted_at": payload.get('submitted_at', row['created_at']), "queue_position": position,
                "finished_at": row["finished_at"], "progress": row["progress"], "deleted_at": row['deleted_at'],
                "cancel_requested": payload.get("cancel_requested", False),
                "unprocessed": payload["total_samples"] - payload["completed"] - payload["failed"],
                "model_calls": [call.model_dump() for call in ModelCalls(self.db).list(run_id,connection=connection)]}
        if row['job_type'] in ('DIRECTION_EXPLORATION', 'EXPLORATION_BATCH'):
            frozen = payload.get('request', {})
            values['exploration_prompt'] = frozen.get('exploration_request', {}).get('prompt')
            if not values['exploration_prompt'] and frozen.get('instruction'):
                values['exploration_prompt'] = {'text': frozen['instruction']}
        if row['job_type'] == 'ANALYSIS_WORKFLOW' and values.get('analysis_kind') == 'consistency':
            request = payload['request']
            values['consistency_prompt'] = (request['consistency_check']['instruction'] if 'consistency_check' in request
                else request.get('submission', {}).get('instruction'))
            if 'consistency_check' in request:
                check = request['consistency_check']
                values['system_prompt'] = check.get('system_prompt')
                if check.get('prompts'):
                    from iad_core.consistency.identity_prompts import IdentityPrompts
                    values['consistency_identity_prompts'] = {name: check['prompts'][name] for name in IdentityPrompts.model_fields}
                values['consistency_check_version'] = check['schema_version']
                from iad_core.consistency.task_types import TASK_TYPES_BY_FORMAT
                formats = set(check.get('dataset_formats', {}).values())
                values['consistency_task_type'] = check.get('task_type') or (
                    TASK_TYPES_BY_FORMAT[next(iter(formats))] if len(formats) == 1 else None)
                profile = check['roles']['vision']['profile']
                values['model_profile'] = profile
                model = profile if profile is not None else check['model']
                values['model_name'] = model['model_id'] if model else None
        if payload.get('request', {}).get('analysis_workflow_version'):
            from iad_core.analysis.models import AnalysisWorkflowSnapshot
            with nullcontext(connection) if connection is not None else self.db.connection() as conn:
                snapshot = AnalysisWorkflowSnapshot.model_validate_json(conn.execute(
                    'SELECT snapshot_json FROM analysis_workflow_runs WHERE job_id=?', (run_id,)).fetchone()[0])
            values.update(model_profile=snapshot.agent.profile.model_dump(), model_name=snapshot.agent.profile.model_id,
                system_prompt=snapshot.system_prompt,
                exploration_prompt=snapshot.exploration_prompt, mining_prompt=snapshot.mining_prompt,
                total_batches=len(snapshot.plan.rounds))
            if snapshot.module == 'knowledge':
                values['knowledge_version_id'] = payload.get('analysis_version_id')
        current = payload.get('current_sample_id')
        samples = self.samples(values['dataset_id'], [error['sample_id'] for error in payload['errors']] + ([current] if current else []),connection=connection)
        values['current_sample'] = samples[current] if current else None
        values['errors'] = [{**error, 'relative_path': samples[error['sample_id']].relative_path} for error in payload['errors']]
        return JobSnapshot.model_validate(values)

