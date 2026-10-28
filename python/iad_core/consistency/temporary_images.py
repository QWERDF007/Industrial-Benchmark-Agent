import hashlib
import io
import secrets
import threading
import time
from collections import OrderedDict
from dataclasses import dataclass, field
from _thread import LockType

import numpy as np
from PIL import Image
from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.models import Count, Identifier
from iad_core.consistency.retrieval_sources import SourceImage


class TemporaryImageLimits(AnalysisModel):
    max_source_bytes: int = Field(default=SourceImage.MAX_SOURCE_BYTES, gt=0)
    max_bytes: int = Field(default=256 * 1024 * 1024, gt=0)
    max_images: int = Field(default=128, gt=0)
    max_vector_bytes: int = Field(default=8 * 1024 * 1024, gt=0)
    ttl_seconds: float = Field(default=1800, gt=0, allow_inf_nan=False)


class TemporaryImageRef(AnalysisModel):
    image_ref: Identifier
    sha256: Identifier
    source_bytes: Count
    expires_in_seconds: float


class TemporaryImageStats(AnalysisModel):
    image_count: Count
    source_bytes: Count
    vector_bytes: Count


@dataclass(frozen=True)
class AcceptedImage:
    owner_id: str
    source: SourceImage
    deadline: float
    source_ref: str | None = None
    lock: LockType = field(default_factory=threading.Lock, compare=False)


class TemporaryImages:
    """Runtime-owned accepted bytes; callers cannot resolve arbitrary paths."""

    def __init__(self, limits: TemporaryImageLimits | None = None):
        self.limits = limits or TemporaryImageLimits()
        self._images: dict[str, AcceptedImage] = {}
        self._vectors: OrderedDict[tuple[str, str], bytes] = OrderedDict()
        self._lock = threading.RLock()
        self._closed = False

    def accept(self, payload: bytes, *, owner_id: str, source_ref: str | None = None) -> TemporaryImageRef:
        if not isinstance(payload, bytes) or not payload or not owner_id.strip():
            raise ConsistencyError('INVALID_SCOPE', 'Accepted image bytes and an owner are required')
        if len(payload) > self.limits.max_source_bytes:
            raise ConsistencyError('RESOURCE_LIMIT', 'Temporary image exceeds the source-byte budget')
        try:
            with Image.open(io.BytesIO(payload)) as image:
                if image.width * image.height * max(4, len(image.getbands())) > SourceImage.MAX_DECODED_BYTES:
                    raise ConsistencyError('RESOURCE_LIMIT', 'Temporary image exceeds the decoded-byte budget')
                if getattr(image, 'n_frames', 1) != 1:
                    raise ValueError('Multi-frame images are unsupported')
                image.verify()
            with Image.open(io.BytesIO(payload)) as image:
                image.load()
        except (OSError, ValueError, Image.DecompressionBombError) as error:
            if isinstance(error, ConsistencyError):
                raise
            raise ConsistencyError('UNSUPPORTED_IMAGE', str(error)) from error
        with self._lock:
            if self._closed:
                raise RuntimeError('Temporary image store is closed')
            self.purge()
            digest = hashlib.sha256(payload).hexdigest()
            if source_ref is not None:
                for reference, image in self._images.items():
                    if (image.owner_id, image.source_ref) == (owner_id, source_ref):
                        if image.source.sha256 != digest:
                            raise ConsistencyError('SOURCE_UNAVAILABLE', 'Accepted host attachment changed')
                        return TemporaryImageRef(image_ref=reference, sha256=digest, source_bytes=len(payload),
                            expires_in_seconds=image.deadline - time.monotonic())
            if len(self._images) >= self.limits.max_images or self.stats().source_bytes + len(payload) > self.limits.max_bytes:
                raise ConsistencyError('RESOURCE_LIMIT', 'Temporary image store is full; release images before uploading more')
            reference = 'image_' + secrets.token_urlsafe(24)
            source = SourceImage(payload, digest)
            self._images[reference] = AcceptedImage(owner_id, source, time.monotonic() + self.limits.ttl_seconds, source_ref)
            return TemporaryImageRef(image_ref=reference, sha256=source.sha256,
                source_bytes=len(payload), expires_in_seconds=self.limits.ttl_seconds)

    def read(self, image_ref: str, *, owner_id: str | None) -> SourceImage:
        with self._lock:
            self.purge()
            image = self._images.get(image_ref)
            if image is None or image.owner_id != owner_id:
                raise ConsistencyError('REFERENCE_NOT_FOUND', 'Managed image reference is missing or expired')
            return image.source

    def release(self, image_ref: str, *, owner_id: str):
        with self._lock:
            self.read(image_ref, owner_id=owner_id)
            self._remove(image_ref)

    def vector(self, image_ref: str, *, owner_id: str, profile_id: str, encode) -> np.ndarray:
        with self._lock:
            self.read(image_ref, owner_id=owner_id)
            image = self._images[image_ref]
        key = (image_ref, profile_id)
        with image.lock:
            with self._lock:
                source = self.read(image_ref, owner_id=owner_id)
                if key in self._vectors:
                    self._vectors.move_to_end(key)
                    return np.frombuffer(self._vectors[key], dtype=np.float32).reshape(1, -1)
            vector = np.ascontiguousarray(encode(source), dtype=np.float32).tobytes()
            with self._lock:
                self.read(image_ref, owner_id=owner_id)
                if len(vector) > self.limits.max_vector_bytes:
                    raise ConsistencyError('RESOURCE_LIMIT', 'Temporary vector exceeds the cache budget')
                while sum(map(len, self._vectors.values())) + len(vector) > self.limits.max_vector_bytes:
                    self._vectors.popitem(last=False)
                self._vectors[key] = vector
                return np.frombuffer(vector, dtype=np.float32).reshape(1, -1)

    def _remove(self, image_ref: str):
        del self._images[image_ref]
        for key in [key for key in self._vectors if key[0] == image_ref]:
            del self._vectors[key]

    def release_owner(self, owner_id: str):
        with self._lock:
            for reference in [key for key, image in self._images.items() if image.owner_id == owner_id]:
                self._remove(reference)

    def purge(self):
        with self._lock:
            now = time.monotonic()
            for reference in [key for key, image in self._images.items() if image.deadline <= now]:
                self._remove(reference)

    def stats(self) -> TemporaryImageStats:
        with self._lock:
            self.purge()
            return TemporaryImageStats(image_count=len(self._images), source_bytes=sum(len(image.source.payload) for image in self._images.values()),
                vector_bytes=sum(map(len, self._vectors.values())))

    def close(self):
        with self._lock:
            self._closed = True
            self._images.clear()
            self._vectors.clear()
