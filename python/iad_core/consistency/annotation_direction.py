from iad_core.consistency.agent_review_models import AnchorAssessmentDecision, CandidateVisualObservation
from iad_core.consistency.annotation_issues import BboxAnnotationIssue
from iad_core.consistency.conflict_categories import CONFLICT_RULES


INVERSE_ISSUE_TYPES = {rule.issue_type: CONFLICT_RULES[category.inverse].issue_type
    for category, rule in CONFLICT_RULES.items()}


class AnnotationDirection:
    @staticmethod
    def reverse(observation: CandidateVisualObservation, candidate_id: str) -> CandidateVisualObservation:
        assessment = observation.assessment
        issues = [BboxAnnotationIssue.model_validate({**issue.model_dump(),
            'type': INVERSE_ISSUE_TYPES[issue.type],
            'main_annotation_ids': issue.candidate_annotation_ids,
            'candidate_annotation_ids': issue.main_annotation_ids,
            'media_ids': list(reversed(issue.media_ids)),
            'same_main_object_as': []}) for issue in assessment.issues] if assessment else []
        return CandidateVisualObservation(**{**observation.model_dump(), 'candidate_id': candidate_id,
            'media_ids': list(reversed(observation.media_ids)),
            'assessment': AnchorAssessmentDecision(**{**assessment.model_dump(),
                'candidate_id': candidate_id, 'issues': issues}) if assessment else None})
