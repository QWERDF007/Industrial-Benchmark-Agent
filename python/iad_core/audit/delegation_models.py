from typing import Literal

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel, NonBlankText


class AuditResultReference(AnalysisModel):
    sample_id: NonBlankText
    result_revision: int = Field(ge=1)
    kind: Literal['finding', 'observation', 'feature', 'image']
    index: int | None = Field(default=None, ge=0)


class AuditClue(AnalysisModel):
    group_id: NonBlankText
    title: NonBlankText
    visual_signature: str
    annotation_relation: str
    next_batch_focus: str
    support_refs: list[AuditResultReference]
    counter_refs: list[AuditResultReference]


class AuditClueIndex(AnalysisModel):
    group_id: NonBlankText
    title: NonBlankText
    visual_signature: str
    annotation_relation: str
    next_batch_focus: str
    support_image_count: int
    counter_image_count: int


class AuditHypothesisAssessment(AnalysisModel):
    group_id: NonBlankText
    assessment: Literal['supported', 'counter', 'unconfirmed', 'not_applicable']
    reason: NonBlankText
    evidence_ids: list[str]


class AuditVisualFeature(AnalysisModel):
    kind: Literal['morphology', 'location', 'size', 'contrast', 'structural_relation', 'instances', 'background']
    description: NonBlankText
    annotation_ids: list[str] = Field(default_factory=list)
    evidence_ids: list[NonBlankText] = Field(min_length=1)


class AuditReviewRequest(AnalysisModel):
    sample_id: NonBlankText
    result_revision: int = Field(ge=1)
    reason: NonBlankText
    conflict_refs: list[AuditResultReference] = Field(min_length=1)


class AuditRecheck(AuditReviewRequest):
    review_id: str
    batch_number: int
    state: Literal['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']
    error: str | None


class AuditBatch(AnalysisModel):
    number: int
    sample_ids: list[str]
    state: Literal['PENDING', 'AUDITING', 'REVIEWING', 'RECHECKING', 'COMPLETED']
    clues_revision: int | None
    clues: list[AuditClue | AuditClueIndex]
    review_revision: int | None
