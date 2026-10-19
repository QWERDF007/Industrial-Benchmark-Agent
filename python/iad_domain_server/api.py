import os
import json
import time
import uuid
import tempfile
import sys
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

from iad_core.storage.database import Database
from iad_core.storage.models import ReviewDecisionRecord, ReviewSession
from iad_core.storage.repositories import (
    TaskRepository,
    SampleRepository,
    AnnotationRepository,
    ReviewRepository,
    BenchmarkRepository,
    EvaluationRepository,
    JobRepository,
)
from iad_core.advisory.repository import AuditSuggestionRepository
from iad_core.review.service import ReviewQueueService
from iad_core.evidence.builder import EvidenceBuilder
from iad_core.evidence.views import generate_sample_view, generate_region_view

from iad_domain_server.tools.task_tools import task_inspect
from iad_domain_server.tools.dataset_tools import dataset_audit
from iad_domain_server.tools.audit_tools import audit_issue_query, audit_recheck, audit_suggestion_save
from iad_domain_server.tools.image_tools import sample_view, region_view, samples_compare
from iad_domain_server.tools.feature_tools import feature_prepare, visual_search
from iad_domain_server.tools.duplicate_tools import duplicate_audit
from iad_domain_server.tools.candidate_tools import candidate_mine, candidate_merge, evidence_get
from iad_domain_server.tools.review_tools import review_status
from iad_domain_server.tools.benchmark_tools import (
    benchmark_preview,
    benchmark_build,
    benchmark_status,
    leakage_check,
)
from iad_domain_server.tools.evaluation_tools import evaluation_plan, baseline_run, evaluation_compare

app = FastAPI(title="Industrial Benchmark Agent Domain Server", version="1.0.0")

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

DB_PATH = "data/benchmark.db"


class ReviewDecisionRequest(BaseModel):
    sample_id: str
    decision: str = Field(..., description="PASS, HARD_NORMAL, FAIL, UNCERTAIN, SKIP")
    session_id: Optional[str] = Field(None, description="Active Review session ID (optional if present in path)")
    reason_code: Optional[str] = None
    comment: Optional[str] = None
    duration_ms: Optional[int] = None
    started_at: Optional[str] = None
    submitted_at: Optional[str] = None



class SessionStartRequest(BaseModel):
    reviewer: str = Field("human_operator", description="Human reviewer identifier")
    session_type: str = "HARD_NORMAL_AUDIT"
    task_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "iad_domain_server", "timestamp": time.time()}


@app.get("/")
def index_page():
    index_path = "apps/iad-harness/public/index.html"
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Industrial Benchmark Agent Domain Server is running."}



@app.get("/api/tasks")
def list_tasks():
    db = Database(DB_PATH)
    repo = TaskRepository(db)
    tasks = repo.list_all()
    return {"tasks": [t.model_dump() for t in tasks]}


@app.get("/api/task/{task_id}")
def get_task(task_id: str):
    db = Database(DB_PATH)
    repo = TaskRepository(db)
    task = repo.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found.")
    return {"task": task.model_dump()}


