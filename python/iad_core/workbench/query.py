import json
from datetime import datetime, timezone
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from iad_core.dataset.registry import DatasetRegistry
from iad_core.storage.database import Database
from iad_core.storage.models import sample_uuid
from iad_core.workbench.report import DatasetReport, QualityAssessment


class SampleQuery(BaseModel):
    model_config = ConfigDict(extra="forbid")
    dataset_id: Optional[str] = None
    task_id: Optional[str] = None
    page: int = Field(1, ge=1)
    page_size: int = Field(24, ge=1, le=200)
    annotation_filters: List[str] = Field(default_factory=list)
    model_status: Literal["all", "pending", "audited", "risk", "PASS", "FAIL", "UNCERTAIN"] = "all"
    review_status: Literal["all", "pending", "reviewed", "PASS", "HARD_NORMAL", "FAIL", "UNCERTAIN", "SKIP"] = "all"
    technical: Literal["all", "issues"] = "all"
    reference_status: Literal["all", "candidate", "excluded"] = "all"
    search: str = ""
    sort_by: Literal["default", "risk", "tech"] = "default"

    @model_validator(mode="after")
    def require_scope(self):
        if not self.dataset_id and not self.task_id:
            raise ValueError("dataset_id or task_id is required")
        if self.reference_status != "all" and not self.dataset_id:
            raise ValueError("Reference filters require dataset_id")
        if any(value not in ("none", "present") and not (value.startswith("category:") and value[9:]) for value in self.annotation_filters):
            raise ValueError("Invalid annotation filter")
        return self


BASE = """
WITH advice AS (
 SELECT *,ROW_NUMBER() OVER(PARTITION BY sample_id ORDER BY created_at DESC,id DESC) AS position
 FROM audit_suggestions
), decisions AS (
 SELECT *,ROW_NUMBER() OVER(PARTITION BY sample_id ORDER BY COALESCE(submitted_at,updated_at) DESC,id DESC) AS position
 FROM current_review_decisions
), base AS (
 SELECT s.*,a.suggestion_id,a.model_route,a.confidence,a.created_at AS audited_at,
 a.reference_sample_ids_json,a.audit_run_id,
 json_extract(a.hypotheses_json,'$[0].label') AS suggested_label,
 json_extract(a.observations_json,'$[0].phenomenon') AS reason_category,
 json_extract(a.observations_json,'$[0].description') AS notes,
 d.decision AS review_decision,d.reviewer,d.comment AS review_comment,d.submitted_at AS reviewed_at,
 (SELECT count(*) FROM annotations n WHERE n.sample_id=s.sample_id) AS annotation_count,
 (SELECT json_group_array(DISTINCT n.raw_label) FROM annotations n WHERE n.sample_id=s.sample_id) AS categories_json,
 CASE WHEN EXISTS(SELECT 1 FROM import_issues i WHERE i.sample_id=s.sample_id AND upper(i.severity) IN ('ERROR','CRITICAL')) THEN 35
      WHEN EXISTS(SELECT 1 FROM import_issues i WHERE i.sample_id=s.sample_id AND upper(i.severity)='WARNING') THEN 58
      WHEN EXISTS(SELECT 1 FROM import_issues i WHERE i.sample_id=s.sample_id) THEN 75
      WHEN s.width*s.height<=0 THEN 50 WHEN s.width*s.height<10000 THEN 45
      WHEN s.width*s.height<50000 THEN 65 ELSE 98 END AS technical_quality_score,
 CASE WHEN a.confidence IS NULL THEN NULL
      WHEN json_extract(a.hypotheses_json,'$[0].label')='FAIL' THEN round(a.confidence*100)
      WHEN json_extract(a.hypotheses_json,'$[0].label')='PASS' THEN round((1-a.confidence)*100)
      ELSE NULL END AS visual_suspicion_score
 FROM samples s LEFT JOIN advice a ON a.sample_id=s.sample_id AND a.position=1
 LEFT JOIN decisions d ON d.sample_id=s.sample_id AND d.position=1
)
"""


