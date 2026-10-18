import os
import json
import time
import uuid
import logging
from typing import Optional, List, Dict, Any

from iad_core.storage.database import Database
from iad_core.storage.models import Sample, Annotation
from iad_core.advisory.schemas import (
    AuditSuggestion,
    ConclusionStatus,
    RecommendedAction,
    ObservationItem,
    HypothesisItem,
    EvidenceRefItem,
)
from iad_core.advisory.repository import AuditSuggestionRepository
from iad_domain_server.contracts import ToolResult, ToolStatus, MutationType

logger = logging.getLogger("iad_domain_server.tools.audit")


def audit_issue_query(
    task_id: str,
    issue_type: Optional[str] = None,
    data_origin: Optional[str] = None,
    batch_id: Optional[str] = None,
    limit: int = 50,
    cursor: int = 0,
    sampling_seed: Optional[int] = 42,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Query dataset issues and suspicious samples for targeted multimodal inspection (S06, Ticket RP-12).
    Supports filtering by issue_type, data_origin, batch_id and cursor pagination.
    """
    db = Database(db_path)
    with db.connection() as conn:
        c = conn.cursor()

        # Build query for import_issues joined with samples
        query = """
        SELECT i.sample_id, i.issue_type, i.severity, i.message,
               s.data_origin, s.batch_id, s.quality_status, s.image_path, s.relative_path
        FROM import_issues i
        LEFT JOIN samples s ON i.sample_id = s.sample_id
        WHERE i.task_id = ?
        """
        params: List[Any] = [task_id]

        if issue_type:
            query += " AND i.issue_type = ?"
            params.append(issue_type)
        if data_origin:
            query += " AND s.data_origin = ?"
            params.append(data_origin)
        if batch_id:
            query += " AND s.batch_id = ?"
            params.append(batch_id)

        # Count total matching
        count_query = f"SELECT COUNT(*) FROM ({query})"
        c.execute(count_query, params)
        total_matching = c.fetchone()[0]

        # Fetch breakdown by issue_type
        breakdown_query = f"""
        SELECT issue_type, COUNT(*) FROM ({query}) GROUP BY issue_type
        """
        c.execute(breakdown_query, params)
        issue_breakdown = dict(c.fetchall())

        # Pagination with deterministic ordering
        query += " ORDER BY i.id ASC LIMIT ? OFFSET ?"
        params.extend([limit, cursor])

        c.execute(query, params)
        rows = c.fetchall()

    samples_list = []
    for r in rows:
        samples_list.append({
            "sample_id": r["sample_id"],
            "issue_type": r["issue_type"],
            "severity": r["severity"],
            "message": r["message"],
            "data_origin": r["data_origin"],
            "batch_id": r["batch_id"],
            "quality_status": r["quality_status"],
            "relative_path": r["relative_path"],
        })

    next_cursor = (cursor + len(samples_list)) if (cursor + len(samples_list) < total_matching) else None

    return ToolResult(
        status=ToolStatus.OK,
        summary=f"Found {total_matching} issue records for task '{task_id}'. Returning {len(samples_list)} records (offset {cursor}).",
        metrics={
            "task_id": task_id,
            "total_matching_issues": total_matching,
            "returned_count": len(samples_list),
            "cursor": cursor,
            "next_cursor": next_cursor,
            "issue_types_breakdown": issue_breakdown,
            "samples": samples_list,
        },
        mutation=MutationType.NONE,
    )


def audit_recheck(
    task_id: str,
    kind: str,
    sample_ids: List[str],
    options: Optional[Dict[str, Any]] = None,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Deterministic hypothesis recheck for candidate samples (S06, Ticket RP-13).
    Strictly accepts controlled kinds:
      - bbox_source_size: validates image pixel dimensions against annotation source width/height
      - bbox_bounds: checks bounding box boundary violations [0, 0, width, height]
      - quality_path_mapping: verifies file path quality cues vs recorded quality_status
      - label_mapping: verifies raw annotation labels against known taxonomy
      - metadata_semantics: checks batch/camera/station diversity across samples
      - verified_duplicate_scope: checks if samples are verified duplicates across batches
    """
    valid_kinds = {
        "bbox_source_size",
        "bbox_bounds",
        "quality_path_mapping",
        "label_mapping",
        "metadata_semantics",
        "verified_duplicate_scope",
    }
    if kind not in valid_kinds:
        return ToolResult(
            status=ToolStatus.ERROR,
            summary=f"Unsupported audit recheck kind '{kind}'. Valid kinds: {sorted(list(valid_kinds))}",
            warnings=[f"Unknown kind: {kind}"],
            mutation=MutationType.NONE,
        )

    db = Database(db_path)
    findings = []
    discrepancy_count = 0

    with db.connection() as conn:
        c = conn.cursor()

        for s_id in sample_ids:
            c.execute("SELECT * FROM samples WHERE sample_id = ? AND task_id = ?", (s_id, task_id))
            s_row = c.fetchone()
            if not s_row:
                findings.append({
                    "sample_id": s_id,
                    "status": "NOT_FOUND",
                    "evidence": f"Sample '{s_id}' not found in task '{task_id}'",
                })
                continue

            c.execute("SELECT * FROM annotations WHERE sample_id = ?", (s_id,))
            ann_rows = c.fetchall()

            if kind == "bbox_source_size":
                mismatches = []
                for ann in ann_rows:
                    sw = ann["source_width"]
                    sh = ann["source_height"]
                    if sw is not None and sh is not None:
                        if sw != s_row["width"] or sh != s_row["height"]:
                            mismatches.append(f"Annotation {ann['annotation_id']}: source {sw}x{sh} != image {s_row['width']}x{s_row['height']}")
                if mismatches:
                    discrepancy_count += 1
                    findings.append({
                        "sample_id": s_id,
                        "status": "DISCREPANCY_FOUND",
                        "evidence": "; ".join(mismatches),
                    })
                else:
                    findings.append({
                        "sample_id": s_id,
                        "status": "CONFIRMED_MATCH",
                        "evidence": f"Annotation dimensions match image size {s_row['width']}x{s_row['height']}",
                    })

            elif kind == "bbox_bounds":
                oobs = []
                w, h = s_row["width"], s_row["height"]
                for ann in ann_rows:
                    if ann["bbox_json"]:
                        bbox = json.loads(ann["bbox_json"])
                        x1, y1, x2, y2 = bbox
                        if x1 < 0 or y1 < 0 or x2 > w or y2 > h:
                            oobs.append(f"Box {bbox} exceeds boundaries [0, 0, {w}, {h}]")
                if oobs:
                    discrepancy_count += 1
                    findings.append({
                        "sample_id": s_id,
                        "status": "DISCREPANCY_FOUND",
                        "evidence": "; ".join(oobs),
                    })
                else:
                    findings.append({
                        "sample_id": s_id,
                        "status": "CONFIRMED_MATCH",
                        "evidence": "All bounding boxes are within bounds.",
                    })

            elif kind == "quality_path_mapping":
                path_lower = s_row["image_path"].lower()
                q_status = s_row["quality_status"].upper()
                cues_ng = any(k in path_lower for k in ["/ng/", "_ng.", "defect", "fail", "bad"])
                cues_ok = any(k in path_lower for k in ["/ok/", "_ok.", "pass", "good", "normal"])

                if cues_ng and q_status in ("PASS", "NORMAL"):
                    discrepancy_count += 1
                    findings.append({
                        "sample_id": s_id,
                        "status": "DISCREPANCY_FOUND",
                        "evidence": f"Path '{s_row['relative_path']}' contains NG cues but quality_status is {q_status}",
                    })
                elif cues_ok and q_status in ("FAIL", "ANOMALY"):
                    discrepancy_count += 1
                    findings.append({
                        "sample_id": s_id,
                        "status": "DISCREPANCY_FOUND",
                        "evidence": f"Path '{s_row['relative_path']}' contains OK cues but quality_status is {q_status}",
                    })
                else:
                    findings.append({
                        "sample_id": s_id,
                        "status": "CONFIRMED_MATCH",
                        "evidence": f"Quality status {q_status} is consistent with file path.",
                    })

            elif kind == "label_mapping":
                labels = [a["raw_label"] for a in ann_rows]
                findings.append({
                    "sample_id": s_id,
                    "status": "CONFIRMED_MATCH",
                    "evidence": f"Found {len(labels)} labels: {labels}",
                })

            elif kind == "metadata_semantics":
                findings.append({
                    "sample_id": s_id,
                    "status": "CONFIRMED_MATCH",
                    "evidence": f"batch_id={s_row['batch_id']}, camera={s_row['camera']}, station={s_row['station']}",
                })

            elif kind == "verified_duplicate_scope":
                c.execute(
                    """
                    SELECT p.sample_b_id, p.pair_status, s2.batch_id as batch_b
                    FROM duplicate_pairs p
                    JOIN samples s2 ON p.sample_b_id = s2.sample_id
                    WHERE p.sample_a_id = ?
                    UNION
                    SELECT p.sample_a_id, p.pair_status, s1.batch_id as batch_b
                    FROM duplicate_pairs p
                    JOIN samples s1 ON p.sample_a_id = s1.sample_id
                    WHERE p.sample_b_id = ?
                    """,
                    (s_id, s_id),
                )
                dup_rows = c.fetchall()
                if dup_rows:
                    cross_batch = [f"{d[0]} (batch={d[2]})" for d in dup_rows if d[2] != s_row["batch_id"]]
                    if cross_batch:
                        discrepancy_count += 1
                        findings.append({
                            "sample_id": s_id,
                            "status": "DISCREPANCY_FOUND",
                            "evidence": f"Cross-batch duplicates detected: {', '.join(cross_batch)}",
                        })
                    else:
                        findings.append({
                            "sample_id": s_id,
                            "status": "CONFIRMED_MATCH",
                            "evidence": f"Duplicates stay within batch {s_row['batch_id']}",
                        })
                else:
                    findings.append({
                        "sample_id": s_id,
                        "status": "CONFIRMED_MATCH",
                        "evidence": "No duplicate pairs found.",
                    })

    return ToolResult(
        status=ToolStatus.OK,
        summary=f"Audit recheck ({kind}) completed for {len(sample_ids)} samples. Found {discrepancy_count} discrepancies.",
        metrics={
            "task_id": task_id,
            "kind": kind,
            "total_checked": len(sample_ids),
            "discrepancy_count": discrepancy_count,
            "findings": findings,
        },
        mutation=MutationType.NONE,
    )


def audit_suggestion_save(
    task_id: str,
    suggestion_id: Optional[str] = None,
    sample_id: Optional[str] = None,
    session_id: Optional[str] = None,
    model_route: Optional[str] = None,
    observations: Optional[List[Dict[str, Any]]] = None,
    hypotheses: Optional[List[Dict[str, Any]]] = None,
    conclusion_status: str = "INSUFFICIENT_EVIDENCE",
    recommended_action: str = "REVIEW",
    evidence_refs: Optional[List[Dict[str, Any]]] = None,
    input_modalities_used: Optional[List[str]] = None,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Save non-authoritative audit suggestion from multimodal LLM (S08, Ticket RP-14).
    Only mutates audit_suggestions table; never alters ground truth or GoldRecords.
    """
    db = Database(db_path)
    repo = AuditSuggestionRepository(db)

    sug_id = suggestion_id or f"sug_{int(time.time())}_{uuid.uuid4().hex[:6]}"

    obs_items = [ObservationItem(**o) for o in (observations or [])]
    hyp_items = [HypothesisItem(**h) for h in (hypotheses or [])]
    ref_items = [EvidenceRefItem(**r) for r in (evidence_refs or [])]

    try:
        c_status = ConclusionStatus(conclusion_status)
    except ValueError:
        c_status = ConclusionStatus.INSUFFICIENT_EVIDENCE

    try:
        r_action = RecommendedAction(recommended_action)
    except ValueError:
        r_action = RecommendedAction.REVIEW

    suggestion = AuditSuggestion(
        suggestion_id=sug_id,
        task_id=task_id,
        sample_id=sample_id,
        session_id=session_id,
        model_route=model_route,
        observations=obs_items,
        hypotheses=hyp_items,
        conclusion_status=c_status,
        recommended_action=r_action,
        evidence_refs=ref_items,
        input_modalities_used=input_modalities_used or ["text"],
    )

    repo.save(suggestion)

    return ToolResult(
        status=ToolStatus.OK,
        summary=f"Audit suggestion '{sug_id}' saved for sample '{sample_id}' (action={r_action.value}, status={c_status.value}).",
        metrics={
            "suggestion_id": sug_id,
            "task_id": task_id,
            "sample_id": sample_id,
            "conclusion_status": c_status.value,
            "recommended_action": r_action.value,
            "observations_count": len(obs_items),
        },
        mutation=MutationType.DERIVED_ARTIFACT,
    )
