from typing import Literal
from uuid import UUID

from pydantic import Field, RootModel, model_validator
from pydantic.json_schema import SkipJsonSchema

from iad_core.advisory.analysis import AnalysisModel, NonBlankText, VisualEvidence
from iad_core.consistency.agent_result_models import AnchorEvidenceReference, AnchorResultDetail, AnchorResultSummary
from iad_core.consistency.agent_models import AnchorResult
from iad_core.consistency.agent_review_models import AnchorAssessmentRecord, AnchorObservation
from iad_core.consistency.identity_models import CandidateIdentityRecord
from iad_core.workbench.analysis_manifest import AnalysisManifest, AnalysisRegistration
from iad_core.workbench.job_models import JobStatus
from iad_core.workbench.model_profile import FrozenModelRole
from iad_core.workbench.module_settings import AuditSettingsValues
from iad_core.audit.knowledge_models import AuditKnowledge, AuditKnowledgeSelection
from iad_core.audit.prompt_text import (DEFAULT_AUDIT_USER_PROMPT, OBSERVER_AUDIT_SYSTEM_PROMPT,
    MASTER_AUDIT_SYSTEM_PROMPT, DEFAULT_AUDIT_BATCH_PROMPT, DEFAULT_AUDIT_REPORT_PROMPT)
from iad_core.analysis.prompt_models import AnalysisRolePrompts
from iad_core.analysis.evidence_models import ContextPolicy, AnalysisEvidenceCandidate
from iad_core.audit.delegation_models import AuditBatch, AuditRecheck, AuditHypothesisAssessment, AuditVisualFeature
from iad_core.audit.profile_models import AuditDatasetProfile
from iad_core.consistency.annotation_issues import IssueType
from iad_core.workbench.audit_result_models import AuditSampleItem
from iad_core.evidence.registrations import RegistrationMediaQuery


class AuditAgentStart(AnalysisModel):
    submission_id: UUID
    subset_ids: list[NonBlankText] = Field(min_length=1)
    consistency_job_id: NonBlankText
    knowledge: AuditKnowledgeSelection | None = None
    master_prompt: AnalysisRolePrompts = Field(default_factory=lambda:AnalysisRolePrompts(
        system_prompt=MASTER_AUDIT_SYSTEM_PROMPT,user_prompt=DEFAULT_AUDIT_BATCH_PROMPT))
    report_instruction: NonBlankText = DEFAULT_AUDIT_REPORT_PROMPT
    observer_prompt: AnalysisRolePrompts = Field(default_factory=lambda:AnalysisRolePrompts(
        system_prompt=OBSERVER_AUDIT_SYSTEM_PROMPT,user_prompt=DEFAULT_AUDIT_USER_PROMPT))
    benchmark_build_id: NonBlankText | None = None


class AuditAgentConfiguration(AnalysisModel):
    settings_revision: int
    settings: AuditSettingsValues


class AuditWorkflowSnapshot(AuditAgentConfiguration):
    schema_version: Literal[4] = 4
    context_policy: ContextPolicy = 'legacy'
    manifest: AnalysisManifest
    agent: FrozenModelRole
    report_instruction: NonBlankText
    consistency_job_id: str
    knowledge: AuditKnowledge | None
    master_prompt: AnalysisRolePrompts
    observer_prompt: AnalysisRolePrompts
    dataset_profile: AuditDatasetProfile


class AuditCheckAssessment(AnalysisModel):
    check_id: NonBlankText = Field(description='必须来自本场knowledge.entries[].check.check_id；不是标注ID、上游差异ID或自拟图像检查项。')
    status: Literal['consistent', 'deviates', 'unobservable', 'not_applicable']
    description: NonBlankText = Field(description='说明本图可见现象与该知识检查动作的具体对应和适用理由。')
    evidence_ids: list[str] = Field(description='本次实际观察的完整原图身份；局部图仅用于观察，不单独引用。')


class AuditFinding(AnalysisModel):
    finding_id: NonBlankText
    description: NonBlankText
    location: NonBlankText
    check_ids: list[str] = Field(default_factory=list,description='仅引用本场选中知识的check_id；无选中知识或独立发现时为空，不填写自拟图像检查项。')
    evidence_ids: list[str] = Field(min_length=1)
    normal_explanation: str
    limitations: list[str]
    type: IssueType = Field(description='按可见问题分类；类别差异指有效同内容对照中同一对象的原始分组差异。')
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
    analysis: NonBlankText = Field(description='只概括本图可见形态及标注覆盖、定位、实例关系。上游与知识评估分别填写对应字段。')
    conclusion: str
    basis: list[str] = Field(description='支持本图判断的具体图像事实。')
    evidence_ids: list[str] = Field(description='本次实际观察的完整原图身份；原图及全部局部必须实际观察，但仅引用所属原图。')
    check_assessments: list[AuditCheckAssessment] = Field(description='仅逐项评估本场选中的knowledge.entries，恰好覆盖其check_id；knowledge为null时必须填[]。普通图像/标注观察写入analysis和basis，不生成自拟check_id。')
    consistency_review: list[AuditConsistencyAssessment] = Field(description='恰好处理本图上游result.issues中的每个issue_id一次；无上游问题时为空。supported须由findings关联，unsupported不能作为本图疑点来源。')
    findings: list[AuditFinding]
    observations: list[AuditObservation] = Field(default_factory=list, description='记录有比较价值的可见现象，描述简短；普通观察不计入质量疑点。')
    hypothesis_assessments: list[AuditHypothesisAssessment] = Field(default_factory=list)
    visual_features: list[AuditVisualFeature] = Field(default_factory=list)
    selected_evidence: list[AnalysisEvidenceCandidate] = Field(default_factory=list,
        description='推荐供主Agent复看的少数完整原图及选择理由，可为空；不自动成为正式精选，不重复另一份精选ID列表。')
    limitations: list[str] = Field(description='画面模糊、目标截断、必要图像读取失败等实际影响本图核查的取证缺口；没有则填[]。')

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


class AuditLegacyFinal(AuditFinal):
    selected_evidence: SkipJsonSchema[list[AnalysisEvidenceCandidate]] = Field(default_factory=list, exclude=True)


class AuditSampleRun(AnalysisModel):
    job_id: str
    sample_id: str
    ordinal: int
    session_id: str
    session_created: bool
    state: JobStatus
    consistency: AnchorResultDetail
    result: AuditFinal | None = None
    result_revision: int = 0

    @property
    def source_status(self) -> str:
        reason = self.consistency.reason
        return reason+':'+(self.consistency.verdict or 'UNCERTAIN') if reason=='MODEL_REVIEWED' else reason


class AuditResultVersion(AnalysisModel):
    revision: int
    final: AuditFinal
    review_id: str | None


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
    knowledge: AuditKnowledge | None
    saved_progress: AuditFinal | None = None
    batch: AuditBatch | None = None
    review: AuditRecheck | None = None
    prior_result: AuditFinal | None = None


class AuditCommit(AnalysisModel):
    commit_key: NonBlankText = Field(description='本次图级终稿的幂等键，仅同内容重传复用。')
    final: AuditLegacyFinal


class AuditEvidenceCommit(AuditCommit):
    final: AuditFinal


class AuditMediaQuery(RegistrationMediaQuery):
    view: Literal['whole', 'annotation_rois', 'all'] = Field(default='whole',
        description='whole仅完整原图和标注元数据；annotation_rois为全部标注局部；all显式读取整图及全部必需局部。')


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


class AuditPromptSection(AnalysisModel):
    title: str
    text: str


class AuditJobPrompts(AnalysisModel):
    sections: list[AuditPromptSection]
