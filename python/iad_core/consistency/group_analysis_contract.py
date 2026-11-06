from typing import Generic, Sequence, TypeVar

from pydantic import ValidationError, model_validator
from pydantic_core import InitErrorDetails, PydanticCustomError

from iad_core.advisory.conclusions import descriptive_conclusion
from iad_core.consistency.group_analysis_conclusions import assertive_conclusion
from iad_core.advisory.output_validation import repairable_output_error
from iad_core.consistency.group_analysis_models import GroupAnalysisDraft, GroupAnalysisSummary
from iad_core.consistency.group_models import FrozenAnalysisGroup
from iad_core.evidence.images import PreparedImage
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.model_references import ModelReferences

Response = TypeVar('Response', bound=GroupAnalysisSummary)


class GroupAnalysisContract(Generic[Response]):
    """A lossless, request-local vocabulary for frozen group references."""

    def __init__(self, response_type: type[Response], group: FrozenAnalysisGroup, images: Sequence[PreparedImage] = ()):
        schema = response_type.model_json_schema()
        comparison = schema['$defs']['GroupAnalysisComparison']['properties']
        differences = comparison['difference_id']['anyOf']
        vocabularies = dict(
            c=[group.anchor.sample.sample_id, *[member.image.sample.sample_id for member in group.members]],
            e=[group.anchor.evidence_id, *[member.image.evidence_id for member in group.members],
                *[member.comparison.evidence_id for member in group.members if member.comparison]],
            r=[*comparison['result_id']['enum']],
            d=[identity for option in differences for identity in option.get('enum', [])],
            v=[image.evidence.evidence_id for image in images])
        self.vocabulary = ModelReferences(vocabularies, images)
        self.references = self.vocabulary.references
        self.images = self.vocabulary.images

        def wire_schema(cls, **options):
            encoded = self.encode(response_type.model_json_schema(**options))
            pair = encoded['$defs'].get('GroupPairAssessment')
            if pair:
                field = pair['properties']['conclusion']
                pair['properties']['conclusion'] = next(option for option in field['anyOf'] if option.get('type') != 'null')
                pair['required'] = list(dict.fromkeys([*pair.get('required', []), 'conclusion']))
            order = ('assessments', 'conclusions', 'limitations', 'overall')
            encoded['properties'] = {key: encoded['properties'][key] for key in order if key in encoded['properties']}
            encoded['required'] = [key for key in order if key in encoded.get('required', [])]
            return encoded

        @model_validator(mode='before')
        def canonical_output(value):
            shape = GroupAnalysisDraft if issubclass(response_type, GroupAnalysisDraft) else GroupAnalysisSummary
            value = shape.model_validate(value).model_dump(mode='json')
            references = [*value.get('assessments', []), *value.get('overall', {}).get('references', []),
                *[ref for conclusion in value.get('conclusions', []) for ref in conclusion.get('references', [])]]
            for reference in references:
                for target, fields in ((reference, ('candidate_id',)),
                    (reference.get('comparison'), ('result_id', 'evidence_id', 'difference_id'))):
                    if not isinstance(target, dict):
                        continue
                    for field in fields:
                        if isinstance(identity := target.get(field), str):
                            if identity not in self.references:
                                raise repairable_output_error('frozen_group_reference',
                                    f'Unknown {field} reference; use the supplied frozen reference vocabulary')
                            target[field] = self.references[identity]
            return value

        self.response_type = type(response_type.__name__, (response_type,), {
            'model_json_schema': classmethod(wire_schema), 'canonical_output': canonical_output,
            'descriptive_output': model_validator(mode='after')(self.validate_descriptions)})

    @staticmethod
    def validate_descriptions(value: Response) -> Response:
        fields = [(('overall', 'text'), value.overall.text),
            *[(('conclusions', index, 'text'), item.text) for index, item in enumerate(value.conclusions)],
            *[(('limitations', index), text) for index, text in enumerate(value.limitations)]]
        if isinstance(value, GroupAnalysisDraft):
            for index, item in enumerate(value.assessments):
                fields.extend([(('assessments', index, 'conclusion'), item.conclusion),(('assessments', index, 'explanation'), item.explanation),
                    *[(('assessments', index, 'findings', finding), text) for finding, text in enumerate(item.findings)]])
        errors: list[InitErrorDetails] = []
        for location, text in fields:
            try:
                if text is None:
                    raise repairable_output_error('missing_consistency_conclusion', '每个候选必须由模型给出conclusion简短结论，分析写入explanation，不能仅提供内部verdict')
                is_conclusion = location == ('overall','text') or location[-1] == 'conclusion'
                (assertive_conclusion if is_conclusion else descriptive_conclusion)(text)
            except PydanticCustomError as error:
                errors.append(InitErrorDetails(type=error, loc=location, input=text))
        if errors:
            raise ValidationError.from_exception_data(type(value).__name__, errors)
        return value

    def encode(self, value):
        return self.vocabulary.encode(value)

    def record(self, context: JobContext, fingerprint: str):
        self.vocabulary.record(context, fingerprint)
