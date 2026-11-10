from iad_core.consistency.group_models import FrozenAnalysisGroup
from iad_core.consistency.group_analysis_models import GroupAnalysisDraft
from iad_core.consistency.repository import ConsistencyRepository


class GroupAnalysisValidation:
    def __init__(self, db):
        self.repository = ConsistencyRepository(db)

    @staticmethod
    def verdict(values):
        priority = {'EQUIVALENT': 0, 'UNCERTAIN': 1, 'MATERIAL': 2}
        return max(values, key=priority.__getitem__)

    def validate(self, result: GroupAnalysisDraft, group: FrozenAnalysisGroup):
        members = {member.image.sample.sample_id: member for member in group.members}
        if len(result.assessments) != len(members) or {item.candidate_id for item in result.assessments} != set(members):
            raise ValueError('Model assessments must cover every frozen candidate exactly once')
        expected = self.verdict(item.verdict for item in result.assessments)
        if result.overall.verdict != expected:
            raise ValueError('整组判定必须与已保存的逐候选评估一致')
        for reference in [*result.overall.references, *[ref for conclusion in result.conclusions for ref in conclusion.references]]:
            member = members.get(reference.candidate_id)
            if member is None:
                raise ValueError('Model reference points outside the frozen group')
            if citation := reference.comparison:
                allowed = {member.image.evidence_id, member.comparison.evidence_id if member.comparison else None}
                saved = self.repository.get(citation.evidence_id).result if citation.evidence_id in allowed else None
                if saved is None or saved.result_id != citation.result_id or (citation.difference_id and
                    citation.difference_id not in {item.difference_id for item in saved.annotation.differences}):
                    raise ValueError('Model reference does not match this candidate and frozen comparison')
