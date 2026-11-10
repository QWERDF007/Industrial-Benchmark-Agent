from typing import Literal
from uuid import UUID

from pydantic import Field, RootModel

from iad_core.advisory.analysis import AnalysisModel, NonBlankText, VisualEvidence
from iad_core.analysis.models import AnalysisCoverageSummary, AnalysisKnowledgeCheck, FrozenAnalysisDirection
from iad_core.consistency.agent_result_models import AnchorEvidenceReference, AnchorResultDetail, AnchorResultSummary
from iad_core.consistency.agent_models import AnchorResult
from iad_core.consistency.agent_review_models import AnchorAssessmentRecord
from iad_core.knowledge.models import KnowledgeCheck, KnowledgeCheckReview, KnowledgeEvidence
from iad_core.knowledge.instructions import MiningDirectionSource
from iad_core.workbench.analysis_manifest import AnalysisManifest, AnalysisRegistration
from iad_core.workbench.job_models import JobStatus
from iad_core.workbench.calls import ModelCallError
from iad_core.workbench.model_profile import FrozenModelRole
from iad_core.workbench.module_settings import AuditSettingsValues
from iad_core.audit.prompt_text import DEFAULT_AUDIT_USER_PROMPT
from iad_core.workbench.audit_result_models import AuditSampleItem


class AuditKnowledgeSelection(AnalysisModel):
    job_id: NonBlankText
    version_id: NonBlankText
    entry_ids: list[NonBlankText]


class AuditAgentStart(AnalysisModel):
    submission_id: UUID
    subset_ids: list[NonBlankText] = Field(min_length=1)
    consistency_job_id: NonBlankText
    knowledge: AuditKnowledgeSelection | None = None
    instruction: NonBlankText = DEFAULT_AUDIT_USER_PROMPT
    system_prompt: NonBlankText | None = None


class AuditSelectedCheck(AnalysisModel):
    check: AnalysisKnowledgeCheck | KnowledgeCheck
    review: KnowledgeCheckReview


class LegacyAuditKnowledge(AnalysisModel):
    selection: AuditKnowledgeSelection
    summary: str
    limitations: list[str]
    unresolved_questions: list[str] = Field(default_factory=list)
    directions: list[FrozenAnalysisDirection] = Field(default_factory=list)
    entries: list[AuditSelectedCheck]
    evidence: list[KnowledgeEvidence]


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


FrozenAuditKnowledge = AuditKnowledge | LegacyAuditKnowledge


class AuditAgentConfiguration(AnalysisModel):
    settings_revision: int
    settings: AuditSettingsValues


class AuditWorkflowSnapshot(AuditAgentConfiguration):
    schema_version: Literal[1, 2] = 1
    manifest: AnalysisManifest
    agent: FrozenModelRole
    instruction: NonBlankText
    system_prompt: NonBlankText | None = None
    consistency_job_id: str
    knowledge: FrozenAuditKnowledge | None


class AuditFinding(AnalysisModel):
    finding_id: NonBlankText
    description: NonBlankText
    location: NonBlankText
    check_ids: list[str] = Field(default_factory=list)
    evidence_ids: list[str] = Field(min_length=1)
    normal_explanation: str
    limitations: list[str]


class AuditCheckAssessment(AnalysisModel):
    check_id: NonBlankText
    status: Literal['consistent', 'deviates', 'unobservable', 'not_applicable']
    description: NonBlankText
    evidence_ids: list[str]


class AuditFinal(AnalysisModel):
    state: Literal['normal', 'suspect', 'insufficient'] = Field(
        description='normal表示现有标注与可见图像相符，包括已正确标注的缺陷；suspect表示可见标注问题需复核；insufficient表示证据不足以判断标注是否正确。')
    analysis: NonBlankText
    conclusion: NonBlankText
    basis: list[str]
    evidence_ids: list[str] = Field(min_length=1,
        description='本场实际打开并观察的完整原图ID，原始标注及全部局部视图属于该原图，不单独引用裁图或掩膜。')
    check_assessments: list[AuditCheckAssessment] = Field(description='恰好覆盖全部已选check_id，各有观察原因；未选择知识时为空数组。')
    findings: list[AuditFinding] = Field(description='本图全部需要复核的标注问题，无疑点时为空数组，不按数量截断。')
    limitations: list[str]


class AuditSampleRun(AnalysisModel):
    job_id: str
    sample_id: str
    ordinal: int
    session_id: str
    session_created: bool
    state: JobStatus
    consistency: AnchorResultDetail
    result: AuditFinal | None = None


class AuditConsistencyContext(AnchorResultSummary):
    result: AnchorResult | None
    evidence: list[AnchorEvidenceReference]
    assessments: list[AnchorAssessmentRecord]


class AuditAgentContext(AnalysisModel):
    job_id: str
    sample_id: str
    session_id: str
    target: AnalysisRegistration
    consistency: AuditConsistencyContext
    knowledge: FrozenAuditKnowledge | None


class AuditCommit(AnalysisModel):
    commit_key: NonBlankText = Field(description='本次图级终稿的幂等键，仅同内容重传复用。')
    final: AuditFinal


class AuditMediaView(AnalysisModel):
    image: VisualEvidence
    sample_id: str
    source: AnalysisRegistration | None


class NativeAuditSampleDetail(AnalysisModel):
    sample: AuditSampleItem
    final: AuditFinal | None
    knowledge: FrozenAuditKnowledge | None
    consistency: AnchorResultDetail
    evidence: list[AuditMediaView]
    errors: list[str]


class NativeAuditEvidenceReference(AnalysisModel):
    run_id: NonBlankText
    sample_id: NonBlankText
    evidence_id: NonBlankText


class HistoricalAuditEvidenceReference(AnalysisModel):
    suggestion_id: NonBlankText
    evidence_id: NonBlankText


class AuditEvidenceQuery(RootModel[NativeAuditEvidenceReference | HistoricalAuditEvidenceReference]):
    pass
