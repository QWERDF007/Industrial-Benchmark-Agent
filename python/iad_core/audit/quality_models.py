from math import isfinite
from typing import Annotated, Literal

from pydantic import Field, model_validator
from pydantic.json_schema import SkipJsonSchema

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.audit.delegation_models import AuditResultReference
from iad_core.audit.stage_models import HardNormalQualification
from iad_core.consistency.conflict_categories import ConflictCategory


AuditScope = Literal['full', 'consistency']


QualityScoreVersion = Literal['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9']
QUALITY_SCORE_VERSION: QualityScoreVersion = '1.9'

ImpactCoefficient = Annotated[float, Field(ge=.5, le=2, allow_inf_nan=False)]
ConsistencyScoreCode = Literal['category_mismatch', 'instance_count_mismatch', 'coverage_mismatch']


class ConsistencyImpactReview(AnalysisModel):
    scope_id: NonBlankText
    code: ConsistencyScoreCode
    coefficient: ImpactCoefficient
    analysis: NonBlankText
    evidence_refs: list[NonBlankText] = Field(min_length=1)


class QualityComparison(AnalysisModel):
    main_id: NonBlankText
    candidate_id: NonBlankText
    categories: list[ConflictCategory]


DistributionAxis = Literal['class_balance', 'image_geometry', 'instance_geometry',
    'instance_count', 'instance_position', 'capture_source']


class DistributionCategoryReference(AnalysisModel):
    kind: Literal['category']
    category: str


class DistributionGroupReference(AnalysisModel):
    kind: Literal['group']
    metric: NonBlankText
    bucket: str


BinSpan = tuple[Annotated[int, Field(ge=0, strict=True)], Annotated[int, Field(ge=0, strict=True)]]


class DistributionBinsReference(AnalysisModel):
    kind: Literal['bins']
    metric: NonBlankText
    x: BinSpan = Field(description='从 0 开始的首尾分箱下标，均包含在内。')
    y: BinSpan | None = Field(default=None, description='仅二维热图填写，同样包含首尾分箱。')


DistributionReference = Annotated[DistributionCategoryReference | DistributionGroupReference | DistributionBinsReference,
    Field(discriminator='kind')]


class DistributionGroup(AnalysisModel):
    label: NonBlankText
    members: list[DistributionGroupReference | DistributionBinsReference] = Field(min_length=1)


class DistributionMetricGrouping(AnalysisModel):
    metric: NonBlankText
    groups: list[DistributionGroup] = Field(min_length=2)


class QualityDistributionReview(AnalysisModel):
    scope_id: str = Field(description='统计范围的scope_id，整体为overall，子集为dataset_id。')
    axis: DistributionAxis
    status: Literal['normal', 'problem', 'not_applicable'] | None = None
    coefficient: ImpactCoefficient | None = None
    comparisons: list[DistributionMetricGrouping] = Field(default_factory=list)
    level: SkipJsonSchema[Literal['none', 'light', 'moderate', 'severe', 'not_applicable'] | None] = None
    overlap_codes: list[str] = Field(default_factory=list, description='仅完整范围：与本项确属同一实际原因的视觉评分代码；无重复原因时为空。')
    grouping: NonBlankText = Field(description='合理范围或分组及其统计依据；单一合理范围和均衡多范围不扣分。')
    evidence_refs: list[NonBlankText] = Field(description='引用输入facts中真实的统计项ref，不编造数量或缺失类别。')
    affected: SkipJsonSchema[list[DistributionReference]] = Field(default_factory=list)
    analysis: NonBlankText = Field(description='先说结论，再用日常中文说明实际质量影响，不写分类定义或内部流程。')


class QualityDistributionEvidence(AnalysisModel):
    metric: str
    bucket: str | None = None
    x_range: tuple[float, float] | None = None
    y_range: tuple[float, float] | None = None
    image_count: int | None = None
    annotation_count: int | None = None
    image_denominator: int | None = None
    annotation_denominator: int | None = None
    basis: str | None = None
    base_deduction: float | None = None
    deduction: float | None = None


ScoreWeight = Annotated[float, Field(ge=0, allow_inf_nan=False)]


class ConsistencyScoreWeights(AnalysisModel):
    consistency: ScoreWeight = .9
    diversity: ScoreWeight = .1

    @model_validator(mode='after')
    def positive_total(self):
        if sum(self.model_dump().values()) <= 0:
            raise ValueError('综合得分系数不能全部为零')
        return self

    def normalized(self) -> dict[str, float]:
        values = self.model_dump()
        total = sum(values.values())
        if not isfinite(total):
            scale = max(values.values())
            values = {name: value / scale for name, value in values.items()}
            total = sum(values.values())
        return {name: value / total for name, value in values.items()}


class AuditScoreWeights(ConsistencyScoreWeights):
    consistency: ScoreWeight = .8
    diversity: ScoreWeight = .15
    redundancy: ScoreWeight = .05


class QualityDefectScene(AnalysisModel):
    annotation_id: str | None
    basis: list[NonBlankText] = Field(default_factory=list, description='本图可见依据，先解释为何符合相应形态、尺寸、位置和对比度场景，不引用出现频次。')
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
    confusable: bool = False
    texture: str | None = None
    texture_reason: NonBlankText | None = None
    profile_revision: int | None = Field(default=None, ge=1)
    qualification: HardNormalQualification | None = None

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
    pair_count: int | None = None
    compared_pairs: int | None = None
    charged_count: int | None = None
    base_deduction: float | None = None
    impact_coefficient: ImpactCoefficient | None = None
    scoring_basis: str | None = None
    analysis: str = ''
    overlap_codes: list[str] = Field(default_factory=list)
    cause: DistributionAxis | Literal[''] = ''
    distribution_evidence: list[QualityDistributionEvidence] = Field(default_factory=list)


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
    consistency_reviews: list[ConsistencyImpactReview] | None = None
    distribution_reviews: list[QualityDistributionReview] | None = None
    aliases: list[QualitySceneAlias] = Field(default_factory=list)
    redundancy_reviewed: bool = Field(description='已实际对照冻结相似候选及已识别相似组的原图，完成低信息增量判断。')
    redundant_groups: list[QualityRedundantGroup] = Field(default_factory=list)
    preview_id: str | None = Field(default=None, description='audit_quality_score返回的预览标识；正式报告原样提交，不自行生成。')


class QualityScorePreview(AnalysisModel):
    assessment: QualityAssessment
    score: QualityScore
