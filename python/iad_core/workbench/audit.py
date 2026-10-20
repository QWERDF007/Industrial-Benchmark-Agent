import threading
import uuid
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from iad_core.advisory.repository import AuditSuggestionRepository
from iad_core.advisory.schemas import AuditSuggestion, ConclusionStatus, EvidenceRefItem, HypothesisItem, ObservationItem, RecommendedAction
from iad_core.dataset.registry import DatasetRegistry
from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository
from iad_core.workbench.projection import suggestion_meta
from iad_core.workbench.query import SampleQuery, WorkbenchQuery

from iad_core.workbench.vision import DEFAULT_MODEL, VlmClient
from iad_core.workbench.inspection import SampleInspection
from iad_core.workbench.jobs import JobContext, JobRunner

class AuditStart(BaseModel):
    model_config = ConfigDict(extra="forbid")
    dataset_id: str
    model_name: str = DEFAULT_MODEL
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

    def audit_sample(self, sample_id: str, model_name: str = DEFAULT_MODEL, run_id: Optional[str] = None,
                     references: Optional[List[str]] = None, cancel: Optional[threading.Event] = None) -> dict:
        samples = SampleRepository(self.db)
        sample = samples.get(sample_id)
        if not sample:
            raise LookupError("Sample not found")
        refs = self.registry.references(sample.dataset_id, exclude=sample_id, limit=8 if references is not None else 4, selected_ids=references)
        def phase(progress):
            if run_id:
                self.jobs.update(run_id, **progress.model_dump(), current_sample_id=sample_id)
        analysis = self.inspection.inspect(sample_id, model_name, refs, cancel, phase)
        result = analysis.conclusion
        suggestion = AuditSuggestion(
            suggestion_id="sug_" + uuid.uuid4().hex, task_id=sample.task_id, sample_id=sample_id,
            model_route=model_name, analysis=analysis, confidence=result.confidence, reference_sample_ids=refs, audit_run_id=run_id,
            observations=[ObservationItem(phenomenon=result.reason_category, description=(result.defect_location + " " + result.description).strip())],
            hypotheses=[HypothesisItem(label=result.suggested_label)],
            conclusion_status=ConclusionStatus.INSUFFICIENT_EVIDENCE if result.suggested_label == "UNCERTAIN" else ConclusionStatus.EVIDENCE_SUPPORTED,
            recommended_action=RecommendedAction.IGNORE_CANDIDATE if result.suggested_label == "PASS" else RecommendedAction.REVIEW,
            evidence_refs=[EvidenceRefItem(kind="normal_reference", sample_id=sid) for sid in refs],
            input_modalities_used=["image", "text"],
        )
        with self.jobs.lock:
            if cancel and cancel.is_set():
                return {"cancelled": True}
            AuditSuggestionRepository(self.db).save(suggestion)
        meta = suggestion_meta(suggestion)
        return {"sample_id": sample_id, "suggestion": meta, **WorkbenchQuery(self.db).sample_scores(sample_id)}

    def start(self, **arguments) -> dict:
        request = AuditStart.model_validate(arguments)
        config = self.registry.resolve(dataset_id=request.dataset_id)
        references = self.registry.references(request.dataset_id)
        if not references:
            raise ValueError("No normal references available; choose normal reference images first")
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
                   "reference_sample_ids": references}
        return self.jobs.start("MODEL_AUDIT", config.task.task_id, payload, self.run, "正在学习良品模式")

    def run(self, context: JobContext):
        payload = context.payload
        for sample_id in payload["sample_ids"]:
            context.checkpoint()
            try:
                result = self.audit_sample(sample_id, payload["model_name"], context.run_id,
                                           payload["reference_sample_ids"], context.cancel)
                context.checkpoint()
                analysis = result["suggestion"]["analysis"]
                context.record(sample_id, profile_id=analysis["profile_id"], phase="SAMPLE_COMPLETED",
                               inspected_regions=analysis["coverage"]["inspected_regions"],
                               planned_regions=analysis["coverage"]["planned_regions"],
                               completed_batches=len(analysis["joint_steps"]), total_batches=len(analysis["joint_steps"]))
            except InterruptedError:
                raise
            except Exception as error:
                context.record(sample_id, error)

    def status(self, run_id: str) -> dict:
        return self.jobs.status(run_id, ("MODEL_AUDIT",))

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
