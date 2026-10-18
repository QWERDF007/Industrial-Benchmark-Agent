import os
import logging
from typing import List, Dict, Any, Optional

from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository, AnnotationRepository
from iad_core.evidence.views import generate_sample_view, generate_region_view
from iad_domain_server.contracts import ToolResult, ToolStatus, MutationType

logger = logging.getLogger("iad_domain_server.tools.image")


def sample_view(
    task_id: str,
    sample_id: str,
    view: str = "raw",
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Fetch raw or annotation overlay view for an inspection sample (S05, RP-09).
    view options: 'raw' (default), 'annotation_overlay'.
    """
    db = Database(db_path)
    sample_repo = SampleRepository(db)
    anno_repo = AnnotationRepository(db)

    sample = sample_repo.get(sample_id)
    if not sample or sample.task_id != task_id:
        return ToolResult(
            status=ToolStatus.ERROR,
            summary=f"Sample '{sample_id}' not found in task '{task_id}'.",
            mutation=MutationType.NONE,
        )

    annotations = anno_repo.list_by_sample(sample_id)

    try:
        view_info = generate_sample_view(sample, annotations, view=view)
    except Exception as e:
        logger.error(f"Failed to generate view for {sample_id}: {e}")
        return ToolResult(
            status=ToolStatus.ERROR,
            summary=f"View generation failed: {str(e)}",
            warnings=[str(e)],
            mutation=MutationType.NONE,
        )

    return ToolResult(
        status=ToolStatus.OK,
        summary=f"Sample view generated for '{sample_id}' (view={view}, size={view_info['width']}x{view_info['height']}).",
        metrics={
            "task_id": task_id,
            "sample_id": sample_id,
            "view_type": view_info["view_type"],
            "width": view_info["width"],
            "height": view_info["height"],
            "view_path": view_info["view_path"],
            "annotations_count": len(view_info["annotations"]),
            "annotations": view_info["annotations"],
            "image_endpoint": f"/internal/sample/{sample_id}/image?view={view}",
        },
        mutation=MutationType.DERIVED_ARTIFACT if view == "annotation_overlay" else MutationType.NONE,
    )


def region_view(
    task_id: str,
    sample_id: str,
    bbox_xyxy: List[int],
    padding_ratio: float = 0.1,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Crop and inspect high-resolution subregion from a sample (S05, RP-10).
    Preserves exact coordinate mapping back to the full image.
    """
    db = Database(db_path)
    sample_repo = SampleRepository(db)

    sample = sample_repo.get(sample_id)
    if not sample or sample.task_id != task_id:
        return ToolResult(
            status=ToolStatus.ERROR,
            summary=f"Sample '{sample_id}' not found in task '{task_id}'.",
            mutation=MutationType.NONE,
        )

    try:
        region_info = generate_region_view(sample, bbox_xyxy, padding_ratio=padding_ratio)
    except Exception as e:
        logger.error(f"Failed to crop region for {sample_id}: {e}")
        return ToolResult(
            status=ToolStatus.ERROR,
            summary=f"Region view failed: {str(e)}",
            warnings=[str(e)],
            mutation=MutationType.NONE,
        )

    bbox_str = ",".join(str(v) for v in bbox_xyxy)
    return ToolResult(
        status=ToolStatus.OK,
        summary=f"Region view created for '{sample_id}' at bbox {bbox_xyxy} (crop size: {region_info['crop_width']}x{region_info['crop_height']}).",
        metrics={
            "task_id": task_id,
            "sample_id": sample_id,
            "original_bbox": region_info["original_bbox"],
            "crop_bbox": region_info["crop_bbox"],
            "crop_width": region_info["crop_width"],
            "crop_height": region_info["crop_height"],
            "scale_mapping": region_info["scale_mapping"],
            "view_path": region_info["view_path"],
            "image_endpoint": f"/internal/sample/{sample_id}/image?bbox={bbox_str}&padding={padding_ratio}",
        },
        mutation=MutationType.DERIVED_ARTIFACT,
    )


def samples_compare(
    task_id: str,
    sample_ids: List[str],
    roles: Optional[List[str]] = None,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Compare multiple samples side-by-side with distinct assigned roles (S05, RP-11).
    E.g. candidate vs normal reference vs historical neighbor.
    """
    db = Database(db_path)
    sample_repo = SampleRepository(db)

    items = []
    missing = []
    for idx, s_id in enumerate(sample_ids):
        sample = sample_repo.get(s_id)
        if not sample or sample.task_id != task_id:
            missing.append(s_id)
            continue
        role = roles[idx] if roles and idx < len(roles) else ("candidate" if idx == 0 else "reference")
        items.append({
            "sample_id": s_id,
            "role": role,
            "quality_status": sample.quality_status.value if hasattr(sample.quality_status, "value") else str(sample.quality_status),
            "width": sample.width,
            "height": sample.height,
            "view_path": sample.image_path,
            "image_endpoint": f"/internal/sample/{s_id}/image?view=raw",
        })

    if not items:
        return ToolResult(
            status=ToolStatus.ERROR,
            summary=f"None of the requested samples exist in task '{task_id}'. Missing: {missing}",
            mutation=MutationType.NONE,
        )

    warnings = [f"Samples not found: {missing}"] if missing else []

    return ToolResult(
        status=ToolStatus.OK,
        summary=f"Prepared comparative view for {len(items)} samples across task '{task_id}'.",
        metrics={
            "task_id": task_id,
            "compared_count": len(items),
            "samples": items,
        },
        warnings=warnings,
        mutation=MutationType.NONE,
    )
