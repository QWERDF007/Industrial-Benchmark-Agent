import json
from collections import Counter
from typing import Literal, Optional

from pydantic import Field, FiniteFloat, JsonValue

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.models import Count, DifferenceType, GalleryDifferenceKind, Identifier
from iad_core.consistency.policy import PolicyRelation
from iad_core.storage.models import Annotation


ANNOTATION_DIFFERENCE_CATEGORIES: dict[DifferenceType, GalleryDifferenceKind] = {
    'CATEGORY': 'category', 'GEOMETRY': 'geometry', 'ONE_SIDED_REGION': 'presence',
    'SPLIT_MERGE': 'instances', 'AMBIGUOUS_MATCH': 'instances', 'QUALITY_LABEL': 'category',
}


class AnnotationDifference(AnalysisModel):
    difference_id: Identifier
    type: DifferenceType
    left: list[Annotation]
    right: list[Annotation]
    region: Optional[list[FiniteFloat]] = Field(default=None, min_length=4, max_length=4)
    policy_relation: PolicyRelation
    facts: dict[str, JsonValue]
    pending: list[str] = Field(default_factory=list)
    reference_from_other: Optional[Literal['left', 'right']] = Field(default=None,
        description='The side where this region is only a reference from the opposite annotation source')
    suspected_missing: Optional[Literal['left', 'right']] = None
    confirmed_conflict: bool = False


class InstanceMatch(AnalysisModel):
    left_id: Identifier
    right_id: Identifier
    bbox_iou: float = Field(ge=0, le=1, allow_inf_nan=False)
    segmentation_iou: Optional[float] = Field(default=None, ge=0, le=1, allow_inf_nan=False)
    geometry_equal: bool
    comparison_kind: Literal['LOCATION_ONLY', 'SEGMENTATION', 'IMAGE_LABEL']


class AnnotationMasking(AnalysisModel):
    annotation_id: Identifier
    total_pixels: Count
    visible_pixels: Count
    ignore_annotation_ids: list[Identifier]


class AnnotationComparison(AnalysisModel):
    status: Literal['COMPLETE', 'PARTIAL', 'UNAVAILABLE']
    policy_relation: PolicyRelation
    matches: list[InstanceMatch]
    differences: list[AnnotationDifference]
    invalid_left: Count
    invalid_right: Count
    confirmed_conflict: bool
    ignore_regions: list[Annotation] = Field(default_factory=list)
    masking: list[AnnotationMasking] = Field(default_factory=list)

    @property
    def factual_differences(self) -> list[AnnotationDifference]:
        differences = []
        for difference in self.differences:
            if difference.type not in ANNOTATION_DIFFERENCE_CATEGORIES:
                continue
            if difference.type == 'AMBIGUOUS_MATCH':
                sides = [Counter(json.dumps(annotation.model_dump(mode='json', include={
                    'annotation_type','raw_label','bbox','polygon','mask_sha256','is_ignored'}), sort_keys=True)
                    for annotation in annotations) for annotations in (difference.left, difference.right)]
                if sides[0] == sides[1]:
                    continue
            differences.append(difference)
        return differences

    @property
    def factual_difference_types(self) -> list[DifferenceType]:
        return sorted({difference.type for difference in self.factual_differences})

    @classmethod
    def json_difference_types(cls, annotation_json: str) -> str:
        return json.dumps(cls.model_validate_json(annotation_json).factual_difference_types)


class AnnotationMatchingConfig(AnalysisModel):
    minimum_iou: float = Field(default=.5, gt=0, le=1, allow_inf_nan=False,
        description='Minimum overlap for confident instance correspondence; lower positive overlap remains a geometry difference requiring correspondence review')
    ambiguity_tolerance: float = Field(default=1e-9, ge=0, allow_inf_nan=False)
    tiny_area: float = Field(default=4, ge=0, allow_inf_nan=False)
    split_coverage: float = Field(default=.9, gt=0, le=1, allow_inf_nan=False)
    max_instances: int = Field(default=500, ge=1, le=5000)
    max_roi_pixels: int = Field(default=16 * 1024 * 1024, ge=1)
    max_cached_pixels: int = Field(default=64 * 1024 * 1024, ge=1)
