from typing import Literal

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.audit.delegation_models import AuditResultReference
from iad_core.workbench.job_models import JobStatus


class AuditDefectFeature(AnalysisModel):
    feature_id: NonBlankText
    category: NonBlankText
    signature: NonBlankText = Field(description='实际缺陷的可见形态、外观和位置关系。')
    normal_distinctions: NonBlankText = Field(description='比较良品时应核对的可见差别，不能凭频次或普通纹理判断困难。')
    references: list[AuditResultReference] = Field(min_length=1, max_length=4)


class AuditDefectProfileCommit(AnalysisModel):
    commit_key: NonBlankText
    base_revision: int = Field(ge=0)
    features: list[AuditDefectFeature] = Field(max_length=16)
    limitations: list[NonBlankText] = Field(default_factory=list)


class AuditDefectProfileView(AnalysisModel):
    revision: int = Field(ge=1)
    features: list[AuditDefectFeature]
    limitations: list[str]


class AuditDefectProfile(AuditDefectProfileView):
    source_versions: dict[str, int]


class AuditPhaseState(AnalysisModel):
    phase: Literal['defects', 'defect_profile', 'normals', 'report', 'blocked']
    pending_sample_ids: list[str] = Field(default_factory=list)
    defect_profile: AuditDefectProfile | None = None
    limitations: list[str] = Field(default_factory=list)


class HardNormalQualification(AnalysisModel):
    feature_id: NonBlankText
    reference: AuditResultReference
    similar_features: list[NonBlankText] = Field(min_length=1)
    normal_reason: NonBlankText
    difficulty_reason: NonBlankText


class AuditStageSample(AnalysisModel):
    sample_id: str
    state: JobStatus
    result_revision: int
    execution_status: str | None

    @classmethod
    def capture(cls, sample):
        return cls(sample_id=sample.sample_id, state=sample.state, result_revision=sample.result_revision,
            execution_status=sample.result.execution_status if sample.result else None)
