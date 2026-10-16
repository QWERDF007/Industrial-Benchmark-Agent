import json
import sqlite3
from typing import Optional, List, Dict, Any
from app.storage.database import Database
from app.schemas.task import InspectionTask
from app.schemas.sample import Sample, QualityStatus
from app.schemas.annotation import Annotation, AnnotationType, AnnotationSource
from app.schemas.issue import ImportIssue, IssueType, Severity


class TaskRepository:
    def __init__(self, db: Database):
        self.db = db

    def upsert(self, task: InspectionTask):
        with self.db.connection() as conn:
            conn.execute(
                """
                INSERT INTO inspection_tasks (
                    task_id, product, station, camera, inspection_target, description, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(task_id) DO UPDATE SET
                    product = excluded.product,
                    station = excluded.station,
                    camera = excluded.camera,
                    inspection_target = excluded.inspection_target,
                    description = excluded.description,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (
                    task.task_id,
                    task.product,
                    task.station,
                    task.camera,
                    task.inspection_target,
                    task.description,
                ),
            )

    def get(self, task_id: str) -> Optional[InspectionTask]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM inspection_tasks WHERE task_id = ?", (task_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return InspectionTask(
                task_id=row["task_id"],
                product=row["product"],
                station=row["station"],
                camera=row["camera"],
                inspection_target=row["inspection_target"],
                description=row["description"],
            )

    def list(self) -> List[InspectionTask]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM inspection_tasks ORDER BY id ASC")
            rows = cursor.fetchall()
            return [
                InspectionTask(
                    task_id=r["task_id"],
                    product=r["product"],
                    station=r["station"],
                    camera=r["camera"],
                    inspection_target=r["inspection_target"],
                    description=r["description"],
                )
                for r in rows
            ]


class SampleRepository:
    def __init__(self, db: Database):
        self.db = db

    def upsert(self, sample: Sample):
        self.upsert_batch([sample])

    def upsert_batch(self, samples: List[Sample]):
        if not samples:
            return
        data = [
            (
                s.sample_id,
                s.task_id,
                s.dataset_id,
                s.image_path,
                s.relative_path,
                s.physical_sample_id,
                s.capture_sequence_id,
                s.batch_id,
                s.station,
                s.camera,
                s.width,
                s.height,
                s.quality_status.value if isinstance(s.quality_status, QualityStatus) else str(s.quality_status),
                s.quality_source,
            )
            for s in samples
        ]
        with self.db.connection() as conn:
            conn.executemany(
                """
                INSERT INTO samples (
                    sample_id, task_id, dataset_id, image_path, relative_path,
                    physical_sample_id, capture_sequence_id, batch_id, station, camera,
                    width, height, quality_status, quality_source, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(task_id, relative_path) DO UPDATE SET
                    sample_id = excluded.sample_id,
                    dataset_id = excluded.dataset_id,
                    image_path = excluded.image_path,
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
                """,
                data,
            )

    def get(self, sample_id: str) -> Optional[Sample]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM samples WHERE sample_id = ?", (sample_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return self._row_to_sample(row)

    def get_by_task_and_relative_path(self, task_id: str, relative_path: str) -> Optional[Sample]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM samples WHERE task_id = ? AND relative_path = ?",
                (task_id, relative_path),
            )
            row = cursor.fetchone()
            if not row:
                return None
            return self._row_to_sample(row)

    def count_by_task(self, task_id: str) -> int:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM samples WHERE task_id = ?", (task_id,))
            return cursor.fetchone()[0]

    def list_by_task(
        self, task_id: str, limit: Optional[int] = None, offset: int = 0
    ) -> List[Sample]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            query = "SELECT * FROM samples WHERE task_id = ? ORDER BY id ASC"
            params: list = [task_id]
            if limit is not None:
                query += " LIMIT ? OFFSET ?"
                params.extend([limit, offset])
            cursor.execute(query, params)
            return [self._row_to_sample(r) for r in cursor.fetchall()]

    def sample_random(self, task_id: str, n: int) -> List[Sample]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM samples WHERE task_id = ? ORDER BY RANDOM() LIMIT ?",
                (task_id, n),
            )
            return [self._row_to_sample(r) for r in cursor.fetchall()]

    @staticmethod
    def _row_to_sample(row: sqlite3.Row) -> Sample:
        return Sample(
            sample_id=row["sample_id"],
            task_id=row["task_id"],
            dataset_id=row["dataset_id"],
            image_path=row["image_path"],
            relative_path=row["relative_path"],
            physical_sample_id=row["physical_sample_id"],
            capture_sequence_id=row["capture_sequence_id"],
            batch_id=row["batch_id"],
            station=row["station"],
            camera=row["camera"],
            width=row["width"],
            height=row["height"],
            quality_status=QualityStatus(row["quality_status"]),
            quality_source=row["quality_source"],
        )


class AnnotationRepository:
    def __init__(self, db: Database):
        self.db = db

    def upsert(self, annotation: Annotation):
        self.upsert_batch([annotation])

    def upsert_batch(self, annotations: List[Annotation]):
        if not annotations:
            return
        data = [
            (
                a.annotation_id,
                a.sample_id,
                a.annotation_type.value if isinstance(a.annotation_type, AnnotationType) else str(a.annotation_type),
                a.raw_label,
                a.phenomenon,
                json.dumps(a.bbox) if a.bbox is not None else None,
                json.dumps(a.polygon) if a.polygon is not None else None,
                a.mask_path,
                a.source.value if isinstance(a.source, AnnotationSource) else str(a.source),
            )
            for a in annotations
        ]
        with self.db.connection() as conn:
            conn.executemany(
                """
                INSERT INTO annotations (
                    annotation_id, sample_id, annotation_type, raw_label, phenomenon,
                    bbox_json, polygon_json, mask_path, source, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(annotation_id) DO UPDATE SET
                    annotation_type = excluded.annotation_type,
                    raw_label = excluded.raw_label,
                    phenomenon = excluded.phenomenon,
                    bbox_json = excluded.bbox_json,
                    polygon_json = excluded.polygon_json,
                    mask_path = excluded.mask_path,
                    source = excluded.source,
                    updated_at = CURRENT_TIMESTAMP
                """,
                data,
            )

    def delete_by_sample_id(self, sample_id: str):
        with self.db.connection() as conn:
            conn.execute("DELETE FROM annotations WHERE sample_id = ?", (sample_id,))

    def delete_by_sample_ids(self, sample_ids: List[str]):
        if not sample_ids:
            return
        with self.db.connection() as conn:
            # Delete in chunks of 500 to stay under SQLite variable limits
            chunk_size = 500
            for i in range(0, len(sample_ids), chunk_size):
                chunk = sample_ids[i : i + chunk_size]
                placeholders = ",".join("?" for _ in chunk)
                conn.execute(
                    f"DELETE FROM annotations WHERE sample_id IN ({placeholders})", chunk
                )

    def list_by_sample(self, sample_id: str) -> List[Annotation]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM annotations WHERE sample_id = ? ORDER BY id ASC",
                (sample_id,),
            )
            return [self._row_to_annotation(r) for r in cursor.fetchall()]

    def sample_random(self, task_id: str, n: int) -> List[Annotation]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT a.* FROM annotations a
                JOIN samples s ON a.sample_id = s.sample_id
                WHERE s.task_id = ?
                ORDER BY RANDOM() LIMIT ?
                """,
                (task_id, n),
            )
            return [self._row_to_annotation(r) for r in cursor.fetchall()]

    def count_by_task(self, task_id: str) -> int:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT COUNT(*) FROM annotations a
                JOIN samples s ON a.sample_id = s.sample_id
                WHERE s.task_id = ?
                """,
                (task_id,),
            )
            return cursor.fetchone()[0]

    @staticmethod
    def _row_to_annotation(row: sqlite3.Row) -> Annotation:
        return Annotation(
            annotation_id=row["annotation_id"],
            sample_id=row["sample_id"],
            annotation_type=AnnotationType(row["annotation_type"]),
            raw_label=row["raw_label"],
            phenomenon=row["phenomenon"],
            bbox=json.loads(row["bbox_json"]) if row["bbox_json"] else None,
            polygon=json.loads(row["polygon_json"]) if row["polygon_json"] else None,
            mask_path=row["mask_path"],
            source=AnnotationSource(row["source"]),
        )


class IssueRepository:
    def __init__(self, db: Database):
        self.db = db

    def add(self, issue: ImportIssue):
        self.add_batch([issue])

    def add_batch(self, issues: List[ImportIssue]):
        if not issues:
            return
        data = [
            (
                issue.task_id,
                issue.sample_id,
                issue.issue_type.value if isinstance(issue.issue_type, IssueType) else str(issue.issue_type),
                issue.severity.value if isinstance(issue.severity, Severity) else str(issue.severity),
                issue.message,
            )
            for issue in issues
        ]
        with self.db.connection() as conn:
            conn.executemany(
                """
                INSERT INTO import_issues (task_id, sample_id, issue_type, severity, message)
                VALUES (?, ?, ?, ?, ?)
                """,
                data,
            )

    def list_by_task(self, task_id: str) -> List[ImportIssue]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM import_issues WHERE task_id = ? ORDER BY id ASC",
                (task_id,),
            )
            rows = cursor.fetchall()
            return [
                ImportIssue(
                    issue_id=str(r["id"]),
                    task_id=r["task_id"],
                    sample_id=r["sample_id"],
                    issue_type=IssueType(r["issue_type"]),
                    severity=Severity(r["severity"]),
                    message=r["message"],
                )
                for r in rows
            ]

    def count_by_task(self, task_id: str) -> int:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM import_issues WHERE task_id = ?", (task_id,))
            return cursor.fetchone()[0]

    def clear_by_task(self, task_id: str):
        with self.db.connection() as conn:
            conn.execute("DELETE FROM import_issues WHERE task_id = ?", (task_id,))
