from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class TrackReadinessStatus(str, Enum):
    READY = "READY"
    PARTIAL = "PARTIAL"
    NOT_READY = "NOT_READY"
    NOT_EVALUATED = "NOT_EVALUATED"


class TrackReadiness(BaseModel):
    standard_ad: TrackReadinessStatus = TrackReadinessStatus.NOT_EVALUATED
    open_normal: TrackReadinessStatus = TrackReadinessStatus.NOT_EVALUATED
    domain_shift: TrackReadinessStatus = TrackReadinessStatus.NOT_EVALUATED
    small_weak: TrackReadinessStatus = TrackReadinessStatus.NOT_EVALUATED
    global_logical: TrackReadinessStatus = TrackReadinessStatus.NOT_EVALUATED


class DatasetAudit(BaseModel):
    task_id: str = Field(..., description="Inspection task ID")
    samples: Dict[str, int] = Field(
        ...,
        description="Sample statistics: total, pass, fail, uncertain",
    )
    annotations: Dict[str, int] = Field(
        ...,
        description="Annotation statistics: total, bbox, polygon, mask, image, annotated_samples, unannotated_samples",
    )
    geometry: Dict[str, int] = Field(
        default_factory=dict,
        description="BBox geometry stats: bbox_total, bbox_valid, bbox_clipped, bbox_scaled, bbox_invalid, bbox_usable",
    )
    metadata: Dict[str, float] = Field(
        ...,
        description="Metadata missing rates (0.0 - 1.0)",
    )
    issues: Dict[str, int] = Field(
        default_factory=dict,
        description="Issue counts grouped by issue_type or severity",
    )
    track_readiness: Dict[str, str] = Field(
        ...,
        description="Readiness status for each benchmark track",
    )
    resolution_distribution: Optional[Dict[str, int]] = Field(
        default_factory=dict,
        description="Resolution distribution (e.g. '1178x1008': count)",
    )
    phenomenon_distribution: Optional[Dict[str, int]] = Field(
        default_factory=dict,
        description="Phenomenon distribution (phenomenon: count)",
    )
    data_origin_distribution: Optional[Dict[str, int]] = Field(
        default_factory=dict,
        description="Sample distribution across data origins (LEGACY_TRAIN, LEGACY_TEST, AUGMENTED, etc.)",
    )
