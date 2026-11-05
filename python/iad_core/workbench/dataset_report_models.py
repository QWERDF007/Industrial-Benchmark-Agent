from typing import Literal
from uuid import UUID, uuid4

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel, AuditImageSource, NonBlankText, VisualEvidence
from iad_core.workbench.benchmark_report import BenchmarkFacts
from iad_core.workbench.audit_result_models import AuditSampleItem
from iad_core.workbench.job_models import JobStatus
from iad_core.workbench.report_requirements import REPORT_REQUIREMENTS, DEFAULT_REPORT_PROMPT


class DatasetReportStart(AnalysisModel):
    submission_id: UUID = Field(default_factory=uuid4)
    dataset_ids: list[str] = Field(min_length=1)
    instruction: NonBlankText = DEFAULT_REPORT_PROMPT


class ReportSection(AnalysisModel):
    status: Literal['evaluable', 'limited', 'needs_evidence', 'unsupported']
    analysis: NonBlankText
    conclusion: NonBlankText
    missing_evidence: list[NonBlankText]
    sample_ids: list[str]
    evidence_ids: list[str]


class DatasetReportConclusion(AnalysisModel):
    sections: dict[str, ReportSection]
    dataset_analysis: NonBlankText
    dataset_conclusion: NonBlankText
    model_analysis: NonBlankText
    model_conclusion: NonBlankText

    @model_validator(mode='after')
    def complete_sections(self):
        if set(self.sections) != set(REPORT_REQUIREMENTS):
            from iad_core.advisory.output_validation import repairable_output_error
            raise repairable_output_error('report_sections', '报告必须包含所列评价要点且不添加未知章节')
        return self


class DatasetReportSnapshot(AnalysisModel):
    run_id: str
    facts: BenchmarkFacts
    conclusion: DatasetReportConclusion
    instruction: str
    model_name: str
    created_at: str
    visual_evidence_ids: list[str]


class ReportJobState(AnalysisModel):
    run_id: str
    status: JobStatus
    progress: int
    total_samples: int
    error: str | None
    created_at: str


class ReportDatum(AnalysisModel):
    label: str
    value: str
    basis: str


class ReportEvidence(AnalysisModel):
    source: AuditImageSource
    image: VisualEvidence
    suggestion_id: str
    audit_sample: AuditSampleItem


class DatasetReportView(AnalysisModel):
    run_id: str
    scope_dataset_ids: list[str]
    signature: str
    created_at: str
    instruction: str
    registered_samples: int
    audited_samples: int
    outcomes: dict[str, int]
    raw_labels: dict[str, int]
    data: dict[str, list[ReportDatum]]
    conclusion: DatasetReportConclusion
    evidence: list[ReportEvidence]
