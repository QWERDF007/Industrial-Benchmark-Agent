import hashlib
import json
from typing import Literal

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.consistency.gallery import GalleryReference
from iad_core.consistency.models import Identifier, ModelAssessmentVerdict
from iad_core.workbench.job_models import JobStatus
from iad_core.evidence.images import MODEL_INPUT_VERSION
from iad_core.consistency.group_analysis_prompts import GROUP_ANALYSIS_INSTRUCTION, GROUP_SUMMARY_INSTRUCTION, DEFAULT_CONSISTENCY_PROMPT
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


class GroupPairAssessment(AnalysisModel):
    candidate_id: Identifier
    verdict: ModelAssessmentVerdict = Field(description='当前候选的比较结论，使用本次提交的完整提示词判断')
    explanation: str = Field(min_length=1,max_length=8000)
    findings: list[str] = Field(default_factory=list,max_length=100,
        description='自由描述实际发现的问题，不受程序差异分类限制；视觉基本一致时可为空')


class GroupOverallConclusion(GroupAnalysisConclusion):
    text: str = Field(min_length=1, max_length=40, pattern=r'^[^\r\n。！？!?]+。?$',
        description='仅用一句短语概括整组差异类型，如标注类别不同、标注位置或范围不同、缺少或多出标注；多种差异短语合并，其他发现据实概括。不写位置、数值、依据、建议或verdict，详细分析写入conclusions')
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
    GROUP_ANALYSIS_INSTRUCTION,GROUP_SUMMARY_INSTRUCTION,MODEL_PROMPT_CONTRACT,GENERATION_PARAMETERS,
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
