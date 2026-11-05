from dataclasses import replace
from typing import Iterable, Mapping, Sequence, TYPE_CHECKING

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

    def record(self, context: 'JobContext', fingerprint: str):
        context.update(model_reference_bindings={**context.payload.get('model_reference_bindings', {}),
            fingerprint: self.references})
