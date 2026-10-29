import hashlib
import json
from typing import Literal

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.gallery import GalleryReference, GalleryImage, GalleryMember
from iad_core.consistency.models import Identifier, ModelAssessmentVerdict
from iad_core.consistency.result_models import FactState
from iad_core.workbench.job_models import JobStatus


class GroupAnalysisStart(GalleryReference):
    request_id: Identifier


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
    verdict: ModelAssessmentVerdict = Field(description='比较标注差异，不判断哪一侧正确。对应标注的原始类别值不同（包括图像级良/不良标签）就是类别不同，判MATERIAL；不以类别映射、语义定义或视觉相近为等价或无法确认的理由。仅同类别的轻微几何浮动可判EQUIVALENT，实际证据不足才判UNCERTAIN')
    explanation: str = Field(min_length=1,max_length=8000)
    findings: list[str] = Field(default_factory=list,max_length=100,
        description='自由描述实际发现的问题，不受程序差异分类限制；视觉基本一致时可为空')


class GroupOverallConclusion(GroupAnalysisConclusion):
    text: str = Field(min_length=1, max_length=40, pattern=r'^[^\r\n。！？!?]+。?$',
        description='仅用一句短语概括整组差异类型，如标注类别不同、标注位置或范围不同、缺少或多出标注；多种差异短语合并，其他发现据实概括。不写位置、数值、依据、建议或verdict，详细分析写入conclusions')
    verdict: ModelAssessmentVerdict = Field(description='综合整组差异；确认存在类别值不同时应保留类别差异，不能以缺少映射或视觉相近降为EQUIVALENT或UNCERTAIN；不判断哪一侧正确')


class GroupAnalysisDraft(AnalysisModel):
    overall: GroupOverallConclusion = Field(description='整组唯一简短结论；详细分析保留在conclusions')
    assessments: list[GroupPairAssessment] = Field(min_length=1,max_length=10000,
        description='覆盖全部候选且每个候选恰好一次；未获得固定主图直接证据时只能UNCERTAIN')
    conclusions: list[GroupAnalysisConclusion] = Field(min_length=1, max_length=100)
    limitations: list[str] = Field(default_factory=list, max_length=100)


GROUP_ANALYSIS_SCHEMA = hashlib.sha256(json.dumps([GroupAnalysisDraft.model_json_schema(),
    'raw-originals-and-annotation-rois'],sort_keys=True).encode()).hexdigest()


class FrozenAnalysisGroup(AnalysisModel):
    kind: Literal['conflicts','groups']
    group_id: Identifier
    facts_state: FactState
    anchor: GalleryImage
    members: list[GalleryMember]


class GroupAnalysisView(AnalysisModel):
    group_id: Identifier
    status: JobStatus | Literal['NOT_ANALYZED']
    run_id: Identifier | None = None
    model_name: str | None = None
    result: GroupAnalysisDraft | None = None
    error: str | None = None
