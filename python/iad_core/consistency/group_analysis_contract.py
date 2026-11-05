from dataclasses import replace
from typing import Generic, Sequence, TypeVar

from pydantic import model_validator

from iad_core.advisory.output_validation import repairable_output_error
from iad_core.consistency.group_analysis_models import GroupAnalysisDraft, GroupAnalysisSummary
from iad_core.consistency.group_models import FrozenAnalysisGroup
from iad_core.evidence.images import PreparedImage
from iad_core.workbench.jobs import JobContext

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
        self.references = {f'@{kind}{index}': identity for kind, identities in vocabularies.items()
            for index, identity in enumerate(dict.fromkeys(identities))}
        self.aliases = {identity: alias for alias, identity in self.references.items()}
        self.images = [replace(image, evidence=image.evidence.model_copy(
            update={'evidence_id': self.aliases[image.evidence.evidence_id]})) for image in images]

        def wire_schema(cls, **options):
            encoded = self.encode(response_type.model_json_schema(**options))
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
            'model_json_schema': classmethod(wire_schema), 'canonical_output': canonical_output})

    def encode(self, value):
        if isinstance(value, dict):
            return {self.aliases.get(key, key): self.encode(item) for key, item in value.items()}
        if isinstance(value, list):
            return [self.encode(item) for item in value]
        return self.aliases.get(value, value) if isinstance(value, str) else value

    def record(self, context: JobContext, fingerprint: str):
        context.update(model_reference_bindings={**context.payload.get('model_reference_bindings', {}),
            fingerprint: self.references})
