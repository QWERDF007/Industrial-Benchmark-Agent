from typing import Annotated, Literal, Optional

from pydantic import Field, StringConstraints

from iad_core.advisory.analysis import AnalysisModel


PolicyRelation = Literal['SAME', 'DIFFERENT', 'UNKNOWN']
AnnotationRole = Literal['REFERENCE', 'PREDICTION', 'UNKNOWN']
AnnotationCoverage = Literal['EXHAUSTIVE', 'PARTIAL', 'UNKNOWN']
PolicyName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class AnnotationPolicy(AnalysisModel):
    policy_id: Optional[PolicyName] = None
    annotation_role: AnnotationRole = 'UNKNOWN'
    annotation_coverage: AnnotationCoverage = 'UNKNOWN'
    category_mapping: dict[PolicyName, PolicyName] = Field(default_factory=dict)

    def relation(self, other: 'AnnotationPolicy') -> PolicyRelation:
        if self.policy_id is None or other.policy_id is None:
            return 'UNKNOWN'
        return 'SAME' if self.policy_id == other.policy_id else 'DIFFERENT'
