import json
import os
from contextlib import nullcontext
from sqlite3 import Connection
import uuid
from collections import Counter
from pathlib import Path
from typing import Annotated, Any, List, Literal, Optional, Union, TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, Field, RootModel, StringConstraints, model_validator

from iad_core.storage.database import Database
from iad_core.task.config import DatasetConfig, FolderRule, load_config
from iad_core.dataset.files import ImageFiles
from iad_core.consistency.policy import AnnotationPolicy


if TYPE_CHECKING:
    from iad_core.dataset.scanner import ScanResult


class DatasetImportOptions(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
    annotation_policy: AnnotationPolicy = Field(default_factory=AnnotationPolicy)


class LabelmeImport(DatasetImportOptions):
    format: Literal["labelme"] = "labelme"
    image_dir: str
    annotation_dir: str
    archive_path: Optional[str] = None
    unannotated_is_normal: bool = True


class FolderClassificationImport(DatasetImportOptions):
    format: Literal["folder_classification"] = "folder_classification"
    root_dir: str
    rules: List[FolderRule]
    preview_fingerprint: str


DatasetImportType = Annotated[Union[LabelmeImport, FolderClassificationImport], Field(discriminator="format")]


class DatasetImport(RootModel[DatasetImportType]):
    @model_validator(mode="before")
    @classmethod
    def validate_envelope(cls, data: Any) -> Any:
        if isinstance(data, dict):
            fmt = data.get("format")
            if not fmt:
                raise ValueError("Dataset format is required: 'labelme' or 'folder_classification'")
            if fmt not in ("labelme", "folder_classification"):
                raise ValueError(f"Unsupported dataset format: '{fmt}'. Expected 'labelme' or 'folder_classification'")
        return data


class DatasetRegistry:
    def __init__(self, db: Database):
        self.db = db

    def save(self, config: DatasetConfig, connection: Optional[Connection] = None, *, require_existing: bool = False) -> None:
        with nullcontext(connection) if connection is not None else self.db.connection() as conn:
            if require_existing:
                if not conn.execute("UPDATE datasets SET config_json=? WHERE dataset_id=? AND task_id=?",
                        (config.model_dump_json(),config.dataset.id,config.task.task_id)).rowcount:
                    raise LookupError("数据集不存在或已删除")
                return
            conn.execute("""
                INSERT INTO datasets(dataset_id,task_id,config_json,scan_ref) VALUES(?,?,?,?)
                ON CONFLICT(dataset_id) DO UPDATE SET config_json=excluded.config_json
            """, (config.dataset.id, config.task.task_id, config.model_dump_json(), 'scan_' + uuid.uuid4().hex))

    def get(self, dataset_id: str, connection: Optional[Connection] = None) -> DatasetConfig:
        with nullcontext(connection) if connection is not None else self.db.connection() as conn:
            row = conn.execute("SELECT config_json FROM datasets WHERE dataset_id=?", (dataset_id,)).fetchone()
        if not row:
            raise LookupError(f"Dataset '{dataset_id}' not found")
        return DatasetConfig.model_validate_json(row[0])

    def resolve(self, dataset_id: Optional[str] = None, task_id: Optional[str] = None) -> DatasetConfig:
        self.discover()
        if dataset_id:
            config = self.get(dataset_id)
            if task_id and config.task.task_id != task_id:
                raise ValueError("Dataset does not belong to the inspection task")
            return config
        with self.db.connection() as conn:
            rows = conn.execute("SELECT dataset_id FROM datasets WHERE task_id=?", (task_id,)).fetchall()
        if len(rows) != 1:
            raise ValueError("Specify dataset_id to select a dataset")
        return self.get(rows[0][0])

    def discover(self) -> None:
        """Register existing YAML datasets once; subsequent edits live in the registry."""
        with self.db.connection() as conn:
            missing = conn.execute("""
                SELECT DISTINCT s.dataset_id,s.task_id FROM samples s
                LEFT JOIN datasets d ON s.dataset_id=d.dataset_id WHERE d.dataset_id IS NULL
            """).fetchall()
        if not missing:
            return
        configs = {}
        for config_path in sorted(Path("configs").glob("*.yaml")):
            config = load_config(str(config_path))
            configs[config.dataset.id] = config
        for dataset_id, task_id in missing:
            config = configs.get(dataset_id)
            if config is None:
                with self.db.connection() as conn:
                    paths = [r[0] for r in conn.execute("SELECT image_path FROM samples WHERE dataset_id=?", (dataset_id,))]
                root = os.path.commonpath([os.path.dirname(p) for p in paths])
                config = DatasetConfig.model_validate({
                    "dataset": {"id": dataset_id, "name": dataset_id, "format": "labelme"}, "root": root,
                    "task": {"task_id": task_id, "inspection_target": "surface"},
                    "annotations": {"format": "labelme"},
                })
            config.dataset.unannotated_is_normal = True
            self.save(config)

    def list(self) -> List[DatasetConfig]:
        self.discover()
        with self.db.connection() as conn:
            return [DatasetConfig.model_validate_json(r[0]) for r in conn.execute("SELECT config_json FROM datasets ORDER BY created_at,dataset_id")]

    def rename(self, dataset_id: str, name: str) -> DatasetConfig:
        name = name.strip()
        if not name or len(name) > 120:
            raise ValueError("Dataset name must contain 1–120 characters")
        config = self.get(dataset_id)
        config.dataset.name = name
        self.save(config, require_existing=True)
        return config

    def delete(self, dataset_id: str) -> None:
        with self.db.connection() as conn:
            conn.execute("BEGIN IMMEDIATE")
            dataset = conn.execute("SELECT task_id FROM datasets WHERE dataset_id=?", (dataset_id,)).fetchone()
            if not dataset:
                raise LookupError("数据集不存在或已删除")
            task_id = dataset['task_id']
            job_dataset = "COALESCE(json_extract(payload_json,'$.request.dataset_id'),json_extract(payload_json,'$.dataset_id'))"
            if conn.execute(f"""SELECT 1 FROM job_runs WHERE status IN ('PENDING','RUNNING')
                AND ({job_dataset}=? OR (task_id=? AND {job_dataset} IS NULL))""", (dataset_id,task_id)).fetchone():
                raise ValueError("数据集仍有执行中的作业，请先取消或等待作业结束后删除")
            exclusive_task = not conn.execute("""SELECT 1 FROM datasets WHERE task_id=? AND dataset_id!=?
                UNION ALL SELECT 1 FROM samples WHERE task_id=? AND dataset_id!=? LIMIT 1""",
                (task_id,dataset_id,task_id,dataset_id)).fetchone()
            if exclusive_task and conn.execute("SELECT 1 FROM agent_runs WHERE task_id=? AND status IN ('PENDING','RUNNING')", (task_id,)).fetchone():
                raise ValueError("数据集仍有执行中的 Agent 作业，请等待作业结束后删除")
            jobs = f"""SELECT job_id FROM job_runs WHERE ({job_dataset}=? OR (task_id=? AND ?))
                AND NOT EXISTS (SELECT 1 FROM consistency_children c WHERE c.run_id=job_runs.job_id)"""
            job_scope = (dataset_id,task_id,exclusive_task)
            conn.execute(f"DELETE FROM model_calls WHERE run_id IN ({jobs})", job_scope)
            conn.execute(f"DELETE FROM job_runs WHERE job_id IN ({jobs})", job_scope)
            for table in ('annotations','gold_records','split_assignments','review_decisions','audit_suggestions'):
                conn.execute(f"DELETE FROM {table} WHERE sample_id IN (SELECT sample_id FROM samples WHERE dataset_id=?)", (dataset_id,))
            conn.execute("DELETE FROM review_sessions WHERE dataset_id=?", (dataset_id,))
            conn.execute("DELETE FROM import_issues WHERE dataset_id=?", (dataset_id,))
            conn.execute("DELETE FROM agent_runs WHERE json_extract(scope_json,'$.dataset_id')=?", (dataset_id,))
            conn.execute("DELETE FROM knowledge_heads WHERE dataset_id=?", (dataset_id,))
            conn.execute("DELETE FROM knowledge_versions WHERE dataset_id=?", (dataset_id,))
            conn.execute("DELETE FROM samples WHERE dataset_id=?", (dataset_id,))
            from iad_core.duplicate.index import PixelIndex
            PixelIndex.collect_unused_groups(conn)
            conn.execute("DELETE FROM datasets WHERE dataset_id=?", (dataset_id,))
            if exclusive_task:
                conn.execute("DELETE FROM split_assignments WHERE build_id IN (SELECT build_id FROM benchmark_builds WHERE task_id=?)", (task_id,))
                for table in ('review_sessions','import_issues','audit_suggestions','evaluation_runs','benchmark_builds','agent_runs','inspection_tasks'):
                    conn.execute(f"DELETE FROM {table} WHERE task_id=?", (task_id,))

    def import_labelme(self, request: Union[LabelmeImport, DatasetImport, dict]) -> DatasetConfig:
        if isinstance(request, dict):
            req = DatasetImport.model_validate(request).root
        elif isinstance(request, DatasetImport):
            req = request.root
        else:
            req = request
        if not isinstance(req, LabelmeImport):
            raise ValueError(f"Expected LabelmeImport, got {type(req).__name__}")
        return self._import_labelme_impl(req)

    def import_dataset(self, request: Union[DatasetImport, LabelmeImport, FolderClassificationImport, dict]) -> DatasetConfig:
        if isinstance(request, dict):
            req = DatasetImport.model_validate(request).root
        elif isinstance(request, DatasetImport):
            req = request.root
        else:
            req = request

        if isinstance(req, LabelmeImport):
            return self._import_labelme_impl(req)
        elif isinstance(req, FolderClassificationImport):
            return self.import_folder_classification(req)
        else:
            raise ValueError(f"Unsupported dataset import request: {type(req)}")

    def import_folder_classification(self, request: FolderClassificationImport) -> DatasetConfig:
        from iad_core.dataset.folder_preview import preview_folder_dataset
        from iad_core.dataset.scanner import scan_dataset

        root_path = self.image_root(request.root_dir)

        preview = preview_folder_dataset(str(root_path), rules=request.rules)
        preview.confirm(request.preview_fingerprint)

        dataset_id = "ds_" + uuid.uuid4().hex
        config = DatasetConfig.model_validate({
            "dataset": {
                "id": dataset_id,
                "name": request.name.strip(),
                "format": "folder_classification",
                "unannotated_is_normal": False,
            },
            "root": str(root_path),
            "task": {"task_id": dataset_id, "inspection_target": "surface"},
            "annotations": {"format": "folder_classification", **request.annotation_policy.model_dump()},
            "folder_rules": [r.model_dump() for r in request.rules],
        })
        scan_dataset(config=config, db_path=self.db.db_path, preview_fingerprint=request.preview_fingerprint)
        with self.db.connection() as conn:
            imported_count = conn.execute("SELECT count(*) FROM samples WHERE dataset_id=?", (dataset_id,)).fetchone()[0]
        if imported_count == 0:
            with self.db.connection() as conn:
                conn.execute("DELETE FROM datasets WHERE dataset_id=?", (dataset_id,))
                conn.execute("DELETE FROM import_issues WHERE task_id=?", (dataset_id,))
                conn.execute("DELETE FROM inspection_tasks WHERE task_id=?", (dataset_id,))
            raise ValueError("No readable images were imported")
        return config

    def _import_labelme_impl(self, request: LabelmeImport) -> DatasetConfig:
        from iad_core.dataset.scanner import scan_dataset

        if request.archive_path:
            from iad_core.dataset.archive import DatasetArchive
            image_dir, annotation_dir = DatasetArchive(request.archive_path).prepare(
                self.db.db_path, request.image_dir, request.annotation_dir)
        else:
            image_dir = Path(request.image_dir).expanduser().resolve(strict=True)
            annotation_dir = Path(request.annotation_dir).expanduser().resolve(strict=True)
        image_dir, annotation_dir = self.sources(str(image_dir), str(annotation_dir))
        dataset_id = "ds_" + uuid.uuid4().hex
        config = DatasetConfig.model_validate({
            "dataset": {"id": dataset_id, "name": request.name.strip(), "format": "labelme", "unannotated_is_normal": request.unannotated_is_normal},
            "root": str(image_dir),
            "task": {"task_id": dataset_id, "inspection_target": "surface"},
            "annotations": {"format": "labelme", "root": str(annotation_dir), **request.annotation_policy.model_dump()},
        })
        scan_dataset(config=config, db_path=self.db.db_path)
        with self.db.connection() as conn:
            imported_count = conn.execute("SELECT count(*) FROM samples WHERE dataset_id=?", (dataset_id,)).fetchone()[0]
        if imported_count == 0:
            with self.db.connection() as conn:
                conn.execute("DELETE FROM datasets WHERE dataset_id=?", (dataset_id,))
                conn.execute("DELETE FROM import_issues WHERE task_id=?", (dataset_id,))
                conn.execute("DELETE FROM inspection_tasks WHERE task_id=?", (dataset_id,))
            raise ValueError("No readable images were imported")
        return config

    def image_root(self, image_dir: str, dataset_id: Optional[str] = None) -> Path:
        images = Path(image_dir).expanduser().resolve(strict=True)
        if not images.is_dir():
            raise ValueError("Image path must be a directory")
        if next(iter(ImageFiles(images)), None) is None:
            raise ValueError("Image directory contains no supported images")
        for existing in self.list():
            if existing.dataset.id != dataset_id and Path(existing.root).resolve() == images:
                raise ValueError("This image directory has already been imported as a dataset")
        return images

    def sources(self, image_dir: str, annotation_dir: str, dataset_id: Optional[str] = None) -> tuple[Path, Path]:
        images = self.image_root(image_dir, dataset_id)
        annotations = Path(annotation_dir).expanduser().resolve(strict=True)
        if not annotations.is_dir():
            raise ValueError("Annotation path must be a directory")
        return images, annotations

    def rescan(self, dataset_id: str, image_dir: Optional[str] = None, annotation_dir: Optional[str] = None,
               folder_rules: Optional[List[FolderRule]] = None, preview_fingerprint: Optional[str] = None,
               force_pixels: bool = False) -> "ScanResult":
        from iad_core.dataset.scanner import scan_dataset

        config = self.get(dataset_id)
        if config.dataset.format == "folder_classification":
            if annotation_dir is not None:
                raise ValueError('Folder datasets do not accept an annotation directory')
            if image_dir is not None:
                config.root = str(self.image_root(image_dir, dataset_id))
            if folder_rules is not None:
                config.folder_rules = folder_rules
            if image_dir is not None or folder_rules is not None:
                from iad_core.dataset.folder_preview import preview_folder_dataset
                preview_folder_dataset(config.root, config.folder_rules).confirm(preview_fingerprint)
        else:
            if image_dir is not None or annotation_dir is not None:
                if not image_dir or not annotation_dir:
                    raise ValueError("Changing dataset sources requires both image and annotation directories")
                images, annotations = self.sources(image_dir, annotation_dir, dataset_id)
                config.root, config.annotations.root = str(images), str(annotations)
        return scan_dataset(config=config, db_path=self.db.db_path, preview_fingerprint=preview_fingerprint, force_pixels=force_pixels)

    def references(self, dataset_id: str, exclude: Optional[str] = None, limit: Optional[int] = 4,
                   selected_ids: Optional[List[str]] = None, connection: Optional[Connection] = None) -> List[str]:
        with nullcontext(connection) if connection is not None else self.db.connection() as conn:
            config = self.get(dataset_id, connection=conn)
            row = conn.execute("SELECT reference_sample_ids_json,reference_selection_set FROM datasets WHERE dataset_id=?", (dataset_id,)).fetchone()
            selected = selected_ids if selected_ids is not None else json.loads(row[0])
            explicit_selection = selected_ids is not None or bool(row[1])
            if config.dataset.format == "folder_classification":
                rows = conn.execute("""
                    SELECT s.sample_id FROM samples s
                    LEFT JOIN current_review_decisions d ON d.id=(SELECT r.id FROM current_review_decisions r
                        WHERE r.sample_id=s.sample_id ORDER BY COALESCE(r.submitted_at,r.updated_at) DESC,r.id DESC LIMIT 1)
                    WHERE s.dataset_id=? AND s.is_excluded=0 AND s.sample_id!=? AND NOT EXISTS(
                        SELECT 1 FROM import_issues i WHERE i.sample_id=s.sample_id AND i.severity IN ('ERROR','WARNING'))
                    AND (d.decision IN ('PASS','HARD_NORMAL') OR (d.id IS NULL AND s.quality_status='PASS'))
                    ORDER BY s.relative_path,s.sample_id
                """, (dataset_id, exclude or "")).fetchall()
            else:
                rows = conn.execute("""
                    SELECT s.sample_id FROM samples s
                    LEFT JOIN current_review_decisions d ON d.id=(SELECT r.id FROM current_review_decisions r
                        WHERE r.sample_id=s.sample_id ORDER BY COALESCE(r.submitted_at,r.updated_at) DESC,r.id DESC LIMIT 1)
                    WHERE s.dataset_id=? AND s.is_excluded=0 AND s.sample_id!=? AND NOT EXISTS(
                        SELECT 1 FROM import_issues i WHERE i.sample_id=s.sample_id AND i.severity IN ('ERROR','WARNING'))
                    AND (d.decision IN ('PASS','HARD_NORMAL') OR (d.id IS NULL AND
                        (s.quality_status='PASS' OR (s.quality_status!='FAIL' AND EXISTS(SELECT 1 FROM json_each(?) WHERE value=s.sample_id))
                         OR (? AND s.quality_status!='FAIL' AND NOT EXISTS(SELECT 1 FROM annotations a WHERE a.sample_id=s.sample_id)))))
                    ORDER BY s.relative_path,s.sample_id
                """, (dataset_id, exclude or "", json.dumps(selected), config.dataset.unannotated_is_normal)).fetchall()
        eligible = [r[0] for r in rows]
        if explicit_selection:
            eligible_ids = set(eligible)
            return [sid for sid in selected if sid in eligible_ids][:limit]
        if limit is None or len(eligible) <= limit:
            return eligible
        return [eligible[i * (len(eligible) - 1) // (limit - 1)] for i in range(limit)] if limit > 1 else eligible[:1]

    def set_references(self, dataset_id: str, sample_ids: List[str]) -> None:
        if not isinstance(sample_ids, list) or any(not isinstance(item, str) for item in sample_ids) or len(sample_ids) != len(set(sample_ids)):
            raise ValueError("References must be distinct sample IDs")
        self.get(dataset_id)
        with self.db.connection() as conn:
            count = conn.execute("SELECT count(*) FROM samples WHERE dataset_id=? AND sample_id IN (SELECT value FROM json_each(?))", (dataset_id, json.dumps(sample_ids))).fetchone()[0]
            if count != len(sample_ids):
                raise ValueError("References must belong to the selected dataset")
            if set(self.references(dataset_id, limit=None, selected_ids=sample_ids)) != set(sample_ids):
                raise ValueError("References must be technically valid and cannot have an adverse human decision")
            conn.execute("UPDATE datasets SET reference_sample_ids_json=?,reference_selection_set=1 WHERE dataset_id=?", (json.dumps(sample_ids), dataset_id))

    def reset_references(self, dataset_id: str) -> None:
        self.get(dataset_id)
        with self.db.connection() as conn:
            conn.execute("UPDATE datasets SET reference_sample_ids_json='[]',reference_selection_set=0 WHERE dataset_id=?", (dataset_id,))

    @staticmethod
    def directories(directory: str) -> dict:
        current = Path(directory).expanduser().resolve(strict=True)
        if not current.is_dir():
            raise ValueError("Path is not a directory")
        entries = sorted(current.iterdir(), key=lambda p: p.name)
        return {"path": str(current), "parent": str(current.parent), "directories": [
            {"name": p.name, "path": str(p)} for p in entries if p.is_dir() and not p.name.startswith(".")
        ], "file_counts": dict(Counter(p.suffix.lower() for p in entries if p.is_file()))}
