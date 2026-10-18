import os
import json
import logging
from typing import Optional, Dict, Any

from iad_core.storage.database import Database
from iad_core.dataset.audit import DatasetAuditService
from iad_core.task.config import load_config
from iad_domain_server.contracts import ToolResult, ToolStatus, MutationType, ArtifactRef

logger = logging.getLogger("iad_domain_server.tools.dataset")


def dataset_audit(
    task_id: str,
    config_path: Optional[str] = None,
    output_dir: Optional[str] = None,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Audit dataset integrity, geometry validity, and benchmark track readiness (R304).
    """
    db = Database(db_path)
    audit_service = DatasetAuditService(db)
    config = load_config(config_path) if config_path and os.path.exists(config_path) else None

    out_dir = output_dir or os.path.join("runs", "audit", task_id)
    os.makedirs(out_dir, exist_ok=True)
    report_json_path = os.path.join(out_dir, "audit_report.json")
    report_md_path = os.path.join(out_dir, "audit_report.md")

    audit_res = audit_service.audit(
        task_id,
        config_path=config_path,
        output_dir=out_dir,
        config=config,
    )

    # Determine status
    std_ad = audit_res.track_readiness.get("Standard AD") or audit_res.track_readiness.get("standard_ad", "NOT_READY")
    if std_ad == "READY":
        status = ToolStatus.OK
    elif std_ad == "PARTIAL":
        status = ToolStatus.PARTIAL
    else:
        status = ToolStatus.NOT_READY

    artifacts = [
        ArtifactRef(
            artifact_id=f"audit_json_{task_id}",
            artifact_type="audit_report_json",
            uri=f"iad://task/{task_id}/audit.json",
            path=os.path.abspath(report_json_path),
            summary="Dataset audit metrics and track readiness in JSON format",
        ),
        ArtifactRef(
            artifact_id=f"audit_md_{task_id}",
            artifact_type="audit_report_markdown",
            uri=f"iad://task/{task_id}/audit.md",
            path=os.path.abspath(report_md_path),
            summary="Dataset audit executive report in Markdown format",
        ),
    ]

    warnings = []
    if audit_res.issues:
        total_issues = sum(audit_res.issues.values())
        warnings.append(f"Audit identified {total_issues} issues in dataset (see report for details).")
    if audit_res.samples.get("pass", 0) < 10:
        warnings.append("Confirmed normal samples count is critically low. Hard normal review required.")

    next_actions = ["Call feature_prepare to extract representations."]
    if status == ToolStatus.PARTIAL:
        next_actions.append("Mine hard normal candidates with candidate_mine to expand normal pool.")

    return ToolResult(
        status=status,
        summary=f"Dataset audited for '{task_id}': {audit_res.samples.get('total', 0)} samples. Track standard_ad: {std_ad}.",
        metrics={
            "samples": audit_res.samples,
            "annotations": audit_res.annotations,
            "track_readiness": audit_res.track_readiness,
            "geometry": audit_res.geometry,
            "issues_count": sum(audit_res.issues.values()) if audit_res.issues else 0,
        },
        artifacts=artifacts,
        warnings=warnings,
        next_actions=next_actions,
        mutation=MutationType.DERIVED_ARTIFACT,
    )
