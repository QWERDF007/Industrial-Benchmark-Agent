from dataclasses import replace
from typing import Annotated, Any, Iterable, Mapping, Sequence, TYPE_CHECKING

from pydantic import BeforeValidator, WithJsonSchema

from iad_core.advisory.output_validation import repairable_output_error
from iad_core.evidence.images import PreparedImage

if TYPE_CHECKING:
    from iad_core.workbench.jobs import JobContext


class ModelReferences:
    """Request-local names for canonical references, including attached annotations."""

    def __init__(self, vocabularies: Mapping[str, Iterable[str]], images: Sequence[PreparedImage] = ()):
        self.references = {f'@{kind}{index}': identity for kind, identities in vocabularies.items()
            for index, identity in enumerate(dict.fromkeys(identities))}
        self.aliases = {identity: alias for alias, identity in self.references.items()}
        self.images = [replace(image, evidence=image.evidence.model_copy(update=self.encode(image.evidence.model_dump())),
            annotations=tuple(annotation.model_copy(update=self.encode(annotation.model_dump())) for annotation in image.annotations))
            for image in images]

    def encode(self, value):
        if isinstance(value, dict):
            return {self.aliases.get(key, key): self.encode(item) for key, item in value.items()}
        if isinstance(value, list):
            return [self.encode(item) for item in value]
        return self.aliases.get(value, value) if isinstance(value, str) else value

    def reference_type(self, field: str, identities: Iterable[str]) -> Any:
        identities = tuple(dict.fromkeys(identities))
        allowed = set(identities)

        def decode(alias: Any) -> str:
            identity = self.references.get(alias) if isinstance(alias, str) else None
            if identity not in allowed:
                raise repairable_output_error('frozen_model_reference',
                    f'{field}包含未允许的引用{alias!r}；只能引用当前Schema给出的短编号，不使用其他字段或其他批次的引用')
            return identity

        return Annotated[str, BeforeValidator(decode), WithJsonSchema({
            'type':'string', 'enum':[self.aliases[identity] for identity in identities]})]

    def record(self, context: 'JobContext', fingerprint: str):
        context.update(model_reference_bindings={**context.payload.get('model_reference_bindings', {}),
            fingerprint: self.references})
