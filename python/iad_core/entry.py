import os
import sys
import json
import uuid
import time
import traceback
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

from iad_core.storage.database import Database
from iad_core.storage.repositories import (
    TaskRepository,
    SampleRepository,
    AnnotationRepository,
    ImportIssueRepository,
    ReviewRepository,
    BenchmarkRepository,
    EvaluationRepository,
    JobRepository,
)
from iad_core.storage.models import ReviewSession, ReviewDecisionRecord, QualityStatus
from iad_core.advisory.repository import AuditSuggestionRepository
from iad_core.advisory.schemas import (
    AuditSuggestion,
    ObservationItem,
    HypothesisItem,
    EvidenceRefItem,
    ConclusionStatus,
    RecommendedAction,
)
from iad_core.dataset.path_safety import validate_sample_image_path, PathSafetyError
from iad_core.dataset.scanner import scan_dataset
from iad_core.evidence.builder import EvidenceBuilder

DEFAULT_DB_PATH = os.environ.get("IAD_DB_PATH", "data/benchmark.db")


def emit(payload: Dict[str, Any]) -> None:
    """Emit JSON payload to stdout flushed immediately."""
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def emit_progress(request_id: str, completed: int, total: int, failed: int = 0, message: Optional[str] = None) -> None:
    data = {
        "event": "progress",
        "request_id": request_id,
        "completed": completed,
        "total": total,
        "failed": failed,
    }
    if message:
        data["message"] = message
    emit(data)


def emit_result(request_id: str, status: str = "OK", data: Any = None, metrics: Optional[Dict[str, Any]] = None, artifacts: Optional[List[Any]] = None) -> None:
    res = {
        "event": "result",
        "request_id": request_id,
        "status": status,
    }
    if data is not None:
        res["data"] = data
    if metrics is not None:
        res["metrics"] = metrics
    if artifacts is not None:
        res["artifacts"] = artifacts
    emit(res)


def emit_error(request_id: str, code: str, message: str, details: Optional[Any] = None) -> None:
    emit({
        "event": "error",
        "request_id": request_id,
        "status": "ERROR",
        "error": {
            "code": code,
            "message": message,
            "details": details,
        }
    })


def op_tool_call(req_id: str, args: Dict[str, Any], db_path: str):
    from iad_core.tools import execute_internal_tool, ToolContractError
    tool_name = args.get("tool_name")
    tool_args = args.get("arguments", {})
    if not tool_name:
        emit_error(req_id, "MISSING_ARGUMENT", "tool_name is required for tool_call")
        return
    try:
        res = execute_internal_tool(tool_name, tool_args)
        status = res.get("status", "OK")
        emit_result(req_id, status=status, data=res, metrics=res.get("metrics"), artifacts=res.get("artifacts"))
    except ToolContractError as e:
        emit_error(req_id, "CONTRACT_ERROR", str(e), {"status_code": e.status_code})
    except Exception as e:
        sys.stderr.write(f"[tool_call {tool_name} error]: {traceback.format_exc()}\n")
        emit_error(req_id, "EXECUTION_ERROR", str(e))


def op_dataset_list(req_id: str, args: Dict[str, Any], db_path: str):
    db = Database(db_path)
    task_repo = TaskRepository(db)
    sample_repo = SampleRepository(db)
    bench_repo = BenchmarkRepository(db)
    rev_repo = ReviewRepository(db)
    sug_repo = AuditSuggestionRepository(db)

    tasks = task_repo.list()
    results = []
    with db.connection() as conn:
        cursor = conn.cursor()
        for t in tasks:
            total_samples = sample_repo.count_by_task(t.task_id)
            cursor.execute(
                """
                SELECT count(*) FROM feature_records f
                JOIN samples s ON f.sample_id = s.sample_id
                WHERE s.task_id = ?
                """,
                (t.task_id,),
            )
            feat_count = cursor.fetchone()[0]
            coverage = (feat_count / total_samples * 100) if total_samples > 0 else 0.0
            review_stats = rev_repo.get_stats(t.task_id)
            sugs = sug_repo.list_by_task(t.task_id)
            builds = bench_repo.list_builds_by_task(t.task_id)
            latest_build = builds[0].build_id if builds else None

            results.append({
                "task_id": t.task_id,
                "task_name": getattr(t, "task_name", None) or t.product or t.task_id,
                "product": t.product,
                "total_samples": total_samples,
                "feature_coverage_pct": round(coverage, 2),
                "total_decisions": review_stats.get("total_decisions", 0),
                "total_suggestions": len(sugs),
                "latest_build_id": latest_build,
            })
    emit_result(req_id, status="OK", data={"tasks": results})


