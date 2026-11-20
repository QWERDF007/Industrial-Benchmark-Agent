import json
import threading
from contextlib import nullcontext
from sqlite3 import Connection
from typing import Optional,Sequence,get_args

from iad_core.storage.database import Database
from iad_core.workbench.calls import ModelCalls
from iad_core.workbench.job_models import JobKind,JobSample,JobSnapshot,JobView
from iad_core.workbench.job_requests import JobRequests


class JobSnapshots:
    def __init__(self,db: Database):
        self.db=db
        self.lock=threading.RLock()
        self.job_types=get_args(JobKind)

    def queue_size(self, dataset_id: str, job_type: JobKind) -> int:
        with self.db.connection() as connection:
            return connection.execute("""SELECT COUNT(*) FROM job_run_requests WHERE job_type=? AND status='PENDING'
                AND json_extract(request_json,'$.dataset_id')=?""", (job_type,dataset_id)).fetchone()[0]

    def identities(self, dataset_id: str, job_types: Sequence[JobKind]) -> dict[str, str]:
        """Map visible attempt IDs to root IDs without loading frozen snapshots."""
        with self.lock:
            placeholders = ",".join("?" for _ in job_types)
            with self.db.connection() as conn:
                rows = conn.execute(f"""WITH owned AS MATERIALIZED (
                    SELECT DISTINCT child_id job_id FROM job_ownership_edges), visible AS (
                    SELECT id,job_id,job_type,status,json_extract(payload_json,'$.root_run_id') root_run_id
                    FROM job_runs j WHERE job_id NOT IN (SELECT job_id FROM owned) AND deleted_at IS NULL
                    AND job_type IN ({placeholders}) AND EXISTS(
                        SELECT 1 FROM job_dataset_scopes s WHERE s.source_id=j.job_id AND s.dataset_id=?))
                    SELECT job_id,root_run_id FROM visible WHERE id IN (
                    SELECT id FROM visible ORDER BY id DESC LIMIT 30)
                    OR (job_type='DIRECTION_EXPLORATION' AND status='RUNNING') ORDER BY id DESC""",
                    (*job_types, dataset_id)).fetchall()
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

    def snapshot(self, run_id: str, job_types: Optional[Sequence[JobKind]] = None, connection: Optional[Connection] = None, *,
                 include_calls: bool = True, include_request: bool = True) -> JobSnapshot | JobView:
        with self.lock, (nullcontext(connection) if connection is not None else self.db.connection()) as conn:
            row = conn.execute("SELECT * FROM job_runs WHERE job_id=?", (run_id,)).fetchone()
            request = None
            if row:
                if include_request:
                    request = JobRequests.read(conn, run_id)
                else:
                    fields = [*JobView.model_fields, 'instruction', 'consistency_check', 'submission', 'analysis_workflow_version']
                    request = {field['key']: json.loads(field['value']) if field['type'] in ('array','object') else field['value']
                        for field in conn.execute('''SELECT key,type,CASE key
                            WHEN 'consistency_check' THEN json_remove(value,'$.scopes.subjects.samples','$.scopes.corpus.samples')
                            WHEN 'submission' THEN json_object('instruction',json_extract(value,'$.instruction'))
                            ELSE value END value FROM job_requests,json_each(request_json)
                            WHERE job_id=? AND key IN (SELECT value FROM json_each(?))''', (run_id,json.dumps(fields)))}
            position = None
            if row and row['job_type'] == 'DIRECTION_EXPLORATION' and row['status'] == 'PENDING':
                position = conn.execute("""SELECT COUNT(*) FROM job_run_requests WHERE job_type=? AND status='PENDING'
                    AND id<=? AND json_extract(request_json,'$.dataset_id')=?""",
                    (row['job_type'], row['id'], request['dataset_id'])).fetchone()[0]
        if not row or row["job_type"] not in (job_types or self.job_types):
            raise LookupError("Job not found")
        payload = json.loads(row["payload_json"])
        values = {**request, **payload, 'request': request, "run_id": run_id, "task_id": row["task_id"], "job_type": row["job_type"],
                "status": row["status"], "message": row["message"], "started_at": row["started_at"],
                "submitted_at": payload.get('submitted_at', row['created_at']), "queue_position": position,
                "finished_at": row["finished_at"], "progress": row["progress"], "deleted_at": row['deleted_at'],
                "cancel_requested": payload.get("cancel_requested", False),
                "unprocessed": payload["total_samples"] - payload["completed"] - payload["failed"],
                "model_calls": [call.model_dump() for call in ModelCalls(self.db).list(run_id,connection=connection)] if include_calls else []}
        if row['job_type'] in ('DIRECTION_EXPLORATION', 'EXPLORATION_BATCH'):
            frozen = request
            values['exploration_prompt'] = frozen.get('exploration_request', {}).get('prompt')
            if not values['exploration_prompt'] and frozen.get('instruction'):
                values['exploration_prompt'] = {'text': frozen['instruction']}
        if row['job_type'] == 'ANALYSIS_WORKFLOW' and values.get('analysis_kind') == 'consistency':
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
                retrieval = check.get('retrieval') or {}
                values.update(image_max_side=check.get('whole_image_max_side'),
                    retrieval_mode=retrieval.get('mode'), similarity_threshold=retrieval.get('min_similarity'))
        if row['job_type'] == 'MODEL_AUDIT':
            values['audit_scope'] = payload.get('audit_scope')
            values['image_max_side'] = payload.get('image_max_side')
            if values['audit_scope'] is None or 'image_max_side' not in payload:
                with nullcontext(connection) if connection is not None else self.db.connection() as frozen_connection:
                    frozen_row = frozen_connection.execute('SELECT snapshot_json FROM audit_workflow_runs WHERE job_id=?', (run_id,)).fetchone()
                if frozen_row is not None:
                    frozen = json.loads(frozen_row['snapshot_json'])
                    settings = frozen.get('settings') or {}
                    values['audit_scope'] = values['audit_scope'] or settings.get('audit_scope')
                    if 'image_max_side' not in payload:
                        values['image_max_side'] = settings.get('whole_image_max_side')
        if request.get('analysis_workflow_version'):
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
        return (JobSnapshot.model_validate(values) if include_request else
            JobView.model_validate({name:values[name] for name in JobView.model_fields if name in values}))

