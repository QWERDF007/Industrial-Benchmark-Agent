import hashlib
import io
import json
import math
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import List, Literal, Optional

from PIL import Image

from iad_core.advisory.analysis import VisualEvidence, RegionProposal, RegionOrigin, RegionImage
from iad_core.evidence.views import padded_bbox
from iad_core.evidence.masks import annotation_mask, annotation_overlay
from iad_core.storage.models import Sample, Annotation

OVERVIEW_MAX_SIDE = 1280
ROI_MAX_SIDE = 1024


def file_sha256(path: str) -> str:
    digest = hashlib.sha256()
    with Path(path).open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def image_pixel_sha256(path: str, expected_sha256: str) -> str:
    data = Path(path).read_bytes()
    if hashlib.sha256(data).hexdigest() != expected_sha256:
        raise ValueError('图像在冻结期间发生变化，请重新选择')
    with Image.open(io.BytesIO(data)) as original:
        pixels = original.convert('RGB')
        return hashlib.sha256(json.dumps(pixels.size).encode() + pixels.tobytes()).hexdigest()


@dataclass(frozen=True)
class PreparedImage:
    evidence: VisualEvidence
    path: str


class RegionView(RegionOrigin):
    origins: List[RegionOrigin]
    crop_bbox: List[int]


class EvidenceImages:
    def __init__(self, db_path: str):
        self.root = Path(db_path).resolve().parent / "cache" / "visual-evidence"

    def capture(self, sample: Sample, role: str, source: str, bbox: Optional[List[int]] = None,
                source_sha256: Optional[str] = None, annotations: Optional[List[Annotation]] = None,
                annotation_mode: Literal["annotation_mask", "annotation_overlay"] = "annotation_overlay") -> PreparedImage:
        box = bbox or [0, 0, sample.width, sample.height]
        original_bytes = Path(sample.image_path).read_bytes()
        source_sha = hashlib.sha256(original_bytes).hexdigest()
        if source_sha256 and source_sha != source_sha256:
            raise ValueError("Source image changed before capture")
        with Image.open(io.BytesIO(original_bytes)) as original:
            if original.size != (sample.width, sample.height):
                raise ValueError("Image dimensions changed; rescan the dataset")
            image = original.convert("RGB").crop(tuple(box))
            if annotations:
                image = (annotation_mask(sample, annotations, box).convert("RGB") if annotation_mode == "annotation_mask"
                         else annotation_overlay(sample, image, annotations, box))
            if role != "roi":
                image.thumbnail((OVERVIEW_MAX_SIDE, OVERVIEW_MAX_SIDE), Image.Resampling.LANCZOS)
            elif max(image.size) > ROI_MAX_SIDE:
                raise ValueError("ROI must be tiled before encoding")
            buffer = io.BytesIO()
            image.save(buffer, "PNG")
            sent_size = list(image.size)
        payload = buffer.getvalue()
        sha = hashlib.sha256(payload).hexdigest()
        self.root.mkdir(parents=True, exist_ok=True)
        path = self.root / (sha + ".png")
        if not path.exists():
            temporary = path.with_suffix("." + uuid.uuid4().hex + ".tmp")
            temporary.write_bytes(payload)
            temporary.replace(path)
        representation = annotation_mode if annotations else "raw"
        annotation_ids = [annotation.annotation_id for annotation in annotations or []]
        annotation_sha = hashlib.sha256(json.dumps([annotation.model_dump(mode="json") for annotation in annotations],
                                                    sort_keys=True).encode()).hexdigest() if annotations else None
        identity = json.dumps([sample.sample_id, role, source, box, sha, source_sha, representation, annotation_ids, annotation_sha])
        evidence = VisualEvidence(evidence_id="img_" + hashlib.sha256(identity.encode()).hexdigest(), role=role, source=source,
                                  original_size=[sample.width, sample.height], crop_bbox=box, sent_size=sent_size,
                                  sha256=sha, source_sha256=source_sha, representation=representation,
                                  annotation_ids=annotation_ids, annotation_sha256=annotation_sha)
        return PreparedImage(evidence=evidence, path=str(path))

    def path(self, evidence: VisualEvidence) -> str:
        path = self.root / (evidence.sha256 + ".png")
        if not path.is_file() or file_sha256(str(path)) != evidence.sha256:
            raise FileNotFoundError("Visual evidence is missing or its content changed")
        return str(path)

    def capture_regions(self, sample: Sample, regions: List[RegionView], annotations: List[Annotation],
                        source_sha256: str) -> List[RegionImage]:
        views = []
        for region in regions:
            raw = self.capture(sample, "roi", region.source, region.crop_bbox, source_sha256)
            views.append(RegionImage(**region.model_dump(), image=raw.evidence))
            linked = [annotation for annotation in annotations
                      if annotation.annotation_id in {origin.annotation_id for origin in region.origins}]
            if linked:
                mask = self.capture(sample, "roi", region.source, region.crop_bbox, source_sha256,
                                    annotations=linked, annotation_mode="annotation_mask")
                views.append(RegionImage(**region.model_dump(), image=mask.evidence))
        return views

    @staticmethod
    def tiles(sample: Sample, bbox: List[int], padding: float) -> List[List[int]]:
        if not (0 <= bbox[0] < bbox[2] <= sample.width and 0 <= bbox[1] < bbox[3] <= sample.height):
            raise ValueError(f"Invalid original image region: {bbox}")
        x1, y1, x2, y2 = padded_bbox(sample, bbox, padding)
        axes = []
        for start, end in [(x1, x2), (y1, y2)]:
            distance = max(0, end - start - ROI_MAX_SIDE)
            steps = math.ceil(distance / (ROI_MAX_SIDE * 0.8))
            axes.append([start + round(distance * i / steps) for i in range(steps + 1)] if steps else [start])
        return [[x, y, min(x + ROI_MAX_SIDE, x2), min(y + ROI_MAX_SIDE, y2)] for y in axes[1] for x in axes[0]]

    def plan(self, sample: Sample, annotations: List[Annotation], proposals: List[RegionProposal]) -> List[RegionView]:
        requested = []
        for annotation in annotations:
            if annotation.bbox and annotation.geometry_status != "INVALID":
                x1, y1, x2, y2 = annotation.bbox
                requested.append(("annotation", annotation.annotation_id, annotation.raw_label,
                                  [math.floor(x1), math.floor(y1), math.ceil(x2), math.ceil(y2)], []))
        has_annotations = bool(requested)
        for proposal in proposals:
            x1, y1, x2, y2 = proposal.bbox_1000
            requested.append(("model", None, proposal.reason, [math.floor(x1 * sample.width / 1000), math.floor(y1 * sample.height / 1000),
                                                              math.ceil(x2 * sample.width / 1000), math.ceil(y2 * sample.height / 1000)], proposal.check_ids))
        if max(sample.width, sample.height) > OVERVIEW_MAX_SIDE or not has_annotations:
            requested.append(("coverage", None, "原图细节覆盖", [0, 0, sample.width, sample.height], []))
        regions = {}
        for source, annotation_id, label, bbox, check_ids in requested:
            origin = RegionOrigin(source=source, annotation_id=annotation_id, label=label, bbox=bbox, check_ids=check_ids)
            for tile in self.tiles(sample, bbox, 0 if source == "coverage" else 0.2):
                key = tuple(tile)
                if key not in regions:
                    regions[key] = RegionView(**origin.model_dump(), origins=[origin], crop_bbox=tile)
                elif origin not in regions[key].origins:
                    regions[key].origins.append(origin)
        return list(regions.values())
