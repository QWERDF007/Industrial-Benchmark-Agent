import json
import sqlite3
from contextlib import nullcontext
from typing import Optional, List, Dict, Any

from iad_core.storage.database import Database
from iad_core.storage.models import (
    InspectionTask,
    Sample,
    QualityStatus,
    DataOrigin,
    Annotation,
    AnnotationType,
    AnnotationSource,
    GeometryStatus,
    ImportIssue,
    FeatureRecord,
    GoldRecord,
    BenchmarkBuildRecord,
    SplitAssignmentRecord,
    EvaluationRunRecord,
    JobRunRecord,
    AgentRunRecord,
)


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
                s.dataset_id or s.task_id or "default",
                s.image_path,
                s.relative_path,
                s.data_origin.value if isinstance(s.data_origin, DataOrigin) else str(s.data_origin),
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
                    sample_id, task_id, dataset_id, image_path, relative_path, data_origin,
                    physical_sample_id, capture_sequence_id, batch_id, station, camera,
                    width, height, quality_status, quality_source, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(dataset_id, relative_path) DO UPDATE SET
                    sample_id = excluded.sample_id,
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

    def get_by_dataset_and_relative_path(self, dataset_id: str, relative_path: str) -> Optional[Sample]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM samples WHERE dataset_id = ? AND relative_path = ?",
                (dataset_id, relative_path),
            )
            row = cursor.fetchone()
            if not row:
                return None
            return self._row_to_sample(row)

    def get_many(self, sample_ids: List[str]) -> List[Sample]:
        if not sample_ids:
            return []
        with self.db.connection() as conn:
            cursor = conn.cursor()
            placeholders = ",".join("?" for _ in sample_ids)
            cursor.execute(
                f"SELECT * FROM samples WHERE sample_id IN ({placeholders})",
                sample_ids,
            )
            return [self._row_to_sample(r) for r in cursor.fetchall()]

    def count_by_task(self, task_id: str) -> int:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM samples WHERE task_id = ? AND is_excluded=0", (task_id,))
            return cursor.fetchone()[0]

    def list_by_task(
        self, task_id: str, limit: Optional[int] = None, offset: int = 0
    ) -> List[Sample]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            query = "SELECT * FROM samples WHERE task_id = ? AND is_excluded=0 ORDER BY id ASC"
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
                "SELECT * FROM samples WHERE task_id = ? AND is_excluded=0 ORDER BY RANDOM() LIMIT ?",
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
            data_origin=DataOrigin(row["data_origin"]) if "data_origin" in row.keys() and row["data_origin"] else DataOrigin.UNKNOWN,
            physical_sample_id=row["physical_sample_id"],
            capture_sequence_id=row["capture_sequence_id"],
            batch_id=row["batch_id"],
            station=row["station"],
            camera=row["camera"],
            width=row["width"],
            height=row["height"],
            quality_status=QualityStatus(row["quality_status"]),
            quality_source=row["quality_source"],
            is_excluded=bool(row['is_excluded']),
        )


