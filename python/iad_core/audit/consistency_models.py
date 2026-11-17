from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.annotation_issues import MainAnnotationIssue
from iad_core.consistency.identity_models import ContentRelation
from iad_core.consistency.models import ModelAssessmentVerdict


class AuditUpstreamResult(AnalysisModel):
    reason: str
    verdict: ModelAssessmentVerdict
    issues: list[MainAnnotationIssue]

    @classmethod
    def capture(cls, result):
        return cls(reason=result.reason, verdict=result.verdict, issues=result.issues) if result else None


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
