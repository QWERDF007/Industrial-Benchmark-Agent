import os
import json
from typing import List, Optional
from iad_core.dataset.adapters.base import DatasetAdapter, RawImage, RawAnnotation
from iad_core.storage.models import AnnotationType, AnnotationSource


class LabelmeAdapter(DatasetAdapter):
    """Adapter for Labelme JSON annotations (used by real-world industrial datasets)."""

    def find_label_file(self, image: RawImage) -> Optional[str]:
        root = os.path.abspath(self.config.root)
        image_path = os.path.abspath(image.image_path)
        rel_path = image.relative_path
        stem, _ = os.path.splitext(rel_path)

        # 1. Custom folder replacement if specified
        ann_cfg = self.config.annotations
        if ann_cfg.root:
            candidate = os.path.join(ann_cfg.root, stem + ".json")
            return candidate if os.path.isfile(candidate) else None
        if ann_cfg.folder_replace:
            replaced_rel = rel_path
            for src, dst in ann_cfg.folder_replace.items():
                replaced_rel = replaced_rel.replace(src, dst)
            replaced_stem, _ = os.path.splitext(replaced_rel)
            candidate = os.path.join(root, replaced_stem + ".json")
            if os.path.exists(candidate):
                return candidate

        # 2. Sidecar (same folder with .json extension)
        image_stem, _ = os.path.splitext(image_path)
        sidecar = image_stem + ".json"
        if os.path.exists(sidecar):
            return sidecar

        # 3. Auto heuristics: look for ExportLabel_ or label/labels folders
        if "ExportImage_" in rel_path:
            candidate = os.path.join(root, stem.replace("ExportImage_", "ExportLabel_") + ".json")
            if os.path.exists(candidate):
                return candidate

        for src, dst in [
            ("images", "labels"),
            ("Images", "Labels"),
            ("image", "label"),
            ("Image", "Label"),
        ]:
            if src in rel_path.split(os.sep):
                new_parts = [dst if p == src else p for p in rel_path.split(os.sep)]
                candidate_rel = os.sep.join(new_parts)
                candidate_stem, _ = os.path.splitext(candidate_rel)
                candidate = os.path.join(root, candidate_stem + ".json")
                if os.path.exists(candidate):
                    return candidate

        return None

    def load_annotations(
        self, image: RawImage, width: int, height: int
    ) -> List[RawAnnotation]:
        label_file = self.find_label_file(image)
        if not label_file or not os.path.exists(label_file):
            return []

        try:
            with open(label_file, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            # Re-raise to let scanner record ANNOTATION_PARSE_ERROR issue
            raise ValueError(f"Failed to parse Labelme JSON '{label_file}': {e}")

        source_width = data.get("imageWidth")
        source_height = data.get("imageHeight")
        if source_width is not None:
            source_width = int(source_width)
        if source_height is not None:
            source_height = int(source_height)

        shapes = data.get("shapes", [])
        annotations: List[RawAnnotation] = []

        for shape in shapes:
            raw_label = str(shape.get("label", ""))
            shape_type = shape.get("shape_type", "rectangle")
            points = shape.get("points", [])
            phenomenon = self.config.annotations.labels.get(raw_label, raw_label if not self.config.annotations.labels else None)

            if shape_type == "rectangle" and len(points) >= 2:
                xs = [float(p[0]) for p in points]
                ys = [float(p[1]) for p in points]
                bbox = [round(min(xs), 2), round(min(ys), 2), round(max(xs), 2), round(max(ys), 2)]
                annotations.append(
                    RawAnnotation(
                        annotation_type=AnnotationType.BBOX,
                        raw_label=raw_label,
                        phenomenon=phenomenon,
                        bbox=bbox,
                        source_width=source_width,
                        source_height=source_height,
                        source=self.config.annotations.source,
                    )
                )
            elif shape_type == "polygon" and len(points) >= 3:
                xs = [float(p[0]) for p in points]
                ys = [float(p[1]) for p in points]
                bbox = [round(min(xs), 2), round(min(ys), 2), round(max(xs), 2), round(max(ys), 2)]
                polygon = [[round(float(p[0]), 2), round(float(p[1]), 2)] for p in points]
                annotations.append(
                    RawAnnotation(
                        annotation_type=AnnotationType.POLYGON,
                        raw_label=raw_label,
                        phenomenon=phenomenon,
                        bbox=bbox,
                        polygon=polygon,
                        source_width=source_width,
                        source_height=source_height,
                        source=self.config.annotations.source,
                    )
                )
            else:
                if len(points) >= 2:
                    xs = [float(p[0]) for p in points]
                    ys = [float(p[1]) for p in points]
                    bbox = [round(min(xs), 2), round(min(ys), 2), round(max(xs), 2), round(max(ys), 2)]
                else:
                    bbox = None
                annotations.append(
                    RawAnnotation(
                        annotation_type=AnnotationType.BBOX if bbox else AnnotationType.IMAGE,
                        raw_label=raw_label,
                        phenomenon=phenomenon,
                        bbox=bbox,
                        source_width=source_width,
                        source_height=source_height,
                        source=self.config.annotations.source,
                    )
                )

        return annotations