class AnnotationRepository:
    def __init__(self, db: Database):
        self.db = db

    def upsert(self, annotation: Annotation):
        self.upsert_batch([annotation])

    def upsert_batch(self, annotations: List[Annotation], connection: Optional[sqlite3.Connection] = None):
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
                a.mask_sha256,
                a.geometry_status.value if isinstance(a.geometry_status, GeometryStatus) else str(a.geometry_status),
                a.source_width,
                a.source_height,
                a.source.value if isinstance(a.source, AnnotationSource) else str(a.source),
            )
            for a in annotations
        ]
        with nullcontext(connection) if connection is not None else self.db.connection() as conn:
            conn.executemany(
                """
                INSERT INTO annotations (
                    annotation_id, sample_id, annotation_type, raw_label, phenomenon,
                    bbox_json, polygon_json, mask_path, mask_sha256, geometry_status, source_width, source_height,
                    source, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(annotation_id) DO UPDATE SET
                    annotation_type = excluded.annotation_type,
                    raw_label = excluded.raw_label,
                    phenomenon = excluded.phenomenon,
                    bbox_json = excluded.bbox_json,
                    polygon_json = excluded.polygon_json,
                    mask_path = excluded.mask_path,
                    mask_sha256 = excluded.mask_sha256,
                    geometry_status = excluded.geometry_status,
                    source_width = excluded.source_width,
                    source_height = excluded.source_height,
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
            mask_sha256=row["mask_sha256"],
            geometry_status=GeometryStatus(row["geometry_status"]) if "geometry_status" in row.keys() and row["geometry_status"] else GeometryStatus.VALID,
            source_width=row["source_width"] if "source_width" in row.keys() else None,
            source_height=row["source_height"] if "source_height" in row.keys() else None,
            source=AnnotationSource(row["source"]) if "source" in row.keys() and row["source"] else AnnotationSource.IMPORTED,
        )


class ImportIssueRepository:
    def __init__(self, db: Database):
        self.db = db

    def add(self, issue: ImportIssue):

        self.add_batch([issue])

    def add_batch(self, issues: List[ImportIssue]):
        if not issues:
            return
        data = [
            (
                issue.task_id or "",
                issue.dataset_id or "UNKNOWN",
                issue.sample_id,
                str(issue.issue_type.value) if hasattr(issue.issue_type, "value") else str(issue.issue_type),
                str(issue.severity.value) if hasattr(issue.severity, "value") else str(issue.severity),
                issue.message,
            )
            for issue in issues
        ]

        with self.db.connection() as conn:
            conn.executemany(
                """
                INSERT INTO import_issues (task_id, dataset_id, sample_id, issue_type, severity, message)
                VALUES (?, ?, ?, ?, ?, ?)
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
                    task_id=r["task_id"],
                    dataset_id=r["dataset_id"] if "dataset_id" in r.keys() else "UNKNOWN",
                    sample_id=r["sample_id"],
                    issue_type=r["issue_type"],
                    severity=r["severity"],
                    message=r["message"],
                )
                for r in rows
            ]

    def count_by_task(self, task_id: str) -> int:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM import_issues WHERE task_id = ?", (task_id,))
            return cursor.fetchone()[0]

    def list_by_sample(self, sample_id: str) -> List[ImportIssue]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM import_issues WHERE sample_id = ? ORDER BY id ASC",
                (sample_id,),
            )
            rows = cursor.fetchall()
            return [
                ImportIssue(
                    task_id=r["task_id"],
                    dataset_id=r["dataset_id"] if "dataset_id" in r.keys() else "UNKNOWN",
                    sample_id=r["sample_id"],
                    issue_type=r["issue_type"],
                    severity=r["severity"],
                    message=r["message"],
                )
                for r in rows
            ]

    def clear_by_task(self, task_id: str):
        with self.db.connection() as conn:
            conn.execute("DELETE FROM import_issues WHERE task_id = ?", (task_id,))


IssueRepository = ImportIssueRepository


