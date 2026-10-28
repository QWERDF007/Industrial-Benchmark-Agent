from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from typing import Callable

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.retrieval_sources import SourceImage
from iad_core.duplicate.index import PixelIndexEntry
from iad_core.duplicate.pixels import PixelContent


@dataclass(frozen=True)
class DecodeSource:
    path: str
    published: PixelIndexEntry


@dataclass(frozen=True)
class DecodeGroup:
    group_id: str
    sources: tuple[DecodeSource, ...]

    @property
    def reserved_bytes(self) -> int:
        return max(((source.published.descriptor.width or 0) * (source.published.descriptor.height or 0) * 8
            + (source.published.file_size if source.published.file_size is not None else SourceImage.MAX_SOURCE_BYTES)
            for source in self.sources), default=0)


@dataclass(frozen=True)
class DecodedImage:
    group_id: str
    source: DecodeSource
    image: SourceImage
    pixels: PixelContent
    failed_sample_ids: frozenset[str]


@dataclass(frozen=True)
class UnavailableImage:
    group_id: str
    error: ConsistencyError
    failed_sample_ids: frozenset[str]


class ImageDecoding:
    def __init__(self, workers: int, memory_bytes: int):
        if workers < 1 or memory_bytes < 1:
            raise ValueError('Image decoding requires positive worker and memory limits')
        self.memory_bytes = memory_bytes
        self.peak_reserved_bytes = 0
        self.executor = ThreadPoolExecutor(max_workers=workers, thread_name_prefix='iad-image-decode')

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.executor.shutdown(wait=True, cancel_futures=True)

    def partition(self, groups: list[DecodeGroup], batch_size: int) -> list[list[DecodeGroup]]:
        if batch_size < 1:
            raise ValueError('Image batches require a positive size')
        batches, batch, reserved = [], [], 0
        for group in groups:
            if group.reserved_bytes > self.memory_bytes:
                if batch:
                    batches.append(batch)
                    batch, reserved = [], 0
                batches.append([group])
                continue
            if batch and (len(batch) == batch_size or reserved + group.reserved_bytes > self.memory_bytes):
                batches.append(batch)
                batch, reserved = [], 0
            batch.append(group)
            reserved += group.reserved_bytes
        if batch:
            batches.append(batch)
        return batches

    def load(self, groups: list[DecodeGroup], checkpoint: Callable[[], None] | None = None) -> list[DecodedImage | UnavailableImage]:
        if checkpoint:
            checkpoint()
        reserved = sum(group.reserved_bytes for group in groups)
        if reserved > self.memory_bytes:
            if len(groups) == 1:
                return [UnavailableImage(groups[0].group_id,
                    ConsistencyError('RESOURCE_LIMIT', 'Original exceeds the configured decoded-image memory budget'), frozenset())]
            raise ConsistencyError('RESOURCE_LIMIT', 'Image batch exceeds the decoded-image memory budget')
        self.peak_reserved_bytes = max(self.peak_reserved_bytes, reserved)
        if checkpoint:
            checkpoint()
        futures = [self.executor.submit(self.decode, group, checkpoint) for group in groups]
        try:
            return [future.result() for future in futures]
        except BaseException:
            for future in futures:
                future.cancel()
            raise

    @staticmethod
    def decode(group: DecodeGroup, checkpoint: Callable[[], None] | None = None) -> DecodedImage | UnavailableImage:
        failed = set()
        failure = ConsistencyError('SOURCE_UNAVAILABLE', 'No current source is available for this content group')
        for source in group.sources:
            if checkpoint:
                checkpoint()
            try:
                image = SourceImage.read(source.path, source.published)
                if checkpoint:
                    checkpoint()
                pixels = image.pixels()
                if checkpoint:
                    checkpoint()
                if pixels.descriptor.decode_status != 'COMPLETE':
                    reason = pixels.descriptor.reason or 'Original image cannot be decoded'
                    code = 'RESOURCE_LIMIT' if reason.startswith('RESOURCE_LIMIT:') else 'UNSUPPORTED_IMAGE' if pixels.descriptor.decode_status == 'UNSUPPORTED' else 'SOURCE_UNAVAILABLE'
                    raise ConsistencyError(code, reason)
                return DecodedImage(group.group_id, source, image, pixels, frozenset(failed))
            except ConsistencyError as error:
                if error.code == 'SOURCE_UNAVAILABLE':
                    failed.add(source.published.sample_id)
                failure = error
        return UnavailableImage(group.group_id, failure, frozenset(failed))
