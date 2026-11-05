from typing import Literal

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.advisory.schemas import AuditSuggestion
from iad_core.consistency.audit_models import AuditConsistencyView
from iad_core.knowledge.models import KnowledgeCheck, KnowledgeKind, KnowledgeEvidence
from iad_core.workbench.job_models import JobStatus

AuditState = Literal['suspect', 'insufficient', 'normal', 'unprocessed']
AUDIT_STATE_LABELS: dict[AuditState, str] = {
    'suspect': '发现疑点', 'insufficient': '证据不足', 'normal': '审计正常', 'unprocessed': '未处理',
}


class AuditSampleQuery(AnalysisModel):
    run_id: str
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=18, ge=1, le=200)
    status: Literal['all', 'suspect', 'insufficient', 'normal', 'unprocessed'] = 'all'
    search: str = ''


class AuditSampleItem(AnalysisModel):
    run_id: str
    sample_id: str
    dataset_id: str
    filename: str
    width: int
    height: int
    audit_state: AuditState
    suggestion_id: str | None
    consistency_check_id: str | None
    overview_evidence_id: str | None
    has_findings: bool
    insufficient_evidence: bool
    consistency_pending: bool


class AuditSamplePage(AnalysisModel):
    run_id: str
    total: int
    page: int
    page_size: int
    distribution: dict[AuditState, int]
    items: list[AuditSampleItem]


class AuditKnowledgeReference(AnalysisModel):
    version_id: str
    normal_reference_version_id: str | None = None
    kind: KnowledgeKind | None = None
    summary: str
    checks: list[KnowledgeCheck]
    limitations: list[str]
    evidence: list[KnowledgeEvidence]


class AuditSampleDetail(AnalysisModel):
    sample: AuditSampleItem
    suggestion: AuditSuggestion | None
    knowledge: AuditKnowledgeReference | None
    consistency: AuditConsistencyView | None
    source_current: bool | None
    errors: list[str]


class AuditRunReport(AnalysisModel):
    run_id: str
    dataset_id: str
    status: JobStatus
    total_samples: int
    audited_samples: int
    coverage_percent: float | None
    suspect_samples: int
    insufficient_samples: int
    consistency_pending_samples: int
    distribution: dict[AuditState, int]
    knowledge_version_id: str | None
    model_name: str | None
    submitted_at: str
    finished_at: str | None
    generated_at: str
    analysis: str
    conclusion: str
    limitations: list[str]
    key_evidence: list[AuditSampleItem]
