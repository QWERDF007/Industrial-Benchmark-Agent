from typing import Literal

from iad_core.advisory.analysis import AnalysisModel
from iad_core.audit.delegation_models import AuditBatch, AuditRecheck
from iad_core.audit.models import AuditFinal, AuditKnowledge, AuditSampleRun
from iad_core.audit.profile_models import AuditDatasetProfile
from iad_core.audit.report_models import AuditDiscovery, AuditDiscoveryIndex, AuditStatistics
from iad_core.analysis.evidence_models import ContextPolicy
from iad_core.consistency.agent_models import AnchorResult
from iad_core.consistency.conflict_categories import ConflictCategory
from iad_core.consistency.identity_models import ContentRelation
from iad_core.workbench.job_models import JobStatus


class AuditMasterComparison(AnalysisModel):
    candidate_id: str
    gate_status: str | None
    relation: ContentRelation | None
    reason: str
    limitations: list[str]


class AuditMasterConsistency(AnalysisModel):
    reason: str
    program_conclusion: str
    model_conclusion: ConflictCategory | Literal['无冲突'] | None
    result: AnchorResult | None
    gates: list[AuditMasterComparison]


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
            consistency=AuditMasterConsistency(reason=upstream.reason,program_conclusion=upstream.program_conclusion,
                model_conclusion=upstream.model_conclusion,result=upstream.result,gates=[AuditMasterComparison(
                    candidate_id=gate.candidate_id,gate_status=gate.gate_status,relation=gate.relation,
                    reason=gate.reason,limitations=gate.limitations) for gate in upstream.gates]))


class AuditMasterContext(AnalysisModel):
    kind: Literal['audit_records'] = 'audit_records'
    job_id: str
    phase: Literal['review', 'report']
    batch: AuditBatch | None
    revision: int
    items: list[AuditMasterRecord]
    discoveries: list[AuditDiscovery | AuditDiscoveryIndex]
    context_policy: ContextPolicy = 'legacy'
    reviews: list[AuditRecheck]
    dataset_profile: AuditDatasetProfile
    statistics: AuditStatistics
    knowledge: AuditKnowledge | None
