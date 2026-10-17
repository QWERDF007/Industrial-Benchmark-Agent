import os
import json
import time
import uuid
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
    ReviewRepository,
    BenchmarkRepository,
    EvaluationRepository,
    JobRepository,
)
from iad_core.review.service import ReviewQueueService
from iad_core.evidence.builder import EvidenceBuilder

app = FastAPI(title="Industrial Benchmark Agent Domain Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "data/benchmark.db"


class ReviewDecisionRequest(BaseModel):
    sample_id: str
    decision: str = Field(..., description="PASS, HARD_NORMAL, FAIL, UNCERTAIN, SKIP")
    session_id: str = Field(..., description="Active Review session ID")
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

    target_session_id = session_id if (session_id and session_id.startswith("revsess_")) else req.session_id
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

@app.get("/api/sample/{sample_id}/image")
def get_sample_image(sample_id: str):
    db = Database(DB_PATH)
    repo = SampleRepository(db)
    sample = repo.get(sample_id)
    if not sample:
        raise HTTPException(status_code=404, detail=f"Sample '{sample_id}' not found in database.")
    if not sample.image_path or not os.path.exists(sample.image_path):
        raise HTTPException(
            status_code=404,
            detail=f"Image file for sample '{sample_id}' not found on disk: {sample.image_path if sample else 'None'}"
        )
    return FileResponse(sample.image_path)


# -------------------------------------------------------------------------
# MCP JSON-RPC 2.0 Transport (R301, Specs Section 26)
# -------------------------------------------------------------------------

@app.post("/mcp")
async def mcp_transport(request: Dict[str, Any] = Body(...)):
    from iad_domain_server.mcp import handle_mcp_request
    return handle_mcp_request(request)

