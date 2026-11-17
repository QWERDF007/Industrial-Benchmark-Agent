import math
from dataclasses import dataclass

import numpy as np

from iad_core.consistency.geometry import InstanceGeometry, union_region
from iad_core.evidence.masks import ImageExtent
from iad_core.storage.models import Annotation
from iad_core.consistency.conflict_categories import ConflictCategory


MIN_CONTENT_CHANGE_FRACTION = .2
CONTENT_CHANGE_GUIDANCE = f'''少标内容、多标内容只用于明显的大范围覆盖增减：程序按对应对象两侧标注联合区域计算单向增减，至少占联合区域的{MIN_CONTENT_CHANGE_FRACTION:.0%}才达到内容差异门槛。多边形使用真实轮廓，拆分合并使用联合覆盖，不能以外接框替代。达到几何门槛后仍须观察原图，说明明显漏盖或多盖的是哪一块实际内容，不能仅按面积数字判断。
两侧基本覆盖同一块缺陷，仅轮廓、边界、位置或尺寸略有不同，归position_difference（位置差异），不计少标内容或多标内容；标注完全相同且实际覆盖一致时归一致。极小对象也以实际覆盖是否明显改变为准。'''


@dataclass(frozen=True)
class AnnotationCoverage:
    left_only: int
    right_only: int
    union: int

    @property
    def categories(self) -> list[ConflictCategory]:
        return [category for category, pixels in ((ConflictCategory.MISSING_CONTENT, self.right_only),
            (ConflictCategory.EXTRA_CONTENT, self.left_only))
            if self.union and pixels / self.union >= MIN_CONTENT_CHANGE_FRACTION]

    @property
    def facts(self) -> dict[str, int]:
        return {'left_only_pixels': self.left_only, 'right_only_pixels': self.right_only,
            'union_pixels': self.union}

    @classmethod
    def compare(cls, left: list[InstanceGeometry], right: list[InstanceGeometry]) -> 'AnnotationCoverage':
        bounds = union_region([item.bounds for item in [*left, *right]])
        x1, y1 = math.floor(bounds[0]), math.floor(bounds[1])
        x2, y2 = math.ceil(bounds[2]), math.ceil(bounds[3])
        left_only = right_only = union = 0
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
            union += int(np.count_nonzero(masks[0] | masks[1]))
        return cls(left_only, right_only, union)

    @classmethod
    def recorded(cls, left: list[Annotation], right: list[Annotation]) -> 'AnnotationCoverage':
        annotations = [*left, *right]
        bounds = union_region([InstanceGeometry.vector_bounds(item) for item in annotations
            if item.annotation_type != 'mask']) if any(item.annotation_type != 'mask' for item in annotations) else [0, 0, 1, 1]
        size = ImageExtent(width=max(1, math.ceil(bounds[2])+1, *(a.source_width or 0 for a in annotations)),
            height=max(1, math.ceil(bounds[3])+1, *(a.source_height or 0 for a in annotations)))
        return cls.compare(*[[InstanceGeometry.prepare(item, size, 16*1024*1024) for item in side]
            for side in (left, right)])
