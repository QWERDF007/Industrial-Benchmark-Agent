from typing import Literal
from uuid import UUID

from pydantic import Field, RootModel

from iad_core.advisory.analysis import AnalysisModel, NonBlankText, VisualEvidence
from iad_core.analysis.models import AnalysisKnowledgeCheck, FrozenAnalysisDirection
from iad_core.consistency.agent_result_models import AnchorResultDetail
from iad_core.knowledge.models import KnowledgeCheck, KnowledgeCheckReview, KnowledgeEvidence
from iad_core.workbench.analysis_manifest import AnalysisManifest, AnalysisRegistration
from iad_core.workbench.job_models import JobStatus
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


class AuditKnowledge(AnalysisModel):
    selection: AuditKnowledgeSelection
    summary: str
    limitations: list[str]
    unresolved_questions: list[str] = Field(default_factory=list)
    directions: list[FrozenAnalysisDirection] = Field(default_factory=list)
    entries: list[AuditSelectedCheck]
    evidence: list[KnowledgeEvidence]


class AuditAgentConfiguration(AnalysisModel):
    settings_revision: int
    settings: AuditSettingsValues


class AuditWorkflowSnapshot(AuditAgentConfiguration):
    schema_version: Literal[1] = 1
    manifest: AnalysisManifest
    agent: FrozenModelRole
    instruction: NonBlankText
    system_prompt: NonBlankText | None = None
    consistency_job_id: str
    knowledge: AuditKnowledge | None


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
    state: Literal['normal', 'suspect', 'insufficient']
    analysis: NonBlankText
    conclusion: NonBlankText
    basis: list[str]
    evidence_ids: list[str] = Field(min_length=1)
    check_assessments: list[AuditCheckAssessment]
    findings: list[AuditFinding]
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


class AuditAgentContext(AnalysisModel):
    job_id: str
    sample_id: str
    session_id: str
    target: AnalysisRegistration
    consistency: AnchorResultDetail
    knowledge: AuditKnowledge | None


class AuditCommit(AnalysisModel):
    commit_key: NonBlankText
    final: AuditFinal


class AuditMediaView(AnalysisModel):
    image: VisualEvidence
    sample_id: str
    source: AnalysisRegistration | None


class NativeAuditSampleDetail(AnalysisModel):
    sample: AuditSampleItem
    final: AuditFinal | None
    knowledge: AuditKnowledge | None
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
