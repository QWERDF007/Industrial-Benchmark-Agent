import os
from typing import List, Optional
from app.adapters.base import DatasetAdapter, RawImage, RawAnnotation
from app.schemas.annotation import AnnotationType, AnnotationSource


class YOLOAdapter(DatasetAdapter):
    """Adapter for YOLO TXT annotations: <class_id> <x_center> <y_center> <width> <height>."""

    def find_label_file(self, image: RawImage) -> Optional[str]:
        root = os.path.abspath(self.config.root)
        image_path = os.path.abspath(image.image_path)
        rel_path = image.relative_path
        stem, _ = os.path.splitext(rel_path)

        ann_cfg = self.config.annotations
        if ann_cfg.folder_replace:
            replaced_rel = rel_path
            for src, dst in ann_cfg.folder_replace.items():
                replaced_rel = replaced_rel.replace(src, dst)
            replaced_stem, _ = os.path.splitext(replaced_rel)
            candidate = os.path.join(root, replaced_stem + ".txt")
            if os.path.exists(candidate):
                return candidate

        # Sidecar
        image_stem, _ = os.path.splitext(image_path)
        sidecar = image_stem + ".txt"
        if os.path.exists(sidecar):
            return sidecar

        # Auto heuristics
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
                candidate = os.path.join(root, candidate_stem + ".txt")
                if os.path.exists(candidate):
                    return candidate

        return None

    def load_annotations(
        self, image: RawImage, width: int, height: int
    ) -> List[RawAnnotation]:
        label_file = self.find_label_file(image)
        if not label_file or not os.path.exists(label_file):
            return []

        annotations: List[RawAnnotation] = []
        try:
            with open(label_file, "r", encoding="utf-8") as f:
                lines = [line.strip() for line in f if line.strip()]
        except Exception as e:
            raise ValueError(f"Failed to read YOLO txt '{label_file}': {e}")

        for line_num, line in enumerate(lines, 1):
            parts = line.split()
            if len(parts) < 5:
                continue
            raw_label = parts[0]
            try:
                xc = float(parts[1]) * width
                yc = float(parts[2]) * height
                w = float(parts[3]) * width
                h = float(parts[4]) * height
            except ValueError as e:
                raise ValueError(f"Malformed coordinate in YOLO line {line_num} in '{label_file}': {line}")

            xmin = round(max(0.0, xc - w / 2.0), 2)
            ymin = round(max(0.0, yc - h / 2.0), 2)
            xmax = round(min(float(width), xc + w / 2.0), 2)
            ymax = round(min(float(height), yc + h / 2.0), 2)

            phenomenon = self.config.annotations.labels.get(raw_label, None)
            annotations.append(
                RawAnnotation(
                    annotation_type=AnnotationType.BBOX,
                    raw_label=raw_label,
                    phenomenon=phenomenon,
                    bbox=[xmin, ymin, xmax, ymax],
                    source=self.config.annotations.source,
                )
            )

        return annotations
