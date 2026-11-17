import math
from dataclasses import dataclass

import numpy as np

from iad_core.consistency.geometry import InstanceGeometry, union_region
from iad_core.evidence.masks import ImageExtent
from iad_core.storage.models import Annotation


@dataclass(frozen=True)
class AnnotationCoverage:
    left_only: int
    right_only: int

    @property
    def facts(self) -> dict[str, int]:
        return {'left_only_pixels': self.left_only, 'right_only_pixels': self.right_only}

    @classmethod
    def compare(cls, left: list[InstanceGeometry], right: list[InstanceGeometry]) -> 'AnnotationCoverage':
        bounds = union_region([item.bounds for item in [*left, *right]])
        x1, y1 = math.floor(bounds[0]), math.floor(bounds[1])
        x2, y2 = math.ceil(bounds[2]), math.ceil(bounds[3])
        left_only = right_only = 0
        # Work in bounded strips; memory depends on the ROI width, not image resolution.
        step = max(1, 262144 // max(1, x2-x1))
        for top in range(y1, y2, step):
            region = (x1, top, x2, min(y2, top+step))
            masks = []
            for group in (left, right):
                mask = np.zeros((region[3]-region[1], x2-x1), dtype=bool)
                for item in group:
                    if item.bounds[1] < region[3] and item.bounds[3] > region[1]:
                        mask |= item.raster(region)
                masks.append(mask)
            left_only += int(np.count_nonzero(masks[0] & ~masks[1]))
            right_only += int(np.count_nonzero(masks[1] & ~masks[0]))
        return cls(left_only, right_only)

    @classmethod
    def recorded(cls, left: list[Annotation], right: list[Annotation]) -> 'AnnotationCoverage':
        annotations = [*left, *right]
        bounds = union_region([InstanceGeometry.vector_bounds(item) for item in annotations
            if item.annotation_type != 'mask']) if any(item.annotation_type != 'mask' for item in annotations) else [0, 0, 1, 1]
        size = ImageExtent(width=max(1, math.ceil(bounds[2])+1, *(a.source_width or 0 for a in annotations)),
            height=max(1, math.ceil(bounds[3])+1, *(a.source_height or 0 for a in annotations)))
        return cls.compare(*[[InstanceGeometry.prepare(item, size, 16*1024*1024) for item in side]
            for side in (left, right)])
