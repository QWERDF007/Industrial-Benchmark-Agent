from typing import TypeVar

from pydantic import model_validator

from iad_core.advisory.output_validation import repairable_output_error
from iad_core.consistency.evidence_models import ConsistencyResult
from iad_core.consistency.group_models import FrozenAnalysisGroup
from iad_core.consistency.group_analysis_models import GroupAnalysisDraft, GroupAnalysisSummary
from iad_core.consistency.models import ModelAssessmentVerdict
from iad_core.consistency.repository import ConsistencyRepository

Summary = TypeVar('Summary', bound=GroupAnalysisSummary)


class GroupAnalysisValidation:
    def __init__(self, db):
        self.repository = ConsistencyRepository(db)

    def response_type(self, response_type: type[Summary], group: FrozenAnalysisGroup,
                      allowed_ids: set[str] | None = None, *, expected_verdict: ModelAssessmentVerdict | None = None) -> type[Summary]:
        """Derive the provider's reference vocabulary from these frozen facts."""
        members = [member for member in group.members if allowed_ids is None or member.image.sample.sample_id in allowed_ids]
        candidates = sorted(member.image.sample.sample_id for member in members)
        evidence_ids = sorted({identity for member in members for identity in
            (member.image.evidence_id, member.comparison.evidence_id if member.comparison else member.image.evidence_id)})
        comparisons = {identity: self.repository.get(identity).result for identity in evidence_ids}
        saved = list(comparisons.values())
        results = sorted({item.result_id for item in saved})
        differences = sorted({item.difference_id for result in saved for item in result.annotation.differences})

        def frozen_schema(cls, **options):
            schema = response_type.model_json_schema(**options)
            definitions = schema['$defs']
            for name in ('GroupAnalysisReference', 'GroupPairAssessment'):
                if name in definitions:
                    definitions[name]['properties']['candidate_id']['enum'] = candidates
            comparison = definitions['GroupAnalysisComparison']['properties']
            comparison['evidence_id']['enum'] = evidence_ids
            comparison['result_id']['enum'] = results
            comparison['difference_id']['anyOf'] = ([dict(type='string',enum=differences)] if differences else []) + [dict(type='null')]
            references = []
            for member in members:
                identities = {member.image.evidence_id}
                if member.comparison:
                    identities.add(member.comparison.evidence_id)
                citations = [dict(type='null')]
                for identity in sorted(identities):
                    result = comparisons[identity]
                    difference_ids = [item.difference_id for item in result.annotation.differences]
                    citations.append(dict(type='object', additionalProperties=False,
                        properties=dict(result_id=dict(type='string',enum=[result.result_id]),
                            evidence_id=dict(type='string',enum=[identity]),
                            difference_id=dict(anyOf=([dict(type='string',enum=difference_ids)] if difference_ids else []) + [dict(type='null')])),
                        required=['result_id','evidence_id']))
                references.append(dict(type='object',additionalProperties=False,
                    properties=dict(candidate_id=dict(type='string',enum=[member.image.sample.sample_id]),
                        comparison=dict(anyOf=citations)), required=['candidate_id']))
            definitions['GroupAnalysisReference'] = dict(anyOf=references)
            return schema

        @model_validator(mode='after')
        def frozen_output(result):
            try:
                self.validate(result, group, allowed_ids, expected_verdict=expected_verdict, comparisons=comparisons)
            except ValueError as error:
                raise repairable_output_error('frozen_group_association', str(error)) from error
            return result

        return type(response_type.__name__, (response_type,), {
            'model_json_schema': classmethod(frozen_schema), 'frozen_output': frozen_output})

    @staticmethod
    def verdict(values):
        priority = {'EQUIVALENT': 0, 'UNCERTAIN': 1, 'MATERIAL': 2}
        return max(values, key=priority.__getitem__)

    def validate(self, result: GroupAnalysisSummary, group: FrozenAnalysisGroup, allowed_ids: set[str] | None = None, *,
                 expected_verdict: ModelAssessmentVerdict | None = None, comparisons: dict[str, ConsistencyResult] | None = None):
        members = {member.image.sample.sample_id: member for member in group.members}
        if expected_verdict is not None and result.overall.verdict != expected_verdict:
            raise ValueError('批次汇总结论与实际逐批结论不一致')
        if isinstance(result, GroupAnalysisDraft):
            if len(result.assessments) != len(members) or {item.candidate_id for item in result.assessments} != set(members):
                raise ValueError('Model assessments must cover every frozen candidate exactly once')
            for assessment in result.assessments:
                if members[assessment.candidate_id].comparison is None and assessment.verdict != 'UNCERTAIN':
                    raise ValueError('A candidate without direct evidence must remain uncertain')
            if result.overall.verdict != self.verdict(item.verdict for item in result.assessments):
                raise ValueError('整组结论不得否定已确认差异或遗漏证据不足的成员')
        for reference in [*result.overall.references, *[ref for conclusion in result.conclusions for ref in conclusion.references]]:
            member = members.get(reference.candidate_id)
            if member is None or allowed_ids is not None and reference.candidate_id not in allowed_ids:
                raise ValueError('Model reference points outside the frozen group or supplied batch conclusions')
            if citation := reference.comparison:
                allowed = {member.image.evidence_id, member.comparison.evidence_id if member.comparison else None}
                saved = (comparisons.get(citation.evidence_id) if comparisons is not None else self.repository.get(citation.evidence_id).result
                    ) if citation.evidence_id in allowed else None
                if saved is None or saved.result_id != citation.result_id or (citation.difference_id and
                    citation.difference_id not in {item.difference_id for item in saved.annotation.differences}):
                    raise ValueError('Model reference does not match this candidate and frozen comparison')
