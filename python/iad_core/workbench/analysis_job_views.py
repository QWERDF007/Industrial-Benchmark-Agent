from iad_core.workbench.job_models import JobSnapshot
from iad_core.workbench.job_snapshots import JobSnapshots


class AnalysisJobViews:
    """Project attempts and per-subset results as one logical selected-scope job."""

    def __init__(self, db):
        self.db, self.snapshots = db, JobSnapshots(db)

    def status(self, run_id: str) -> dict:
        current = self.snapshots.snapshot(run_id, ('ANALYSIS_WORKFLOW',)).model_dump()
        root = self.snapshots.snapshot(current['root_run_id'], ('ANALYSIS_WORKFLOW',)).model_dump()
        with self.db.connection() as connection:
            ids = [row[0] for row in connection.execute("""SELECT job_id FROM job_runs
                WHERE job_type='ANALYSIS_WORKFLOW' AND json_extract(payload_json,'$.root_run_id')=? ORDER BY id""", (root['run_id'],))]
        attempts = [self.snapshots.snapshot(identity, ('ANALYSIS_WORKFLOW',)).model_dump() for identity in ids]
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
        return dict(latest, request=root['request'], sample_ids=root['sample_ids'], total_samples=total,
            completed=len(completed), completed_sample_ids=sorted(completed), failed=len(failed),
            failed_sample_ids=sorted(failed), errors=list(errors.values()), unprocessed=total-len(completed)-len(failed),
            progress=len(completed)/total, dataset_results=list(results.values()),
            submitted_at=root['submitted_at'], started_at=root['started_at'],
            status='PARTIAL' if latest['status']=='FAILED' and completed else latest['status'],
            batch_runs=list(dict.fromkeys(rid for attempt in attempts for rid in attempt['batch_runs'])))

    def list(self, dataset_id: str, analysis_kind: str) -> list:
        roots = dict.fromkeys(job['root_run_id'] for job in self.snapshots.list(dataset_id, ('ANALYSIS_WORKFLOW',))
            if job['analysis_kind'] == analysis_kind)
        selected = []
        for root in roots:
            job = self.status(root)
            selected.append(self.summary(job, dataset_id))
        return selected

    def summary(self, job: dict, dataset_id: str | None = None) -> dict:
        dataset_id = dataset_id or job['dataset_id']
        unit = next(unit for unit in job['request']['units'] if unit['dataset_id'] == dataset_id)
        result = next((result for result in job['dataset_results'] if result['dataset_id'] == dataset_id), {})
        values = dict(job, **{key:result.get(key) for key in ('knowledge_version_id','exploration_version_id')},
            mining_prompt=unit['request'].get('mining_prompt'),
            exploration_prompt=unit['request'].get('exploration_request', {}).get('prompt'))
        return {key:value for key,value in values.items() if key in JobSnapshot.model_fields}
