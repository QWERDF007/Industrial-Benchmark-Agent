from typing import Literal

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.audit.delegation_models import AuditResultReference
from iad_core.consistency.conflict_categories import ConflictCategory


QualityScoreVersion = Literal['1.1', '1.2', '1.3']
QUALITY_SCORE_VERSION: QualityScoreVersion = '1.3'


class AuditScoreWeights(AnalysisModel):
    consistency: float = Field(default=.8, ge=0, allow_inf_nan=False)
    diversity: float = Field(default=.15, ge=0, allow_inf_nan=False)
    redundancy: float = Field(default=.05, ge=0, allow_inf_nan=False)

    @model_validator(mode='after')
    def positive_total(self):
        if sum(self.model_dump().values()) <= 0:
            raise ValueError('综合得分系数不能全部为零')
        return self

    def normalized(self) -> dict[str, float]:
        values = self.model_dump()
        scale = max(values.values())
        scaled = {name: value / scale for name, value in values.items()}
        total = sum(scaled.values())
        return {name: value / total for name, value in scaled.items()}


class QualityDefectScene(AnalysisModel):
    annotation_id: str | None
    morphology: NonBlankText
    special_morphology: str | None = None
    appearance: NonBlankText
    size: Literal['tiny', 'small', 'medium', 'large']
    location: Literal['center', 'edge', 'corner']
    structural_region: str | None = None
    contrast: Literal['low', 'medium', 'high']


class QualityNormalScene(AnalysisModel):
    hard: bool
    hard_type: str | None = None
    confusable: bool
    texture: str | None = None

    @model_validator(mode='after')
    def hard_subtype(self):
        if self.hard and not (self.hard_type or '').strip():
            raise ValueError('困难良品必须描述可见的困难类型')
        return self


class QualityObservation(AnalysisModel):
    complete: bool = Field(description='是否有充分原图证据完成场景归类；缺证时填false，不猜测。')
    defects: list[QualityDefectScene] = Field(default_factory=list)
    normal: QualityNormalScene | None = None
    limitation: str = ''

    @model_validator(mode='after')
    def explain_missing(self):
        if not self.complete and not self.limitation.strip():
            raise ValueError('评分观察不完整时必须说明缺口')
        return self


class QualityDefect(QualityDefectScene):
    category: str


class QualityImage(AnalysisModel):
    sample_id: str
    dataset_id: str
    completed: bool = True
    consistency_categories: list[ConflictCategory] = Field(default_factory=list)
    observation_complete: bool = False
    is_normal: bool = False
    defects: list[QualityDefect] = Field(default_factory=list)
    normal: QualityNormalScene | None = None


class QualityScoreItem(AnalysisModel):
    code: str
    dimension: Literal['consistency', 'diversity', 'redundancy']
    direction: str
    label: str
    maximum: float
    count: int
    denominator: int
    ratio: float | None
    deduction: float | None
    scenario: str = ''
    sample_ids: list[str] = Field(default_factory=list)
    suppressed_by: str | None = None


class QualityDimension(AnalysisModel):
    label: str
    score: float | None
    deduction: float | None


class QualityScore(AnalysisModel):
    version: QualityScoreVersion = QUALITY_SCORE_VERSION
    dataset_id: str | None = None
    status: Literal['complete', 'insufficient']
    total: float | None
    weights: dict[str, float]
    total_images: int
    completed_images: int
    observed_images: int
    limitations: list[str]
    dimensions: dict[str, QualityDimension]
    items: list[QualityScoreItem]
    dataset_scores: list['QualityScore'] = Field(default_factory=list)


class QualitySceneAlias(AnalysisModel):
    axis: Literal['morphology', 'special_morphology', 'appearance', 'structural_region', 'hard_type', 'texture', 'confusable']
    source: NonBlankText
    canonical: NonBlankText = Field(description='同一实际场景使用同一名称；不同原因不得为去重而合并。')


class QualityRedundantGroup(AnalysisModel):
    members: list[AuditResultReference] = Field(min_length=2)
    reason: NonBlankText = Field(description='依据实际对照的原图解释为何只增加很少信息，候选相似度不是依据。')


class QualityAssessment(AnalysisModel):
    aliases: list[QualitySceneAlias] = Field(default_factory=list)
    redundancy_reviewed: bool = Field(description='已实际对照冻结相似候选及已识别相似组的原图，完成低信息增量判断。')
    redundant_groups: list[QualityRedundantGroup] = Field(default_factory=list)
    preview_id: str | None = Field(default=None, description='audit_quality_score返回的预览标识；正式报告原样提交，不自行生成。')


class QualityScorePreview(AnalysisModel):
    assessment: QualityAssessment
    score: QualityScore