def op_dataset_get(req_id: str, args: Dict[str, Any], db_path: str):
    task_id = args.get("task_id")
    if not task_id:
        emit_error(req_id, "MISSING_ARGUMENT", "task_id is required")
        return
    db = Database(db_path)
    task_repo = TaskRepository(db)
    sample_repo = SampleRepository(db)
    rev_repo = ReviewRepository(db)
    sug_repo = AuditSuggestionRepository(db)
    bench_repo = BenchmarkRepository(db)

    task = task_repo.get(task_id)
    if not task:
        emit_error(req_id, "NOT_FOUND", f"Task '{task_id}' not found")
        return

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
        feat_count = cursor.fetchone()[0]
    coverage = (feat_count / total_samples * 100) if total_samples > 0 else 0.0
    review_stats = rev_repo.get_stats(task_id)
    sugs = sug_repo.list_by_task(task_id)
    builds = bench_repo.list_builds_by_task(task_id)
    latest_build = builds[0].build_id if builds else None

    # Counts by quality status
    samples = sample_repo.list_by_task(task_id, limit=100000)
    status_counts = {"PASS": 0, "FAIL": 0, "UNCERTAIN": 0}
    for s in samples:
        st = s.quality_status.value if hasattr(s.quality_status, "value") else str(s.quality_status)
        status_counts[st] = status_counts.get(st, 0) + 1

    emit_result(req_id, status="OK", data={
        "task_id": task.task_id,
        "task_name": getattr(task, "task_name", None) or task.product or task.task_id,
        "product": task.product,
        "total_samples": total_samples,
        "status_counts": status_counts,
        "feature_coverage_pct": round(coverage, 2),
        "total_decisions": review_stats.get("total_decisions", 0),
        "total_suggestions": len(sugs),
        "latest_build_id": latest_build,
    })


def op_dataset_scan(req_id: str, args: Dict[str, Any], db_path: str):
    task_id = args.get("task_id")
    config_path = args.get("config_path")
    if not config_path and task_id:
        cfg = f"configs/{task_id}.yaml"
        if os.path.exists(cfg):
            config_path = cfg

    if not config_path or not os.path.exists(config_path):
        emit_error(req_id, "CONFIG_NOT_FOUND", f"Dataset config file '{config_path}' not found")
        return

    emit_progress(req_id, completed=0, total=100, message="Scanning dataset files...")
    res = scan_dataset(config_path=config_path, db_path=db_path)
    emit_progress(req_id, completed=100, total=100, message="Scan completed")
    emit_result(req_id, status="OK", data=res.model_dump())


def extract_suggestion_meta(sug: Any) -> Dict[str, Any]:
    """Helper to safely extract normalized advisory info from domain AuditSuggestion (S08)."""
    if not sug:
        return {
            "suggested_label": "UNCERTAIN",
            "reason_category": "UNKNOWN",
            "model_name": "NOT_MEASURED",
            "notes": "",
            "confidence": 0.5,
        }

    suggested_label = "UNCERTAIN"
    if hasattr(sug, "hypotheses") and sug.hypotheses:
        suggested_label = sug.hypotheses[0].label
    elif hasattr(sug, "suggested_label"):
        suggested_label = sug.suggested_label

    reason_category = "UNKNOWN"
    notes = ""
    if hasattr(sug, "observations") and sug.observations:
        reason_category = sug.observations[0].phenomenon
        notes = sug.observations[0].description or ""
    elif hasattr(sug, "reason_category"):
        reason_category = sug.reason_category
        notes = getattr(sug, "notes", "") or ""

    model_name = getattr(sug, "model_route", None) or getattr(sug, "model_name", None) or "Qwen/Qwen3.8-27B-FP8"
    confidence = getattr(sug, "confidence", 0.85) or 0.85

    return {
        "suggestion_id": getattr(sug, "suggestion_id", ""),
        "suggested_label": suggested_label,
        "reason_category": reason_category,
        "model_name": model_name,
        "notes": notes,
        "confidence": confidence,
        "created_at": getattr(sug, "created_at", None),
    }


def compute_technical_quality_score(sample: Any, issues: List[Any]) -> int:
    """
    DS-S07: Compute technical imaging & data engineering quality (0-100).
    Evaluates format integrity, out-of-bounds bounding boxes, resolution.
    """
    if issues:
        has_crit = any(str(getattr(i, "severity", "")).upper() in ["CRITICAL", "ERROR"] for i in issues)
        has_warn = any(str(getattr(i, "severity", "")).upper() == "WARNING" for i in issues)
        if has_crit:
            return 35
        elif has_warn:
            return 58
        return 75

    w = getattr(sample, "width", 0) or 0
    h = getattr(sample, "height", 0) or 0
    pixels = w * h
    if pixels <= 0:
        return 50
    if pixels < 10000:
        return 45
    if pixels < 50000:
        return 65
    return 98


