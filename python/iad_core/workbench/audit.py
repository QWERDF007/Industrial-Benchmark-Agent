import hashlib
import json
import uuid
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from iad_core.advisory.repository import AuditSuggestionRepository
from iad_core.advisory.analysis import AuditAnalysis
from iad_core.advisory.schemas import AuditSuggestion, ConclusionStatus, EvidenceRefItem, HypothesisItem, ObservationItem, RecommendedAction
from iad_core.dataset.registry import DatasetRegistry
from iad_core.evidence.images import EvidenceImages
from iad_core.evidence.sources import SampleContent
from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository
from iad_core.workbench.query import SampleQuery, WorkbenchQuery

from iad_core.workbench.vision import DEFAULT_MODEL, VlmClient
from iad_core.workbench.inspection import SampleInspection
from iad_core.workbench.jobs import JobContext, JobRunner
from iad_core.workbench.knowledge import InspectionKnowledge

AUDIT_GENERATION_VERSION = 'dataset-audit-v1'

class AuditStart(BaseModel):
    model_config = ConfigDict(extra="forbid")
    dataset_id: str
    origin_session_id: Optional[str] = None
    model_name: str = DEFAULT_MODEL
    normal_version_id: Optional[str] = None
    defect_version_id: Optional[str] = None
    sample_ids: Optional[List[str]] = None
    filters: dict = Field(default_factory=dict)