class FeatureRepository:

    def __init__(self, db: Database):
        self.db = db

    def upsert(
        self,
        sample_id: Any,
        model_id: Optional[str] = None,
        preprocess_key: Optional[str] = None,
        dim: Optional[int] = None,
        dtype: Optional[str] = None,
        embedding_blob: Optional[bytes] = None,
        source_file_size: Optional[int] = None,
        source_mtime_ns: Optional[int] = None,
    ):
        if not isinstance(sample_id, str):
            rec = sample_id
            if isinstance(rec, dict):
                sample_id = rec["sample_id"]
                model_id = rec["model_id"]
                preprocess_key = rec["preprocess_key"]
                dim = rec["dim"]
                dtype = rec["dtype"]
                embedding_blob = rec.get("embedding_blob")
                source_file_size = rec.get("source_file_size")
                source_mtime_ns = rec.get("source_mtime_ns")
            else:
                sample_id = rec.sample_id
                model_id = rec.model_id
                preprocess_key = rec.preprocess_key
                dim = rec.dim
                dtype = rec.dtype
                embedding_blob = getattr(rec, "embedding_blob", None)
                source_file_size = getattr(rec, "source_file_size", None)
                source_mtime_ns = getattr(rec, "source_mtime_ns", None)

        with self.db.connection() as conn:
            conn.execute(
                """
                INSERT INTO feature_records (
                    sample_id, model_id, preprocess_key, dim, dtype,
                    embedding_blob, source_file_size, source_mtime_ns, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(sample_id, model_id, preprocess_key) DO UPDATE SET
                    dim = excluded.dim,
                    dtype = excluded.dtype,
                    embedding_blob = excluded.embedding_blob,
                    source_file_size = excluded.source_file_size,
                    source_mtime_ns = excluded.source_mtime_ns,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (
                    sample_id,
                    model_id,
                    preprocess_key,
                    dim,
                    dtype,
                    embedding_blob,
                    source_file_size,
                    source_mtime_ns,
                ),
            )

    def upsert_batch(self, records: List[Any]):
        if not records:
            return
        data = []
        for r in records:
            if isinstance(r, dict):
                data.append((
                    r["sample_id"],
                    r["model_id"],
                    r["preprocess_key"],
                    r["dim"],
                    r["dtype"],
                    r.get("embedding_blob"),
                    r.get("source_file_size"),
                    r.get("source_mtime_ns"),
                ))
            else:
                data.append((
                    r.sample_id,
                    r.model_id,
                    r.preprocess_key,
                    r.dim,
                    r.dtype,
                    getattr(r, "embedding_blob", None),
                    getattr(r, "source_file_size", None),
                    getattr(r, "source_mtime_ns", None),
                ))
        with self.db.connection() as conn:
            conn.executemany(
                """
                INSERT INTO feature_records (
                    sample_id, model_id, preprocess_key, dim, dtype,
                    embedding_blob, source_file_size, source_mtime_ns, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(sample_id, model_id, preprocess_key) DO UPDATE SET
                    dim = excluded.dim,
                    dtype = excluded.dtype,
                    embedding_blob = excluded.embedding_blob,
                    source_file_size = excluded.source_file_size,
                    source_mtime_ns = excluded.source_mtime_ns,
                    updated_at = CURRENT_TIMESTAMP
                """,
                data,
            )

    def get(
        self, sample_id: str, model_id: str, preprocess_key: str
    ) -> Optional[Dict[str, Any]]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT * FROM feature_records 
                WHERE sample_id = ? AND model_id = ? AND preprocess_key = ?
                """,
                (sample_id, model_id, preprocess_key),
            )
            row = cursor.fetchone()
            if not row:
                return None
            return dict(row)

    def list_by_task(
        self, task_id: str, model_id: str, preprocess_key: str
    ) -> List[Dict[str, Any]]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT f.* FROM feature_records f
                JOIN samples s ON f.sample_id = s.sample_id
                WHERE s.task_id = ? AND f.model_id = ? AND f.preprocess_key = ?
                ORDER BY s.id ASC
                """,
                (task_id, model_id, preprocess_key),
            )
            return [dict(r) for r in cursor.fetchall()]

    def count_by_task(
        self, task_id: str, model_id: str, preprocess_key: str
    ) -> int:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT COUNT(*) FROM feature_records f
                JOIN samples s ON f.sample_id = s.sample_id
                WHERE s.task_id = ? AND f.model_id = ? AND f.preprocess_key = ?
                """,
                (task_id, model_id, preprocess_key),
            )
            return cursor.fetchone()[0]


