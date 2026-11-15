import hashlib
from dataclasses import dataclass
from pathlib import Path
from typing import ClassVar

from iad_core.consistency.errors import ConsistencyError
from iad_core.duplicate.pixels import PixelContent


@dataclass(frozen=True)
class SourceImage:
    MAX_SOURCE_BYTES: ClassVar[int] = 128 * 1024 * 1024
    MAX_DECODED_BYTES: ClassVar[int] = 256 * 1024 * 1024
    payload: bytes
    sha256: str

    @classmethod
    def read(cls, path: str) -> 'SourceImage':
        try:
            with Path(path).open('rb') as source:
                payload = source.read(cls.MAX_SOURCE_BYTES + 1)
        except OSError as error:
            raise ConsistencyError('SOURCE_UNAVAILABLE', 'Image source is unavailable') from error
        if len(payload) > cls.MAX_SOURCE_BYTES:
            raise ConsistencyError('RESOURCE_LIMIT', 'Image source exceeds the byte budget')
        digest = hashlib.sha256(payload).hexdigest()
        return cls(payload, digest)

    def pixels(self) -> PixelContent:
        return PixelContent.read_bytes(self.payload, max_decoded_bytes=self.MAX_DECODED_BYTES)
