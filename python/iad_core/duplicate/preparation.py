import hashlib
import json
import multiprocessing
import threading
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from filelock import FileLock, Timeout

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.models import CoverageCount, PixelDescriptor
from iad_core.duplicate.index import PixelScan, PixelScanSummary
from iad_core.duplicate.pixels import PixelContent
from iad_core.evidence.revisions import FileRevision
from iad_core.storage.database import Database


@dataclass(frozen=True)
class PreparedImage:
    sha256: str
    descriptor: PixelDescriptor


def prepare_image(path: str) -> PreparedImage:
    payload = Path(path).read_bytes()
    digest = hashlib.sha256(payload).hexdigest()
    descriptor = PixelContent.read_bytes(payload).descriptor
    return PreparedImage(digest, descriptor)


class PixelPreparation:
    MAX_WORKERS = 8
    _executor: ProcessPoolExecutor | None = None
    _executor_lock = threading.Lock()

    def __init__(self, db: Database):
        self.db = db

    @classmethod
    def executor(cls) -> ProcessPoolExecutor:
        with cls._executor_lock:
            if cls._executor is None:
                cls._executor = ProcessPoolExecutor(max_workers=cls.MAX_WORKERS,
                    mp_context=multiprocessing.get_context('spawn'))
            return cls._executor

    @classmethod
    def close(cls) -> None:
        with cls._executor_lock:
            if cls._executor is not None:
                cls._executor.shutdown(wait=True, cancel_futures=True)
                cls._executor = None

    def prepare(self, sample_ids: list[str], *, checkpoint: Callable[[], None] | None = None,
                record: Callable[[list[str], ConsistencyError | None], None] | None = None,
                memory_bytes: int = 512 * 1024 * 1024) -> PixelScanSummary:
        if memory_bytes < 1:
            raise ValueError('Pixel preparation requires a positive memory budget')
        checkpoint = checkpoint or (lambda: None)
        checkpoint()
        lock = FileLock(str(Path(self.db.db_path).resolve()) + '.pixels.lock')
        while True:
            checkpoint()
            try:
                lock.acquire(timeout=0.1)
                break
            except Timeout:
                continue
        sample_ids = sorted(set(sample_ids))
        try:
            counts = {'COMPLETE': 0, 'UNAVAILABLE': 0, 'UNSUPPORTED': 0}
            decoded = compared = reused = peak = 0
            with self.db.connection() as connection:
                rows = connection.execute('''SELECT s.*,d.scan_ref,p.file_revision_json,
                    p.image_sha256,p.descriptor_json FROM samples s JOIN datasets d ON d.dataset_id=s.dataset_id
                    LEFT JOIN sample_pixel_index p ON p.sample_id=s.sample_id
                    WHERE s.sample_id IN (SELECT value FROM json_each(?)) ORDER BY s.sample_id''',
                    (json.dumps(sample_ids),)).fetchall()
            if len(rows) != len(sample_ids) or any(row['is_excluded'] for row in rows):
                raise ConsistencyError('SOURCE_UNAVAILABLE', 'Prepared sources are missing or excluded')
            scan_ref = rows[0]['scan_ref'] if rows else 'empty'
            pending, cached = [], []
            for row in rows:
                checkpoint()
                if row['file_revision_json']:
                    descriptor = PixelDescriptor.model_validate_json(row['descriptor_json'])
                    if descriptor.compare_profile == PixelContent.COMPARE_PROFILE and descriptor.decode_status in ('COMPLETE', 'UNSUPPORTED'):
                        counts[descriptor.decode_status] += 1
                        reused += 1
                        if descriptor.decode_status == 'COMPLETE':
                            cached.append(row['sample_id'])
                        elif record:
                            record([row['sample_id']], ConsistencyError('UNSUPPORTED_IMAGE', descriptor.reason or 'Unsupported image'))
                        continue
                revision = FileRevision.read(row['image_path'])
                pending.append((row, revision))
            if cached and record:
                record(cached, None)
            offset = 0
            while offset < len(pending):
                checkpoint()
                chunk, reserved = [], 0
                while offset < len(pending) and len(chunk) < self.MAX_WORKERS:
                    row, revision = pending[offset]
                    budget = revision.size + row['width'] * row['height'] * 8
                    if chunk and reserved + budget > memory_bytes:
                        break
                    chunk.append((row, revision))
                    reserved += budget
                    offset += 1
                futures = [self.executor().submit(prepare_image, row['image_path']) for row, _ in chunk]
                try:
                    results = []
                    for future in futures:
                        checkpoint()
                        results.append(future.result())
                    checkpoint()
                    with self.db.connection(temporary=True) as connection:
                        scan = PixelScan(connection, cache_bytes=memory_bytes // 2)
                        for (row, revision), prepared in zip(chunk, results):
                            scan.stage(row['sample_id'], row['image_path'], prepared.sha256,
                                descriptor=prepared.descriptor, scan_ref=row['scan_ref'], file_revision=revision)
                        connection.commit()
                        connection.execute('BEGIN IMMEDIATE')
                        for dataset_id in {row['dataset_id'] for row, _ in chunk}:
                            scan.publish(dataset_id)
                        decoded += scan.decoded_images
                        compared += scan.compared_pairs
                        peak = max(peak, scan.cache.peak_bytes)
                    completed = []
                    for (row, _), prepared in zip(chunk, results):
                        counts[prepared.descriptor.decode_status] += 1
                        if prepared.descriptor.decode_status == 'COMPLETE':
                            completed.append(row['sample_id'])
                        elif record:
                            error = ConsistencyError(
                                'UNSUPPORTED_IMAGE' if prepared.descriptor.decode_status == 'UNSUPPORTED' else 'SOURCE_UNAVAILABLE',
                                prepared.descriptor.reason or 'Image cannot be decoded')
                            record([row['sample_id']], error)
                    if completed and record:
                        record(completed, None)
                except (OSError, ValueError) as error:
                    if isinstance(error, ConsistencyError):
                        raise
                    raise ConsistencyError('SOURCE_UNAVAILABLE', str(error)) from error
                finally:
                    for future in futures:
                        future.cancel()
            return PixelScanSummary(scan_ref=scan_ref, coverage=CoverageCount(total=len(rows),
                completed=counts['COMPLETE'], failed=counts['UNAVAILABLE'], unsupported=counts['UNSUPPORTED']),
                reused_samples=reused, decoded_images=decoded, compared_pairs=compared, cache_peak_bytes=peak)
        finally:
            lock.release()