class WorkbenchQuery:
    def __init__(self, db: Database):
        self.db = db

    def sample_scores(self, sample_id: str) -> dict:
        with self.db.connection() as conn:
            row = conn.execute(BASE + "SELECT technical_quality_score,visual_suspicion_score FROM base WHERE sample_id=?", (sample_id,)).fetchone()
        if row is None:
            raise LookupError("Sample not found")
        return dict(row)

    def samples(self, query: SampleQuery) -> dict:
        clauses, params = [], []
        if query.dataset_id:
            clauses.append("dataset_id=?")
            params.append(query.dataset_id)
        if query.task_id:
            clauses.append("task_id=?")
            params.append(query.task_id)
        if query.annotation_filters:
            annotations = []
            if "none" in query.annotation_filters:
                annotations.append("annotation_count=0")
            if "present" in query.annotation_filters:
                annotations.append("annotation_count>0")
            categories = [value[9:] for value in query.annotation_filters if value.startswith("category:")]
            if categories:
                annotations.append("EXISTS(SELECT 1 FROM annotations n WHERE n.sample_id=base.sample_id AND (n.raw_label IN (SELECT value FROM json_each(?)) OR n.phenomenon IN (SELECT value FROM json_each(?))))")
                params.extend([json.dumps(categories)] * 2)
            clauses.append("(" + " OR ".join(annotations) + ")")
        model_status = query.model_status
        review_status = query.review_status
        if model_status == "pending":
            clauses.append("suggestion_id IS NULL")
        elif model_status == "audited":
            clauses.append("suggestion_id IS NOT NULL")
        elif model_status == "risk":
            clauses.append("(visual_suspicion_score>=60 OR suggested_label='FAIL')")
        elif model_status != "all":
            clauses.append("suggested_label=?")
            params.append(model_status)
        if review_status in ("pending", "reviewed"):
            clauses.append("review_decision IS NULL" if review_status == "pending" else "review_decision IS NOT NULL")
        elif review_status != "all":
            clauses.append("review_decision=?")
            params.append(review_status)
        if query.technical == "issues":
            clauses.append("technical_quality_score<70")
        if query.reference_status != "all":
            references = DatasetRegistry(self.db).references(query.dataset_id, limit=None)
            clauses.append("sample_id " + ("NOT IN" if query.reference_status == "excluded" else "IN") + " (SELECT value FROM json_each(?))")
            params.append(json.dumps(references))
        if query.search:
            clauses.append("instr(lower(relative_path),lower(?))>0")
            params.append(query.search)
        where = " AND ".join(clauses)
        order = {"default": "id", "risk": "visual_suspicion_score DESC,id", "tech": "technical_quality_score,id"}[query.sort_by]
        with self.db.connection() as conn:
            count = conn.execute(BASE + f"SELECT count(*) FROM base WHERE {where}", params).fetchone()[0]
            rows = conn.execute(BASE + f"SELECT * FROM base WHERE {where} ORDER BY {order} LIMIT ? OFFSET ?",
                                [*params, query.page_size, (query.page - 1) * query.page_size]).fetchall()
        items = []
        for row in rows:
            item = dict(row)
            item["sample_uuid"] = sample_uuid(item["sample_id"])
            item["annotation_categories"] = json.loads(item.pop("categories_json"))
            item["has_vlm_observation"] = bool(item["suggestion_id"])
            item["reviewed"] = item["review_decision"] is not None
            item["suggestion"] = None if not item["suggestion_id"] else {
                "suggestion_id": item["suggestion_id"], "suggested_label": item["suggested_label"] or "UNCERTAIN",
                "reason_category": item["reason_category"], "notes": item["notes"], "confidence": item["confidence"],
                "model_name": item["model_route"], "reference_sample_ids": json.loads(item["reference_sample_ids_json"]),
                "audit_run_id": item["audit_run_id"], "created_at": item["audited_at"],
            }
            items.append(item)
        return {"total": count, "page": query.page, "page_size": query.page_size, "items": items}

    def report(self, dataset_id: Optional[str] = None, task_id: Optional[str] = None) -> dict:
        if not dataset_id and not task_id:
            raise ValueError("dataset_id or task_id is required")
        clauses, params = [], []
        for column, value in (("dataset_id", dataset_id), ("task_id", task_id)):
            if value:
                clauses.append(column + "=?")
                params.append(value)
        where = " AND ".join(clauses)
        with self.db.connection() as conn:
            conn.execute("BEGIN")
            row = conn.execute(BASE + f"""
                SELECT count(*) AS total_samples,count(suggestion_id) AS vlm_audited_count,
                COALESCE(sum(suggested_label='FAIL'),0) AS vlm_anomalies_count,
                COALESCE(sum(technical_quality_score<70),0) AS technical_quality_issues,
                count(review_decision) AS human_reviewed_count,
                COALESCE(sum(review_decision IN ('PASS','HARD_NORMAL')),0) AS human_pass_count,
                COALESCE(sum(review_decision='FAIL'),0) AS human_fail_count,
                COALESCE(sum(review_decision='UNCERTAIN'),0) AS human_uncertain_count,
                COALESCE(sum(review_decision='SKIP'),0) AS human_skipped_count,
                COALESCE(sum(review_decision IS NULL AND suggested_label='FAIL'),0) AS pending_risk_count
                FROM base WHERE {where}
            """, params).fetchone()
            categories = {r[0]: r[1] for r in conn.execute(BASE + f"SELECT COALESCE(reason_category,'UNSPECIFIED'),count(*) FROM base WHERE {where} AND suggestion_id IS NOT NULL GROUP BY COALESCE(reason_category,'UNSPECIFIED')", params)}
            samples = conn.execute(BASE + f"""
                SELECT b.sample_id,b.width,b.height,b.suggestion_id,b.suggested_label,b.review_decision,
                    b.reviewed_at,b.audit_run_id,a.analysis_json
                FROM base b LEFT JOIN audit_suggestions a ON a.suggestion_id=b.suggestion_id
                WHERE {" AND ".join("b." + clause for clause in clauses)}
            """, params).fetchall()
            issues = conn.execute(f"SELECT sample_id,severity FROM import_issues WHERE {where}", params).fetchall()
            quality = QualityAssessment.from_records(samples, issues)
        result = dict(row)
        result.update({"dataset_id": dataset_id, "task_id": task_id, "categories": categories,
                       "vlm_coverage_pct": quality.audit_coverage.percent,
                       "generated_at": datetime.now(timezone.utc).isoformat(), "quality": quality})
        return DatasetReport(**result).model_dump(mode="json")

    def datasets(self) -> dict:
        registry = DatasetRegistry(self.db)
        items = []
        for config in registry.list():
            dataset_id = config.dataset.id
            report = self.report(dataset_id=dataset_id, task_id=config.task.task_id)
            with self.db.connection() as conn:
                annotation_counts = conn.execute("SELECT a.raw_label,count(*) FROM annotations a JOIN samples s ON s.sample_id=a.sample_id WHERE s.dataset_id=? GROUP BY a.raw_label ORDER BY a.raw_label", (dataset_id,)).fetchall()
                feature_count = conn.execute("SELECT count(DISTINCT f.sample_id) FROM feature_records f JOIN samples s ON s.sample_id=f.sample_id WHERE s.dataset_id=?", (dataset_id,)).fetchone()[0]
                selected = conn.execute("SELECT reference_selection_set FROM datasets WHERE dataset_id=?", (dataset_id,)).fetchone()[0]
            items.append({**report, "dataset_id": dataset_id, "name": config.dataset.name or dataset_id,
                          "task_name": config.task.name or config.task.product or config.task.task_id,
                          "product": config.task.product, "image_dir": config.root, "annotation_dir": config.annotations.root,
                          "annotation_categories": [row[0] for row in annotation_counts], "annotation_count": sum(row[1] for row in annotation_counts),
                          "reference_sample_ids": registry.references(dataset_id, limit=None),
                          "reference_mode": "selected" if selected else "automatic",
                          "unannotated_is_normal": config.dataset.unannotated_is_normal,
                          "feature_coverage_pct": round(100 * feature_count / report["total_samples"], 2) if report["total_samples"] else 0})
        return {"datasets": items}
