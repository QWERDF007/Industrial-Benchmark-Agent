from typing import List, Literal, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, model_validator


class AnalysisModel(BaseModel):
    model_config = ConfigDict(extra="forbid", json_schema_serialization_defaults_required=True)


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


class RegionObservation(ViewAnalysis):
    region_index: int = Field(ge=1, description="本次请求的 ROI 序号，从1开始，与输入区域顺序对应")


class JointAnalysis(VlmResult):
    global_view: GlobalAnalysis
    region_observations: List[RegionObservation]


class VisualEvidence(AnalysisModel):
    evidence_id: str
    role: Literal["normal", "overview", "roi"]
    source: Literal["reference", "global", "annotation", "model", "coverage"]
    original_size: List[int]
    crop_bbox: List[int]
    sent_size: List[int]
    sha256: str = Field(pattern="^[a-f0-9]{64}$")
    source_sha256: str = Field(pattern="^[a-f0-9]{64}$")
    representation: Literal["raw", "annotation_mask", "annotation_overlay"] = "raw"
    annotation_ids: List[str] = Field(default_factory=list)
    annotation_sha256: Optional[str] = Field(default=None, pattern="^[a-f0-9]{64}$")
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


class RegionImage(RegionOrigin):
    origins: List[RegionOrigin]
    image: VisualEvidence
    crop_bbox: List[int]


class RegionEvidence(RegionImage):
    observation: ViewAnalysis


class SynthesisStep(AnalysisModel):
    step_id: str
    input_evidence_ids: List[str]
    child_step_ids: List[str]
    result: Union[VlmResult, JointAnalysis]


class AuditAnalysis(AnalysisModel):
    normal_version_id: Optional[str] = None
    defect_version_id: Optional[str] = None
    legacy_profile_id: Optional[str] = None
    knowledge_limitations: List[str] = Field(default_factory=list)
    reference_sample_ids: List[str] = Field(default_factory=list)
    overview: VisualEvidence
    coverage: Coverage
    global_view: GlobalAnalysis
    regions: List[RegionEvidence]
    auxiliary_evidence: List[VisualEvidence] = Field(default_factory=list)
    conclusion: VlmResult
    joint_steps: List[SynthesisStep] = Field(default_factory=list)


class InspectionProgress(AnalysisModel):
    phase: Literal["PREPARING_KNOWLEDGE", "GLOBAL", "REGIONS", "SYNTHESIS"]
    inspected_regions: int = 0
    planned_regions: int = 0
    completed_batches: int = 0
    total_batches: int = 0