class AuditService:
    def __init__(self, db: Database, client: Optional[VlmClient] = None, jobs: Optional[JobRunner] = None):
        self.db = db
        self.registry = DatasetRegistry(db)
        self.client = client or VlmClient()
        self.inspection = SampleInspection(db, self.client)
        self.owns_jobs = jobs is None
        self.jobs = jobs or JobRunner(db, ("MODEL_AUDIT",))

    @property
    def generation_signature(self) -> str:
        return hashlib.sha256(json.dumps([AUDIT_GENERATION_VERSION, AuditAnalysis.model_json_schema()], sort_keys=True).encode()).hexdigest()

    def audit_sample(self, sample_id: str, model_name: str, knowledge: InspectionKnowledge, context: JobContext):
        samples = SampleRepository(self.db)
        sample = samples.get(sample_id)
        if not sample:
            raise LookupError("Sample not found")
        expected = next(source for source in context.payload['input_sources'] if source['sample_id'] == sample_id)
        if SampleContent.capture(self.db, sample_id).model_dump() != expected:
            raise ValueError('源图像或标注内容已变化，请重新启动审计')
        def phase(progress):
            context.update(**progress.model_dump(), current_sample_id=sample_id)
        analysis = self.inspection.inspect(sample_id, model_name, knowledge, context.cancel, phase)
        if SampleContent.capture(self.db, sample_id).model_dump() != expected:
            raise ValueError('源图像或标注内容已变化，请重新启动审计')
        refs = analysis.reference_sample_ids
        result = analysis.conclusion
        suggestion = AuditSuggestion(
            suggestion_id="sug_" + uuid.uuid4().hex, task_id=sample.task_id, sample_id=sample_id,
            session_id=context.payload.get('origin_session_id'),
            model_route=model_name, analysis=analysis, confidence=result.confidence, reference_sample_ids=refs, audit_run_id=context.run_id,
            observations=[ObservationItem(phenomenon=result.reason_category, description=(result.defect_location + " " + result.description).strip())],
            hypotheses=[HypothesisItem(label=result.suggested_label)],
            conclusion_status=ConclusionStatus.INSUFFICIENT_EVIDENCE if result.suggested_label == "UNCERTAIN" else ConclusionStatus.EVIDENCE_SUPPORTED,
            recommended_action=RecommendedAction.IGNORE_CANDIDATE if result.suggested_label == "PASS" else RecommendedAction.REVIEW,
            evidence_refs=[EvidenceRefItem(kind="normal_reference", sample_id=sid) for sid in refs],
            input_modalities_used=["image", "text"],
        )
        context.record(sample_id, persist=lambda conn: AuditSuggestionRepository(self.db).save(suggestion, conn),
            phase="SAMPLE_COMPLETED", inspected_regions=analysis.coverage.inspected_regions,
            planned_regions=analysis.coverage.planned_regions,
            completed_batches=len(analysis.joint_steps), total_batches=len(analysis.joint_steps))

    def start(self, **arguments) -> dict:
        request = AuditStart.model_validate(arguments)
        config = self.registry.resolve(dataset_id=request.dataset_id)
        knowledge = InspectionKnowledge.resolve(self.db, request.dataset_id, request.normal_version_id, request.defect_version_id)
        if request.sample_ids is None:
            filters = {**request.filters, "dataset_id": request.dataset_id, "page": 1, "page_size": 200}
            query = SampleQuery.model_validate(filters)
            sample_ids = []
            while True:
                page = WorkbenchQuery(self.db).samples(query)
                sample_ids.extend(item["sample_id"] for item in page["items"])
                if query.page * query.page_size >= page["total"]:
                    break
                query.page += 1
        else:
            sample_ids = list(dict.fromkeys(request.sample_ids))
            for sid in sample_ids:
                sample = SampleRepository(self.db).get(sid)
                if not sample or sample.dataset_id != request.dataset_id:
                    raise ValueError("Audit samples must belong to the selected dataset")
        if not sample_ids:
            raise ValueError("No samples match the audit filters")
        payload = {"dataset_id": request.dataset_id, "model_name": request.model_name, "sample_ids": sample_ids,
                   "origin_session_id": request.origin_session_id,
                   "generation_signature": self.generation_signature,
                   "input_sources": [SampleContent.capture(self.db, sid).model_dump() for sid in sample_ids],
                   "normal_version_id": knowledge.normal.version_id,
                   "defect_version_id": knowledge.defect.version_id if knowledge.defect else None}
        return self.jobs.start("MODEL_AUDIT", config.task.task_id, payload, self.run, "准备冻结知识审计")

    def run(self, context: JobContext):
        payload = context.payload
        if payload['generation_signature'] != self.generation_signature:
            raise ValueError('模型审计规则已变化，请重新启动审计')
        from iad_core.knowledge.repository import KnowledgeRepository
        repository = KnowledgeRepository(self.db)
        knowledge = InspectionKnowledge(repository.get(payload['normal_version_id']),
            repository.get(payload['defect_version_id']) if payload['defect_version_id'] else None)
        for sample_id in payload["sample_ids"]:
            context.checkpoint()
            try:
                self.audit_sample(sample_id, payload["model_name"], knowledge, context)
            except InterruptedError:
                raise
            except Exception as error:
                context.record(sample_id, error)

    def status(self, run_id: str) -> dict:
        return self.jobs.status(run_id, ("MODEL_AUDIT",))

    def retry(self, run_id: str, sample_ids: Optional[List[str]] = None) -> dict:
        def validate(request):
            try:
                current = [SampleContent.capture(self.db, sid).model_dump() for sid in request['sample_ids']]
                if current != request['input_sources'] or request['generation_signature'] != self.generation_signature:
                    raise ValueError('源图像或标注内容已变化')
                from iad_core.knowledge.repository import KnowledgeRepository
                repository = KnowledgeRepository(self.db)
                knowledge = InspectionKnowledge(repository.get(request['normal_version_id']),
                    repository.get(request['defect_version_id']) if request['defect_version_id'] else None)
                for snapshot in [knowledge.normal, *([knowledge.defect] if knowledge.defect else [])]:
                    for evidence in snapshot.evidence:
                        EvidenceImages(self.db.db_path).path(evidence.image)
            except (ValueError, LookupError, OSError) as error:
                raise ValueError(f'冻结输入不可恢复，请重新启动审计：{error}') from error
        return self.jobs.retry(run_id, ("MODEL_AUDIT",), self.run, sample_ids, validate)

    def list(self, dataset_id: str) -> list:
        return self.jobs.list(dataset_id, ("MODEL_AUDIT",))

    def cancel(self, run_id: str) -> dict:
        return self.jobs.cancel(run_id, ("MODEL_AUDIT",))

    def wait(self, run_id: str, timeout: float):
        self.jobs.wait(run_id, timeout)

    def close(self):
        if self.owns_jobs:
            self.jobs.close()
            self.client.close()
