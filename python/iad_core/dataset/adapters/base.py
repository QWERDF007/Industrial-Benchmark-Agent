import os
import re
import fnmatch
from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any, Generator, Iterator
from pydantic import BaseModel, Field

from iad_core.storage.models import QualityStatus, DataOrigin
from iad_core.storage.models import AnnotationType, AnnotationSource, GeometryStatus
from iad_core.task.config import DatasetConfig, MetadataRule


class RawImage(BaseModel):
    image_path: str
    relative_path: str
    dataset_id: str


class RawQuality(BaseModel):
    quality_status: QualityStatus
    quality_source: str


class RawAnnotation(BaseModel):
    annotation_type: AnnotationType
    raw_label: str
    phenomenon: Optional[str] = None
    bbox: Optional[List[float]] = None
    polygon: Optional[List[List[float]]] = None
    mask_path: Optional[str] = None
    geometry_status: GeometryStatus = GeometryStatus.VALID
    source_width: Optional[int] = None
    source_height: Optional[int] = None
    source: AnnotationSource = AnnotationSource.IMPORTED


class DatasetAdapter(ABC):
    def __init__(self, config: DatasetConfig):
        self.config = config

    def scan_images(self) -> Generator[RawImage, None, None]:
        """Stream images from the dataset root matching glob patterns without loading all into memory."""
        root = os.path.abspath(self.config.root)
        if not os.path.exists(root):
            raise FileNotFoundError(f"Dataset root directory does not exist: {root}")

        globs = self.config.images.glob or ["**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.bmp"]
        exclude_globs = self.config.images.exclude or []

        # Walk through directory tree efficiently
        for dirpath, _, filenames in os.walk(root):
            for filename in sorted(filenames):
                full_path = os.path.join(dirpath, filename)
                rel_path = os.path.relpath(full_path, root)

                # Check inclusion globs (support both root and nested paths)
                matched = any(
                    fnmatch.fnmatch(rel_path, pat)
                    or fnmatch.fnmatch(filename, pat)
                    or fnmatch.fnmatch(rel_path, pat.replace("**/", ""))
                    or fnmatch.fnmatch(filename, pat.replace("**/", ""))
                    for pat in globs
                )
                if not matched:
                    continue

                # Check exclusion globs
                excluded = any(
                    fnmatch.fnmatch(rel_path, pat)
                    or fnmatch.fnmatch(filename, pat)
                    or fnmatch.fnmatch(rel_path, pat.replace("**/", ""))
                    or fnmatch.fnmatch(filename, pat.replace("**/", ""))
                    for pat in exclude_globs
                )
                if excluded:
                    continue

                yield RawImage(
                    image_path=full_path,
                    relative_path=rel_path,
                    dataset_id=self.config.dataset.id,
                )

    def load_origin(self, image: RawImage) -> DataOrigin:
        """Resolve data origin (e.g. LEGACY_TRAIN, LEGACY_TEST, AUGMENTED, MISSED_CASE, PRODUCTION_RAW)."""
        o_cfg = self.config.origin
        rel_path = image.relative_path
        if o_cfg.source == "folder":
            rel_parts = rel_path.split(os.sep)
            for part in rel_parts[:-1]:
                for key, val in o_cfg.mapping.items():
                    if key.lower() == part.lower() or key in part:
                        try:
                            return DataOrigin(val.upper())
                        except ValueError:
                            return DataOrigin.UNKNOWN

            stem = os.path.splitext(os.path.basename(rel_path))[0]
            for key, val in o_cfg.mapping.items():
                if key in stem:
                    try:
                        return DataOrigin(val.upper())
                    except ValueError:
                        return DataOrigin.UNKNOWN

            try:
                return DataOrigin(o_cfg.default.upper())
            except ValueError:
                return DataOrigin.UNKNOWN

        elif o_cfg.source == "fixed":
            try:
                return DataOrigin(o_cfg.default.upper())
            except ValueError:
                return DataOrigin.UNKNOWN

        return DataOrigin.UNKNOWN

    def load_quality(self, image: RawImage) -> RawQuality:
        """Resolve quality status (PASS, FAIL, UNCERTAIN) based on config and match_mode."""
        q_cfg = self.config.quality
        match_mode = getattr(q_cfg, "match_mode", "exact")

        if q_cfg.source == "folder":
            rel_parts = image.relative_path.split(os.sep)
            # Check parent folder names against mapping
            for part in rel_parts[:-1]:
                for key, val in q_cfg.mapping.items():
                    matched = False
                    if match_mode == "exact":
                        matched = (key.lower() == part.lower())
                        if not matched and (key in part):
                            # Token/boundary match in segment (e.g. ExportImage_漏检 matches 漏检)
                            pattern = r"(?:^|[_\-\s])" + re.escape(key) + r"(?:[_\-\s]|$)"
                            matched = bool(re.search(pattern, part, re.IGNORECASE))
                    elif match_mode == "token":
                        pattern = r"(?:^|[_\-\s])" + re.escape(key) + r"(?:[_\-\s]|$)"
                        matched = bool(re.search(pattern, part, re.IGNORECASE))
                    elif match_mode == "contains":
                        matched = key.lower() in part.lower()
                    elif match_mode == "regex":
                        matched = bool(re.search(key, part))

                    if matched:
                        status = QualityStatus(val.upper())
                        return RawQuality(quality_status=status, quality_source=f"folder:{part}")

            # Check filename stem if parent folders didn't match
            stem = os.path.splitext(os.path.basename(image.relative_path))[0]
            for key, val in q_cfg.mapping.items():
                matched = False
                if match_mode in ("exact", "token"):
                    if key.lower() == stem.lower():
                        matched = True
                    else:
                        pattern = r"(?:^|[_\-\s])" + re.escape(key) + r"(?:[_\-\s]|$)"
                        matched = bool(re.search(pattern, stem, re.IGNORECASE))
                elif match_mode == "contains":
                    matched = key.lower() in stem.lower()
                elif match_mode == "regex":
                    matched = bool(re.search(key, stem))

                if matched:
                    status = QualityStatus(val.upper())
                    return RawQuality(quality_status=status, quality_source=f"filename:{key}")

            return RawQuality(quality_status=q_cfg.default, quality_source="default")

        elif q_cfg.source == "filename_regex" and q_cfg.pattern:
            filename = os.path.basename(image.relative_path)
            match = re.search(q_cfg.pattern, filename)
            if match:
                key = match.group(1) if match.groups() else match.group(0)
                if key in q_cfg.mapping:
                    return RawQuality(
                        quality_status=QualityStatus(q_cfg.mapping[key].upper()),
                        quality_source="filename_regex",
                    )
            return RawQuality(quality_status=q_cfg.default, quality_source="default")

        elif q_cfg.source == "fixed" and q_cfg.default:
            return RawQuality(quality_status=q_cfg.default, quality_source="fixed")

        return RawQuality(quality_status=q_cfg.default, quality_source="default")

    def load_metadata(self, image: RawImage) -> Dict[str, Any]:
        """Extract metadata fields (batch_id, physical_sample_id, capture_sequence_id, station, camera)."""
        meta_cfg = self.config.metadata
        result: Dict[str, Any] = {}

        for field in ["batch_id", "physical_sample_id", "capture_sequence_id", "station", "camera"]:
            rule: Optional[MetadataRule] = getattr(meta_cfg, field, None)
            if rule is None or rule.source == "none":
                if field == "station" and self.config.task.station:
                    result[field] = self.config.task.station
                elif field == "camera" and self.config.task.camera:
                    result[field] = self.config.task.camera
                else:
                    result[field] = None
                continue

            if rule.source == "fixed":
                result[field] = rule.value
            elif rule.source in ("regex", "filename_regex", "folder_regex"):
                target = (
                    os.path.basename(image.relative_path)
                    if rule.source == "filename_regex"
                    else (
                        os.path.dirname(image.relative_path)
                        if rule.source == "folder_regex"
                        else image.relative_path
                    )
                )
                if rule.pattern:
                    match = re.search(rule.pattern, target)
                    if match:
                        if rule.group and rule.group in match.groupdict():
                            result[field] = match.group(rule.group)
                        elif match.groupdict() and field in match.groupdict():
                            result[field] = match.group(field)
                        elif match.groups():
                            result[field] = match.group(1)
                        else:
                            result[field] = match.group(0)
                    else:
                        result[field] = None
                else:
                    result[field] = None
            else:
                result[field] = None

        return result

    @abstractmethod
    def load_annotations(
        self, image: RawImage, width: int, height: int
    ) -> List[RawAnnotation]:
        """Load annotations associated with the image."""
        ...
