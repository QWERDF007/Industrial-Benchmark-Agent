from typing import Literal

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel, NonBlankText, VisualEvidence
from iad_core.consistency.models import Identifier


class IdentityRegionSource(AnalysisModel):
    side: Literal['main', 'candidate']
    annotation_id: Identifier
    original_bbox: tuple[float, float, float, float]


class IdentityRegionPair(AnalysisModel):
    region_pair_id: Identifier
    source_annotations: list[IdentityRegionSource] = Field(min_length=1)
    main_window: tuple[int, int, int, int] | None
    candidate_window: tuple[int, int, int, int] | None
    mapping: Literal['registered', 'unverified']
    limitation: NonBlankText | None = None
    main_media: VisualEvidence | None = None
    candidate_media: VisualEvidence | None = None


class IdentityRegionCheck(AnalysisModel):
    region_pair_id: Identifier
    main_media_id: Identifier
    candidate_media_id: Identifier
    visual_relation: Literal['same', 'different', 'unverified']
    main_description: NonBlankText
    candidate_description: NonBlankText
    reason: NonBlankText
