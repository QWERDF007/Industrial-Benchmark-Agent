from contextlib import nullcontext
from sqlite3 import Connection
from typing import Sequence

from iad_core.storage.database import Database
from iad_core.workbench.job_models import JobKind, JobSnapshot
from iad_core.workbench.job_snapshots import JobSnapshots


class JobFamilies:
    """Read retries as one frozen-scope job while retaining actual attempt provenance."""

    def __init__(self, db: Database):
        self.db, self.snapshots = db, JobSnapshots(db)

    def snapshot(self, run_id: str, job_types: Sequence[JobKind], *, connection: Connection | None = None) -> JobSnapshot:
        with nullcontext(connection) if connection is not None else self.db.connection() as conn:
            if connection is None:
                conn.execute('BEGIN')
            current = self.snapshots.snapshot(run_id, job_types, connection=conn).model_dump(exclude_computed_fields=True)
            root = current if current['root_run_id']==run_id else self.snapshots.snapshot(
                current['root_run_id'], job_types, connection=conn).model_dump(exclude_computed_fields=True)
            ids = [row[0] for row in conn.execute('''SELECT job_id FROM job_runs
                WHERE job_type=? AND json_extract(payload_json,'$.root_run_id')=? ORDER BY id''',
                (current['job_type'], root['run_id']))]
            known = {current['run_id']:current, root['run_id']:root}
            attempts = [known[identity] if identity in known else self.snapshots.snapshot(
                identity, job_types, connection=conn).model_dump(exclude_computed_fields=True) for identity in ids]
        latest = attempts[-1]
        completed = {sid for attempt in attempts for sid in attempt['completed_sample_ids']}
        failed = set()
        for attempt in attempts:
            failed.difference_update(attempt['sample_ids'])
            failed.update(attempt['failed_sample_ids'])
        failed.difference_update(completed)
        errors = {error['sample_id']:error for attempt in attempts for error in attempt['errors'] if error['sample_id'] in failed}
        results = {}
        for attempt in attempts:
            for result in attempt['dataset_results']:
                results.setdefault(result['dataset_id'], {}).update({key:value for key,value in result.items() if value is not None})
        total = root['total_samples']
        status = latest['status']
        if status not in ('PENDING', 'RUNNING', 'CANCELLED', 'INTERRUPTED'):
            status = 'COMPLETED' if len(completed)==total else 'PARTIAL' if completed else 'FAILED'
        return JobSnapshot.model_validate(dict(latest, request=root['request'], sample_ids=root['sample_ids'], total_samples=total,
            completed=len(completed), completed_sample_ids=sorted(completed), failed=len(failed),
            failed_sample_ids=sorted(failed), errors=list(errors.values()), unprocessed=total-len(completed)-len(failed),
            progress=len(completed)/total, dataset_results=list(results.values()),
            submitted_at=root['submitted_at'], started_at=root['started_at'], status=status,
            batch_runs=list(dict.fromkeys(rid for attempt in attempts for rid in attempt['batch_runs'])),
            model_calls=[call for attempt in attempts for call in attempt['model_calls']]))

    def list(self, dataset_id: str, job_types: Sequence[JobKind]) -> list[JobSnapshot]:
        roots = dict.fromkeys(self.snapshots.identities(dataset_id, job_types).values())
        return [self.snapshot(root, job_types) for root in roots]
