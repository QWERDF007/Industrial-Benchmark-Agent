import os
import json
import logging
from typing import Optional, List, Dict, Any
from PIL import Image
from pydantic import BaseModel

from iad_core.task.config import DatasetConfig, load_config
from iad_core.storage.models import (
    InspectionTask,
    Sample,
    Annotation,
    ImportIssue,
    QualityStatus,
    DataOrigin,
    GeometryStatus,
    AnnotationSource,
    AnnotationType,
)
from iad_core.storage.database import Database
from iad_core.dataset.adapters import get_adapter

logger = logging.getLogger("iad_benchmark.scanner")


class ScanResult(BaseModel):
    dataset_id: str
    task_id: str
    image_count: int
    annotation_count: int
    issue_count: int
    db_path: str


def scan_dataset(
    config_path: Optional[str] = None,
    db_path: str = "data/benchmark.db",
    batch_size: int = 500,
    config: Optional[DatasetConfig] = None,
) -> ScanResult:
    """
    R203: Scan dataset according to YAML config, persist into SQLite database, and return summary.
    """
    if config is not None and config_path is not None:
        raise ValueError("Specify config or config_path, not both")
    config = config or load_config(config_path)
    db = Database(db_path)
    from iad_core.dataset.registry import DatasetRegistry
    DatasetRegistry(db).save(config)

    # 1. Upsert InspectionTask
    with db.connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO inspection_tasks (task_id, product, station, camera, inspection_target, description)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(task_id) DO UPDATE SET
                product = excluded.product,
                station = excluded.station,
                camera = excluded.camera,
                inspection_target = excluded.inspection_target,
                description = excluded.description,
                updated_at = CURRENT_TIMESTAMP
        """, (
            config.task.task_id,
            config.task.product,
            config.task.station,
            config.task.camera,
            config.task.inspection_target,
            config.task.description,
        ))
        # Clear prior issues for idempotent rescan
        cursor.execute("DELETE FROM import_issues WHERE task_id = ?", (config.task.task_id,))

    # 2. Get adapter
    adapter = get_adapter(config)

    sample_batch: List[Sample] = []
    ann_batch: List[Annotation] = []
    issue_batch: List[ImportIssue] = []
    sample_ids_batch: List[str] = []

    total_images = 0
    total_annotations = 0
    total_issues = 0

    bbox_policy = config.annotations.bbox_policy

    def flush_batch():
        nonlocal sample_batch, ann_batch, issue_batch, sample_ids_batch
        if not sample_batch and not issue_batch:
            return

        with db.connection() as conn:
            cursor = conn.cursor()
            if sample_ids_batch:
                cursor.executemany("DELETE FROM annotations WHERE sample_id = ?", [(sid,) for sid in sample_ids_batch])

            if sample_batch:
                cursor.executemany("""
                    INSERT INTO samples (
                        sample_id, task_id, dataset_id, image_path, relative_path,
                        data_origin, physical_sample_id, capture_sequence_id,
                        batch_id, station, camera, width, height, quality_status, quality_source
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(dataset_id, relative_path) DO UPDATE SET
                        task_id = excluded.task_id,
                        image_path = excluded.image_path,
                        data_origin = excluded.data_origin,
                        physical_sample_id = excluded.physical_sample_id,
                        capture_sequence_id = excluded.capture_sequence_id,
                        batch_id = excluded.batch_id,
                        station = excluded.station,
                        camera = excluded.camera,
                        width = excluded.width,
                        height = excluded.height,
                        quality_status = excluded.quality_status,
                        quality_source = excluded.quality_source,
                        updated_at = CURRENT_TIMESTAMP
                """, [
                    (
                        s.sample_id, s.task_id, s.dataset_id, s.image_path, s.relative_path,
                        s.data_origin.value if hasattr(s.data_origin, "value") else str(s.data_origin),
                        s.physical_sample_id, s.capture_sequence_id, s.batch_id,
                        s.station, s.camera, s.width, s.height,
                        s.quality_status.value if hasattr(s.quality_status, "value") else str(s.quality_status),
                        s.quality_source,
                    )
                    for s in sample_batch
                ])

            if ann_batch:
                cursor.executemany("""
                    INSERT INTO annotations (
                        annotation_id, sample_id, annotation_type, raw_label, phenomenon,
                        bbox_json, polygon_json, mask_path, geometry_status, source,
                        source_width, source_height
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(annotation_id) DO UPDATE SET
                        raw_label = excluded.raw_label,
                        phenomenon = excluded.phenomenon,
                        bbox_json = excluded.bbox_json,
                        polygon_json = excluded.polygon_json,
                        mask_path = excluded.mask_path,
                        geometry_status = excluded.geometry_status,
                        source = excluded.source,
                        source_width = excluded.source_width,
                        source_height = excluded.source_height
                """, [
                    (
                        a.annotation_id, a.sample_id,
                        a.annotation_type.value if hasattr(a.annotation_type, "value") else str(a.annotation_type),
                        a.raw_label, a.phenomenon,
                        json.dumps(a.bbox) if a.bbox else None,
                        json.dumps(a.polygon) if a.polygon else None,
                        a.mask_path,
                        a.geometry_status.value if hasattr(a.geometry_status, "value") else str(a.geometry_status),
                        a.source.value if hasattr(a.source, "value") else str(a.source),
                        a.source_width, a.source_height,
                    )
                    for a in ann_batch
                ])

            if issue_batch:
                cursor.executemany("""
                    INSERT INTO import_issues (task_id, dataset_id, sample_id, issue_type, severity, message)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, [
                    (i.task_id, i.dataset_id, i.sample_id, i.issue_type, i.severity, i.message)
                    for i in issue_batch
                ])

        sample_batch.clear()
        ann_batch.clear()
        issue_batch.clear()
        sample_ids_batch.clear()

    # 3. Stream images and process in batches
    for raw_img in adapter.scan_images():
        total_images += 1
        sample_id = f"{config.dataset.id}:{raw_img.relative_path}"
        sample_ids_batch.append(sample_id)

        try:
            with Image.open(raw_img.image_path) as img:
                width, height = img.size
        except Exception as e:
            logger.error(f"Cannot decode image: {raw_img.relative_path} ({e})")
            issue_batch.append(
                ImportIssue(
                    task_id=config.task.task_id,
                    dataset_id=config.dataset.id,
                    sample_id=sample_id,
                    issue_type="INVALID_IMAGE",
                    severity="ERROR",
                    message=f"Corrupted or unreadable image: {e}",
                )
            )
            total_issues += 1
            if len(sample_batch) >= batch_size or len(issue_batch) >= batch_size:
                flush_batch()
            continue

        quality_info = adapter.load_quality(raw_img)
        data_origin = adapter.load_origin(raw_img)
        meta = adapter.load_metadata(raw_img)

        sample = Sample(
            sample_id=sample_id,
            task_id=config.task.task_id,
            dataset_id=config.dataset.id,
            image_path=raw_img.image_path,
            relative_path=raw_img.relative_path,
            data_origin=data_origin,
            physical_sample_id=meta.get("physical_sample_id"),
            capture_sequence_id=meta.get("capture_sequence_id"),
            batch_id=meta.get("batch_id"),
            station=meta.get("station") or config.task.station,
            camera=meta.get("camera") or config.task.camera,
            width=width,
            height=height,
            quality_status=quality_info.quality_status,
            quality_source=quality_info.quality_source,
        )
        sample_batch.append(sample)

        try:
            raw_anns = adapter.load_annotations(raw_img, width, height)
        except Exception as e:
            logger.error(f"Failed to load annotations for {raw_img.relative_path}: {e}")
            issue_batch.append(
                ImportIssue(
                    task_id=config.task.task_id,
                    dataset_id=config.dataset.id,
                    sample_id=sample_id,
                    issue_type="ANNOTATION_PARSE_ERROR",
                    severity="ERROR",
                    message=f"Annotation parse failure: {e}",
                )
            )
            total_issues += 1
            raw_anns = []

        for ann_idx, raw_ann in enumerate(raw_anns):
            ann_id = f"{sample_id}:ann_{ann_idx}"
            raw_label = raw_ann.raw_label
            phenomenon = raw_ann.phenomenon
            source_w = raw_ann.source_width
            source_h = raw_ann.source_height
            geometry_status = GeometryStatus.VALID

            if phenomenon is None and raw_label not in config.annotations.labels:
                phenomenon = "unknown"
                issue_batch.append(
                    ImportIssue(
                        task_id=config.task.task_id,
                        dataset_id=config.dataset.id,
                        sample_id=sample_id,
                        issue_type="UNKNOWN_LABEL",
                        severity="WARNING",
                        message=f"Unknown annotation label: {raw_label}",
                    )
                )
                total_issues += 1

            if source_w is not None and source_h is not None and (source_w != width or source_h != height):
                if bbox_policy.source_size_mismatch == "scale" and source_w > 0 and source_h > 0:
                    scale_x = width / float(source_w)
                    scale_y = height / float(source_h)
                    if raw_ann.bbox:
                        raw_ann.bbox = [
                            round(raw_ann.bbox[0] * scale_x, 2),
                            round(raw_ann.bbox[1] * scale_y, 2),
                            round(raw_ann.bbox[2] * scale_x, 2),
                            round(raw_ann.bbox[3] * scale_y, 2),
                        ]
                    geometry_status = GeometryStatus.SCALED
                else:
                    geometry_status = GeometryStatus.INVALID

            if raw_ann.bbox and geometry_status != GeometryStatus.INVALID:
                xmin, ymin, xmax, ymax = raw_ann.bbox
                if xmin < 0 or ymin < 0 or xmax > width or ymax > height:
                    issue_batch.append(
                        ImportIssue(
                            task_id=config.task.task_id,
                            dataset_id=config.dataset.id,
                            sample_id=sample_id,
                            issue_type="INVALID_BBOX",
                            severity="WARNING" if bbox_policy.out_of_bounds == "clip" else "ERROR",
                            message=f"BBox out of bounds: [{xmin}, {ymin}, {xmax}, {ymax}] for image size {width}x{height}",
                        )
                    )
                    total_issues += 1
                    if bbox_policy.out_of_bounds == "clip":
                        raw_ann.bbox = [
                            max(0.0, min(float(width), xmin)),
                            max(0.0, min(float(height), ymin)),
                            max(0.0, min(float(width), xmax)),
                            max(0.0, min(float(height), ymax)),
                        ]
                        geometry_status = GeometryStatus.CLIPPED
                    else:
                        geometry_status = GeometryStatus.INVALID

            annotation = Annotation(
                annotation_id=ann_id,
                sample_id=sample_id,
                annotation_type=raw_ann.annotation_type,
                raw_label=raw_label,
                phenomenon=phenomenon,
                bbox=raw_ann.bbox,
                polygon=raw_ann.polygon,
                mask_path=raw_ann.mask_path,
                geometry_status=geometry_status,
                source=raw_ann.source,
                source_width=source_w,
                source_height=source_h,
            )
            ann_batch.append(annotation)
            total_annotations += 1

        if len(sample_batch) >= batch_size or len(issue_batch) >= batch_size:
            flush_batch()

    flush_batch()

    return ScanResult(
        dataset_id=config.dataset.id,
        task_id=config.task.task_id,
        image_count=total_images,
        annotation_count=total_annotations,
        issue_count=total_issues,
        db_path=db_path,
    )