def op_sample_list(req_id: str, args: Dict[str, Any], db_path: str):
    task_id = args.get("task_id")
    page = int(args.get("page", 1))
    page_size = int(args.get("page_size", 24))
    filter_mode = args.get("filter", "all")  # all, risk, unreviewed, technical, fail, pass
    sort_by = args.get("sort_by", "default")  # default, risk, tech

    if not task_id:
        emit_error(req_id, "MISSING_ARGUMENT", "task_id is required")
        return

    db = Database(db_path)
    sample_repo = SampleRepository(db)
    sug_repo = AuditSuggestionRepository(db)
    rev_repo = ReviewRepository(db)
    issue_repo = ImportIssueRepository(db)

    all_samples = sample_repo.list_by_task(task_id, limit=50000)
    sugs = sug_repo.list_by_task(task_id)
    # Map latest suggestion per sample
    sug_map = {}
    for s in sugs:
        if s.sample_id and s.sample_id not in sug_map:
            sug_map[s.sample_id] = s

    decisions = rev_repo.list_decisions_by_task(task_id)
    dec_map = {d.sample_id: d for d in decisions}

    task_issues = issue_repo.list_by_task(task_id)
    issues_by_sample: Dict[str, List[Any]] = {}
    for iss in task_issues:
        if iss.sample_id:
            issues_by_sample.setdefault(iss.sample_id, []).append(iss)

    enriched = []
    for s in all_samples:
        sug = sug_map.get(s.sample_id)
        dec = dec_map.get(s.sample_id)
        st = s.quality_status.value if hasattr(s.quality_status, "value") else str(s.quality_status)

        has_vlm = sug is not None
        vlm_risk = None
        sug_meta = None
        if sug:
            sug_meta = extract_suggestion_meta(sug)
            label = sug_meta["suggested_label"]
            cat = sug_meta["reason_category"]
            conf = sug_meta["confidence"]
            if label == "FAIL" or cat in ["OVERFLOW", "DISCONTINUITY", "FOREIGN_OBJECT", "ANOMALY", "SCRATCH", "DEFORMATION"]:
                vlm_risk = int(conf * 100) if conf > 0.5 else 75
            elif label == "PASS":
                vlm_risk = int((1.0 - conf) * 30)
            else:
                vlm_risk = 50

        s_issues = issues_by_sample.get(s.sample_id, [])
        tech_score = compute_technical_quality_score(s, s_issues)

        enriched.append({
            "sample_id": s.sample_id,
            "task_id": s.task_id,
            "batch_id": s.batch_id,
            "data_origin": s.data_origin.value if hasattr(s.data_origin, "value") else str(s.data_origin),
            "quality_status": st,
            "has_vlm_observation": has_vlm,
            "visual_suspicion_score": vlm_risk,
            "technical_quality_score": tech_score,
            "has_technical_issue": len(s_issues) > 0,
            "reviewed": dec is not None,
            "review_decision": dec.decision if dec else None,
            "suggestion": sug_meta,
        })

    # Apply filters
    filtered = enriched
    if filter_mode == "risk":
        filtered = [x for x in enriched if x["visual_suspicion_score"] is not None and x["visual_suspicion_score"] >= 60]
    elif filter_mode == "unreviewed":
        filtered = [x for x in enriched if not x["has_vlm_observation"]]
    elif filter_mode == "technical":
        filtered = [x for x in enriched if x["technical_quality_score"] is not None and x["technical_quality_score"] < 70]
    elif filter_mode == "pending_human_review":
        filtered = [x for x in enriched if not x["reviewed"]]
    elif filter_mode == "reviewed":
        filtered = [x for x in enriched if x["reviewed"]]

    # Apply sort
    if sort_by == "risk":
        filtered.sort(key=lambda x: x["visual_suspicion_score"] if x["visual_suspicion_score"] is not None else -1, reverse=True)
    elif sort_by == "tech":
        filtered.sort(key=lambda x: x["technical_quality_score"] if x["technical_quality_score"] is not None else 999)

    total_count = len(filtered)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paged = filtered[start_idx:end_idx]

    # Calculate summary metrics
    vlm_audited_count = sum(1 for x in enriched if x["has_vlm_observation"])
    suspicious_count = sum(1 for x in enriched if x["visual_suspicion_score"] is not None and x["visual_suspicion_score"] >= 60)
    tech_issue_count = sum(1 for x in enriched if x["technical_quality_score"] is not None and x["technical_quality_score"] < 70)

    emit_result(req_id, status="OK", data={
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_in_task": len(all_samples),
        "vlm_audited_count": vlm_audited_count,
        "suspicious_count": suspicious_count,
        "tech_issue_count": tech_issue_count,
        "items": paged,
    })


