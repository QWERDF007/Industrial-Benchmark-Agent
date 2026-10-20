from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class AnalysisModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class NormalPatterns(AnalysisModel):
    structure: str
    texture: str
    position_variation: str
    illumination_variation: str
    normal_allowances: List[str]
    cautions: List[str]


class RegionProposal(AnalysisModel):
    bbox_1000: List[int] = Field(min_length=4, max_length=4, description="图像归一化坐标 [x1,y1,x2,y2]，范围 0..1000")
    reason: str

    @model_validator(mode="after")
    def valid_box(self):
        x1, y1, x2, y2 = self.bbox_1000
        if not (0 <= x1 < x2 <= 1000 and 0 <= y1 < y2 <= 1000):
            raise ValueError("Invalid normalized region")
        return self


class ViewAnalysis(AnalysisModel):
    description: str
    position_analysis: str
    illumination_analysis: str


class GlobalAnalysis(ViewAnalysis):
    suspect_regions: List[RegionProposal] = Field(default_factory=list)


class VlmResult(ViewAnalysis):
    suggested_label: Literal["PASS", "FAIL", "UNCERTAIN"]
    reason_category: str
    confidence: float = Field(ge=0, le=1)
    defect_location: str = ""
    evidence_ids: List[str] = Field(min_length=1)
    conflicts: List[str] = Field(default_factory=list)
    missing_evidence: List[str] = Field(default_factory=list)


class VisualEvidence(AnalysisModel):
    evidence_id: str
    role: Literal["normal", "overview", "roi"]
    source: Literal["reference", "global", "annotation", "model", "coverage"]
    original_size: List[int]
    crop_bbox: List[int]
    sent_size: List[int]
    sha256: str = Field(pattern="^[a-f0-9]{64}$")
    source_sha256: str = Field(pattern="^[a-f0-9]{64}$")
    media_type: Literal["image/png"] = "image/png"


class Coverage(AnalysisModel):
    planned_regions: int
    inspected_regions: int
    complete: bool
    missing: List[str] = Field(default_factory=list)


RegionSource = Literal["annotation", "model", "coverage"]


class RegionOrigin(AnalysisModel):
    source: RegionSource
    annotation_id: Optional[str] = None
    label: str
    bbox: List[int]


class RegionEvidence(RegionOrigin):
    origins: List[RegionOrigin]
    image: VisualEvidence
    crop_bbox: List[int]
    observation: ViewAnalysis


class SynthesisStep(AnalysisModel):
    step_id: str
    input_evidence_ids: List[str]
    child_step_ids: List[str]
    result: VlmResult


class AuditAnalysis(AnalysisModel):
    profile_id: str
    overview: VisualEvidence
    coverage: Coverage
    global_view: GlobalAnalysis
    regions: List[RegionEvidence]
    conclusion: VlmResult
    joint_steps: List[SynthesisStep] = Field(default_factory=list)


class InspectionProgress(AnalysisModel):
    phase: Literal["LEARNING_NORMAL", "GLOBAL", "REGIONS", "SYNTHESIS"]
    profile_id: str = ""
    inspected_regions: int = 0
    planned_regions: int = 0
    completed_batches: int = 0
    total_batches: int = 0


class NormalSource(AnalysisModel):
    sample_id: str
    sha256: str
    qualification: Literal["human_pass", "human_hard_normal", "manual_selection", "raw_pass", "initial_unannotated"]


class NormalProfile(AnalysisModel):
    knowledge_kind: Literal["mllm_semantic"] = "mllm_semantic"
    generation_version: str
    sources: List[NormalSource]
    profile_id: str
    dataset_id: str
    model_name: str
    reference_sample_ids: List[str]
    patterns: NormalPatterns
    created_at: str
