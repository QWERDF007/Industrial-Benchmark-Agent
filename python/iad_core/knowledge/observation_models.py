from typing import Literal

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.analysis.observation_models import AnalysisSampleObservation
from iad_core.analysis.evidence_models import AnalysisEvidenceCandidate
from iad_core.knowledge.models import LearnedCheck


class KnowledgeAssessment(AnalysisModel):
    check_id: NonBlankText
    role: Literal['support', 'counter', 'allowed_variation', 'context', 'normal_control', 'not_comparable', 'uncertain', 'not_present']
    evidence_ids: list[NonBlankText]
    reason: NonBlankText


class KnowledgeDiscovery(LearnedCheck):
    candidate_id: NonBlankText
    direction_refs: list[NonBlankText] = Field(min_length=1)
    dataset_ids: list[NonBlankText] = Field(min_length=1)


class KnowledgeReportContent(AnalysisModel):
    observations: list[AnalysisSampleObservation]
    assessments: list[KnowledgeAssessment]
    discoveries: list[KnowledgeDiscovery]
    discovery_summary: NonBlankText
    limitations: list[str] = Field(default_factory=list)
    unresolved_questions: list[str] = Field(default_factory=list)


class KnowledgeBatchReport(KnowledgeReportContent):
    key_evidence_ids: list[NonBlankText]


class KnowledgeEvidenceReport(KnowledgeReportContent):
    selected_evidence: list[AnalysisEvidenceCandidate]

    @property
    def key_evidence_ids(self) -> list[str]:
        return [item.evidence_id for item in self.selected_evidence]


class KnowledgeDiscoveryDecision(AnalysisModel):
    candidate_id: NonBlankText
    action: Literal['new', 'merge', 'reject']
    check_id: NonBlankText | None = None
    reason: NonBlankText

    @model_validator(mode='after')
    def target(self):
        if (self.action != 'reject') != (self.check_id is not None):
            raise ValueError('新增或合并需填写目标知识，拒绝不填写目标知识')
        return self


class KnowledgeReportReview(AnalysisModel):
    round_id: int = Field(ge=2, strict=True)
    discovery_decisions: list[KnowledgeDiscoveryDecision]


class KnowledgeBatchArchive(AnalysisModel):
    round_id: int
    wave_id: int
    session_id: str
    catalog_revision: int
    report: KnowledgeBatchReport | KnowledgeEvidenceReport | None = None
    review_revision: int | None = None
    discovery_decisions: list[KnowledgeDiscoveryDecision] = Field(default_factory=list)