def op_sample_get(req_id: str, args: Dict[str, Any], db_path: str):
    sample_id = args.get("sample_id")
    if not sample_id:
        emit_error(req_id, "MISSING_ARGUMENT", "sample_id is required")
        return
    db = Database(db_path)
    sample_repo = SampleRepository(db)
    sug_repo = AuditSuggestionRepository(db)
    rev_repo = ReviewRepository(db)
    ann_repo = AnnotationRepository(db)
    issue_repo = ImportIssueRepository(db)

    sample = sample_repo.get(sample_id)
    if not sample:
        emit_error(req_id, "NOT_FOUND", f"Sample '{sample_id}' not found")
        return

    # Check path safety
    real_path = None
    try:
        real_path = validate_sample_image_path(sample, db_path=db_path)
    except PathSafetyError:
        pass

    sugs = sug_repo.list_by_sample(sample_id)
    sug = sugs[0] if sugs else None
    dec = rev_repo.get_decision(sample_id)
    anns = ann_repo.list_by_sample(sample_id)

    # Technical issues for this sample (indexed by sample_id for sub-millisecond speed)
    sample_issues = issue_repo.list_by_sample(sample_id)
    tech_score = compute_technical_quality_score(sample, sample_issues)

    sug_meta = None
    vlm_risk = None
    if sug:
        sug_meta = extract_suggestion_meta(sug)
        label = sug_meta["suggested_label"]
        cat = sug_meta["reason_category"]
        conf = sug_meta["confidence"]
        if label == "FAIL" or cat in ["OVERFLOW", "DISCONTINUITY", "FOREIGN_OBJECT", "ANOMALY", "SCRATCH", "DEFORMATION"]:
            vlm_risk = int(conf * 100) if conf > 0.5 else 75
        elif label == "PASS":
            vlm_risk = int((1.0 - conf) * 30)
        else:
            vlm_risk = 50

    emit_result(req_id, status="OK", data={
        "sample": sample.model_dump(),
        "image_verified_path": real_path,
        "suggestion": sug_meta,
        "visual_suspicion_score": vlm_risk,
        "technical_quality_score": tech_score,
        "annotations": [a.model_dump() for a in anns],
        "technical_issues": [i.model_dump() for i in sample_issues],
        "review_decision": dec.model_dump() if dec else None,
    })


def op_sample_image_path(req_id: str, args: Dict[str, Any], db_path: str):
    sample_id = args.get("sample_id")
    if not sample_id:
        emit_error(req_id, "MISSING_ARGUMENT", "sample_id is required")
        return
    db = Database(db_path)
    sample_repo = SampleRepository(db)
    sample = sample_repo.get(sample_id)
    if not sample:
        emit_error(req_id, "NOT_FOUND", f"Sample '{sample_id}' not found in database")
        return

    try:
        real_path = validate_sample_image_path(sample, db_path=db_path)
        # Check media type
        ext = os.path.splitext(real_path)[1].lower()
        media_type = "image/png" if ext == ".png" else "image/jpeg"
        emit_result(req_id, status="OK", data={
            "sample_id": sample_id,
            "path": real_path,
            "media_type": media_type,
            "exists": True,
        })
    except PathSafetyError as e:
        emit_error(req_id, "PATH_SAFETY_ERROR", str(e), {"status_code": e.status_code})


def op_review_queue(req_id: str, args: Dict[str, Any], db_path: str):
    from iad_core.review.service import ReviewQueueService
    task_id = args.get("task_id")
    page = int(args.get("page", 1))
    page_size = int(args.get("page_size", 20))
    if not task_id:
        emit_error(req_id, "MISSING_ARGUMENT", "task_id is required")
        return

    try:
        service = ReviewQueueService(task_id=task_id, db_path=db_path)
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

        emit_result(req_id, status="OK", data={
            "task_id": task_id,
            "total_candidates": total_candidates,
            "page": page,
            "page_size": page_size,
            "items": items,
        })
    except Exception as e:
        emit_error(req_id, "QUEUE_ERROR", str(e))


def op_review_evidence(req_id: str, args: Dict[str, Any], db_path: str):
    task_id = args.get("task_id")
    sample_id = args.get("sample_id")
    if not task_id or not sample_id:
        emit_error(req_id, "MISSING_ARGUMENT", "task_id and sample_id are required")
        return
    try:
        builder = EvidenceBuilder(task_id=task_id, db_path=db_path)
        pkg = builder.build(sample_id)
        if not pkg:
            emit_error(req_id, "NOT_FOUND", "Evidence package not found")
            return
        emit_result(req_id, status="OK", data=pkg.model_dump())
    except Exception as e:
        emit_error(req_id, "EVIDENCE_ERROR", str(e))


