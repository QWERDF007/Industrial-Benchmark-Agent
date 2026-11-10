from typing import Literal, Self

from pydantic import ConfigDict, Field, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText, VisualEvidence
from iad_core.consistency.models import CandidateLimit, Digest, Identifier
from iad_core.consistency.group_analysis_models import GroupAnalysisComparison, GroupAnalysisDraft, GroupAnalysisReference, GroupPairAssessment, GroupPairDecision
from iad_core.consistency.group_analysis_conclusions import EQUIVALENT_CONCLUSION
from iad_core.consistency.group_models import VisualWindow
from iad_core.consistency.annotation_issues import ISSUE_CATEGORIES, BboxAnnotationIssue


VISUAL_REQUEST_ID_RULE = (
    'request_id标识完整的视觉请求；复用已保存观察须保持原始参数，'
    '改变question或candidate_ids时须使用新的request_id。'
)


class AnchorVisualStart(AnalysisModel):
    request_id: Identifier = Field(description=VISUAL_REQUEST_ID_RULE)
    fingerprint: Digest = Field(description='上下文提供的当前冻结清单指纹。')
    candidate_ids: list[Identifier] = Field(min_length=1, description='完整使用上下文中一个冻结页的候选集合，不拆页、不跨页拼接。')
    question: NonBlankText
    windows: list[VisualWindow] = Field(default_factory=list, exclude=True)
    gate_revisions: dict[str, int] = Field(default_factory=dict)


class AnchorContextQuery(AnalysisModel):
    candidate_id: Identifier | None = None


class AnchorObservationReceipt(AnalysisModel):
    observation_id: Identifier
    request_id: Identifier
    candidate_ids: list[Identifier] = Field(min_length=1)


class AnchorVisualPlan(AnalysisModel):
    fingerprint: Digest
    pages: list[AnchorVisualStart] = Field(min_length=1)


class GateDispute(AnalysisModel):
    reason: NonBlankText
    region_pair_ids: list[Identifier] = Field(default_factory=list,
        description='本次实际观察到内容矛盾的真实配对区域ID；仅原图证据时为空。')


class CandidateVisualObservation(AnalysisModel):
    model_config = ConfigDict(frozen=True)

    candidate_id: Identifier
    description: NonBlankText
    media_ids: list[Identifier] = Field(min_length=1,
        description='主图与当前候选的两个原图evidence_id；原始标注和全部裁剪视图随原图分组，不单独引用裁图。')
    limitations: list[NonBlankText] = Field(default_factory=list)
    gate_dispute: GateDispute | None = Field(default=None,
        description='发现两侧实际内容不同或资格依据不足时报告争议；不能继续提交标注差异。')


class AnchorVisualResult(AnalysisModel):
    observations: list[CandidateVisualObservation] = Field(min_length=1, description='恰好覆盖本次输入的全部候选，每个candidate_id一次。')


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
    request_id: Identifier | None = None
    fingerprint: Digest
    draft: GroupAnalysisDraft
    observation_ids: dict[Identifier, list[Identifier]]


class AnchorAssessmentDecision(GroupPairDecision):
    issues: list[BboxAnnotationIssue] = Field(default_factory=list,
        description='MATERIAL必须保存全部独立矩形问题，关联真实两侧框ID与实际原图身份；拆分合并不重复计数量差异。')
    verdict: Literal['EQUIVALENT', 'MATERIAL', 'UNCERTAIN'] = Field(description='MATERIAL存在差异；EQUIVALENT一致；UNCERTAIN为合格候选的标注审核证据不足。')

    @model_validator(mode='after')
    def validate_issues(self) -> Self:
        if self.verdict == 'MATERIAL' and not self.issues:
            raise ValueError('MATERIAL必须提供全部独立问题及真实框和原图引用')
        if self.verdict != 'MATERIAL' and self.issues:
            raise ValueError('一致或证据不足不能包含已确认差异')
        return self

    def as_assessment(self) -> GroupPairAssessment:
        categories = [ISSUE_CATEGORIES[self.issues[0].type]] if self.issues else []
        conclusion = None
        if self.verdict == 'EQUIVALENT':
            conclusion = EQUIVALENT_CONCLUSION
        elif self.verdict == 'MATERIAL':
            conclusion = categories[0].value
        return GroupPairAssessment(**self.model_dump(), categories=categories, conclusion=conclusion)


class AnchorAssessmentEvidence(AnalysisModel):
    fingerprint: Digest = Field(description='当前冻结清单指纹。')
    observation_ids: list[Identifier] = Field(description='本场实际保存且包含当前候选的视觉观察回执ID。程序完成的图像级标签比较为空。')


class AnchorAssessmentInput(AnchorAssessmentEvidence):
    observation_ids: list[Identifier] = Field(min_length=1, description='本场已保存且实际包含当前候选的视觉观察回执。')
    assessment: AnchorAssessmentDecision = Field(description='提交候选判定和全部独立问题，展示分类及结论由服务端派生')


class AnchorAssessmentSubmission(AnchorAssessmentEvidence):
    assessment: GroupPairAssessment
    comparison: GroupAnalysisComparison
    gate_revision: int = Field(default=0, ge=0)

    @property
    def reference(self) -> GroupAnalysisReference:
        return GroupAnalysisReference(candidate_id=self.assessment.candidate_id, comparison=self.comparison)


class AnchorAssessmentRecord(AnalysisModel):
    assessment_id: CandidateLimit
    submission: AnchorAssessmentSubmission


class AnchorReviewSubmission(AnalysisModel):
    request_id: Identifier | None = None
    fingerprint: Digest = Field(description='当前冻结清单指纹。')
    assessment_ids: list[CandidateLimit] = Field(description='恰好包含当前有效候选的最新评估回执；零有效候选时为空。')
