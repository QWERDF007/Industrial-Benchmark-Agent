from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from iad_core.consistency.annotation_models import AnnotationMasking, AnnotationMatchingConfig
from iad_core.consistency.geometry import InstanceGeometry
from iad_core.consistency.models import Relation
from iad_core.storage.models import Annotation

if TYPE_CHECKING:
    from iad_core.consistency.annotations import AnnotationSet


@dataclass(frozen=True)
class GeometryIssue:
    side: int
    index: int | None
    reason: str
    source_errors: list[str] = field(default_factory=list)


@dataclass
class ComparisonDomain:
    sides: list[dict[int, InstanceGeometry]]
    invalid: list[int]
    issues: list[GeometryIssue]
    ignore_regions: list[Annotation]
    masking: list[AnnotationMasking]

    @staticmethod
    def pixel_statistics(sides: list['AnnotationSet'], left, right):
        from iad_core.duplicate.verification_models import RegionPixelStatistics
        regions=[item.bbox for source in sides for item in source.annotations
            if item.bbox and item.geometry_status!='INVALID' and not item.is_ignored]
        if not regions:return None
        if any(source.annotation_coordinates!='RAW' for source in sides):
            return RegionPixelStatistics(status='UNSUPPORTED',regions=[],reason='Raw annotation coordinates are unavailable on one side')
        return left.region_statistics(right,regions)
    unavailable_reason: str | None

    @classmethod
    def prepare(cls, sides: list['AnnotationSet'], relation: Relation, config: AnnotationMatchingConfig) -> 'ComparisonDomain':
        domain = cls([{}, {}], [0, 0], [],
            [annotation for side in sides for annotation in side.annotations if annotation.is_ignored], [], None)
        if relation != 'EXACT' or (sides[0].width, sides[0].height) != (sides[1].width, sides[1].height) or any(side.annotation_coordinates != 'RAW' for side in sides):
            domain.unavailable_reason = 'Original coordinate correspondence is not verified'
        cached_pixels = 0
        invalid_ignore = False
        for side_index, side in enumerate(sides):
            if side.errors:
                domain.issues.append(GeometryIssue(side_index, None, 'Imported annotation records are unreadable', side.errors))
                domain.invalid[side_index] += len(side.errors)
            if len(side.annotations) > config.max_instances:
                domain.issues.append(GeometryIssue(side_index, None, 'RESOURCE_LIMIT: instance count exceeds matching budget'))
                domain.invalid[side_index] += len(side.annotations)
                invalid_ignore |= any(annotation.is_ignored for annotation in side.annotations)
                continue
            for index, annotation in enumerate(side.annotations):
                try:
                    if annotation.sample_id != side.sample_id:
                        raise ValueError('Annotation belongs to a different sample')
                    geometry = InstanceGeometry.prepare(annotation, side, config.max_roi_pixels)
                    size = geometry.pixels.size if geometry.pixels is not None else 0
                    if cached_pixels + size > config.max_cached_pixels:
                        raise ValueError('RESOURCE_LIMIT: prepared annotations exceed matching budget')
                    cached_pixels += size
                    domain.sides[side_index][index] = geometry
                except (ValueError, OSError) as error:
                    domain.issues.append(GeometryIssue(side_index, index, str(error)))
                    domain.invalid[side_index] += 1
                    invalid_ignore |= annotation.is_ignored
        if invalid_ignore:
            domain.unavailable_reason = 'Ignore region is unreadable; the comparable pixel domain is unknown'
        ignores = [geometry for side in domain.sides for geometry in side.values() if geometry.annotation.is_ignored]
        for side_index, prepared in enumerate(domain.sides):
            for index, geometry in list(prepared.items()):
                if geometry.annotation.is_ignored:
                    del prepared[index]
                    continue
                if domain.unavailable_reason is not None or geometry.annotation.annotation_type == 'image':
                    continue
                previous_size = geometry.pixels.size if geometry.pixels is not None else 0
                try:
                    visible, record = geometry.exclude(ignores, config.max_roi_pixels)
                    size = visible.pixels.size if visible is not None and visible.pixels is not None else 0
                    if cached_pixels - previous_size + size > config.max_cached_pixels:
                        raise ValueError('RESOURCE_LIMIT: masked annotations exceed the prepared pixel budget')
                    cached_pixels += size - previous_size
                    if record is not None:
                        domain.masking.append(record)
                    if visible is None:
                        del prepared[index]
                    else:
                        prepared[index] = visible
                except ValueError as error:
                    del prepared[index]
                    cached_pixels -= previous_size
                    domain.invalid[side_index] += 1
                    domain.issues.append(GeometryIssue(side_index, index, str(error)))
        return domain