class GoldRepository:
    def __init__(self, db: Database):
        self.db = db

    def upsert(self, record: GoldRecord):
        self.upsert_batch([record])

    def upsert_batch(self, records: List[GoldRecord]):
        if not records:
            return
        data = [
            (
                r.sample_id,
                r.task_id,
                r.policy_name,
                r.gold_quality,
                r.binary_label,
                1 if r.hard_normal else 0,
                r.gold_source,
                r.gold_source_ref,
                r.gold_status,
                json.dumps(r.provenance) if r.provenance else None,
            )
            for r in records
        ]
        with self.db.connection() as conn:
            conn.executemany(
                """
                INSERT INTO gold_records (
                    sample_id, task_id, policy_name, gold_quality, binary_label,
                    hard_normal, gold_source, gold_source_ref, gold_status,
                    provenance_json, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(sample_id, policy_name) DO UPDATE SET
                    gold_quality = excluded.gold_quality,
                    binary_label = excluded.binary_label,
                    hard_normal = excluded.hard_normal,
                    gold_source = excluded.gold_source,
                    gold_source_ref = excluded.gold_source_ref,
                    gold_status = excluded.gold_status,
                    provenance_json = excluded.provenance_json,
                    updated_at = CURRENT_TIMESTAMP
                """,
                data,
            )

    def list_by_task(self, task_id: str, policy_name: Optional[str] = None) -> List[GoldRecord]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            if policy_name:
                cursor.execute(
                    """
                    SELECT g.*, s.physical_sample_id, s.capture_sequence_id, s.batch_id,
                           s.data_origin, s.image_path, s.relative_path
                    FROM gold_records g
                    JOIN samples s ON g.sample_id = s.sample_id
                    WHERE g.task_id = ? AND g.policy_name = ?
                    ORDER BY s.id ASC
                    """,
                    (task_id, policy_name),
                )
            else:
                cursor.execute(
                    """
                    SELECT g.*, s.physical_sample_id, s.capture_sequence_id, s.batch_id,
                           s.data_origin, s.image_path, s.relative_path
                    FROM gold_records g
                    JOIN samples s ON g.sample_id = s.sample_id
                    WHERE g.task_id = ?
                    ORDER BY s.id ASC
                    """,
                    (task_id,),
                )
            rows = cursor.fetchall()

            out = []
            for r in rows:
                out.append(
                    GoldRecord(
                        sample_id=r["sample_id"],
                        task_id=r["task_id"],
                        policy_name=r["policy_name"],
                        gold_quality=r["gold_quality"],
                        binary_label=r["binary_label"],
                        hard_normal=bool(r["hard_normal"]),
                        gold_source=r["gold_source"],
                        gold_source_ref=r["gold_source_ref"],
                        gold_status=r["gold_status"],
                        provenance=json.loads(r["provenance_json"]) if r["provenance_json"] else {},
                        physical_sample_id=r["physical_sample_id"],
                        capture_sequence_id=r["capture_sequence_id"],
                        batch_id=r["batch_id"],
                        data_origin=r["data_origin"] or "UNKNOWN",
                        image_path=r["image_path"],
                        relative_path=r["relative_path"],
                    )
                )
            return out


