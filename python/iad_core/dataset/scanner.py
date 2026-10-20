import logging
import io
import os
from pathlib import Path
from typing import Optional, List
from PIL import Image
from pydantic import BaseModel

from iad_core.task.config import DatasetConfig, load_config
from iad_core.storage.models import (
    Sample,
    Annotation,
    ImportIssue,
    GeometryStatus,
)
from iad_core.storage.database import Database
from iad_core.storage.repositories import AnnotationRepository
from iad_core.dataset.adapters import get_adapter
from iad_core.dataset.scan_snapshot import ScanSnapshot
from iad_core.evidence.masks import MaskImages

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
    """Scan configured sources and atomically publish current samples, annotations and issues."""
    if config is not None and config_path is not None:
        raise ValueError("Specify config or config_path, not both")
    config = config or load_config(config_path)
    roots = [config.root, *([config.annotations.root] if config.annotations.root else [])]
    for root in roots:
        if not Path(root).is_dir():
            raise FileNotFoundError(f'Dataset directory is unavailable: {root}')
        with os.scandir(root):
            pass
    db = Database(db_path)
    with db.connection() as conn:
        snapshot = ScanSnapshot(conn, config)

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

            AnnotationRepository(db).upsert_batch(ann_batch, connection=conn)

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
            conn.execute("INSERT INTO scan_seen(sample_id) VALUES(?)", (sample_id,))

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
                mask_png = raw_ann.mask_png

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
                        if raw_ann.polygon:
                            raw_ann.polygon = [[round(x*scale_x, 2), round(y*scale_y, 2)] for x, y in raw_ann.polygon]
                        geometry_status = GeometryStatus.SCALED
                        if mask_png:
                            with Image.open(io.BytesIO(mask_png)) as pixels:
                                scaled = pixels.resize((width, height), Image.Resampling.NEAREST)
                            if scaled.getbbox():
                                mask_png = MaskImages.encode(scaled)
                            else:
                                geometry_status = GeometryStatus.INVALID
                                issue_batch.append(ImportIssue(task_id=config.task.task_id, dataset_id=config.dataset.id,
                                    sample_id=sample_id, issue_type="INVALID_MASK", severity="ERROR",
                                    message="Mask scaling erased all foreground pixels"))
                                total_issues += 1
                    else:
                        geometry_status = GeometryStatus.INVALID
                        issue_batch.append(ImportIssue(task_id=config.task.task_id, dataset_id=config.dataset.id,
                            sample_id=sample_id, issue_type="INVALID_BBOX", severity="ERROR",
                            message=f"Annotation source dimensions {source_w}x{source_h} do not match image {width}x{height}"))
                        total_issues += 1

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

                mask_path, mask_sha256 = MaskImages(db_path).store(mask_png) if mask_png else (None, None)
                annotation = Annotation(
                    annotation_id=ann_id,
                    sample_id=sample_id,
                    annotation_type=raw_ann.annotation_type,
                    raw_label=raw_label,
                    phenomenon=phenomenon,
                    bbox=raw_ann.bbox,
                    polygon=raw_ann.polygon,
                    mask_path=mask_path,
                    mask_sha256=mask_sha256,
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

        total_issues += snapshot.publish(db, config)

        return ScanResult(
            dataset_id=config.dataset.id,
            task_id=config.task.task_id,
            image_count=total_images,
            annotation_count=total_annotations,
            issue_count=total_issues,
            db_path=db_path,
        )
