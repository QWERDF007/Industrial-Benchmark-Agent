import os
import logging
from typing import Optional, List
from PIL import Image
from pydantic import BaseModel, Field

from app.schemas.config import DatasetConfig, load_config
from app.schemas.task import InspectionTask
from app.schemas.sample import Sample, QualityStatus, DataOrigin
from app.schemas.annotation import Annotation, AnnotationType, AnnotationSource, GeometryStatus
from app.schemas.issue import ImportIssue, IssueType, Severity
from app.storage.database import Database
from app.storage.repositories import (
    TaskRepository,
    SampleRepository,
    AnnotationRepository,
    IssueRepository,
)
from app.adapters import get_adapter

logger = logging.getLogger("iad_benchmark.scanner")


class ScanResult(BaseModel):
    dataset_id: str
    task_id: str
    image_count: int
    annotation_count: int
    issue_count: int
    db_path: str


def scan_dataset(
    config_path: str,
    db_path: str = "data/benchmark.db",
    batch_size: int = 500,
) -> ScanResult:
    """Scan dataset according to YAML config, persist into SQLite database, and return summary."""
    config = load_config(config_path)
    db = Database(db_path)

    task_repo = TaskRepository(db)
    sample_repo = SampleRepository(db)
    ann_repo = AnnotationRepository(db)
    issue_repo = IssueRepository(db)

    # 1. Upsert InspectionTask
    task = InspectionTask(
        task_id=config.task.task_id,
        product=config.task.product,
        station=config.task.station,
        camera=config.task.camera,
        inspection_target=config.task.inspection_target,
        description=config.task.description,
    )
    task_repo.upsert(task)
    logger.info(f"Initialized task: {task.task_id}")

    # Clear prior issues for this task on rescan to remain idempotent
    issue_repo.clear_by_task(task.task_id)

    # 2. Get adapter
    adapter = get_adapter(config)

    # 3. Stream images and process in batches
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

        if sample_ids_batch:
            # Clean old annotations for idempotent rescan
            ann_repo.delete_by_sample_ids(sample_ids_batch)

        if sample_batch:
            sample_repo.upsert_batch(sample_batch)
        if ann_batch:
            ann_repo.upsert_batch(ann_batch)
        if issue_batch:
            issue_repo.add_batch(issue_batch)

        sample_batch.clear()
        ann_batch.clear()
        issue_batch.clear()
        sample_ids_batch.clear()

    for raw_img in adapter.scan_images():
        total_images += 1
        sample_id = f"{config.dataset.id}:{raw_img.relative_path}"
        sample_ids_batch.append(sample_id)

        # A. Read image dimensions
        try:
            with Image.open(raw_img.image_path) as img:
                width, height = img.size
        except Exception as e:
            logger.error(f"Cannot decode image: {raw_img.relative_path} ({e})")
            issue_batch.append(
                ImportIssue(
                    task_id=task.task_id,
                    sample_id=sample_id,
                    issue_type=IssueType.INVALID_IMAGE,
                    severity=Severity.ERROR,
                    message=f"Corrupted or unreadable image: {e}",
                )
            )
            total_issues += 1
            if len(sample_batch) >= batch_size or len(issue_batch) >= batch_size:
                flush_batch()
            continue

        # B. Resolve quality status and origin
        quality_info = adapter.load_quality(raw_img)
        data_origin = adapter.load_origin(raw_img)

        # C. Resolve metadata
        meta = adapter.load_metadata(raw_img)
        batch_id = meta.get("batch_id")
        physical_sample_id = meta.get("physical_sample_id")
        capture_sequence_id = meta.get("capture_sequence_id")
        station = meta.get("station") or config.task.station
        camera = meta.get("camera") or config.task.camera

        sample = Sample(
            sample_id=sample_id,
            task_id=task.task_id,
            dataset_id=config.dataset.id,
            image_path=raw_img.image_path,
            relative_path=raw_img.relative_path,
            data_origin=data_origin,
            physical_sample_id=physical_sample_id,
            capture_sequence_id=capture_sequence_id,
            batch_id=batch_id,
            station=station,
            camera=camera,
            width=width,
            height=height,
            quality_status=quality_info.quality_status,
            quality_source=quality_info.quality_source,
        )
        sample_batch.append(sample)

        # D. Resolve annotations
        try:
            raw_anns = adapter.load_annotations(raw_img, width, height)
        except Exception as e:
            logger.error(f"Failed to load annotations for {raw_img.relative_path}: {e}")
            issue_batch.append(
                ImportIssue(
                    task_id=task.task_id,
                    sample_id=sample_id,
                    issue_type=IssueType.ANNOTATION_PARSE_ERROR,
                    severity=Severity.ERROR,
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

            # Unknown label handling
            if phenomenon is None and raw_label not in config.annotations.labels:
                phenomenon = "unknown"
                logger.warning(f"Unknown annotation label '{raw_label}' in {raw_img.relative_path}")
                issue_batch.append(
                    ImportIssue(
                        task_id=task.task_id,
                        sample_id=sample_id,
                        issue_type=IssueType.UNKNOWN_LABEL,
                        severity=Severity.WARNING,
                        message=f"Unknown annotation label: {raw_label}",
                    )
                )
                total_issues += 1

            # Source size mismatch check (C03)
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
                    if raw_ann.polygon:
                        raw_ann.polygon = [
                            [round(p[0] * scale_x, 2), round(p[1] * scale_y, 2)]
                            for p in raw_ann.polygon
                        ]
                    geometry_status = GeometryStatus.SCALED
                else:
                    geometry_status = GeometryStatus.INVALID
                    issue_batch.append(
                        ImportIssue(
                            task_id=task.task_id,
                            sample_id=sample_id,
                            issue_type=IssueType.ANNOTATION_PARSE_ERROR,
                            severity=Severity.WARNING,
                            message=f"Source image size {source_w}x{source_h} mismatches actual {width}x{height}",
                        )
                    )
                    total_issues += 1

            # BBox geometry bounds check
            bbox = raw_ann.bbox
            if bbox is not None and geometry_status != GeometryStatus.INVALID:
                xmin, ymin, xmax, ymax = bbox
                inverted = (xmin >= xmax or ymin >= ymax)
                out_of_bounds = (xmin < 0 or ymin < 0 or xmax > width or ymax > height)

                if inverted:
                    geometry_status = GeometryStatus.INVALID
                    issue_batch.append(
                        ImportIssue(
                            task_id=task.task_id,
                            sample_id=sample_id,
                            issue_type=IssueType.INVALID_BBOX,
                            severity=Severity.WARNING,
                            message=f"Inverted bbox coordinates {bbox}",
                        )
                    )
                    total_issues += 1
                elif out_of_bounds:
                    issue_batch.append(
                        ImportIssue(
                            task_id=task.task_id,
                            sample_id=sample_id,
                            issue_type=IssueType.INVALID_BBOX,
                            severity=Severity.WARNING,
                            message=f"BBox {bbox} out of bounds for image {width}x{height}",
                        )
                    )
                    total_issues += 1
                    if bbox_policy.out_of_bounds == "clip":
                        c_xmin = max(0.0, min(float(width), xmin))
                        c_ymin = max(0.0, min(float(height), ymin))
                        c_xmax = max(0.0, min(float(width), xmax))
                        c_ymax = max(0.0, min(float(height), ymax))
                        if c_xmin < c_xmax and c_ymin < c_ymax:
                            bbox = [round(c_xmin, 2), round(c_ymin, 2), round(c_xmax, 2), round(c_ymax, 2)]
                            geometry_status = GeometryStatus.CLIPPED
                        else:
                            geometry_status = GeometryStatus.INVALID
                    else:
                        # Default "reject"
                        geometry_status = GeometryStatus.INVALID

            ann = Annotation(
                annotation_id=ann_id,
                sample_id=sample_id,
                annotation_type=raw_ann.annotation_type,
                raw_label=raw_label,
                phenomenon=phenomenon,
                bbox=bbox,
                polygon=raw_ann.polygon,
                mask_path=raw_ann.mask_path,
                geometry_status=geometry_status,
                source_width=source_w,
                source_height=source_h,
                source=raw_ann.source,
            )
            ann_batch.append(ann)
            total_annotations += 1

        if total_images % 1000 == 0:
            logger.info(f"Scanned {total_images} images...")

        if len(sample_batch) >= batch_size or len(issue_batch) >= batch_size:
            flush_batch()

    # Flush remaining
    flush_batch()

    logger.info(
        f"Scan complete. Images: {total_images}, Annotations: {total_annotations}, Issues: {total_issues}"
    )

    return ScanResult(
        dataset_id=config.dataset.id,
        task_id=task.task_id,
        image_count=total_images,
        annotation_count=total_annotations,
        issue_count=total_issues,
        db_path=os.path.abspath(db_path),
    )