class BenchmarkRepository:
    def __init__(self, db: Database):
        self.db = db

    def save_build(self, record: BenchmarkBuildRecord):
        with self.db.connection() as conn:
            conn.execute(
                """
                INSERT INTO benchmark_builds (
                    build_id, task_id, gold_policy, split_policy, seed, status, output_dir
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(build_id) DO UPDATE SET
                    status = excluded.status,
                    output_dir = excluded.output_dir
                """,
                (
                    record.build_id,
                    record.task_id,
                    record.gold_policy,
                    record.split_policy,
                    record.seed,
                    record.status,
                    record.output_dir,
                ),
            )

    def save_split_assignments(self, assignments: List[SplitAssignmentRecord]):
        if not assignments:
            return
        data = [
            (a.build_id, a.sample_id, a.split_group_id, a.split_name)
            for a in assignments
        ]
        with self.db.connection() as conn:
            conn.executemany(
                """
                INSERT INTO split_assignments (build_id, sample_id, split_group_id, split_name)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(build_id, sample_id) DO UPDATE SET
                    split_group_id = excluded.split_group_id,
                    split_name = excluded.split_name
                """,
                data,
            )

    def upsert_build(self, record: BenchmarkBuildRecord):
        return self.save_build(record)

    def upsert_split_assignments(self, assignments: List[SplitAssignmentRecord]):
        return self.save_split_assignments(assignments)

    def get_build(self, build_id: str) -> Optional[BenchmarkBuildRecord]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM benchmark_builds WHERE build_id = ?", (build_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return BenchmarkBuildRecord(
                build_id=row["build_id"],
                task_id=row["task_id"],
                gold_policy=row["gold_policy"],
                split_policy=row["split_policy"],
                seed=row["seed"],
                status=row["status"],
                output_dir=row["output_dir"],
            )

    def list_split_assignments(self, build_id: str) -> List[SplitAssignmentRecord]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM split_assignments WHERE build_id = ? ORDER BY id ASC",
                (build_id,),
            )
            return [
                SplitAssignmentRecord(
                    build_id=r["build_id"],
                    sample_id=r["sample_id"],
                    split_group_id=r["split_group_id"],
                    split_name=r["split_name"],
                )
                for r in cursor.fetchall()
            ]

    def get_split_assignments_by_build(self, build_id: str) -> List[SplitAssignmentRecord]:
        return self.list_split_assignments(build_id)

    def list_builds_by_task(self, task_id: str) -> List[BenchmarkBuildRecord]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM benchmark_builds WHERE task_id = ? ORDER BY id DESC",
                (task_id,),
            )
            return [
                BenchmarkBuildRecord(
                    build_id=r["build_id"],
                    task_id=r["task_id"],
                    gold_policy=r["gold_policy"],
                    split_policy=r["split_policy"],
                    seed=r["seed"],
                    status=r["status"],
                    output_dir=r["output_dir"],
                )
                for r in cursor.fetchall()
            ]

    def get_latest_build(self, task_id: str) -> Optional[BenchmarkBuildRecord]:
        builds = self.list_builds_by_task(task_id)
        return builds[0] if builds else None



class JobRepository:
    def __init__(self, db: Database):
        self.db = db

    def upsert(self, job: JobRunRecord):
        with self.db.connection() as conn:
            conn.execute(
                """
                INSERT INTO job_runs (
                    job_id, task_id, job_type, status, progress, message, artifact_dir,
                    started_at, finished_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(job_id) DO UPDATE SET
                    status = excluded.status,
                    progress = excluded.progress,
                    message = excluded.message,
                    artifact_dir = excluded.artifact_dir,
                    started_at = excluded.started_at,
                    finished_at = excluded.finished_at
                """,
                (
                    job.job_id,
                    job.task_id,
                    job.job_type,
                    job.status,
                    job.progress,
                    job.message,
                    job.artifact_dir,
                    job.started_at,
                    job.finished_at,
                ),
            )

    def get(self, job_id: str) -> Optional[JobRunRecord]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM job_runs WHERE job_id = ?", (job_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return JobRunRecord(
                job_id=row["job_id"],
                task_id=row["task_id"],
                job_type=row["job_type"],
                status=row["status"],
                progress=row["progress"] or 0.0,
                message=row["message"],
                artifact_dir=row["artifact_dir"],
                started_at=row["started_at"],
                finished_at=row["finished_at"],
            )

    def list_by_task(self, task_id: str) -> List[JobRunRecord]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM job_runs WHERE task_id = ? ORDER BY id DESC",
                (task_id,),
            )
            return [
                JobRunRecord(
                    job_id=r["job_id"],
                    task_id=r["task_id"],
                    job_type=r["job_type"],
                    status=r["status"],
                    progress=r["progress"] or 0.0,
                    message=r["message"],
                    artifact_dir=r["artifact_dir"],
                    started_at=r["started_at"],
                    finished_at=r["finished_at"],
                )
                for r in cursor.fetchall()
            ]