def op_review_start_session(req_id: str, args: Dict[str, Any], db_path: str):
    task_id = args.get("task_id", "kuangjiao_inspection_01")
    reviewer = args.get("reviewer", "human_expert")
    db = Database(db_path)
    repo = ReviewRepository(db)
    now = datetime.now(timezone.utc).isoformat()
    s_id = f"revsess_{int(time.time())}_{uuid.uuid4().hex[:6]}"

    sess = ReviewSession(
        session_id=s_id,
        task_id=task_id,
        reviewer=reviewer,
        started_at=now,
        submitted_at=None,
        total_reviewed=0,
    )
    repo.save_session(sess)
    emit_result(req_id, status="OK", data={
        "session_id": s_id,
        "task_id": task_id,
        "reviewer": reviewer,
        "started_at": now,
    })


def op_review_submit_decision(req_id: str, args: Dict[str, Any], db_path: str):
    session_id = args.get("session_id")
    sample_id = args.get("sample_id")
    decision = args.get("decision")
    reason_code = args.get("reason_code")
    comment = args.get("comment")
    duration_ms = args.get("duration_ms", 0)

    if not session_id or not sample_id or not decision:
        emit_error(req_id, "MISSING_ARGUMENT", "session_id, sample_id and decision are required")
        return

    db = Database(db_path)
    repo = ReviewRepository(db)
    sess = repo.get_session(session_id)
    if not sess:
        emit_error(req_id, "SESSION_NOT_FOUND", f"Review session '{session_id}' not found")
        return

    now = datetime.now(timezone.utc).isoformat()
    record = ReviewDecisionRecord(
        sample_id=sample_id,
        reviewer=sess.reviewer,
        decision=decision,
        reason_code=reason_code,
        comment=comment,
        evidence_version="v2",
        review_session_id=session_id,
        review_duration_ms=duration_ms or 0,
        started_at=args.get("started_at"),
        submitted_at=now,
    )
    repo.save_decision(record)
    emit_result(req_id, status="OK", data={
        "status": "success",
        "sample_id": sample_id,
        "decision": decision,
        "session_id": session_id,
        "reviewer": sess.reviewer,
    })


def op_review_finish_session(req_id: str, args: Dict[str, Any], db_path: str):
    session_id = args.get("session_id")
    if not session_id:
        emit_error(req_id, "MISSING_ARGUMENT", "session_id is required")
        return
    db = Database(db_path)
    repo = ReviewRepository(db)
    sess = repo.get_session(session_id)
    if not sess:
        emit_error(req_id, "SESSION_NOT_FOUND", f"Session '{session_id}' not found")
        return

    decisions = repo.list_decisions_by_session(session_id)
    sess.submitted_at = datetime.now(timezone.utc).isoformat()
    sess.total_reviewed = len(decisions)
    repo.save_session(sess)
    emit_result(req_id, status="OK", data={
        "session_id": session_id,
        "status": "finished",
        "reviewed_count": len(decisions),
        "finished_at": sess.submitted_at,
    })


def op_review_stats(req_id: str, args: Dict[str, Any], db_path: str):
    task_id = args.get("task_id")
    if not task_id:
        emit_error(req_id, "MISSING_ARGUMENT", "task_id is required")
        return
    db = Database(db_path)
    repo = ReviewRepository(db)
    stats = repo.get_stats(task_id)
    emit_result(req_id, status="OK", data=stats)


def op_sample_thumbnail(req_id: str, args: Dict[str, Any], db_path: str):
    sample_id = args.get("sample_id")
    size = int(args.get("size", 240))
    if not sample_id:
        emit_error(req_id, "MISSING_ARGUMENT", "sample_id is required")
        return
    db = Database(db_path)
    sample_repo = SampleRepository(db)
    sample = sample_repo.get(sample_id)
    if not sample:
        emit_error(req_id, "NOT_FOUND", f"Sample '{sample_id}' not found")
        return

    try:
        real_path = validate_sample_image_path(sample, db_path=db_path)
    except PathSafetyError as e:
        emit_error(req_id, "PATH_SAFETY_ERROR", str(e))
        return

    # Check cache directory
    cache_dir = "data/cache/thumbnails"
    os.makedirs(cache_dir, exist_ok=True)
    import hashlib
    thumb_name = hashlib.sha256(sample_id.encode("utf-8")).hexdigest() + f"_{size}.jpg"
    thumb_path = os.path.abspath(os.path.join(cache_dir, thumb_name))

    if os.path.exists(thumb_path) and os.path.getsize(thumb_path) > 0:
        emit_result(req_id, status="OK", data={
            "sample_id": sample_id,
            "path": thumb_path,
            "media_type": "image/jpeg",
            "cached": True,
        })
        return

    try:
        from PIL import Image
        with Image.open(real_path) as im:
            rgb_im = im.convert("RGB")
            rgb_im.thumbnail((size, size), Image.Resampling.LANCZOS)
            rgb_im.save(thumb_path, "JPEG", quality=85)

        emit_result(req_id, status="OK", data={
            "sample_id": sample_id,
            "path": thumb_path,
            "media_type": "image/jpeg",
            "cached": False,
        })
    except Exception as e:
        emit_error(req_id, "THUMBNAIL_ERROR", f"Failed to generate thumbnail: {e}")


