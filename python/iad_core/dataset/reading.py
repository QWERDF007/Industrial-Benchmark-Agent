from collections import deque
from collections.abc import Callable, Iterable, Iterator
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from itertools import islice
from typing import TypeVar

from PIL import Image

from iad_core.dataset.adapters.base import AnnotationDocument, DatasetAdapter, RawImage, RawQuality
from iad_core.evidence.revisions import FileRevision
from iad_core.storage.models import DataOrigin

T = TypeVar('T')
R = TypeVar('R')


@dataclass
class ReadImage:
    source: RawImage
    revision: FileRevision | None = None
    width: int | None = None
    height: int | None = None
    document: AnnotationDocument | None = None
    quality: RawQuality | None = None
    origin: DataOrigin | None = None
    metadata: dict[str, str] = field(default_factory=dict)
    image_error: str | None = None
    annotation_error: str | None = None


class DatasetReading:
    """Read bounded batches of headers and annotation files, leaving all database writes to the caller."""

    WORKERS = 8

    def __init__(self, adapter: DatasetAdapter, batch_size: int):
        if batch_size < 1:
            raise ValueError('Image read batch size must be positive')
        self.adapter, self.batch_size = adapter, batch_size

    def scan(self) -> Iterator[ReadImage]:
        images = iter(self.adapter.scan_images())
        Image.init()
        with ThreadPoolExecutor(max_workers=self.WORKERS, thread_name_prefix='iad-import') as executor:
            while chunk := list(islice(images, self.batch_size)):
                headers = list(self.map(executor, self.header, chunk))
                yield from self.map(executor, self.annotations, headers)

    @classmethod
    def map(cls, executor: ThreadPoolExecutor, read: Callable[[T], R], inputs: Iterable[T]) -> Iterator[R]:
        inputs = iter(inputs)
        pending = deque(executor.submit(read, item) for item in islice(inputs, cls.WORKERS))
        try:
            while pending:
                yield pending.popleft().result()
                if (next_item := next(inputs, None)) is not None:
                    pending.append(executor.submit(read, next_item))
        finally:
            for future in pending:
                future.cancel()

    @staticmethod
    def header(source: RawImage) -> ReadImage:
        result = ReadImage(source)
        try:
            result.revision = FileRevision.read(source.image_path)
            with Image.open(source.image_path) as image:
                result.width, result.height = image.size
        except (OSError, ValueError, Image.DecompressionBombError) as error:
            result.image_error = str(error)
        return result

    def annotations(self, result: ReadImage) -> ReadImage:
        if result.image_error:
            return result
        result.quality = self.adapter.load_quality(result.source)
        result.origin = self.adapter.load_origin(result.source)
        result.metadata = self.adapter.load_metadata(result.source)
        try:
            result.document = self.adapter.load_annotations(result.source, result.width, result.height)
        except Exception as error:
            result.annotation_error = str(error)
        return result