class AgentRunRepository:
    def __init__(self, db: Database):
        self.db = db

    def upsert(self, run: AgentRunRecord):
        with self.db.connection() as conn:
            conn.execute(
                """
                INSERT INTO agent_runs (
                    run_id, task_id, session_id, goal, status, final_artifact, started_at, finished_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(run_id) DO UPDATE SET
                    task_id = excluded.task_id,
                    session_id = excluded.session_id,
                    goal = excluded.goal,
                    status = excluded.status,
                    final_artifact = excluded.final_artifact,
                    started_at = excluded.started_at,
                    finished_at = excluded.finished_at
                """,
                (
                    run.run_id,
                    run.task_id,
                    run.session_id,
                    run.goal,
                    run.status,
                    run.final_artifact,
                    run.started_at,
                    run.finished_at,
                ),
            )

    def get(self, run_id: str) -> Optional[AgentRunRecord]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM agent_runs WHERE run_id = ?", (run_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return AgentRunRecord(
                run_id=row["run_id"],
                task_id=row["task_id"],
                session_id=row["session_id"],
                goal=row["goal"],
                status=row["status"],
                final_artifact=row["final_artifact"],
                started_at=row["started_at"],
                finished_at=row["finished_at"],
            )

    def get_by_session(self, session_id: str) -> Optional[AgentRunRecord]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM agent_runs WHERE session_id = ? ORDER BY id DESC LIMIT 1",
                (session_id,),
            )
            row = cursor.fetchone()
            if not row:
                return None
            return AgentRunRecord(
                run_id=row["run_id"],
                task_id=row["task_id"],
                session_id=row["session_id"],
                goal=row["goal"],
                status=row["status"],
                final_artifact=row["final_artifact"],
                started_at=row["started_at"],
                finished_at=row["finished_at"],
            )


class EvaluationRepository:
    def __init__(self, db: Database):
        self.db = db

    def save_run(self, run: EvaluationRunRecord):
        with self.db.connection() as conn:
            conn.execute(
                """
                INSERT INTO evaluation_runs (
                    run_id, task_id, build_id, model_id, threshold_strategy,
                    metrics_json, status, output_dir
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(run_id) DO UPDATE SET
                    threshold_strategy = excluded.threshold_strategy,
                    metrics_json = excluded.metrics_json,
                    status = excluded.status,
                    output_dir = excluded.output_dir
                """,
                (
                    run.run_id,
                    run.task_id,
                    run.build_id,
                    run.model_id,
                    run.threshold_strategy,
                    json.dumps(run.metrics) if run.metrics else None,
                    run.status,
                    run.output_dir,
                ),
            )

    def get_run(self, run_id: str) -> Optional[EvaluationRunRecord]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM evaluation_runs WHERE run_id = ?", (run_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return EvaluationRunRecord(
                run_id=row["run_id"],
                task_id=row["task_id"],
                build_id=row["build_id"],
                model_id=row["model_id"],
                threshold_strategy=row["threshold_strategy"],
                metrics=json.loads(row["metrics_json"]) if row["metrics_json"] else {},
                status=row["status"],
                output_dir=row["output_dir"],
            )

    def list_by_task(self, task_id: str) -> List[EvaluationRunRecord]:
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM evaluation_runs WHERE task_id = ? ORDER BY id DESC",
                (task_id,),
            )
            return [
                EvaluationRunRecord(
                    run_id=r["run_id"],
                    task_id=r["task_id"],
                    build_id=r["build_id"],
                    model_id=r["model_id"],
                    threshold_strategy=r["threshold_strategy"],
                    metrics=json.loads(r["metrics_json"]) if r["metrics_json"] else {},
                    status=r["status"],
                    output_dir=r["output_dir"],
                )
                for r in cursor.fetchall()
            ]
