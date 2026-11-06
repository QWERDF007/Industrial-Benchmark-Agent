import json
import hashlib

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.audit_models import AuditResultReference
from iad_core.consistency.repository import ConsistencyRepository
from iad_core.consistency.batch_repository import BatchRepository
from iad_core.consistency.group_analysis_models import GroupAnalysisDraft
from iad_core.consistency.group_models import FrozenAnalysisGroup
from iad_core.consistency.models import Mode
from iad_core.knowledge.models import KnowledgeCheckSummary
from iad_core.knowledge.display_evidence import KnowledgeDisplayEvidence
from iad_core.knowledge.repository import KnowledgeRepository
from iad_core.storage.database import Database
from iad_core.workbench.job_families import JobFamilies
from iad_core.workbench.analysis_job_views import AnalysisJobViews
from iad_core.knowledge.instructions import FrozenMiningPrompt


class AuditKnowledgeSource(AnalysisModel):
    job_id: str
    dataset_id: str
    version_id: str
    name: str
    submitted_at: str
    started_at: str | None
    finished_at: str | None
    entries: list[KnowledgeCheckSummary]


class AuditConsistencySource(AnalysisModel):
    job_id: str
    dataset_ids: list[str]
    submitted_at: str
    started_at: str | None
    finished_at: str | None
    conflict_count: int
    batch_id: str


class AuditSourceCatalog(AnalysisModel):
    knowledge_jobs: list[AuditKnowledgeSource]
    consistency_jobs: list[AuditConsistencySource]


class FrozenAuditComparison(AuditResultReference):
    compared_sample_id: str


class FrozenAuditGroup(AnalysisModel):
    run_id: str
    sample_ids: list[str]
    result_sha256: str


class FrozenAuditSources(AnalysisModel):
    knowledge_job_id: str
    knowledge_version_id: str
    knowledge_entry_ids: list[str] = Field(min_length=1)
    consistency_job_ids: list[str] = Field(min_length=1)
    consistency_sample_ids: list[str]
    consistency_mode: Mode
    consistency_groups: list[FrozenAuditGroup]
    consistency_references: list[FrozenAuditComparison]


