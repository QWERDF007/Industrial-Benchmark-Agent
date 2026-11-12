from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.analysis.models import AnalysisCoverageSummary, AnalysisKnowledgeCheck
from iad_core.knowledge.models import KnowledgeCheck, KnowledgeCheckReview, KnowledgeEvidence
from iad_core.knowledge.instructions import MiningDirectionSource
from iad_core.workbench.calls import ModelCallError


class AuditKnowledgeSelection(AnalysisModel):
    job_id: NonBlankText
    version_id: NonBlankText
    entry_ids: list[NonBlankText]


class AuditSelectedCheck(AnalysisModel):
    check: AnalysisKnowledgeCheck | KnowledgeCheck
    review: KnowledgeCheckReview

    @property
    def evidence_ids(self) -> list[str]:
        return list(dict.fromkeys([
            *self.check.support_evidence_ids, *self.check.counter_evidence_ids,
            *(item.evidence_id for item in self.check.key_evidence or []),
        ]))


class AuditKnowledgeScope(AnalysisModel):
    dataset_ids: list[str]
    revision: int
    execution_status: str
    execution_error: ModelCallError | None
    coverage: AnalysisCoverageSummary
    finalization_complete: bool | None


class AuditKnowledgeDirection(AnalysisModel):
    ref: str
    source: MiningDirectionSource
    title: NonBlankText
    instruction: NonBlankText


class AuditKnowledge(AnalysisModel):
    selection: AuditKnowledgeSelection
    source_scope: AuditKnowledgeScope
    directions: list[AuditKnowledgeDirection]
    entries: list[AuditSelectedCheck]
    evidence: list[KnowledgeEvidence]
