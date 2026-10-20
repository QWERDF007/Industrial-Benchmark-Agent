import json
import threading
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from iad_core.advisory.repository import AuditSuggestionRepository
from iad_core.advisory.schemas import AuditSuggestion, ConclusionStatus, EvidenceRefItem, HypothesisItem, ObservationItem, RecommendedAction
from iad_core.dataset.registry import DatasetRegistry
from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository
from iad_core.workbench.projection import suggestion_meta
from iad_core.workbench.query import SampleQuery, WorkbenchQuery

from iad_core.workbench.vision import VlmClient
from iad_core.workbench.inspection import SampleInspection

DEFAULT_MODEL = "Qwen/Qwen3.8-27B-FP8"


class AuditStart(BaseModel):
    model_config = ConfigDict(extra="forbid")
    dataset_id: str
    model_name: str = DEFAULT_MODEL
    sample_ids: Optional[List[str]] = None
    limit: int = Field(50, ge=1, le=10000)
    max_regions: int = Field(12, ge=1, le=32)
    filters: dict = Field(default_factory=dict)


class AuditService:
    def __init__(self, db: Database, client: Optional[VlmClient] = None):
        self.db = db
        self.registry = DatasetRegistry(db)
        self.client = client or VlmClient()
        self.inspection = SampleInspection(db, self.client)
        self.lock = threading.RLock()
        self.threads = {}
        self.cancelled = {}
        with db.connection() as conn:
            conn.execute("UPDATE job_runs SET status='INTERRUPTED',message='Worker stopped before completion',finished_at=? WHERE job_type='MODEL_AUDIT' AND status IN ('PENDING','RUNNING')",
                         (datetime.now(timezone.utc).isoformat(),))

    def audit_sample(self, sample_id: str, model_name: str = DEFAULT_MODEL, run_id: Optional[str] = None,
                     references: Optional[List[str]] = None, cancel: Optional[threading.Event] = None, max_regions: int = 12) -> dict:
        samples = SampleRepository(self.db)
        sample = samples.get(sample_id)
        if not sample:
            raise LookupError("Sample not found")
        refs = self.registry.references(sample.dataset_id, exclude=sample_id, limit=8 if references is not None else 4, selected_ids=references)
        def phase(progress):
            if run_id:
                with self.lock, self.db.connection() as conn:
                    conn.execute("UPDATE job_runs SET message=?,payload_json=json_patch(payload_json,?) WHERE job_id=? AND status='RUNNING'",
                                 (progress.phase, json.dumps({**progress.model_dump(), "current_sample_id": sample_id}), run_id))
        analysis = self.inspection.inspect(sample_id, model_name, refs, cancel, phase, max_regions)
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
        with self.lock:
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
            while len(sample_ids) < request.limit:
                page = WorkbenchQuery(self.db).samples(query)
                sample_ids.extend(item["sample_id"] for item in page["items"])
                if query.page * query.page_size >= page["total"]:
                    break
                query.page += 1
            sample_ids = sample_ids[:request.limit]
        else:
            sample_ids = list(dict.fromkeys(request.sample_ids))
            if len(sample_ids) > 10000:
                raise ValueError("Too many samples")
            for sid in sample_ids:
                sample = SampleRepository(self.db).get(sid)
                if not sample or sample.dataset_id != request.dataset_id:
                    raise ValueError("Audit samples must belong to the selected dataset")
        if not sample_ids:
            raise ValueError("No samples match the audit filters")
        run_id = "audit_" + uuid.uuid4().hex
        payload = {"dataset_id": request.dataset_id, "model_name": request.model_name, "sample_ids": sample_ids,
                   "reference_sample_ids": references, "max_regions": request.max_regions, "completed": 0, "failed": 0, "errors": [], "total_samples": len(sample_ids)}
        with self.lock, self.db.connection() as conn:
            if conn.execute("SELECT 1 FROM job_runs WHERE job_type='MODEL_AUDIT' AND status IN ('PENDING','RUNNING') AND json_extract(payload_json,'$.dataset_id')=?", (request.dataset_id,)).fetchone():
                raise ValueError("This dataset already has an active audit")
            conn.execute("INSERT INTO job_runs(job_id,task_id,job_type,status,progress,message,payload_json,started_at) VALUES(?,?,'MODEL_AUDIT','RUNNING',0,?,?,?)",
                         (run_id, config.task.task_id, "正在学习良品模式", json.dumps(payload), datetime.now(timezone.utc).isoformat()))
            event = self.cancelled[run_id] = threading.Event()
            thread = self.threads[run_id] = threading.Thread(target=self.run, args=(run_id, payload, event), daemon=True)
        thread.start()
        return self.status(run_id)

    def run(self, run_id: str, payload: dict, cancel: threading.Event):
        for sample_id in payload["sample_ids"]:
            if cancel.is_set():
                break
            try:
                result = self.audit_sample(sample_id, payload["model_name"], run_id, payload["reference_sample_ids"], cancel, payload["max_regions"])
                if cancel.is_set():
                    break
                payload["completed"] += 1
                payload["profile_id"] = result["suggestion"]["analysis"]["profile_id"]
                payload["phase"] = "SAMPLE_COMPLETED"
                payload["inspected_regions"] = result["suggestion"]["analysis"]["coverage"]["inspected_regions"]
                payload["planned_regions"] = result["suggestion"]["analysis"]["coverage"]["planned_regions"]
            except Exception as error:
                if cancel.is_set():
                    break
                payload["failed"] += 1
                payload["errors"].append({"sample_id": sample_id, "message": str(error)})
            with self.lock, self.db.connection() as conn:
                conn.execute("UPDATE job_runs SET payload_json=?,progress=?,message=? WHERE job_id=? AND status='RUNNING'",
                             (json.dumps(payload), (payload["completed"] + payload["failed"]) / payload["total_samples"],
                              f"完成 {payload['completed']}，失败 {payload['failed']} / {payload['total_samples']}", run_id))
        with self.lock, self.db.connection() as conn:
            status = "CANCELLED" if cancel.is_set() else "FAILED" if payload["failed"] == payload["total_samples"] else "PARTIAL" if payload["failed"] else "COMPLETED"
            conn.execute("UPDATE job_runs SET status=?,payload_json=?,finished_at=? WHERE job_id=?",
                         (status, json.dumps(payload), datetime.now(timezone.utc).isoformat(), run_id))
        with self.lock:
            self.threads.pop(run_id, None)
            self.cancelled.pop(run_id, None)

    def status(self, run_id: str) -> dict:
        with self.db.connection() as conn:
            row = conn.execute("SELECT * FROM job_runs WHERE job_id=? AND job_type='MODEL_AUDIT'", (run_id,)).fetchone()
        if not row:
            raise LookupError("Audit job not found")
        payload = json.loads(row["payload_json"])
        return {**payload, "run_id": run_id, "task_id": row["task_id"], "status": row["status"],
                "message": row["message"], "started_at": row["started_at"], "finished_at": row["finished_at"],
                "progress": (payload["completed"] + payload["failed"]) / payload["total_samples"]}

    def list(self, dataset_id: str) -> list:
        with self.db.connection() as conn:
            ids = [r[0] for r in conn.execute("SELECT job_id FROM job_runs WHERE job_type='MODEL_AUDIT' AND json_extract(payload_json,'$.dataset_id')=? ORDER BY id DESC LIMIT 30", (dataset_id,))]
        return [self.status(run_id) for run_id in ids]

    def cancel(self, run_id: str) -> dict:
        with self.lock:
            status = self.status(run_id)
            if status["status"] in ("RUNNING", "PENDING"):
                self.cancelled[run_id].set()
                with self.db.connection() as conn:
                    conn.execute("UPDATE job_runs SET status='CANCELLED',message='已取消，当前请求返回后停止',finished_at=? WHERE job_id=?", (datetime.now(timezone.utc).isoformat(), run_id))
        return self.status(run_id)

    def wait(self, run_id: str, timeout: float):
        with self.lock:
            thread = self.threads.get(run_id)
        if thread:
            thread.join(timeout)

    def close(self):
        with self.lock:
            threads = list(self.threads.values())
            for event in self.cancelled.values():
                event.set()
        for thread in threads:
            thread.join(timeout=1)
        self.client.close()
