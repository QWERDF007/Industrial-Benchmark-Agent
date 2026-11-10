import math

from iad_core.advisory.analysis import RegionOrigin
from iad_core.evidence.images import RegionView
from iad_core.storage.models import Annotation, Sample


def annotation_views(sample: Sample, annotations: list[Annotation]) -> list[RegionView]:
    regions: dict[tuple[int, ...], RegionView] = {}
    for annotation in annotations:
        if not annotation.bbox or annotation.geometry_status == 'INVALID' or annotation.is_ignored:
            continue
        x1, y1, x2, y2 = annotation.bbox
        bounds = [math.floor(x1), math.floor(y1), math.ceil(x2), math.ceil(y2)]
        pad_x, pad_y = (x2 - x1) * .1, (y2 - y1) * .1
        crop = [max(0, math.floor(x1 - pad_x)), max(0, math.floor(y1 - pad_y)),
            min(sample.width, math.ceil(x2 + pad_x)), min(sample.height, math.ceil(y2 + pad_y))]
        if crop[0] >= crop[2] or crop[1] >= crop[3]:
            continue
        origin = RegionOrigin(source='annotation', annotation_id=annotation.annotation_id,
            label=annotation.raw_label, bbox=bounds)
        key = tuple(crop)
        if key not in regions:
            regions[key] = RegionView(**origin.model_dump(), origins=[origin], crop_bbox=crop)
        else:
            regions[key].origins.append(origin)
    return list(regions.values())
