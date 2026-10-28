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
        if row['job_type'] in ('NORMAL_KNOWLEDGE', 'DEFECT_KNOWLEDGE'):
            from iad_core.knowledge.trace import observation_progress
            values['observation_progress'] = observation_progress(values)
        if row['job_type'] == 'DIRECTION_EXPLORATION':
            frozen = payload.get('request', {})
            values['exploration_prompt'] = frozen.get('exploration_request', {}).get('prompt')
            if not values['exploration_prompt'] and frozen.get('instruction'):
                values['exploration_prompt'] = {'text': frozen['instruction']}
        current = payload.get('current_sample_id')
        samples = self.samples(values['dataset_id'], [error['sample_id'] for error in payload['errors']] + ([current] if current else []),connection=connection)
        values['current_sample'] = samples[current] if current else None
        values['errors'] = [{**error, 'relative_path': samples[error['sample_id']].relative_path} for error in payload['errors']]
        return JobSnapshot.model_validate(values)