class AuditSources:
    """Select published domain records; keep their immutable identities in the audit."""

    JOB_TYPES = ('ANALYSIS_WORKFLOW', 'KNOWLEDGE', 'KNOWLEDGE_BATCH')

    def __init__(self, db: Database):
        self.db = db

    def catalog(self, dataset_ids: list[str]) -> AuditSourceCatalog:
        families = JobFamilies(self.db)
        jobs = {job.run_id: job for dataset_id in sorted(set(dataset_ids))
            for job in families.list(dataset_id, self.JOB_TYPES)}
        knowledge, consistency = [], []
        repository = KnowledgeRepository(self.db)
        for job in sorted(jobs.values(), key=lambda job: job.submitted_at, reverse=True):
            if job.status != 'COMPLETED' or job.deleted_at:
                continue
            metadata = dict(job_id=job.run_id, submitted_at=job.submitted_at,
                started_at=job.started_at, finished_at=job.finished_at)
            if job.analysis_kind == 'consistency' and job.program_batch_id:
                count = BatchRepository(self.db).conflict_group_count(job.program_batch_id)
                consistency.append(AuditConsistencySource(**metadata, dataset_ids=job.dataset_ids,
                    batch_id=job.program_batch_id, conflict_count=count))
            elif job.analysis_kind == 'knowledge' or job.job_type in ('KNOWLEDGE', 'KNOWLEDGE_BATCH'):
                versions = {item.knowledge_version_id for item in job.dataset_results if item.knowledge_version_id}
                if job.knowledge_version_id:
                    versions.add(job.knowledge_version_id)
                for version_id in sorted(versions):
                    version = repository.get(version_id)
                    if version.dataset_id not in dataset_ids or version.kind is not None or not version.checks:
                        continue
                    prompt = job.mining_prompt
                    if job.job_type == 'ANALYSIS_WORKFLOW':
                        projected = AnalysisJobViews(self.db).summary(job, version.dataset_id)
                        prompt = FrozenMiningPrompt.model_validate(projected['mining_prompt']) if projected['mining_prompt'] else None
                    name = prompt.configuration.objective.split('\n')[0] if prompt else f'知识挖掘 {job.run_id[-6:]}'
                    display = KnowledgeDisplayEvidence(version.evidence)
                    knowledge.append(AuditKnowledgeSource(**metadata, dataset_id=version.dataset_id,
                        version_id=version_id, name=name, entries=[display.summary(check) for check in version.checks]))
        return AuditSourceCatalog(knowledge_jobs=knowledge, consistency_jobs=consistency)

    def freeze(self, dataset_id: str, knowledge_job_id: str, knowledge_version_id: str,
               knowledge_entry_ids: list[str], consistency_job_ids: list[str], *, dataset_ids: list[str] | None = None) -> FrozenAuditSources:
        catalog = self.catalog(dataset_ids or [dataset_id])
        knowledge = next((item for item in catalog.knowledge_jobs
            if item.job_id == knowledge_job_id and item.version_id == knowledge_version_id and item.dataset_id == dataset_id), None)
        if knowledge is None:
            raise ValueError('请选择当前子数据集已完成并发布知识的挖掘作业')
        if not knowledge_entry_ids or len(set(knowledge_entry_ids)) != len(knowledge_entry_ids) or not set(
                knowledge_entry_ids) <= {check.check_id for check in knowledge.entries}:
            raise ValueError('知识条目必须来自所选作业发布的版本，且不能重复或为空')
        selected = {item.job_id: item for item in catalog.consistency_jobs}
        if not consistency_job_ids or len(set(consistency_job_ids)) != len(consistency_job_ids) or not set(consistency_job_ids) <= selected.keys():
            raise ValueError('请选择当前子数据集已完成的一致性作业，且不能重复或为空')
        batches = [selected[identity].batch_id for identity in consistency_job_ids]
        families = JobFamilies(self.db)
        jobs = [families.snapshot(identity, ('ANALYSIS_WORKFLOW',)) for identity in consistency_job_ids]
        sample_ids = sorted({sample_id for job in jobs for sample_id in job.sample_ids})
        modes = {BatchRepository(self.db).get(batch)[0].request.mode for batch in batches}
        fingerprints = {unit['fingerprint'] for job in jobs for unit in job.model_extra.get('gallery_plan', [])}
        groups = []
        with self.db.connection() as conn:
            if fingerprints:
                analyses = conn.execute('''WITH RECURSIVE owned(job_id) AS (
                    SELECT job_id FROM job_runs WHERE job_type='ANALYSIS_WORKFLOW'
                    AND json_extract(payload_json,'$.root_run_id') IN (SELECT value FROM json_each(?))
                    UNION SELECT e.child_id FROM job_ownership_edges e JOIN owned o ON o.job_id=e.parent_id)
                    SELECT j.job_id,json_extract(j.payload_json,'$.group_analysis') result,
                        json_extract(j.payload_json,'$.request.frozen_group') frozen_group,
                        json_extract(j.payload_json,'$.request.group_fingerprint') fingerprint
                    FROM job_runs j JOIN owned o ON o.job_id=j.job_id
                    WHERE j.job_type='CONSISTENCY_ANALYSIS' AND j.status='COMPLETED'
                        AND json_extract(j.payload_json,'$.request.group_fingerprint') IN (SELECT value FROM json_each(?))
                    ORDER BY j.id DESC''', (json.dumps([job.root_run_id for job in jobs]), json.dumps(sorted(fingerprints)))).fetchall()
                seen = set()
                for row in analyses:
                    if row['fingerprint'] in seen:
                        continue
                    seen.add(row['fingerprint'])
                    group = FrozenAnalysisGroup.model_validate_json(row['frozen_group'])
                    groups.append(FrozenAuditGroup(run_id=row['job_id'],
                        sample_ids=sorted({group.anchor.sample_id, *[member.image.sample_id for member in group.members]}),
                        result_sha256=hashlib.sha256(row['result'].encode()).hexdigest()))
            rows = conn.execute('''SELECT DISTINCT r.evidence_id FROM consistency_results r
                JOIN consistency_batch_results b ON b.evidence_id=r.evidence_id
                WHERE b.batch_id IN (SELECT value FROM json_each(?)) ORDER BY r.evidence_id''',
                (json.dumps(batches),)).fetchall()
        references = []
        for row in rows:
            saved = ConsistencyRepository(self.db).get(row['evidence_id'])
            references.append(FrozenAuditComparison(sample_id=saved.parameters.sample_a, compared_sample_id=saved.parameters.sample_b,
                result_id=saved.result.result_id, evidence_id=saved.result.evidence_id))
        return FrozenAuditSources(knowledge_job_id=knowledge_job_id, knowledge_version_id=knowledge_version_id,
            knowledge_entry_ids=knowledge_entry_ids, consistency_job_ids=consistency_job_ids,
            consistency_sample_ids=sample_ids, consistency_references=references,
            consistency_mode=next(iter(modes)) if len(modes)==1 else 'combined', consistency_groups=groups)

    def analyses(self, sources: FrozenAuditSources, sample_id: str) -> list[dict]:
        results = []
        with self.db.connection() as conn:
            for reference in sources.consistency_groups:
                if sample_id not in reference.sample_ids:
                    continue
                row = conn.execute("SELECT json_extract(payload_json,'$.group_analysis') FROM job_runs WHERE job_id=? AND status='COMPLETED'",
                    (reference.run_id,)).fetchone()
                if row is None or row[0] is None or hashlib.sha256(row[0].encode()).hexdigest() != reference.result_sha256:
                    raise ValueError('冻结的一致性模型分析缺失或已变化')
                result = GroupAnalysisDraft.model_validate_json(row[0])
                results.append(dict(source_run_id=reference.run_id, verdict=result.overall.verdict,
                    summary=result.overall.text, analyses=[item.text for item in result.conclusions], limitations=result.limitations))
        return results
