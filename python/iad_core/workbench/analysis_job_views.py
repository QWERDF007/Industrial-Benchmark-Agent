from iad_core.workbench.job_models import JobSnapshot, JobView, JobSummary
from iad_core.workbench.job_families import JobFamilies


class AnalysisJobViews:
    """Project attempts and per-subset results as one logical selected-scope job."""

    def __init__(self, db):
        self.families = JobFamilies(db)

    def status(self, run_id: str) -> dict:
        return self.families.snapshot(run_id, ('ANALYSIS_WORKFLOW',)).model_dump()

    def view(self, run_id: str, *, summary=False) -> dict:
        return self.summary(self.families.snapshot(run_id, ('ANALYSIS_WORKFLOW',),
            include_calls=not summary, include_request=not summary), compact=summary)

    def list(self, dataset_id: str | list[str], analysis_kind: str, *, summary=False) -> list:
        selected = []
        roots = dict.fromkeys(root for identity in ([dataset_id] if isinstance(dataset_id, str) else dataset_id)
            for root in self.families.snapshots.identities(identity, ('ANALYSIS_WORKFLOW',)).values())
        for root in roots:
            job = self.families.snapshot(root, ('ANALYSIS_WORKFLOW',), include_calls=not summary, include_request=not summary)
            if job.analysis_kind == analysis_kind:
                selected.append(self.summary(job, compact=summary))
        return selected

    def summary(self, job: dict | JobView, *, compact=False) -> dict:
        if isinstance(job, dict):
            job = JobSnapshot.model_validate(job)
        model = JobSummary if compact else JobView
        return model.model_validate({name:getattr(job,name) for name in model.model_fields}).model_dump(mode='json')
