from typing import Optional, List, Dict, Any, Tuple
from pydantic import BaseModel, Field
from iad_core.candidate.schemas import CandidateSignals


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


class DirectVerifiedPairEvidence(BaseModel):
    """
    Evidence for an image pair that was DIRECTLY verified by PairVerifier V2.
    Metrics reflect real pairwise calculation.
    """
    sample_id: str
    image_path: str
    dino_cosine: float
    pixel_cosine: float
    ncc: float
    mean_abs_diff: float
    high_diff_ratio: float
    best_shift: Tuple[int, int] = (0, 0)
    verified: bool = True
    data_origin: str = "UNKNOWN"


class VerifiedComponentMemberEvidence(BaseModel):
    """
    Evidence for a transitive connected component member from Union-Find.
    Represents component connectivity rather than direct verified pairwise edge.
    """
    group_id: str
    sample_id: str
    image_path: str
    data_origin: str = "UNKNOWN"
    is_cross_origin: bool = False
    group_size: int = 1


class DuplicateEvidence(BaseModel):
    group_id: str
    sample_id: str
    image_path: str
    verified: bool
    pixel_similarity: float
    feature_similarity: float
    is_cross_origin: bool
    data_origin: str


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
    similar history neighbors, direct verified duplicate pairs, verified component members,
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
    direct_verified_pairs: List[DirectVerifiedPairEvidence] = Field(default_factory=list)
    verified_component_members: List[VerifiedComponentMemberEvidence] = Field(default_factory=list)
    verified_duplicates: List[DuplicateEvidence] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    annotations: List[AnnotationEvidence] = Field(default_factory=list)
    evidence_status: str = Field("COMPLETE", description="'COMPLETE' or 'INCOMPLETE'")
    evidence_version: str = "v2"
