from typing import Annotated, Literal, Self

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel

from iad_core.consistency.models import Identifier, ModelAssessmentVerdict
from iad_core.workbench.job_models import JobStatus
from iad_core.consistency.conflict_categories import ConflictCategory, primary_conflict_category
from iad_core.consistency.group_analysis_conclusions import CONCLUSION_CHOICES
from iad_core.consistency.annotation_issues import AnnotationIssue, ISSUE_CATEGORIES



class GroupAnalysisComparison(AnalysisModel):
    result_id: Identifier
    evidence_id: Identifier
    difference_id: Identifier | None = None


class GroupAnalysisReference(AnalysisModel):
    candidate_id: Identifier
    comparison: GroupAnalysisComparison | None = None


class GroupAnalysisConclusion(AnalysisModel):
    text: str = Field(min_length=1, max_length=8000)
    references: list[GroupAnalysisReference] = Field(min_length=1, max_length=100)


ConclusionPhrase = Annotated[str, Field(min_length=1, max_length=40,
    json_schema_extra={'enum': list(CONCLUSION_CHOICES)},
    description='冲突结论只能从类别不一致、位置差异、多类别、少类别、拆分、合并中单选，按主图相对候选图的方向判断；无差异为一致，证据缺失为null。位置、数值及全部具体差异依据只写在分析中')]


class GroupPairDecision(AnalysisModel):
    candidate_id: Identifier
    verdict: ModelAssessmentVerdict = Field(description='当前候选的标注一致性判定：MATERIAL为实质冲突，EQUIVALENT为一致，UNCERTAIN为关键证据缺失')
    explanation: str = Field(min_length=1,max_length=8000, description='当前候选的标注比对分析')
    findings: list[str] = Field(default_factory=list,max_length=100,
        description='当前候选的具体发现')
    limitations: list[str] = Field(default_factory=list, max_length=100,
        description='独立保存未能确认的部分；已确认差异仍保留在issues，不因局部不确定而丢失。')
    issues: list[AnnotationIssue] = Field(default_factory=list, description='全部独立问题；标注ID来自冻结事实，引用实际送达的两侧原图。拆分合并不重复计同组数量差异。')


class GroupPairAssessment(GroupPairDecision):
    conclusion: ConclusionPhrase | None = None
    categories: list[ConflictCategory] | None = Field(default=None,
        description='与conclusion相同的唯一主要冲突分类；主图比候选少标注为少类别，多标注为多类别；主图同一对象多个标注而候选一个为拆分，反之为合并。无差异及缺失证据时为空，其他实际差异保留在分析中。')

    @model_validator(mode='after')
    def derive_primary_conclusion(self) -> Self:
        category = primary_conflict_category(ISSUE_CATEGORIES[issue.type] for issue in self.issues)
        if self.verdict == 'MATERIAL' and category is not None:
            self.categories = [category]
            self.conclusion = category.value
        return self


class GroupVerdict(AnalysisModel):
    text: ConclusionPhrase | None
    verdict: ModelAssessmentVerdict = Field(description='根据逐候选结论汇总的整组结论')


class GroupOverallConclusion(GroupVerdict):
    references: list[GroupAnalysisReference] = Field(min_length=1, max_length=100)


class GroupAnalysisSummary(AnalysisModel):
    overall: GroupOverallConclusion = Field(description='整组唯一简短结论；详细分析保留在conclusions')
    conclusions: list[GroupAnalysisConclusion] = Field(min_length=1, max_length=100)
    limitations: list[str] = Field(default_factory=list, max_length=100)


class GroupAnalysisDraft(GroupAnalysisSummary):
    assessments: list[GroupPairAssessment] = Field(min_length=1,max_length=10000,
        description='覆盖全部候选且每个候选恰好一次；未获得固定主图直接证据时只能UNCERTAIN')

    @model_validator(mode='after')
    def derive_primary_conclusion(self) -> Self:
        if self.overall.verdict == 'MATERIAL':
            category = primary_conflict_category(category for assessment in self.assessments
                if assessment.verdict == 'MATERIAL' for category in (assessment.categories or []))
            if category is not None:
                self.overall = self.overall.model_copy(update={'text': category.value})
        return self


class GroupAnalysisView(AnalysisModel):
    group_id: Identifier
    status: JobStatus | Literal['NOT_ANALYZED']
    run_id: Identifier | None = None
    model_name: str | None = None
    result: GroupAnalysisDraft | None = None
    error: str | None = None
    completed_batches: int = 0
    total_batches: int | None = None