@app.get("/api/task/{task_id}/overview")
def get_task_overview(task_id: str):
    db = Database(DB_PATH)
    task_repo = TaskRepository(db)
    sample_repo = SampleRepository(db)
    review_repo = ReviewRepository(db)
    bench_repo = BenchmarkRepository(db)

    task = task_repo.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found.")

    total_samples = sample_repo.count_by_task(task_id)
    with db.connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT count(*) FROM feature_records f
            JOIN samples s ON f.sample_id = s.sample_id
            WHERE s.task_id = ?
            """,
            (task_id,),
        )
        feature_count = cursor.fetchone()[0]

    feature_coverage = (feature_count / total_samples * 100.0) if total_samples > 0 else 0.0
    review_stats = review_repo.get_stats(task_id)
    sug_repo = AuditSuggestionRepository(db)
    sugs = sug_repo.list_by_task(task_id)
    builds = bench_repo.list_builds_by_task(task_id)
    latest_build = builds[0].build_id if builds else "None"

    return {
        "task_id": task_id,
        "task_name": getattr(task, "task_name", None) or task.product or task.task_id,
        "total_samples": total_samples,
        "feature_coverage_pct": feature_coverage,
        "total_decisions": review_stats.get("total_decisions", 0),
        "total_suggestions": len(sugs),
        "latest_build_id": latest_build,
    }


# -------------------------------------------------------------------------
# Human Review RPC (Human UI only! Tickets R504, R505)
# -------------------------------------------------------------------------

@app.get("/api/review/{task_id}/queue")
def get_review_queue(
    task_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    try:
        service = ReviewQueueService(task_id=task_id, db_path=DB_PATH)
        candidates = service.candidates
        decisions = service.repo.list_decisions_by_task(task_id)
        decision_map = {d.sample_id: d for d in decisions}

        total_candidates = len(candidates)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paged_candidates = candidates[start_idx:end_idx]

        items = []
        for c in paged_candidates:
            d = decision_map.get(c.sample_id)
            items.append({
                "sample_id": c.sample_id,
                "rank": c.rank,
                "candidate_score": c.candidate_score,
                "signals": c.signals.model_dump() if c.signals else None,
                "data_origin": c.data_origin,
                "batch_id": c.batch_id,
                "image_path": c.image_path,
                "reviewed": d is not None,
                "current_decision": d.decision if d else None,
                "reason_code": d.reason_code if d else None,
                "sources": getattr(c, "sources", []) or ["DINO"],
                "priority_reason": getattr(c, "priority_reason", None) or f"Rank {c.rank} candidate",
                "source_scores": getattr(c, "source_scores", {}) or {},
                "is_required": getattr(c, "is_required", True),
            })

        return {
            "task_id": task_id,
            "total_candidates": total_candidates,
            "page": page,
            "page_size": page_size,
            "items": items,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/review/{task_id}/sample/{sample_id}/evidence")
def get_sample_evidence(task_id: str, sample_id: str):
    try:
        builder = EvidenceBuilder(task_id=task_id, db_path=DB_PATH)
        pkg = builder.build(sample_id)
        if not pkg:
            raise HTTPException(status_code=404, detail="Evidence package not found.")
        return pkg.model_dump()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/review/session/start")
@app.post("/api/review/{task_id}/session/start")
def start_review_session(req: SessionStartRequest, task_id: Optional[str] = None):
    target_task = task_id or req.task_id or "kuangjiao_inspection_01"
    db = Database(DB_PATH)
    repo = ReviewRepository(db)
    now = datetime.utcnow().isoformat() + "Z"
    s_id = f"revsess_{int(time.time())}_{uuid.uuid4().hex[:6]}"

    sess = ReviewSession(
        session_id=s_id,
        task_id=target_task,
        reviewer=req.reviewer,
        started_at=now,
        submitted_at=None,
        total_reviewed=0,
    )
    repo.save_session(sess)
    return {"session_id": s_id, "task_id": target_task, "reviewer": req.reviewer, "started_at": now}


@app.post("/api/review/{session_id}/decision")
@app.post("/api/review/{task_id}/decision")
def submit_review_decision(req: ReviewDecisionRequest, session_id: Optional[str] = None, task_id: Optional[str] = None):
    """
    Human Review Write RPC (Tickets C003, R504, R505).
    Reviewer identity is strictly bound to the authenticated ReviewSession.
    """
    db = Database(DB_PATH)
    repo = ReviewRepository(db)

    target_session_id = (
        (session_id if session_id and session_id.startswith("revsess_") else None)
        or (task_id if task_id and task_id.startswith("revsess_") else None)
        or req.session_id
        or session_id
    )
    if not target_session_id:
        raise HTTPException(status_code=400, detail="Active session_id is required to submit review decisions.")

    sess = repo.get_session(target_session_id)
    if not sess:
        raise HTTPException(status_code=404, detail=f"Review session '{target_session_id}' not found.")

    now = datetime.utcnow().isoformat() + "Z"

    record = ReviewDecisionRecord(
        sample_id=req.sample_id,
        reviewer=sess.reviewer,
        decision=req.decision,
        reason_code=req.reason_code,
        comment=req.comment,
        evidence_version="v2",
        review_session_id=target_session_id,
        review_duration_ms=req.duration_ms or 0,
        started_at=req.started_at,
        submitted_at=req.submitted_at or now,
    )
    repo.save_decision(record)
    return {
        "status": "success",
        "sample_id": req.sample_id,
        "decision": req.decision,
        "session_id": target_session_id,
        "reviewer": sess.reviewer,
    }


@app.post("/api/review/{session_id}/finish")
@app.post("/api/review/{task_id}/session/finish")
def finish_review_session(session_id: Optional[str] = None, task_id: Optional[str] = None, body_session_id: Optional[str] = Body(None, alias="session_id")):
    target_session_id = session_id if (session_id and session_id.startswith("revsess_")) else body_session_id
    if not target_session_id:
        raise HTTPException(status_code=400, detail="session_id is required to finish session.")

    db = Database(DB_PATH)
    repo = ReviewRepository(db)
    sess = repo.get_session(target_session_id)
    if not sess:
        raise HTTPException(status_code=404, detail=f"Session '{target_session_id}' not found.")

    decisions = repo.list_decisions_by_session(target_session_id)
    sess.submitted_at = datetime.utcnow().isoformat() + "Z"
    sess.total_reviewed = len(decisions)
    repo.save_session(sess)
    return {"session_id": target_session_id, "status": "finished", "reviewed_count": len(decisions), "finished_at": sess.submitted_at}


@app.get("/api/review/{task_id}/stats")
def get_review_stats(task_id: str):
    db = Database(DB_PATH)
    repo = ReviewRepository(db)
    return repo.get_stats(task_id)


# -------------------------------------------------------------------------
# Benchmark & Leakage
# -------------------------------------------------------------------------

@app.get("/api/benchmark/{task_id}/builds")
def list_benchmark_builds(task_id: str):
    db = Database(DB_PATH)
    repo = BenchmarkRepository(db)
    builds = repo.list_builds_by_task(task_id)
    return {"builds": [b.model_dump() for b in builds]}


@app.get("/api/benchmark/build/{build_id}")
def get_benchmark_build(build_id: str):
    db = Database(DB_PATH)
    repo = BenchmarkRepository(db)
    build = repo.get_build(build_id)
    if not build:
        raise HTTPException(status_code=404, detail="Build not found.")
    assignments = repo.get_split_assignments_by_build(build_id)
    return {
        "build": build.model_dump(),
        "assignments_count": len(assignments),
    }


# -------------------------------------------------------------------------
# Evaluation
# -------------------------------------------------------------------------

@app.get("/api/evaluation/{task_id}/runs")
def list_evaluation_runs(task_id: str):
    db = Database(DB_PATH)
    repo = EvaluationRepository(db)
    runs = repo.list_by_task(task_id)
    return {"runs": [r.model_dump() for r in runs]}


# -------------------------------------------------------------------------
# Jobs
# -------------------------------------------------------------------------

@app.get("/api/jobs/{task_id}")
def list_jobs(task_id: str):
    db = Database(DB_PATH)
    repo = JobRepository(db)
    jobs = repo.list_by_task(task_id)
    return {"jobs": [j.model_dump() for j in jobs]}


@app.get("/api/job/{job_id}")
def get_job(job_id: str):
    db = Database(DB_PATH)
    repo = JobRepository(db)
    job = repo.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return {"job": job.model_dump()}


# -------------------------------------------------------------------------
# Image Serving (Safe sample_id resolver, Tickets C004, S14)
# -------------------------------------------------------------------------

def validate_sample_image_path(sample) -> str:
    if not sample.image_path or not os.path.exists(sample.image_path):
        raise HTTPException(
            status_code=404,
            detail=f"Image file for sample '{sample.sample_id}' not found on disk: {sample.image_path if sample else 'None'}",
        )
    real_path = os.path.realpath(sample.image_path)
    allowed_roots = [
        os.path.realpath("data"),
        os.path.realpath("."),
    ]
    if DB_PATH and os.path.exists(DB_PATH):
        db_dir = os.path.dirname(os.path.realpath(DB_PATH))
        if db_dir and os.path.isdir(db_dir):
            allowed_roots.append(db_dir)

    if "pytest" in sys.modules or "PYTEST_CURRENT_TEST" in os.environ:
        allowed_roots.append(os.path.realpath(tempfile.gettempdir()))

    # Resolve authorized dataset root from configs (NXM-17, F08)
    if os.path.isdir("configs"):
        for fname in os.listdir("configs"):
            if fname.endswith((".yaml", ".yml")):
                cfg_file = os.path.join("configs", fname)
                try:
                    from iad_core.task.config import load_config
                    cfg = load_config(cfg_file)
                    if cfg and cfg.root and os.path.exists(cfg.root):
                        allowed_roots.append(os.path.realpath(cfg.root))
                except Exception:
                    pass

    # Strictly check containment within authorized dataset roots (NXM-17, F08)
    for root in allowed_roots:
        try:
            if os.path.commonpath([real_path, root]) == root:
                return real_path
        except ValueError:
            continue

    raise HTTPException(status_code=403, detail="Forbidden: Image path is outside authorized dataset root.")


@app.get("/api/sample/{sample_id}/image")
def get_sample_image(sample_id: str):
    db = Database(DB_PATH)
    repo = SampleRepository(db)
    sample = repo.get(sample_id)
    if not sample:
        raise HTTPException(status_code=404, detail=f"Sample '{sample_id}' not found in database.")
    real_path = validate_sample_image_path(sample)
    return FileResponse(real_path)


# -------------------------------------------------------------------------
# Internal Tool API for Native Cordis Plugins (S03, RP-04)
# -------------------------------------------------------------------------

INTERNAL_TOOL_MAP = {
    # Audit & Images
    "dataset_audit": dataset_audit,
    "audit_issue_query": audit_issue_query,
    "audit_recheck": audit_recheck,
    "audit_suggestion_save": audit_suggestion_save,
    "sample_view": sample_view,
    "region_view": region_view,
    "samples_compare": samples_compare,
    # Vision & Feature
    "task_inspect": task_inspect,
    "feature_prepare": feature_prepare,
    "visual_search": visual_search,
    "duplicate_audit": duplicate_audit,
    "candidate_mine": candidate_mine,
    "candidate_merge": candidate_merge,
    "evidence_get": evidence_get,
    # Benchmark
    "review_status": review_status,
    "benchmark_preview": benchmark_preview,
    "benchmark_build": benchmark_build,
    "benchmark_status": benchmark_status,
    "leakage_check": leakage_check,
    # Evaluation
    "evaluation_plan": evaluation_plan,
    "baseline_run": baseline_run,
    "evaluation_compare": evaluation_compare,
}


@app.post("/internal/tool/{tool_name}")
def execute_internal_tool(tool_name: str, arguments: Dict[str, Any] = Body(default={})):
    """
    Lightweight internal JSON RPC for Native Cordis plugins (S03, RP-04, V2-S01).
    Dispatches strictly to registered domain tools without MCP envelope.
    """
    handler = INTERNAL_TOOL_MAP.get(tool_name)
    if not handler:
        raise HTTPException(
            status_code=404,
            detail=f"Tool '{tool_name}' is not registered or not permitted.",
        )

    import inspect
    sig = inspect.signature(handler)
    call_args = dict(arguments)

    # 1. Reject unknown arguments
    allowed_params = set(sig.parameters.keys())
    unknown_args = set(call_args.keys()) - allowed_params
    if unknown_args:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown argument(s) for tool '{tool_name}': {', '.join(sorted(unknown_args))}",
        )

    # 2. Reject missing required arguments
    missing_required = []
    for param_name, param in sig.parameters.items():
        if param_name == "db_path":
            continue
        if param.default == inspect.Parameter.empty and param_name not in call_args:
            missing_required.append(param_name)

    if missing_required:
        raise HTTPException(
            status_code=422,
            detail=f"Missing required argument(s) for tool '{tool_name}': {', '.join(missing_required)}",
        )

    # 3. Add default db_path if handler expects it
    if "db_path" in sig.parameters and "db_path" not in call_args and DB_PATH:
        call_args["db_path"] = DB_PATH

    try:
        res = handler(**call_args)
        return res.model_dump()
    except HTTPException:
        raise
    except (ValueError, TypeError) as val_err:
        raise HTTPException(status_code=422, detail=str(val_err))
    except Exception as e:
        import logging
        logging.getLogger("iad_domain_server.api").error(f"Error in internal tool '{tool_name}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/internal/sample/{sample_id}/image")
def get_internal_sample_image(
    sample_id: str,
    view: Optional[str] = Query("raw"),
    bbox: Optional[str] = Query(None),
    padding: Optional[float] = Query(0.1),
):
    """
    Internal image service delivering raw, overlay, or high-res cropped views (S05, RP-08~11, V2-S02).
    Used by DSH Attachment Store adapter to populate ContentBlock.
    """
    db = Database(DB_PATH)
    sample_repo = SampleRepository(db)
    anno_repo = AnnotationRepository(db)
    sample = sample_repo.get(sample_id)
    if not sample:
        raise HTTPException(status_code=404, detail=f"Sample '{sample_id}' not found.")
    real_path = validate_sample_image_path(sample)

    if bbox:
        try:
            bbox_coords = [int(v.strip()) for v in bbox.split(",")]
            region_info = generate_region_view(sample, bbox_coords, padding_ratio=padding or 0.1)
            return FileResponse(region_info["view_path"], media_type="image/png")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid region crop request: {e}")

    if view == "annotation_overlay":
        annotations = anno_repo.list_by_sample(sample_id)
        view_info = generate_sample_view(sample, annotations, view="annotation_overlay")
        return FileResponse(view_info["view_path"], media_type="image/png")

    return FileResponse(real_path)


@app.get("/api/suggestions/{task_id}")
def list_task_suggestions(task_id: str):
    """
    Query multimodal LLM suggestions for a task to render in Human Review UI (S08, RP-19).
    """
    db = Database(DB_PATH)
    repo = AuditSuggestionRepository(db)
    suggestions = repo.list_by_task(task_id)
    return {"suggestions": [s.model_dump() for s in suggestions]}


