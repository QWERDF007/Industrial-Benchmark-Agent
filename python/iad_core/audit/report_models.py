from typing import Literal

from pydantic import Field, computed_field, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.workbench.job_models import JobStatus
from iad_core.consistency.annotation_issues import ISSUE_CATEGORIES
from iad_core.consistency.conflict_categories import CONFLICT_CATEGORY_LABELS
from iad_core.advisory.analysis import VisualEvidence
from iad_core.workbench.analysis_manifest import AnalysisRegistration

AUDIT_ISSUE_LABELS = {kind:CONFLICT_CATEGORY_LABELS[category] for kind,category in ISSUE_CATEGORIES.items()}
AUDIT_ISSUE_LABELS['image_label_mismatch'] = '图像级标签疑点'
AUDIT_ASSESSMENT_LABELS = {'supported':'支持为疑点','unsupported':'不支持为疑点','insufficient':'证据不足'}
AUDIT_CONSISTENCY_LABELS = {'NO_CANDIDATES':'无候选','NO_ELIGIBLE_CANDIDATES':'无有效候选',
    'MODEL_REVIEWED:MATERIAL':'存在标注差异','MODEL_REVIEWED:EQUIVALENT':'标注一致','MODEL_REVIEWED:UNCERTAIN':'待核实'}


class AuditCount(AnalysisModel):
    image_count: int
    occurrences: int


class AuditStatistics(AnalysisModel):
    total_images: int
    completed_images: int
    normal_images: int
    suspect_images: int
    incomplete_images: int
    completion_rate: float | None
    suspect_rate_among_completed: float | None
    issue_occurrences: int
    issue_types: dict[str, AuditCount]
    datasets: dict[str, dict[str, int]]
    consistency_cross: dict[str, dict[str, int]]
    consistency_assessments: dict[str, int]
    knowledge_assessments: dict[str, dict[str, int]]
    observation_images: int = 0
    observation_occurrences: int = 0


class AuditRecordQuery(AnalysisModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=30, ge=1, le=100)
    sample_id: str | None = None
    issue_type: str | None = None
    consistency_assessment: Literal['supported','unsupported','insufficient'] | None = None
    knowledge_id: str | None = None
    state: Literal['normal','suspect','incomplete'] | None = None


class AuditIssueReference(AnalysisModel):
    sample_id: NonBlankText
    finding_id: NonBlankText


class AuditRepresentative(AnalysisModel):
    sample_id: NonBlankText
    finding_id: str | None = None
    role: Literal['representative','counter'] = Field(default='representative',description='representative为典型疑点图；counter为已观察的判断边界对照图，不是人工确认的正常真值。')
    reason: NonBlankText


class AuditReportImage(AnalysisModel):
    sample_id: str
    role: Literal['representative','counter']
    caption: str
    reason: str
    image: VisualEvidence
    source: AnalysisRegistration


class AuditIssueGroup(AnalysisModel):
    group_id: NonBlankText
    title: NonBlankText
    description: NonBlankText
    issue_refs: list[AuditIssueReference] = Field(min_length=1)
    representatives: list[AuditRepresentative] = Field(min_length=1, max_length=4)
    normal_explanations: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)


class AuditReportedGroup(AuditIssueGroup):
    @computed_field
    @property
    def affected_image_count(self) -> int:
        return len({ref.sample_id for ref in self.issue_refs})

    @computed_field
    @property
    def issue_occurrences(self) -> int:
        return len(self.issue_refs)


class AuditGroupCommit(AnalysisModel):
    commit_key: NonBlankText
    groups: list[AuditIssueGroup] = Field(default_factory=list, max_length=30)
    remove_group_ids: list[NonBlankText] = Field(default_factory=list)

    @model_validator(mode='after')
    def nonempty_change(self):
        if not self.groups and not self.remove_group_ids:
            raise ValueError('需要提供主题更新或删除项')
        return self


class AuditReportCommit(AnalysisModel):
    commit_key: NonBlankText
    scope_analysis: NonBlankText
    issue_analysis: NonBlankText
    consistency_analysis: NonBlankText
    knowledge_analysis: NonBlankText
    boundary_analysis: str = Field(default='', description='解释相似现象在已保存图级记录中的判断边界；不重判终稿，不假设类别语义、实例规范或采集工艺。没有实际对照时不编造。')
    conclusion: NonBlankText
    limitations: list[str]


class AuditReportSession(AnalysisModel):
    job_id: str
    session_id: str
    session_created: bool
    generation: int
    state: JobStatus
    groups: list[AuditReportedGroup]
    result: AuditReportCommit | None
    error: str | None


class AuditReportEvidenceQuery(AnalysisModel):
    sample_id: NonBlankText
    evidence_id: NonBlankText
