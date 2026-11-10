from typing import Literal
from uuid import UUID

from pydantic import Field, RootModel, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText, VisualEvidence
from iad_core.analysis.models import AnalysisCoverageSummary, AnalysisKnowledgeCheck, FrozenAnalysisDirection
from iad_core.consistency.agent_result_models import AnchorEvidenceReference, AnchorResultDetail, AnchorResultSummary
from iad_core.consistency.agent_models import AnchorResult
from iad_core.consistency.agent_review_models import AnchorAssessmentRecord, AnchorObservation
from iad_core.consistency.identity_models import CandidateIdentityRecord
from iad_core.knowledge.models import KnowledgeCheck, KnowledgeCheckReview, KnowledgeEvidence
from iad_core.knowledge.instructions import MiningDirectionSource
from iad_core.workbench.analysis_manifest import AnalysisManifest, AnalysisRegistration
from iad_core.workbench.job_models import JobStatus
from iad_core.workbench.calls import ModelCallError
from iad_core.workbench.model_profile import FrozenModelRole
from iad_core.workbench.module_settings import AuditSettingsValues
from iad_core.audit.prompt_text import DEFAULT_AUDIT_USER_PROMPT, DEFAULT_AUDIT_REPORT_PROMPT
from iad_core.consistency.annotation_issues import IssueType
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
    report_instruction: NonBlankText = DEFAULT_AUDIT_REPORT_PROMPT


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
    schema_version: Literal[1, 2, 3] = 1
    manifest: AnalysisManifest
    agent: FrozenModelRole
    instruction: NonBlankText
    system_prompt: NonBlankText | None = None
    report_instruction: NonBlankText | None = None
    consistency_job_id: str
    knowledge: FrozenAuditKnowledge | None


class LegacyAuditFinding(AnalysisModel):
    finding_id: NonBlankText
    description: NonBlankText
    location: NonBlankText
    check_ids: list[str] = Field(default_factory=list,description='仅引用本场选中知识的check_id；无选中知识或独立发现时为空，不填写自拟图像检查项。')
    evidence_ids: list[str] = Field(min_length=1)
    normal_explanation: str
    limitations: list[str]


class AuditCheckAssessment(AnalysisModel):
    check_id: NonBlankText = Field(description='必须来自本场knowledge.entries[].check.check_id；不是标注ID、上游差异ID或自拟图像检查项。')
    status: Literal['consistent', 'deviates', 'unobservable', 'not_applicable']
    description: NonBlankText
    evidence_ids: list[str] = Field(description='本次实际观察的完整原图身份；局部图仅用于观察，不单独引用。')


class LegacyAuditFinal(AnalysisModel):
    state: Literal['normal', 'suspect', 'insufficient'] = Field(
        description='normal表示现有标注与可见图像相符，包括已正确标注的缺陷；suspect表示可见标注问题需复核；insufficient表示证据不足以判断标注是否正确。')
    analysis: NonBlankText
    conclusion: NonBlankText
    basis: list[str]
    evidence_ids: list[str] = Field(min_length=1,
        description='本场实际打开并观察的完整原图ID，原始标注及全部局部视图属于该原图，不单独引用裁图或掩膜。')
    check_assessments: list[AuditCheckAssessment] = Field(description='恰好覆盖全部已选check_id，各有观察原因；未选择知识时为空数组。')
    findings: list[LegacyAuditFinding] = Field(description='本图全部需要复核的标注问题，无疑点时为空数组，不按数量截断。')
    limitations: list[str]


class AuditFinding(LegacyAuditFinding):
    type: IssueType
    annotation_ids: list[str] = Field(default_factory=list,description='引用当前主图真实annotation_id；类别、多标、位置和合并至少1个，拆分至少2个，少标或图像级可以为空。')
    consistency_issue_refs: list[str] = Field(default_factory=list,description='只引用本图上游result.issues中的真实issue_id，独立发现且不采纳上游问题时为空。')

    @model_validator(mode='after')
    def validate_object_reference(self):
        minimum = {'category_mismatch':1,'extra_annotation':1,'position_difference':1,'split':2,'merge':1}.get(self.type,0)
        if len(set(self.annotation_ids)) != len(self.annotation_ids) or len(self.annotation_ids) < minimum:
            raise ValueError('疑点必须引用本图实际标注对象，拆分至少涉及两个原始对象')
        return self



