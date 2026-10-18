import os
import json
import logging
from typing import List, Dict, Any, Optional
from PIL import Image, ImageDraw

from iad_core.storage.models import Sample, Annotation

logger = logging.getLogger("iad_core.evidence.views")


def generate_sample_view(
    sample: Sample,
    annotations: List[Annotation],
    view: str = "raw",
    output_dir: str = "runs/views",
) -> Dict[str, Any]:
    """
    Generate raw or annotation overlay view for a sample (S05, RP-09).
    """
    if not os.path.exists(sample.image_path):
        raise FileNotFoundError(f"Image not found at {sample.image_path}")

    os.makedirs(output_dir, exist_ok=True)

    ann_summaries = []
    for a in annotations:
        ann_summaries.append({
            "annotation_id": a.annotation_id,
            "annotation_type": a.annotation_type.value if hasattr(a.annotation_type, "value") else str(a.annotation_type),
            "raw_label": a.raw_label,
            "phenomenon": a.phenomenon,
            "bbox": a.bbox,
        })

    if view == "annotation_overlay" and annotations:
        clean_id = sample.sample_id.replace(":", "_").replace("/", "_")
        overlay_path = os.path.join(output_dir, f"overlay_{clean_id}.png")

        with Image.open(sample.image_path) as img:
            rgb_img = img.convert("RGB")
            draw = ImageDraw.Draw(rgb_img)
            for a in annotations:
                if a.bbox and len(a.bbox) == 4:
                    x1, y1, x2, y2 = a.bbox
                    draw.rectangle([x1, y1, x2, y2], outline="red", width=3)
                    label_str = a.phenomenon or a.raw_label or "defect"
                    draw.text((x1 + 4, max(0, y1 - 12)), label_str, fill="red")
            rgb_img.save(overlay_path, "PNG")

        return {
            "view_path": overlay_path,
            "width": sample.width,
            "height": sample.height,
            "view_type": "annotation_overlay",
            "annotations": ann_summaries,
        }

    return {
        "view_path": sample.image_path,
        "width": sample.width,
        "height": sample.height,
        "view_type": "raw",
        "annotations": ann_summaries,
    }


def generate_region_view(
    sample: Sample,
    bbox_xyxy: List[int],
    padding_ratio: float = 0.1,
    output_dir: str = "runs/views",
) -> Dict[str, Any]:
    """
    Crop specific region from sample with padding for high-resolution inspection (S05, RP-10).
    """
    if not os.path.exists(sample.image_path):
        raise FileNotFoundError(f"Image not found at {sample.image_path}")

    if len(bbox_xyxy) != 4:
        raise ValueError(f"bbox_xyxy must contain 4 integers [x1, y1, x2, y2], got {bbox_xyxy}")

    x1, y1, x2, y2 = [int(v) for v in bbox_xyxy]
    if x2 <= x1 or y2 <= y1:
        raise ValueError(f"Invalid bbox dimensions: x1={x1}, x2={x2}, y1={y1}, y2={y2}")

    bw = x2 - x1
    bh = y2 - y1
    pad_w = int(bw * padding_ratio)
    pad_h = int(bh * padding_ratio)

    crop_x1 = max(0, x1 - pad_w)
    crop_y1 = max(0, y1 - pad_h)
    crop_x2 = min(sample.width, x2 + pad_w)
    crop_y2 = min(sample.height, y2 + pad_h)

    os.makedirs(output_dir, exist_ok=True)
    clean_id = sample.sample_id.replace(":", "_").replace("/", "_")
    crop_filename = f"crop_{clean_id}_{crop_x1}_{crop_y1}_{crop_x2}_{crop_y2}.png"
    crop_path = os.path.join(output_dir, crop_filename)

    with Image.open(sample.image_path) as img:
        cropped = img.crop((crop_x1, crop_y1, crop_x2, crop_y2))
        cropped.convert("RGB").save(crop_path, "PNG")

    return {
        "view_path": crop_path,
        "original_bbox": [x1, y1, x2, y2],
        "crop_bbox": [crop_x1, crop_y1, crop_x2, crop_y2],
        "crop_width": crop_x2 - crop_x1,
        "crop_height": crop_y2 - crop_y1,
        "sample_width": sample.width,
        "sample_height": sample.height,
        "scale_mapping": {
            "origin_x": crop_x1,
            "origin_y": crop_y1,
            "width": crop_x2 - crop_x1,
            "height": crop_y2 - crop_y1,
        },
    }
