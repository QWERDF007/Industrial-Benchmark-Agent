import hashlib
import io
import uuid
from pathlib import Path
from typing import List, Optional

from PIL import Image, ImageChops, ImageDraw

from iad_core.storage.models import Annotation, AnnotationType, Sample


class MaskImages:
    def __init__(self, db_path: str):
        self.root = Path(db_path).resolve().parent / "cache" / "annotation-masks"

    @staticmethod
    def encode(image: Image.Image) -> bytes:
        pixels = image.convert("L").point(lambda value: 255 if value else 0)
        if not pixels.getbbox():
            raise ValueError("Mask contains no foreground pixels")
        buffer = io.BytesIO()
        pixels.save(buffer, "PNG")
        return buffer.getvalue()

    def store(self, payload: bytes) -> tuple[str, str]:
        sha = hashlib.sha256(payload).hexdigest()
        self.root.mkdir(parents=True, exist_ok=True)
        path = self.root / (sha + ".png")
        if not path.exists() or hashlib.sha256(path.read_bytes()).hexdigest() != sha:
            temporary = path.with_suffix("." + uuid.uuid4().hex + ".tmp")
            temporary.write_bytes(payload)
            temporary.replace(path)
        return str(path), sha

    @staticmethod
    def load(annotation: Annotation, sample: Sample) -> Image.Image:
        if not annotation.mask_path or not annotation.mask_sha256:
            raise ValueError("Mask pixels or their fingerprint are missing; rescan the annotation")
        payload = Path(annotation.mask_path).read_bytes()
        if hashlib.sha256(payload).hexdigest() != annotation.mask_sha256:
            raise ValueError("Mask pixels changed after import")
        with Image.open(io.BytesIO(payload)) as image:
            if image.format != "PNG" or image.mode != "L" or image.size != (sample.width, sample.height):
                raise ValueError("Mask pixels do not match the sample dimensions")
            if not image.getbbox():
                raise ValueError("Mask contains no foreground pixels")
            return image.copy()


def annotation_mask(sample: Sample, annotations: List[Annotation], bbox: Optional[List[int]] = None) -> Image.Image:
    box = bbox or [0, 0, sample.width, sample.height]
    result = Image.new("L", (box[2]-box[0], box[3]-box[1]))
    for annotation in annotations:
        if annotation.geometry_status == "INVALID":
            continue
        if annotation.annotation_type == AnnotationType.MASK:
            result = ImageChops.lighter(result, MaskImages.load(annotation, sample).crop(tuple(box)))
        elif annotation.polygon:
            ImageDraw.Draw(result).polygon([(x-box[0], y-box[1]) for x, y in annotation.polygon], fill=255)
        elif annotation.bbox:
            x1, y1, x2, y2 = annotation.bbox
            ImageDraw.Draw(result).rectangle([x1-box[0], y1-box[1], x2-box[0], y2-box[1]], fill=255)
    return result


def annotation_overlay(sample: Sample, image: Image.Image, annotations: List[Annotation],
                       bbox: Optional[List[int]] = None) -> Image.Image:
    box = bbox or [0, 0, sample.width, sample.height]
    result = image.copy()
    for annotation in annotations:
        if annotation.geometry_status == "INVALID":
            continue
        if annotation.annotation_type == AnnotationType.MASK:
            pixels = annotation_mask(sample, [annotation], box)
            result = Image.composite(Image.new("RGB", result.size, "#f59e0b"), result,
                                     pixels.point(lambda value: 85 if value else 0))
        elif annotation.polygon:
            points = [(x-box[0], y-box[1]) for x, y in annotation.polygon]
            ImageDraw.Draw(result).polygon(points, outline="red", width=2)
        elif annotation.bbox:
            x1, y1, x2, y2 = annotation.bbox
            draw = ImageDraw.Draw(result)
            draw.rectangle([x1-box[0], y1-box[1], x2-box[0], y2-box[1]], outline="red", width=3)
    return result
