from typing import Literal

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.workbench.job_models import JobStatus
from iad_core.audit.report_models import AuditStatistics, AuditReportedGroup, AuditReportImage

AuditState = Literal['suspect', 'insufficient', 'normal', 'unprocessed', 'incomplete']
AUDIT_STATE_LABELS: dict[AuditState, str] = {
    'suspect': '发现疑点', 'insufficient': '证据不足', 'normal': '审计正常', 'unprocessed': '未处理', 'incomplete': '未完成',
}


class AuditSampleQuery(AnalysisModel):
    run_id: str
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=18, ge=1, le=200)
    status: Literal['all', 'suspect', 'insufficient', 'normal', 'unprocessed', 'incomplete'] = 'all'
    search: str = ''
    issue_type: str | None = None
    group_id: str | None = None
    consistency_assessment: str | None = None
    knowledge_id: str | None = None


class AuditSampleItem(AnalysisModel):
    run_id: str
    sample_id: str
    dataset_id: str
    filename: str
    width: int
    height: int
    audit_state: AuditState
    overview_evidence_id: str | None
    has_findings: bool
    insufficient_evidence: bool
    consistency_pending: bool
    session_id: str | None = None
    execution_status: JobStatus | None = None


class AuditSamplePage(AnalysisModel):
    run_id: str
    total: int
    page: int
    page_size: int
    distribution: dict[AuditState, int]
    items: list[AuditSampleItem]


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

    export_ready: bool = True
    statistics: AuditStatistics | None = None
    groups: list[AuditReportedGroup] = Field(default_factory=list)
    consistency_job_id: str | None = None
    report_state: JobStatus | None = None
    report_session_id: str | None = None
    scope_analysis: str = ''
    consistency_analysis: str = ''
    knowledge_analysis: str = ''
    boundary_analysis: str = ''
    dataset_names: dict[str,str] = Field(default_factory=dict)
    knowledge_titles: dict[str,str] = Field(default_factory=dict)
    evidence_groups: dict[str,list[AuditReportImage]] = Field(default_factory=dict)
