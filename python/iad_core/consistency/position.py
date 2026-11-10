from typing import Literal

from pydantic import Field, FiniteFloat

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.consistency.geometry import bbox_iou


class PositionTolerancePolicy(AnalysisModel):
    policy_version: NonBlankText = 'coverage-v1'
    absolute_boundary_px: FiniteFloat | None = Field(default=None, ge=0)
    relative_boundary_fraction: FiniteFloat | None = Field(default=None, ge=0, le=1)
    min_coverage_consistency: FiniteFloat | None = Field(default=None, ge=0, le=1)
    consider_registration_uncertainty: Literal[True] = True
    tiny_defect_coverage_override: Literal[True] = True


class PositionComparison(AnalysisModel):
    aligned_bbox: tuple[FiniteFloat, FiniteFloat, FiniteFloat, FiniteFloat]
    bbox_iou: FiniteFloat
    edge_offsets_px: tuple[FiniteFloat, FiniteFloat, FiniteFloat, FiniteFloat]
    center_offset_px: tuple[FiniteFloat, FiniteFloat]
    relative_size_change: tuple[FiniteFloat, FiniteFloat]
    main_overlap_fraction: FiniteFloat
    candidate_overlap_fraction: FiniteFloat
    registration_uncertainty_px: FiniteFloat | None
    tolerance_policy_version: NonBlankText
    tolerance_result: Literal['within_tolerance', 'outside_tolerance', 'borderline']
    coverage_assessment: Literal['requires_visual_confirmation'] = 'requires_visual_confirmation'

    @classmethod
    def measure(cls, main, candidate, *, policy: PositionTolerancePolicy, uncertainty_px: float | None):
        widths = [box[2]-box[0] for box in (main,candidate)]
        heights = [box[3]-box[1] for box in (main,candidate)]
        if min(*widths,*heights) <= 0:
            raise ValueError('位置比较需要有效矩形')
        intersection = max(0,min(main[2],candidate[2])-max(main[0],candidate[0])) * max(0,min(main[3],candidate[3])-max(main[1],candidate[1]))
        fractions = [intersection/(width*height) for width,height in zip(widths,heights)]
        offsets = tuple(float(b-a) for a,b in zip(main,candidate))
        result = 'borderline'
        if all(value is not None for value in (policy.absolute_boundary_px,policy.relative_boundary_fraction,
                policy.min_coverage_consistency,uncertainty_px)):
            limits = [policy.absolute_boundary_px+uncertainty_px] * 4
            relative = [abs(value)/size for value,size in zip(offsets,(widths[0],heights[0],widths[0],heights[0]))]
            within = (all(abs(value)<=limit for value,limit in zip(offsets,limits))
                and max(relative)<=policy.relative_boundary_fraction and min(fractions)>=policy.min_coverage_consistency)
            result = 'within_tolerance' if within else 'outside_tolerance'
            if uncertainty_px > 0 and max(abs(value) for value in offsets) <= uncertainty_px:
                result = 'borderline'
        return cls(aligned_bbox=candidate, bbox_iou=bbox_iou(main,candidate), edge_offsets_px=offsets,
            center_offset_px=((candidate[0]+candidate[2]-main[0]-main[2])/2,(candidate[1]+candidate[3]-main[1]-main[3])/2),
            relative_size_change=(widths[1]/widths[0]-1,heights[1]/heights[0]-1),
            main_overlap_fraction=fractions[0],candidate_overlap_fraction=fractions[1],registration_uncertainty_px=uncertainty_px,
            tolerance_policy_version=policy.policy_version,tolerance_result=result)


    @classmethod
    def compare_annotations(cls, main_boxes, candidate_boxes, *, policy, uncertainty_px):
        pairs = [(main_id,candidate_id,box,other) for main_id,box in main_boxes.items() for candidate_id,other in candidate_boxes.items()]
        selected = {(main_id,candidate_id) for main_id,candidate_id,box,other in pairs if bbox_iou(box,other)>0}
        for main_id in main_boxes:
            options = [item for item in pairs if item[0] == main_id]
            if options:
                nearest = min(options,key=lambda item:sum((item[2][axis]+item[2][axis+2]-item[3][axis]-item[3][axis+2])**2 for axis in (0,1)))
                selected.add(nearest[:2])
        return [PositionAnnotationComparison(main_annotation_id=main_id,candidate_annotation_id=candidate_id,
            **cls.measure(box,other,policy=policy,uncertainty_px=uncertainty_px).model_dump())
            for main_id,candidate_id,box,other in pairs if (main_id,candidate_id) in selected]


class PositionAnnotationComparison(PositionComparison):
    main_annotation_id: NonBlankText
    candidate_annotation_id: NonBlankText
