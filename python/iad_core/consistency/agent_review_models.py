from typing import Annotated, Self

from pydantic import Field, WithJsonSchema, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText, VisualEvidence
from iad_core.consistency.models import CandidateLimit, Digest, Identifier
from iad_core.consistency.group_analysis_models import GroupAnalysisComparison, GroupAnalysisDraft, GroupAnalysisReference, GroupPairAssessment, GroupPairDecision
from iad_core.consistency.group_analysis_conclusions import CONCLUSION_CATEGORIES, EQUIVALENT_CONCLUSION
from iad_core.consistency.group_analysis_contract import GroupAnalysisContract
from iad_core.consistency.conflict_categories import ConflictCategory
from iad_core.consistency.group_models import VisualWindow


VISUAL_REQUEST_ID_RULE = (
    'request_id标识完整的视觉请求；复用已保存观察须保持原始参数，'
    '改变question、candidate_ids或windows时须使用新的request_id。'
)


class AnchorVisualStart(AnalysisModel):
    request_id: Identifier = Field(description=VISUAL_REQUEST_ID_RULE)
    fingerprint: Digest
    candidate_ids: list[Identifier] = Field(min_length=1)
    question: NonBlankText
    windows: list[VisualWindow] = Field(default_factory=list)


class AnchorContextQuery(AnalysisModel):
    candidate_id: Identifier | None = None


class AnchorObservationReceipt(AnalysisModel):
    observation_id: Identifier
    request_id: Identifier
    candidate_ids: list[Identifier] = Field(min_length=1)


class AnchorVisualPlan(AnalysisModel):
    fingerprint: Digest
    pages: list[AnchorVisualStart] = Field(min_length=1)


class CandidateVisualObservation(AnalysisModel):
    candidate_id: Identifier
    description: NonBlankText
    phenomena_comparable: bool
    appearance_explains_annotation_difference: bool
    media_ids: list[Identifier] = Field(min_length=1)
    limitations: list[NonBlankText] = Field(default_factory=list)


class AnchorVisualResult(AnalysisModel):
    observations: list[CandidateVisualObservation] = Field(min_length=1)


class AnchorVisualRequest(AnchorVisualStart):
    anchor_id: Identifier
    input_fingerprint: Digest
    media: list[VisualEvidence] = Field(min_length=1)
    facts: dict


class AnchorObservation(AnalysisModel):
    observation_id: Identifier
    request: AnchorVisualRequest
    result: AnchorVisualResult


class AnchorDraftSubmission(AnalysisModel):
    fingerprint: Digest
    draft: GroupAnalysisDraft
    observation_ids: dict[Identifier, list[Identifier]]


ModelConflictCategory = Annotated[ConflictCategory, WithJsonSchema({'type': 'string', 'enum': list(CONCLUSION_CATEGORIES)})]


class AnchorAssessmentDecision(GroupPairDecision):
    categories: list[ModelConflictCategory] = Field(max_length=1,
        description='MATERIAL提供唯一主要冲突分类；EQUIVALENT和UNCERTAIN为空数组。其他发现保留在分析中。')

    @model_validator(mode='after')
    def validate_categories(self) -> Self:
        GroupAnalysisContract.validate_categories(self.verdict, self.categories)
        return self

    def as_assessment(self) -> GroupPairAssessment:
        conclusion = None
        if self.verdict == 'EQUIVALENT':
            conclusion = EQUIVALENT_CONCLUSION
        elif self.verdict == 'MATERIAL':
            conclusion = self.categories[0].value
        return GroupPairAssessment(**self.model_dump(), conclusion=conclusion)


class AnchorAssessmentEvidence(AnalysisModel):
    fingerprint: Digest
    observation_ids: list[Identifier] = Field(min_length=1)


class AnchorAssessmentInput(AnchorAssessmentEvidence):
    assessment: AnchorAssessmentDecision = Field(description='提交候选判定及主要冲突分类，结论文本由服务端依据该判定编码')


class AnchorAssessmentSubmission(AnchorAssessmentEvidence):
    assessment: GroupPairAssessment
    comparison: GroupAnalysisComparison

    @property
    def reference(self) -> GroupAnalysisReference:
        return GroupAnalysisReference(candidate_id=self.assessment.candidate_id, comparison=self.comparison)


class AnchorAssessmentRecord(AnalysisModel):
    assessment_id: CandidateLimit
    submission: AnchorAssessmentSubmission


class AnchorAssessmentSelection(AnalysisModel):
    assessment_id: CandidateLimit = Field(description='本场最新已保存评估的整数ID')


class AnchorReviewSubmission(AnalysisModel):
    fingerprint: Digest
    assessment_ids: list[CandidateLimit] = Field(min_length=1)
    overall: AnchorAssessmentSelection = Field(description='从全部最新评估中选择符合汇总优先级的一个主评估，作为整场主结论来源')
    conclusions: list[NonBlankText] = Field(min_length=1, max_length=100)
    limitations: list[NonBlankText] = Field(default_factory=list, max_length=100)
