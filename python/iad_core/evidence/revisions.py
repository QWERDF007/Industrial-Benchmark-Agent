import hashlib
import json
import os
from pathlib import Path

from pydantic import BaseModel, ConfigDict

from iad_core.storage.models import Annotation, Sample


class FileRevision(BaseModel):
    model_config = ConfigDict(frozen=True, extra='forbid')

    device: int
    inode: int
    size: int
    mtime_ns: int
    ctime_ns: int

    @classmethod
    def read(cls, path: str | Path) -> 'FileRevision':
        stat = os.stat(path)
        return cls(device=stat.st_dev, inode=stat.st_ino, size=stat.st_size,
                   mtime_ns=stat.st_mtime_ns, ctime_ns=stat.st_ctime_ns)


class SourceRevision(BaseModel):
    model_config = ConfigDict(frozen=True, extra='forbid')

    image: FileRevision
    sample: Sample
    annotations_sha256: str

    @property
    def fingerprint(self) -> str:
        return hashlib.sha256(self.model_dump_json().encode()).hexdigest()

    @classmethod
    def describe(cls, sample: Sample, annotations: list[Annotation], image: FileRevision) -> 'SourceRevision':
        digest = hashlib.sha256(json.dumps(
            [annotation.model_dump(mode='json') for annotation in annotations], sort_keys=True).encode()).hexdigest()
        return cls(image=image, sample=sample, annotations_sha256=digest)
