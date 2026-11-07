import hashlib
import json
from typing import Annotated, Literal

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.consistency.gallery import GalleryReference
from iad_core.consistency.models import Identifier, ModelAssessmentVerdict
from iad_core.workbench.job_models import JobStatus
from iad_core.evidence.images import MODEL_INPUT_VERSION
from iad_core.consistency.conflict_categories import ConflictCategory
from iad_core.consistency.group_analysis_prompts import GROUP_ANALYSIS_INSTRUCTION, GROUP_SUMMARY_INSTRUCTION, GROUP_DIRECTION_INSTRUCTION, DEFAULT_CONSISTENCY_PROMPT
from iad_core.workbench.vision import MODEL_PROMPT_CONTRACT, GENERATION_PARAMETERS

DEFAULT_CANDIDATE_BATCH_SIZE = 12


class GroupAnalysisStart(GalleryReference):
    request_id: Identifier
    batch_size: int = Field(default=DEFAULT_CANDIDATE_BATCH_SIZE, ge=1, le=200)
    instruction: NonBlankText = DEFAULT_CONSISTENCY_PROMPT


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
    description='以主图相对候选图为方向的确定性简短结论：一致、主图缺少标注、主图多出标注、位置差异、类别不一致、拆分、合并等具体类型；同时存在的类型用顿号并列，禁止A或B及基本一致。位置、数值、依据只写在分析中')]


class GroupPairAssessment(AnalysisModel):
    candidate_id: Identifier
    verdict: ModelAssessmentVerdict = Field(description='当前候选的内部检索判定，最终答案由conclusion陈述，explanation解释依据，不用该枚举标签代替结论')
    conclusion: ConclusionPhrase | None = None
    categories: list[ConflictCategory] | None = Field(default=None,
        description='当前主图相对本候选图的全部差异分类，可多选；主图比候选少标注为少类别，多标注为多类别；主图同一对象多个框而候选一个为拆分，反之为合并；未发现差异时为空。类别/数量事实可直接比较，不等于裁决哪一侧正确。')
    explanation: str = Field(min_length=1,max_length=8000,
        description='当前图对的分析依据，具体说明差异发生在哪一侧、哪个对象或区域，位置、类别、数量及拆分合并等实际变化，解释conclusion；无差异时说明各项对应。不得用基本一致、可能、疑似、待核对等话术替代判断。真实缺失证据须指明缺失内容及其阻断的判断')
    findings: list[str] = Field(default_factory=list,max_length=100,
        description='自由描述实际发现的问题，不受程序差异分类限制；未发现差异时可为空')


class GroupOverallConclusion(GroupAnalysisConclusion):
    text: ConclusionPhrase
    verdict: ModelAssessmentVerdict = Field(description='根据逐候选结论汇总的整组结论')


class GroupAnalysisSummary(AnalysisModel):
    overall: GroupOverallConclusion = Field(description='整组唯一简短结论；详细分析保留在conclusions')
    conclusions: list[GroupAnalysisConclusion] = Field(min_length=1, max_length=100)
    limitations: list[str] = Field(default_factory=list, max_length=100)


class GroupAnalysisDraft(GroupAnalysisSummary):
    assessments: list[GroupPairAssessment] = Field(min_length=1,max_length=10000,
        description='覆盖全部候选且每个候选恰好一次；未获得固定主图直接证据时只能UNCERTAIN')


class GroupAnalysisBatch(AnalysisModel):
    run_id: Identifier
    candidate_ids: list[Identifier] = Field(min_length=1)
    input_fingerprint: str = Field(pattern='^[a-f0-9]{64}$')
    result: GroupAnalysisDraft


GROUP_ANALYSIS_SCHEMA = hashlib.sha256(json.dumps([GroupAnalysisDraft.model_json_schema(),GroupAnalysisSummary.model_json_schema(),
    GROUP_ANALYSIS_INSTRUCTION,GROUP_SUMMARY_INSTRUCTION,GROUP_DIRECTION_INSTRUCTION,MODEL_PROMPT_CONTRACT,GENERATION_PARAMETERS,
    'raw-originals-and-annotation-rois', 'frozen-reference-enums-v1', 'frozen-analysis-instruction-v1', MODEL_INPUT_VERSION],sort_keys=True).encode()).hexdigest()




class GroupAnalysisView(AnalysisModel):
    group_id: Identifier
    status: JobStatus | Literal['NOT_ANALYZED']
    run_id: Identifier | None = None
    model_name: str | None = None
    result: GroupAnalysisDraft | None = None
    error: str | None = None
    completed_batches: int = 0
    total_batches: int | None = None
