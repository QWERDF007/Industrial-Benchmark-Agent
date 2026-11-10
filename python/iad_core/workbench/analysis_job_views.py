from iad_core.workbench.job_models import JobSnapshot, JobView
from iad_core.workbench.job_families import JobFamilies


class AnalysisJobViews:
    """Project attempts and per-subset results as one logical selected-scope job."""

    def __init__(self, db):
        self.families = JobFamilies(db)

    def status(self, run_id: str) -> dict:
        return self.families.snapshot(run_id, ('ANALYSIS_WORKFLOW',)).model_dump()

    def view(self, run_id: str) -> dict:
        return self.summary(self.families.snapshot(run_id, ('ANALYSIS_WORKFLOW',)))

    def list(self, dataset_id: str, analysis_kind: str) -> list:
        selected = []
        for job in self.families.list(dataset_id, ('ANALYSIS_WORKFLOW',)):
            if job.analysis_kind == analysis_kind:
                selected.append(self.summary(job))
        return selected

    def summary(self, job: dict | JobSnapshot) -> dict:
        job = JobSnapshot.model_validate(job)
        return JobView.from_snapshot(job).model_dump(mode='json')
