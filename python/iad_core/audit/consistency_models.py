from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.annotation_issues import MainAnnotationIssue
from iad_core.consistency.agent_result_models import AnchorResultDetail
from iad_core.consistency.identity_models import ContentRelation
from iad_core.consistency.models import ModelAssessmentVerdict


class AuditUpstreamResult(AnalysisModel):
    reason: str
    verdict: ModelAssessmentVerdict
    issues: list[MainAnnotationIssue]

    @classmethod
    def capture(cls, source: AnchorResultDetail) -> 'AuditUpstreamResult | None':
        return cls(reason=source.reason, verdict=source.verdict, issues=source.result.issues) if source.result else None


class AuditCandidateContext(AnalysisModel):
    candidate_id: str
    gate_status: str | None
    relation: ContentRelation | None
    reason: str
    limitations: list[str]

    @classmethod
    def capture(cls, gate):
        return cls(candidate_id=gate.candidate_id, gate_status=gate.gate_status, relation=gate.relation,
            reason=gate.reason, limitations=gate.limitations)
