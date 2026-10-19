from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class CandidateSignals(BaseModel):
    normal_distance: float = Field(..., description="Distance to nearest normal reference (0..1)")
    density_outlier: float = Field(..., description="Local KNN density outlier score (0..1)")
    domain_novelty: float = Field(..., description="Novelty relative to domain/historical centroid (0..1)")
    annotation_signal: float = Field(..., description="Lightweight signal from existing annotations (0..1)")


class CandidateRecord(BaseModel):
    sample_id: str
    rank: int = 0
    candidate_score: float = Field(0.5, description="Weighted composite candidate score (0..1)")
    signals: CandidateSignals = Field(
        default_factory=lambda: CandidateSignals(
            normal_distance=0.5,
            density_outlier=0.5,
            domain_novelty=0.5,
            annotation_signal=0.0,
        )
    )
    data_origin: str = "REAL"
    quality_status: str = "UNCERTAIN"
    batch_id: Optional[str] = None
    physical_sample_id: Optional[str] = None
    image_path: str = ""
    relative_path: str = ""
    is_required: bool = True
    sources: Optional[List[str]] = Field(default_factory=list, description="Discovery channels e.g. DINO, LLM, AUDIT")
    priority_reason: Optional[str] = Field(None, description="Detailed reason for review prioritization")
    source_scores: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Per-source score breakdown")



class CandidateScoringWeights(BaseModel):
    normal_distance: float = 0.40
    density_outlier: float = 0.30
    domain_novelty: float = 0.15
    annotation_signal: float = 0.15

    def normalized(self) -> "CandidateScoringWeights":
        total = self.normal_distance + self.density_outlier + self.domain_novelty + self.annotation_signal
        if total <= 0:
            return CandidateScoringWeights(
                normal_distance=0.25, density_outlier=0.25, domain_novelty=0.25, annotation_signal=0.25
            )
        return CandidateScoringWeights(
            normal_distance=round(self.normal_distance / total, 4),
            density_outlier=round(self.density_outlier / total, 4),
            domain_novelty=round(self.domain_novelty / total, 4),
            annotation_signal=round(self.annotation_signal / total, 4),
        )


class CandidateMiningResult(BaseModel):
    task_id: str
    policy_name: str = "default"
    pool_size: int
    top_k: int
    weights: CandidateScoringWeights
    diversity_threshold: float
    selected_count: int
    low_reference_warning: bool
    reference_count: int
    reference_breakdown: Dict[str, int] = Field(default_factory=dict)
    candidates_json_path: str
    report_md_path: str
    elapsed_seconds: float