def op_report_get(req_id: str, args: Dict[str, Any], db_path: str):
    task_id = args.get("task_id")
    if not task_id:
        emit_error(req_id, "MISSING_ARGUMENT", "task_id is required")
        return

    db = Database(db_path)
    task_repo = TaskRepository(db)
    sample_repo = SampleRepository(db)
    sug_repo = AuditSuggestionRepository(db)
    rev_repo = ReviewRepository(db)

    task = task_repo.get(task_id)
    if not task:
        emit_error(req_id, "NOT_FOUND", f"Task '{task_id}' not found")
        return

    samples = sample_repo.list_by_task(task_id, limit=100000)
    total_samples = len(samples)

    sugs = sug_repo.list_by_task(task_id)
    decisions = rev_repo.list_decisions_by_task(task_id)

    vlm_audited_count = len(sugs)
    sug_metas = [extract_suggestion_meta(s) for s in sugs]
    vlm_anomalies_count = sum(1 for m in sug_metas if m["suggested_label"] == "FAIL" or m["reason_category"] in ["DISCONTINUITY", "OVERFLOW", "FOREIGN_OBJECT", "ANOMALY", "SCRATCH", "DEFORMATION"])

    human_reviewed_count = len(decisions)
    human_pass_count = sum(1 for d in decisions if d.decision == "PASS")
    human_fail_count = sum(1 for d in decisions if d.decision == "FAIL")
    human_uncertain_count = sum(1 for d in decisions if d.decision == "UNCERTAIN")

    categories: Dict[str, int] = {}
    for m in sug_metas:
        cat = m["reason_category"] or "UNKNOWN"
        categories[cat] = categories.get(cat, 0) + 1

    batches: Dict[str, int] = {}
    for s in samples:
        b = s.batch_id or "default"
        batches[b] = batches.get(b, 0) + 1

    tech_issues = sum(1 for s in samples if (s.width and s.height and s.width * s.height < 10000))
    coverage_pct = round((vlm_audited_count / total_samples * 100), 2) if total_samples > 0 else 0.0

    emit_result(req_id, status="OK", data={
        "task_id": task_id,
        "task_name": getattr(task, "task_name", None) or task.product or task_id,
        "product": task.product,
        "total_samples": total_samples,
        "vlm_audited_count": vlm_audited_count,
        "vlm_coverage_pct": coverage_pct,
        "vlm_anomalies_count": vlm_anomalies_count,
        "technical_quality_issues": tech_issues,
        "human_reviewed_count": human_reviewed_count,
        "human_pass_count": human_pass_count,
        "human_fail_count": human_fail_count,
        "human_uncertain_count": human_uncertain_count,
        "categories": categories,
        "batches": batches,
        "model_name": sug_metas[0]["model_name"] if sug_metas else "NOT_MEASURED",
        "generated_at": datetime.now(timezone.utc).isoformat(),
    })


