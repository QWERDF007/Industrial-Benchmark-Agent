from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.analysis.argument_models import AnalysisKeyEvidence
from iad_core.analysis.models import AnalysisCommit, AnalysisDirectionBody, AnalysisCheckBody
from iad_core.analysis.finalization_models import AnalysisFinalize
from iad_core.analysis.finalization_state import AnalysisDirectionReview
from iad_core.analysis.observation_models import AnalysisSampleObservation
from iad_core.exploration.models import ExplorationReportReview
from iad_core.knowledge.observation_models import KnowledgeReportReview


class AnalysisSelectionChange(AnalysisModel):
    entry_id: NonBlankText
    key_evidence: list[AnalysisKeyEvidence] = Field(min_length=1, max_length=4)


class AnalysisSelections(AnalysisModel):
    selections: list[AnalysisSelectionChange] = Field(default_factory=list,
        description='仅提交精选发生变化或本次明确复核的条目。每条最多4张，省略保留既有精选；完整论据由arguments账本派生。')


class ExplorationDeltaCommit(AnalysisCommit, AnalysisSelections):
    observations: list[AnalysisSampleObservation] = Field(default_factory=list)
    directions: list[AnalysisDirectionBody] = Field(description='只提交新增或正文变化的完整业务条目；未变传[]。不重复累计图像ID，论据在arguments提交增量，精选在selections独立提交。')
    report_reviews: list[ExplorationReportReview] = Field(default_factory=list)


class KnowledgeDeltaCommit(AnalysisCommit, AnalysisSelections):
    checks: list[AnalysisCheckBody] = Field(description='只提交新增或正文变化的完整业务条目；未变传[]。论据在arguments提交增量，精选在selections独立提交。')
    report_reviews: list[KnowledgeReportReview] = Field(default_factory=list)


class ExplorationDeltaFinalize(AnalysisFinalize, AnalysisSelections):
    directions: list[AnalysisDirectionBody]


class KnowledgeDeltaFinalize(AnalysisFinalize, AnalysisSelections):
    checks: list[AnalysisCheckBody]
    direction_reviews: list[AnalysisDirectionReview] = Field(default_factory=list)
