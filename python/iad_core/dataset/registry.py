import json
import os
import uuid
from collections import Counter
from pathlib import Path
from typing import Annotated, List, Optional

from pydantic import BaseModel, ConfigDict, StringConstraints

from iad_core.storage.database import Database
from iad_core.task.config import DatasetConfig, load_config


class DatasetImport(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
    image_dir: str
    annotation_dir: str
    archive_path: Optional[str] = None
    unannotated_is_normal: bool = True


class DatasetRegistry:
    def __init__(self, db: Database):
        self.db = db

    def save(self, config: DatasetConfig) -> None:
        with self.db.connection() as conn:
            conn.execute("""
                INSERT INTO datasets(dataset_id,task_id,config_json) VALUES(?,?,?)
                ON CONFLICT(dataset_id) DO UPDATE SET config_json=excluded.config_json
            """, (config.dataset.id, config.task.task_id, config.model_dump_json()))

    def get(self, dataset_id: str) -> DatasetConfig:
        with self.db.connection() as conn:
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
                    "dataset": {"id": dataset_id, "name": dataset_id}, "root": root,
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
        self.save(config)
        return config

    def import_labelme(self, request: DatasetImport) -> DatasetConfig:
        from iad_core.dataset.scanner import scan_dataset

        if request.archive_path:
            from iad_core.dataset.archive import DatasetArchive
            image_dir, annotation_dir = DatasetArchive(request.archive_path).prepare(
                self.db.db_path, request.image_dir, request.annotation_dir)
        else:
            image_dir = Path(request.image_dir).expanduser().resolve(strict=True)
            annotation_dir = Path(request.annotation_dir).expanduser().resolve(strict=True)
        if not image_dir.is_dir() or not annotation_dir.is_dir():
            raise ValueError("Image and annotation paths must be directories")
        if not any(p.suffix.lower() in {".png", ".jpg", ".jpeg", ".bmp", ".webp"} for p in image_dir.rglob("*") if p.is_file()):
            raise ValueError("Image directory contains no supported images")
        for existing in self.list():
            if Path(existing.root).resolve() == image_dir and existing.annotations.root and Path(existing.annotations.root).resolve() == annotation_dir:
                raise ValueError("These image and annotation directories have already been imported")
        dataset_id = "ds_" + uuid.uuid4().hex
        config = DatasetConfig.model_validate({
            "dataset": {"id": dataset_id, "name": request.name.strip(), "unannotated_is_normal": request.unannotated_is_normal},
            "root": str(image_dir),
            "task": {"task_id": dataset_id, "inspection_target": "surface"},
            "annotations": {"format": "labelme", "root": str(annotation_dir)},
            "images": {"glob": ["**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.bmp", "**/*.webp"]},
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

    def references(self, dataset_id: str, exclude: Optional[str] = None, limit: Optional[int] = 4,
                   selected_ids: Optional[List[str]] = None) -> List[str]:
        config = self.get(dataset_id)
        with self.db.connection() as conn:
            row = conn.execute("SELECT reference_sample_ids_json,reference_selection_set FROM datasets WHERE dataset_id=?", (dataset_id,)).fetchone()
            selected = selected_ids if selected_ids is not None else json.loads(row[0])
            explicit_selection = selected_ids is not None or bool(row[1])
            rows = conn.execute("""
                SELECT s.sample_id FROM samples s
                LEFT JOIN current_review_decisions d ON d.id=(SELECT r.id FROM current_review_decisions r
                    WHERE r.sample_id=s.sample_id ORDER BY COALESCE(r.submitted_at,r.updated_at) DESC,r.id DESC LIMIT 1)
                WHERE s.dataset_id=? AND s.sample_id!=? AND NOT EXISTS(
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