def op_sample_audit(req_id: str, args: Dict[str, Any], db_path: str):
    """
    DS-S08, DS-S10: Perform on-demand multimodal visual audit on a single sample using local VLM.
    Persists non-authoritative AuditSuggestion without mutating gold truth.
    """
    sample_id = args.get("sample_id")
    model_name = args.get("model_name", "Qwen/Qwen3.8-27B-FP8")

    if not sample_id:
        emit_error(req_id, "MISSING_ARGUMENT", "sample_id is required")
        return

    db = Database(db_path)
    sample_repo = SampleRepository(db)
    sug_repo = AuditSuggestionRepository(db)

    sample = sample_repo.get(sample_id)
    if not sample:
        emit_error(req_id, "NOT_FOUND", f"Sample '{sample_id}' not found")
        return

    try:
        real_path = validate_sample_image_path(sample, db_path=db_path)
    except PathSafetyError as e:
        emit_error(req_id, "PATH_SAFETY_ERROR", str(e))
        return

    try:
        import base64
        import json
        import re
        import urllib.request

        with open(real_path, "rb") as f:
            img_bytes = f.read()
        b64 = base64.b64encode(img_bytes).decode("utf-8")
        ext = os.path.splitext(real_path)[1].lower()
        mime = "image/png" if ext == ".png" else "image/jpeg"

        vlm_endpoint = os.environ.get("LIVE_VLM_ENDPOINT", "http://192.168.2.197:30002/v1/chat/completions")
        vlm_key = os.environ.get("LIVE_VLM_KEY") or os.environ.get("OPENAI_API_KEY") or "sk-123456"

        prompt_text = (
            "你是一名资深工业表面缺陷检测与视觉质检专家。\n"
            "请审计该工业工件图像，判断是否存在工业缺陷（如溢胶、断胶、少胶、气泡、划痕、污渍、异物、形变、偏位等）。\n"
            "请输出严格有效的JSON代码块（格式如下）：\n"
            "{\n"
            '  "suggested_label": "PASS" | "FAIL" | "UNCERTAIN",\n'
            '  "reason_category": "OVERFLOW" | "DISCONTINUITY" | "FOREIGN_OBJECT" | "SCRATCH" | "DEFORMATION" | "NORMAL" | "OTHER",\n'
            '  "confidence": 0.0到1.0之间的浮点数,\n'
            '  "defect_location": "缺陷发生的大致区域或方位",\n'
            '  "description": "详细视觉质检推理过程与判定事实依据"\n'
            "}"
        )

        payload = {
            "model": model_name,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt_text},
                        {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}}
                    ]
                }
            ],
            "temperature": 0.1,
            "max_tokens": 2048
        }

        req = urllib.request.Request(
            vlm_endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {vlm_key}"
            }
        )

        emit_progress(req_id, completed=20, total=100, message=f"Calling multimodal VLM ({model_name})...")
        resp = urllib.request.urlopen(req, timeout=45)
        resp_data = json.loads(resp.read().decode("utf-8"))
        content = resp_data["choices"][0]["message"]["content"].strip()

        # Parse JSON from content
        json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", content, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group(1))
        else:
            brace_match = re.search(r"(\{.*\})", content, re.DOTALL)
            if brace_match:
                parsed = json.loads(brace_match.group(1))
            else:
                parsed = {
                    "suggested_label": "UNCERTAIN",
                    "reason_category": "UNKNOWN",
                    "confidence": 0.5,
                    "description": content
                }

        sug_label = parsed.get("suggested_label", "UNCERTAIN").upper()
        if sug_label not in ["PASS", "FAIL", "UNCERTAIN"]:
            sug_label = "UNCERTAIN"
        reason_cat = parsed.get("reason_category", "UNKNOWN").upper()
        confidence = float(parsed.get("confidence", 0.85))
        desc = parsed.get("description", "")
        defect_loc = parsed.get("defect_location", "")
        if defect_loc:
            desc = f"【位置: {defect_loc}】{desc}"

        sug_id = f"sug_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        c_status = ConclusionStatus.EVIDENCE_SUPPORTED if sug_label in ["PASS", "FAIL"] else ConclusionStatus.INSUFFICIENT_EVIDENCE
        r_action = RecommendedAction.REVIEW if sug_label == "FAIL" else RecommendedAction.IGNORE_CANDIDATE

        obs_item = ObservationItem(phenomenon=reason_cat, description=desc)
        hyp_item = HypothesisItem(label=sug_label, supporting_refs=[desc])
        evidence_item = EvidenceRefItem(kind="multimodal_vlm_audit", sample_id=sample_id, description=f"Model: {model_name}, Confidence: {confidence:.2f}")

        sug_obj = AuditSuggestion(
            suggestion_id=sug_id,
            task_id=sample.task_id,
            sample_id=sample_id,
            session_id="web_interactive_audit",
            model_route=model_name,
            observations=[obs_item],
            hypotheses=[hyp_item],
            conclusion_status=c_status,
            recommended_action=r_action,
            evidence_refs=[evidence_item],
            input_modalities_used=["image", "text"],
        )

        sug_repo.save(sug_obj)

        if sug_label == "FAIL" or reason_cat in ["OVERFLOW", "DISCONTINUITY", "FOREIGN_OBJECT", "ANOMALY", "SCRATCH", "DEFORMATION"]:
            vlm_risk = int(confidence * 100) if confidence > 0.5 else 75
        elif sug_label == "PASS":
            vlm_risk = int((1.0 - confidence) * 30)
        else:
            vlm_risk = 50

        emit_result(req_id, status="OK", data={
            "sample_id": sample_id,
            "visual_suspicion_score": vlm_risk,
            "suggestion": {
                "suggestion_id": sug_id,
                "suggested_label": sug_label,
                "reason_category": reason_cat,
                "model_name": model_name,
                "confidence": confidence,
                "notes": desc,
                "created_at": sug_obj.created_at,
            }
        })
    except Exception as e:
        emit_error(req_id, "VLM_AUDIT_ERROR", f"Multimodal audit failed: {e}")


