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
    observations: list[AnalysisSampleObservation] = Field(min_length=1)
    assessments: list[ExplorationAssessment]
    discoveries: list[ExplorationDiscovery]
    discovery_summary: NonBlankText
    key_evidence_ids: list[NonBlankText]


class ExplorationBatchArchive(AnalysisModel):
    round_id: int
    wave_id: int
    session_id: str
    catalog_revision: int
    report: ExplorationBatchReport | None = None
    review_revision: int | None = None
    discovery_decisions: list[ExplorationDiscoveryDecision] = Field(default_factory=list)
