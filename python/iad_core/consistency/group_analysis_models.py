from typing import Annotated, Literal

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel

from iad_core.consistency.models import Identifier, ModelAssessmentVerdict
from iad_core.workbench.job_models import JobStatus
from iad_core.consistency.conflict_categories import ConflictCategory
from iad_core.consistency.group_analysis_conclusions import CONCLUSION_CHOICES



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
    explanation: str = Field(min_length=1,max_length=8000,
        description='当前图对的分析依据，具体说明差异发生在哪一侧、哪个对象或区域，位置、类别、数量及拆分合并等实际变化，解释判定及主分类；无差异时说明各项对应。不得用基本一致、可能、疑似、待核对等话术替代判断。真实缺失证据须指明缺失内容及其阻断的判断')
    findings: list[str] = Field(default_factory=list,max_length=100,
        description='自由描述实际发现的问题，不受程序差异分类限制；未发现差异时可为空')


class GroupPairAssessment(GroupPairDecision):
    conclusion: ConclusionPhrase | None = None
    categories: list[ConflictCategory] | None = Field(default=None,
        description='与conclusion相同的唯一主要冲突分类；主图比候选少标注为少类别，多标注为多类别；主图同一对象多个框而候选一个为拆分，反之为合并。无差异及缺失证据时为空，其他实际差异保留在分析中。')


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


class GroupAnalysisView(AnalysisModel):
    group_id: Identifier
    status: JobStatus | Literal['NOT_ANALYZED']
    run_id: Identifier | None = None
    model_name: str | None = None
    result: GroupAnalysisDraft | None = None
    error: str | None = None
    completed_batches: int = 0
    total_batches: int | None = None
