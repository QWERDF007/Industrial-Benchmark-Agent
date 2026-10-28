from typing import Literal, Optional, List, Dict, Any
from pydantic import BaseModel, Field
from iad_core.candidate.schemas import CandidateSignals
from iad_core.duplicate.models import PairObservation


class NormalReferenceEvidence(BaseModel):
    sample_id: str
    image_path: str
    similarity: float
    quality_status: str
    batch_id: Optional[str] = None
    physical_sample_id: Optional[str] = None


class NeighborEvidence(BaseModel):
    sample_id: str
    image_path: str
    similarity: float
    quality_status: str
    data_origin: str
    batch_id: Optional[str] = None
    physical_sample_id: Optional[str] = None


class DirectPairEvidence(PairObservation):
    sample_id: str
    image_path: str
    data_origin: str = "UNKNOWN"


class StrictContentMemberEvidence(BaseModel):
    relation: Literal['EXACT'] = 'EXACT'
    group_id: str
    sample_id: str
    image_path: str
    data_origin: str = "UNKNOWN"
    is_cross_origin: bool = False
    group_size: int


class AnnotationEvidence(BaseModel):
    annotation_id: str
    annotation_type: str
    raw_label: str
    phenomenon: Optional[str] = None
    bbox_json: Optional[str] = None
    polygon_json: Optional[str] = None
    geometry_status: str = "VALID"
    source: str


class EvidencePackage(BaseModel):
    """
    Evidence Package for a candidate sample under human review.
    Contains query sample metadata, score breakdown, nearest normal references,
    similar history neighbors, versioned pair observations, published strict content members,
    and annotations.
    """
    sample_id: str
    image_path: str
    relative_path: str
    task_id: str
    candidate_score: float = Field(..., description="Mining composite score (0..1)")
    signals: CandidateSignals
    nearest_normal: List[NormalReferenceEvidence] = Field(default_factory=list)
    nearest_neighbors: List[NeighborEvidence] = Field(default_factory=list)
    direct_pair_observations: List[DirectPairEvidence] = Field(default_factory=list)
    strict_content_members: List[StrictContentMemberEvidence] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    annotations: List[AnnotationEvidence] = Field(default_factory=list)
    evidence_status: str = Field("COMPLETE", description="'COMPLETE' or 'INCOMPLETE'")
    evidence_version: str = "v2"
