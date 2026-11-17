import hashlib
import json
from typing import Literal, Optional

from pydantic import Field, FiniteFloat, JsonValue, model_validator

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.models import Count, DifferenceType, GalleryDifferenceKind, Identifier
from iad_core.consistency.policy import PolicyRelation
from iad_core.storage.models import Annotation
from iad_core.consistency.conflict_categories import ConflictCategory
from iad_core.consistency.annotation_assignment import AnnotationAssignment


ANNOTATION_DIFFERENCE_CATEGORIES: dict[DifferenceType, GalleryDifferenceKind] = {
    'CATEGORY': 'category', 'GEOMETRY': 'geometry', 'ONE_SIDED_REGION': 'presence', 'ANNOTATION_COUNT':'presence',
    'SPLIT_MERGE': 'instances', 'QUALITY_LABEL': 'category',
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
    coordinate_frame: Literal['RAW_EXACT','RELATIVE_IMAGE','UNAVAILABLE'] = 'UNAVAILABLE'

    @model_validator(mode='before')
    @classmethod
    def restore_qualitative_comparison(cls, value: object) -> object:
        if not isinstance(value, dict) or not any(isinstance(item, dict) and item.get('type') == 'AMBIGUOUS_MATCH'
                for item in value.get('differences', [])):
            return value
        from iad_core.consistency.geometry import bbox_iou

        original = value
        values = original['differences']
        matches = list(original.get('matches', []))
        restored = []
        for value in values:
            if isinstance(value, AnnotationDifference) or value.get('type') != 'AMBIGUOUS_MATCH':
                restored.append(value)
                continue
            sides = [[Annotation.model_validate(item) for item in value[side]] for side in ('left', 'right')]
            shapes = [[item.model_dump(include={'annotation_type', 'bbox', 'polygon', 'mask_sha256'}) for item in side]
                for side in sides]
            scores = {(i, j): bbox_iou(first.bbox, second.bbox)
                for i, first in enumerate(sides[0]) for j, second in enumerate(sides[1])
                if first.bbox is not None and second.bbox is not None}
            exact = {(i, j) for i, first in enumerate(shapes[0]) for j, second in enumerate(shapes[1])
                if first == second}
            assignment = AnnotationAssignment.solve({i: item.annotation_id for i, item in enumerate(sides[0])},
                {j: item.annotation_id for j, item in enumerate(sides[1])}, scores, exact)
            findings = []
            for i, j in assignment.pairs:
                matches.append({'left_id': sides[0][i].annotation_id, 'right_id': sides[1][j].annotation_id,
                    'bbox_iou': scores.get((i, j), 1.), 'segmentation_iou': None,
                    'geometry_equal': shapes[0][i] == shapes[1][j],
                    'comparison_kind': 'IMAGE_LABEL' if sides[0][i].annotation_type == 'image' else 'LOCATION_ONLY'})
                if sides[0][i].raw_label != sides[1][j].raw_label:
                    findings.append(('CATEGORY', (i,), (j,), {}))
                if shapes[0][i] != shapes[1][j]:
                    findings.append(('GEOMETRY', (i,), (j,), {'bbox_iou': scores[i, j], 'segmentation_iou': None}))
            for lc, rc in assignment.groups:
                findings.append(('SPLIT_MERGE', lc, rc, {}))
                if {sides[0][i].raw_label for i in lc} != {sides[1][j].raw_label for j in rc}:
                    findings.append(('CATEGORY', lc, rc, {}))
            findings.extend(('ONE_SIDED_REGION', (i,), (), {}) for i in assignment.left_only)
            findings.extend(('ONE_SIDED_REGION', (), (j,), {}) for j in assignment.right_only)
            for index, (kind, lc, rc, facts) in enumerate(findings):
                left, right = [sides[0][i] for i in lc], [sides[1][j] for j in rc]
                identity = value['difference_id'] if index == 0 else 'difference_' + hashlib.sha256(json.dumps(
                    [value['difference_id'], kind, [a.annotation_id for a in left], [a.annotation_id for a in right]]
                    ).encode()).hexdigest()
                restored.append({**value, 'difference_id': identity, 'type': kind, 'left': left, 'right': right,
                    'facts': facts, 'reference_from_other': ('right' if left else 'left')
                        if kind == 'ONE_SIDED_REGION' else None})
        return {**original, 'differences': restored, 'matches': matches}

    @property
    def factual_differences(self) -> list[AnnotationDifference]:
        return [difference for difference in self.differences if difference.type in ANNOTATION_DIFFERENCE_CATEGORIES]

    @property
    def factual_difference_types(self) -> list[DifferenceType]:
        return sorted({difference.type for difference in self.factual_differences})

    @property
    def conflict_categories(self) -> list[ConflictCategory]:
        categories = set()
        for difference in self.factual_differences:
            match difference.type:
                case 'QUALITY_LABEL' | 'CATEGORY':
                    categories.add(ConflictCategory.CATEGORY)
                case 'GEOMETRY':
                    categories.add(ConflictCategory.POSITION)
                case 'ONE_SIDED_REGION':
                    categories.add(ConflictCategory.EXTRA if difference.left else ConflictCategory.MISSING)
                case 'ANNOTATION_COUNT':
                    categories.add(ConflictCategory.EXTRA if difference.facts['left_count']>difference.facts['right_count'] else ConflictCategory.MISSING)
                case 'SPLIT_MERGE':
                    categories.add(ConflictCategory.SPLIT if len(difference.left)>len(difference.right) else ConflictCategory.MERGE)
        return [category for category in ConflictCategory if category in categories]

    @classmethod
    def json_difference_types(cls, annotation_json: str) -> str:
        return json.dumps(cls.model_validate_json(annotation_json).factual_difference_types)


class AnnotationMatchingConfig(AnalysisModel):
    minimum_iou: float = Field(default=.5, gt=0, le=1, allow_inf_nan=False,
        description='Minimum overlap for confident instance correspondence; lower positive overlap remains a geometry difference requiring correspondence review')
    max_instances: int = Field(default=500, ge=1, le=5000)
    max_roi_pixels: int = Field(default=16 * 1024 * 1024, ge=1)
    max_cached_pixels: int = Field(default=64 * 1024 * 1024, ge=1)

    @model_validator(mode='before')
    @classmethod
    def restore_matching_parameters(cls, value: object) -> object:
        if isinstance(value, dict):
            return {key: item for key, item in value.items()
                if key not in {'ambiguity_tolerance', 'tiny_area', 'split_coverage'}}
        return value