class AuditConsistencyAssessment(AnalysisModel):
    source_issue_id: NonBlankText
    assessment: Literal['supported','unsupported','insufficient']
    reason: NonBlankText
    evidence_ids: list[str]

    @model_validator(mode='after')
    def validate_observation(self):
        if self.assessment != 'insufficient' and not self.evidence_ids:
            raise ValueError('支持或不支持上游疑点必须引用实际观察证据')
        return self


class AuditObservation(AnalysisModel):
    description: NonBlankText
    annotation_ids: list[str] = Field(default_factory=list)
    evidence_ids: list[str] = Field(min_length=1, description='本次实际观察的完整原图身份，不单独引用局部图。')


class AuditFinal(AnalysisModel):
    execution_status: Literal['completed','incomplete','failed']
    state: Literal['normal','suspect'] | None
    analysis: NonBlankText
    conclusion: str
    basis: list[str]
    evidence_ids: list[str] = Field(description='本次实际观察的完整原图身份；原图及全部局部必须实际观察，但仅引用所属原图。')
    check_assessments: list[AuditCheckAssessment] = Field(description='仅逐项评估本场选中的knowledge.entries，恰好覆盖其check_id；knowledge为null时必须填[]。普通图像/标注观察写入analysis和basis，不生成自拟check_id。')
    consistency_review: list[AuditConsistencyAssessment] = Field(description='恰好处理本图上游result.issues中的每个issue_id一次；无上游问题时为空。supported须由findings关联，unsupported不能作为本图疑点来源。')
    findings: list[AuditFinding]
    observations: list[AuditObservation] = Field(default_factory=list, description='有理解价值但不足以形成质量疑点的简短观察，不计入疑点，也不改变业务结论；不因缺少类别语义或假设规范而填写。')
    limitations: list[str]

    @model_validator(mode='after')
    def validate_completion(self):
        if self.execution_status == 'completed':
            if self.state is None or not self.evidence_ids or not self.conclusion.strip():
                raise ValueError('完整审计必须有两类结论之一、真实图证和结论正文')
            if (self.state == 'suspect') != bool(self.findings):
                raise ValueError('图级疑点结论与疑点记录不一致')
        positions = [tuple(sorted(finding.annotation_ids)) for finding in self.findings if finding.type=='position_difference']
        if len(positions) != len(set(positions)):
            raise ValueError('同一标注对象的位置差异只能记录一次')
        if self.execution_status != 'completed' and self.state is not None:
            raise ValueError('未完成审计不能生成完整业务结论')
        return self


class AuditSampleRun(AnalysisModel):
    job_id: str
    sample_id: str
    ordinal: int
    session_id: str
    session_created: bool
    state: JobStatus
    consistency: AnchorResultDetail
    result: AuditFinal | LegacyAuditFinal | None = None


class AuditConsistencyContext(AnchorResultSummary):
    result: AnchorResult | None
    evidence: list[AnchorEvidenceReference]
    assessments: list[AnchorAssessmentRecord]
    gates: list[CandidateIdentityRecord]
    observations: list[AnchorObservation]
    captured_evidence: list[AnchorEvidenceReference]


class AuditAgentContext(AnalysisModel):
    job_id: str
    sample_id: str
    session_id: str
    target: AnalysisRegistration
    consistency: AuditConsistencyContext
    knowledge: FrozenAuditKnowledge | None
    saved_progress: AuditFinal | None = None


class AuditCommit(AnalysisModel):
    commit_key: NonBlankText = Field(description='本次图级终稿的幂等键，仅同内容重传复用。')
    final: AuditFinal


class AuditMediaView(AnalysisModel):
    image: VisualEvidence
    sample_id: str
    source: AnalysisRegistration | None


class NativeAuditSampleDetail(AnalysisModel):
    sample: AuditSampleItem
    final: AuditFinal | LegacyAuditFinal | None
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


class AuditJobPrompts(AnalysisModel):
    system_prompt: str
    instruction: str
    report_instruction: str
