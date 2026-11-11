from typing import Literal

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.analysis.observation_models import AnalysisSampleObservation
from iad_core.exploration.models import DirectionContent, ExplorationDiscoveryDecision


class ExplorationAssessment(AnalysisModel):
    direction_id: NonBlankText
    role: Literal['support', 'normal_control', 'counter', 'not_comparable', 'uncertain', 'not_present']
    evidence_ids: list[NonBlankText]
    reason: NonBlankText


class ExplorationDiscovery(DirectionContent):
    candidate_id: NonBlankText


class ExplorationBatchReport(AnalysisModel):
    observations: list[AnalysisSampleObservation] = Field(default_factory=list,
        description='可选的明确图像事实；不要求本批每张图生成文字，方向关系和候选应自带可见依据。')
    assessments: list[ExplorationAssessment]
    discoveries: list[ExplorationDiscovery]
    discovery_summary: NonBlankText
    key_evidence_ids: list[NonBlankText]
    limitations: list[str] = Field(default_factory=list)
    unresolved_questions: list[str] = Field(default_factory=list)


class ExplorationBatchArchive(AnalysisModel):
    round_id: int
    wave_id: int
    session_id: str
    catalog_revision: int
    report: ExplorationBatchReport | None = None
    review_revision: int | None = None
    discovery_decisions: list[ExplorationDiscoveryDecision] = Field(default_factory=list)
