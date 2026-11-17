from typing import Literal

from iad_core.advisory.analysis import AnalysisModel
from iad_core.audit.consistency_models import AuditCandidateContext, AuditUpstreamResult
from iad_core.audit.delegation_models import AuditBatch, AuditRecheck
from iad_core.audit.models import AuditFinal, AuditSampleRun
from iad_core.audit.quality_models import QualityScoreVersion
from iad_core.audit.knowledge_models import AuditKnowledge
from iad_core.audit.profile_models import AuditDatasetProfile
from iad_core.audit.report_models import AuditDiscovery, AuditDiscoveryIndex, AuditStatistics
from iad_core.analysis.evidence_models import ContextPolicy
from iad_core.consistency.annotation_issues import IssueType
from iad_core.consistency.conflict_categories import ConflictCategory
from iad_core.workbench.job_models import JobStatus


class AuditMasterConsistency(AnalysisModel):
    source_status: str
    reason: str
    program_conclusion: str
    model_conclusion: ConflictCategory | Literal['无冲突'] | None
    result: AuditUpstreamResult | None
    gates: list[AuditCandidateContext]


class AuditMasterRecord(AnalysisModel):
    sample_id: str
    result_revision: int
    state: JobStatus
    final: AuditFinal | None
    consistency: AuditMasterConsistency

    @classmethod
    def capture(cls, sample: AuditSampleRun) -> 'AuditMasterRecord':
        upstream = sample.consistency
        return cls(sample_id=sample.sample_id,result_revision=sample.result_revision,state=sample.state,final=sample.result,
            consistency=AuditMasterConsistency(source_status=sample.source_status,reason=upstream.reason,program_conclusion=upstream.program_conclusion,
                model_conclusion=upstream.model_conclusion,result=AuditUpstreamResult.capture(upstream),gates=[AuditCandidateContext.capture(gate) for gate in upstream.gates]))


class AuditMasterContext(AnalysisModel):
    quality_score_version: QualityScoreVersion | None = None
    kind: Literal['audit_records'] = 'audit_records'
    job_id: str
    phase: Literal['review', 'report']
    batch: AuditBatch | None
    revision: int
    items: list[AuditMasterRecord]
    items_scope: Literal['unread_versions'] = 'unread_versions'
    discoveries: list[AuditDiscovery | AuditDiscoveryIndex]
    context_policy: ContextPolicy = 'legacy'
    reviews: list[AuditRecheck]
    dataset_profile: AuditDatasetProfile
    applicable_issue_types: list[IssueType]
    statistics: AuditStatistics
    knowledge: AuditKnowledge | None
