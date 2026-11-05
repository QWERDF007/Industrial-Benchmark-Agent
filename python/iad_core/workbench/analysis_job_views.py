from iad_core.workbench.job_models import JobSnapshot
from iad_core.workbench.job_families import JobFamilies


class AnalysisJobViews:
    """Project attempts and per-subset results as one logical selected-scope job."""

    def __init__(self, db):
        self.families = JobFamilies(db)

    def status(self, run_id: str) -> dict:
        return self.families.snapshot(run_id, ('ANALYSIS_WORKFLOW',)).model_dump()

    def list(self, dataset_id: str, analysis_kind: str) -> list:
        selected = []
        for job in self.families.list(dataset_id, ('ANALYSIS_WORKFLOW',)):
            if job.analysis_kind == analysis_kind:
                selected.append(self.summary(job.model_dump(), dataset_id))
        return selected

    def summary(self, job: dict, dataset_id: str | None = None) -> dict:
        dataset_id = dataset_id or job['dataset_id']
        unit = next(unit for unit in job['request']['units'] if unit['dataset_id'] == dataset_id)
        result = next((result for result in job['dataset_results'] if result['dataset_id'] == dataset_id), {})
        values = dict(job, **{key:result.get(key) for key in ('knowledge_version_id','exploration_version_id')},
            mining_prompt=unit['request'].get('mining_prompt'),
            exploration_prompt=unit['request'].get('exploration_request', {}).get('prompt'))
        return {key:value for key,value in values.items() if key in JobSnapshot.model_fields}
