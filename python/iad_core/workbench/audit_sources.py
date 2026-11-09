from typing import Literal

from iad_core.advisory.analysis import AnalysisModel
from iad_core.analysis.queries import AnalysisQueries
from iad_core.consistency.agent_results import ConsistencyAgentResults
from iad_core.knowledge.models import KnowledgeCheckSummary
from iad_core.storage.database import Database
from iad_core.workbench.job_families import JobFamilies


class AuditKnowledgeSource(AnalysisModel):
    job_id: str
    dataset_id: str
    version_id: str
    name: str
    submitted_at: str
    started_at: str | None
    finished_at: str | None
    entries: list[KnowledgeCheckSummary]
    publication_status: Literal['complete','partial'] = 'complete'


class AuditConsistencySource(AnalysisModel):
    job_id: str
    dataset_ids: list[str]
    submitted_at: str
    started_at: str | None
    finished_at: str | None
    conflict_count: int
    batch_id: str | None = None


class AuditSourceCatalog(AnalysisModel):
    knowledge_jobs: list[AuditKnowledgeSource]
    consistency_jobs: list[AuditConsistencySource]


class AuditSources:
    """Select published domain records; keep their immutable identities in the audit."""

    JOB_TYPES = ('ANALYSIS_WORKFLOW',)

    def __init__(self, db: Database):
        self.db = db

    def catalog(self, dataset_ids: list[str]) -> AuditSourceCatalog:
        families = JobFamilies(self.db)
        jobs = {job.run_id: job for dataset_id in sorted(set(dataset_ids))
            for job in families.list(dataset_id, self.JOB_TYPES)}
        knowledge, consistency = [], []
        queries = AnalysisQueries(self.db)
        native_versions = {version.version_id:version for dataset_id in dataset_ids for version in queries.versions(dataset_id,'knowledge')}
        for job in sorted(jobs.values(), key=lambda job: job.submitted_at, reverse=True):
            if job.deleted_at:
                continue
            metadata = dict(job_id=job.run_id, submitted_at=job.submitted_at,
                started_at=job.started_at, finished_at=job.finished_at)
            request = job.model_extra.get('request', {})
            if job.analysis_kind == 'knowledge':
                versions = {identity:version for identity,version in native_versions.items() if version.source_run_id == job.run_id}
                for version_id, version in versions.items():
                    view = queries.view(version_id)
                    if not view.catalog.checks:
                        continue
                    name = job.mining_prompt.configuration.objective.split('\n')[0]
                    knowledge.append(AuditKnowledgeSource(**metadata,dataset_id=version.dataset_id,version_id=version_id,
                        name=name,entries=queries.check_summaries(view),
                        publication_status='complete' if view.coverage.completed == view.coverage.total else 'partial'))
            elif job.status != 'COMPLETED':
                continue
            elif job.analysis_kind == 'consistency' and request.get('consistency_check') and set(dataset_ids) <= set(job.dataset_ids):
                count = ConsistencyAgentResults(self.db).report(job.run_id).original_conflicts
                consistency.append(AuditConsistencySource(**metadata,dataset_ids=job.dataset_ids,conflict_count=count))
        return AuditSourceCatalog(knowledge_jobs=knowledge, consistency_jobs=consistency)