def op_audit_start(req_id: str, args: Dict[str, Any], db_path: str):
    task_id = args.get("task_id")
    mode = args.get("mode", "HYBRID")
    model_name = args.get("model_name", "Qwen/Qwen3.8-27B-FP8")
    if not task_id:
        emit_error(req_id, "MISSING_ARGUMENT", "task_id is required")
        return

    from iad_core.jobs.manager import JobManager
    db = Database(db_path)
    job_mgr = JobManager(db=db)
    sample_repo = SampleRepository(db)
    samples = sample_repo.list_by_task(task_id, limit=10000)
    total_count = len(samples)

    run_id = f"audit_run_{int(time.time())}_{uuid.uuid4().hex[:6]}"
    job = job_mgr.create_job(
        task_id=task_id,
        job_type=f"AUDIT_{mode}",
        job_id=run_id,
    )
    job_mgr.start_job(run_id, message=f"Starting audit job in {mode} mode with {model_name}")

    emit_result(req_id, status="OK", data={
        "run_id": run_id,
        "task_id": task_id,
        "mode": mode,
        "model_name": model_name,
        "status": "RUNNING",
        "total_samples": total_count,
        "progress": 0.0,
    })


def op_audit_status(req_id: str, args: Dict[str, Any], db_path: str):
    run_id = args.get("run_id")
    if not run_id:
        emit_error(req_id, "MISSING_ARGUMENT", "run_id is required")
        return

    from iad_core.jobs.manager import JobManager
    db = Database(db_path)
    job_mgr = JobManager(db=db)
    job = job_mgr.get_job(run_id)
    if not job:
        emit_error(req_id, "NOT_FOUND", f"Audit job '{run_id}' not found")
        return

    emit_result(req_id, status="OK", data=job.model_dump())


def op_audit_cancel(req_id: str, args: Dict[str, Any], db_path: str):
    run_id = args.get("run_id")
    if not run_id:
        emit_error(req_id, "MISSING_ARGUMENT", "run_id is required")
        return

    from iad_core.jobs.manager import JobManager
    db = Database(db_path)
    job_mgr = JobManager(db=db)
    job = job_mgr.get_job(run_id)
    if not job:
        emit_error(req_id, "NOT_FOUND", f"Audit job '{run_id}' not found")
        return

    job.status = "CANCELLED"
    job.message = "Cancelled by user"
    job.finished_at = datetime.now(timezone.utc).isoformat()
    job_mgr.repo.upsert(job)
    emit_result(req_id, status="OK", data={"run_id": run_id, "status": "CANCELLED"})


OPERATIONS = {
    "tool_call": op_tool_call,
    "dataset_list": op_dataset_list,
    "dataset_get": op_dataset_get,
    "dataset_scan": op_dataset_scan,
    "sample_list": op_sample_list,
    "sample_get": op_sample_get,
    "sample_audit": op_sample_audit,
    "sample_image_path": op_sample_image_path,
    "sample_thumbnail": op_sample_thumbnail,
    "review_queue": op_review_queue,
    "review_evidence": op_review_evidence,
    "review_start_session": op_review_start_session,
    "review_submit_decision": op_review_submit_decision,
    "review_finish_session": op_review_finish_session,
    "review_stats": op_review_stats,
    "report_get": op_report_get,
    "audit_start": op_audit_start,
    "audit_status": op_audit_status,
    "audit_cancel": op_audit_cancel,
}


def dispatch_request(req_data: Dict[str, Any], default_db_path: str = DEFAULT_DB_PATH):
    req_id = req_data.get("request_id", f"req_{int(time.time()*1000)}")
    op = req_data.get("operation")
    arguments = req_data.get("arguments", {})
    db_path = req_data.get("db_path", default_db_path)

    if not op:
        emit_error(req_id, "MISSING_OPERATION", "Field 'operation' is required in request")
        return

    handler = OPERATIONS.get(op)
    if not handler:
        emit_error(req_id, "UNKNOWN_OPERATION", f"Operation '{op}' is not supported. Supported: {list(OPERATIONS.keys())}")
        return

    handler(req_id, arguments, db_path)


def main():
    """
    Entrypoint: reads JSON commands from stdin (or sys.argv[1]),
    dispatches, and emits JSON / NDJSON to stdout.
    """
    # 1. Check CLI argument first
    if len(sys.argv) > 1 and sys.argv[1].strip().startswith("{"):
        raw_cmd = sys.argv[1].strip()
        try:
            req_data = json.loads(raw_cmd)
            dispatch_request(req_data)
        except json.JSONDecodeError as e:
            emit_error("error_decode", "JSON_DECODE_ERROR", str(e))
        return

    # 2. Otherwise read from stdin line-by-line (NDJSON streaming, supports persistent daemon and EOF pipe)
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req_data = json.loads(line)
            dispatch_request(req_data)
        except json.JSONDecodeError as e:
            emit_error("error_decode", "JSON_DECODE_ERROR", f"Failed to parse line: {e}")


if __name__ == "__main__":
    main()
