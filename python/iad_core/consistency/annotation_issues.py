from typing import Annotated, Literal, Self

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.consistency.conflict_categories import ConflictCategory


IssueType = Literal['image_label_mismatch', 'category_mismatch', 'extra_annotation', 'missing_annotation',
    'position_difference', 'split', 'merge']

ISSUE_CATEGORIES = {'image_label_mismatch': ConflictCategory.CATEGORY, 'category_mismatch': ConflictCategory.CATEGORY,
    'extra_annotation': ConflictCategory.EXTRA, 'missing_annotation': ConflictCategory.MISSING,
    'position_difference': ConflictCategory.POSITION, 'split': ConflictCategory.SPLIT, 'merge': ConflictCategory.MERGE}


class IssueEvidenceFields(AnalysisModel):
    description: NonBlankText
    media_ids: list[str] = Field(min_length=2, max_length=2, description='实际观察的两侧原图身份各一次。')
    limitations: list[NonBlankText] = Field(default_factory=list)
    review_suggestion: NonBlankText = '人工核对两侧原始标注及标注规范。'


class BboxAnnotationIssue(IssueEvidenceFields):
    type: Literal['category_mismatch', 'extra_annotation', 'missing_annotation', 'position_difference', 'split', 'merge']
    main_annotation_ids: list[str] = Field(default_factory=list)
    candidate_annotation_ids: list[str] = Field(default_factory=list)

    @model_validator(mode='after')
    def check_objects(self) -> Self:
        main, candidate = len(self.main_annotation_ids), len(self.candidate_annotation_ids)
        if main != len(set(self.main_annotation_ids)) or candidate != len(set(self.candidate_annotation_ids)):
            raise ValueError('问题中的标注ID不得重复')
        valid = {'category_mismatch': main >= 1 and candidate >= 1,
            'position_difference': main >= 1 and candidate >= 1,
            'extra_annotation': main >= 1 and candidate == 0,
            'missing_annotation': main == 0 and candidate >= 1,
            'split': main >= 2 and candidate == 1,
            'merge': main == 1 and candidate >= 2}[self.type]
        if not valid:
            raise ValueError('差异类型与两侧真实对象的标注ID数量不匹配')
        return self


class ImageLabelIssue(IssueEvidenceFields):
    type: Literal['image_label_mismatch'] = 'image_label_mismatch'
    main_label: Literal['OK', 'NG']
    candidate_label: Literal['OK', 'NG']

    @model_validator(mode='after')
    def validate_difference(self):
        if self.main_label == self.candidate_label:
            raise ValueError('图像级标签不一致必须有两个不同的实际标签')
        return self


AnnotationIssue = Annotated[BboxAnnotationIssue | ImageLabelIssue, Field(discriminator='type')]


class MainIssueEvidence(AnalysisModel):
    assessment_id: int
    candidate_id: str
    candidate_annotation_ids: list[str]
    media_ids: list[str]
    candidate_label: Literal['OK', 'NG'] | None = None


class MainAnnotationIssue(AnalysisModel):
    issue_id: str
    type: IssueType
    main_annotation_ids: list[str]
    description: NonBlankText
    supporting_assessment_ids: list[int]
    evidence: list[MainIssueEvidence]
    limitations: list[str]
    review_suggestion: NonBlankText
    main_label: Literal['OK', 'NG'] | None = None
