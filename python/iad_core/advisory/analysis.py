from typing import Annotated, List, Literal, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, model_validator


NonBlankText = Annotated[str, Field(min_length=1, pattern=r'^[\s\S]*\S[\s\S]*$')]


class AnalysisModel(BaseModel):
    model_config = ConfigDict(extra="forbid", json_schema_serialization_defaults_required=True)


class RegionProposal(AnalysisModel):
    bbox_1000: List[int] = Field(min_length=4, max_length=4, description="图像归一化坐标 [x1,y1,x2,y2]，范围 0..1000")
    reason: str
    check_ids: List[str] = Field(default_factory=list)

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
    description: str = Field(min_length=1, description="一句话综合建议，指出优先复核位置与问题；整体和局部观察放在对应字段，不重复长篇视觉描述")
    suggested_label: Literal["PASS", "FAIL", "UNCERTAIN"]
    reason_category: str
    confidence: float = Field(ge=0, le=1)
    defect_location: str = ""
    evidence_ids: List[str] = Field(min_length=1)
    conflicts: List[str] = Field(default_factory=list)
    missing_evidence: List[str] = Field(default_factory=list)


class RegionObservation(ViewAnalysis):
    region_index: int = Field(ge=1, description="本次请求的 ROI 序号，从1开始，与输入区域顺序对应")


class CheckAssessment(ViewAnalysis):
    description: str = Field(min_length=1)
    check_id: str
    status: Literal["normal", "anomaly", "insufficient", "not_applicable"] = Field(
        description="normal：符合正常判据或未命中异常判据；anomaly：偏离正常判据或命中异常判据；不可观察/缺证为insufficient；不适用为not_applicable，须解释原因")
    evidence_ids: List[str] = Field(min_length=1)
    limitations: List[str] = Field(default_factory=list)
    inspection_regions: List[RegionProposal] = Field(default_factory=list, description="该判据尚需补充细看的区域；仅填尚无足够原分辨率证据的区域，坐标相对整图")


class LocalFindingLocation(AnalysisModel):
    scope: Literal["local"] = Field(description="可定位部位的现象，例如孔内异物或局部色差")
    bbox: List[int] = Field(min_length=4, max_length=4, description="必须给出原图像素坐标[x1,y1,x2,y2]，不能省略或填null")
    description: str = Field(min_length=1)


class GlobalFindingLocation(AnalysisModel):
    scope: Literal["global"] = Field(description="仅用于整体结构关系，不用于规避局部现象的定位")
    bbox: None = None
    description: str = Field(min_length=1)


FindingLocation = Annotated[Union[LocalFindingLocation, GlobalFindingLocation], Field(discriminator='scope')]


class FindingReference(AnalysisModel):
    step_id: str
    finding_index: int = Field(ge=1, description="该步骤findings中的序号，从1开始")


class FindingObservation(AnalysisModel):
    check_ids: List[str] = Field(description="关联此现象影响的全部冻结检查项。一个现象可同时影响正常和异常判据，应合并为一个finding并在此列全相关check_id；所有status=anomaly的检查项必须至少被一个finding引用，不得只填异常知识中的check_id。新现象尚无判据时可为空，不得伪造检查项")
    location: FindingLocation
    description: str = Field(min_length=1, description="一句可见现象")
    hypothesis: str = Field(min_length=1)
    normal_explanation: str = Field(min_length=1, description="需排除的合理正常解释，不能直接把疑点视为缺陷事实")
    limitations: List[str] = Field(default_factory=list)
    review_action: str = Field(min_length=1)
    priority: Literal["high", "medium", "low"] = Field(description="人工复核顺序，不代表缺陷概率")
    evidence_ids: List[str] = Field(min_length=1)
    related_findings: List[FindingReference] = Field(default_factory=list, description="更新/合并的此前待处理疑点；引用给定reference，不按重叠框自行推断身份")


class FindingResolution(AnalysisModel):
    related_findings: List[FindingReference] = Field(min_length=1)
    description: str = Field(min_length=1, description="实际证据为何已排除该疑点")
    normal_explanation: str = Field(min_length=1)
    evidence_ids: List[str] = Field(min_length=1)


class AuditFinding(FindingObservation):
    finding_id: str
    source_step_ids: List[str]


class JointAnalysis(VlmResult):
    global_view: GlobalAnalysis
    region_observations: List[RegionObservation]
    check_assessments: List[CheckAssessment] = Field(default_factory=list)
    findings: List[FindingObservation] = Field(default_factory=list)
    resolved_findings: List[FindingResolution] = Field(default_factory=list)

    @property
    def region_requests(self) -> List[RegionProposal]:
        return [*self.global_view.suspect_regions, *[region.model_copy(update={
            'check_ids': sorted(set(region.check_ids) | {assessment.check_id})})
            for assessment in self.check_assessments for region in assessment.inspection_regions]]


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

    def model_context(self) -> dict:
        return self.model_dump(exclude={'annotation_ids'})


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
    check_ids: List[str] = Field(default_factory=list)

    def model_context(self) -> dict:
        return self.model_dump(exclude={'annotation_id', 'label', 'origins', 'image'})


class RegionImage(RegionOrigin):
    origins: List[RegionOrigin]
    image: VisualEvidence
    crop_bbox: List[int]

    def model_context(self) -> dict:
        return {**super().model_context(), 'origins': [origin.model_context() for origin in self.origins],
                'image': self.image.model_context()}


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
    check_assessments: List[CheckAssessment] = Field(default_factory=list)
    findings: List[AuditFinding] = Field(default_factory=list)
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
