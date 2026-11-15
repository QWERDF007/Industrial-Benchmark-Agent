import json
import uuid
from collections.abc import Iterable
from collections import OrderedDict
from contextlib import nullcontext
from datetime import datetime, timezone
from pathlib import Path
from sqlite3 import Connection
from typing import Callable, Optional

from PIL import Image
from pydantic import AwareDatetime, Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.models import Count, CoverageCount, Identifier, PixelDescriptor
from iad_core.consistency.errors import ConsistencyError
from iad_core.duplicate.pixels import PixelContent
from iad_core.storage.database import Database
from iad_core.evidence.revisions import FileRevision


class PixelIndexEntry(AnalysisModel):
    sample_id: Identifier
    scan_ref: Identifier
    image_sha256: Optional[str]
    content_group_id: Optional[Identifier]
    descriptor: PixelDescriptor
    file_size: Optional[Count]
    mtime_ns: Optional[Count]
    indexed_at: AwareDatetime
    file_revision_json: Optional[str] = None


class PixelMembers(AnalysisModel):
    items: list[PixelIndexEntry]
    total: Count
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=200)


class PixelScanSummary(AnalysisModel):
    scan_ref: Identifier
    coverage: CoverageCount
    reused_samples: Count
    decoded_images: Count
    compared_pairs: Count
    cache_peak_bytes: Count


class DecodedPixels:
    def __init__(self, byte_budget: int):
        if byte_budget < 0:
            raise ValueError('Pixel cache budget must be non-negative')
        self.byte_budget = byte_budget
        self.bytes = self.peak_bytes = 0
        self.items: OrderedDict[str, PixelContent] = OrderedDict()

    def get(self, group_id: str) -> Optional[PixelContent]:
        content = self.items.get(group_id)
        if content is not None:
            self.items.move_to_end(group_id)
        return content

    def put(self, group_id: str, content: PixelContent) -> None:
        if group_id in self.items:
            self.bytes -= self.items.pop(group_id).decoded_bytes
        if content.decoded_bytes > self.byte_budget:
            return
        while self.items and self.bytes + content.decoded_bytes > self.byte_budget:
            self.bytes -= self.items.popitem(last=False)[1].decoded_bytes
        self.items[group_id] = content
        self.bytes += content.decoded_bytes
        self.peak_bytes = max(self.peak_bytes, self.bytes)


class PixelIndex:
    def __init__(self, db: Database):
        self.db = db

    def prepare(self, sample_ids: Iterable[str], *, checkpoint: Callable[[], None] | None = None,
                record: Callable[[list[str], ConsistencyError | None], None] | None = None,
                memory_bytes: int = 512 * 1024 * 1024) -> PixelScanSummary:
        from iad_core.duplicate.preparation import PixelPreparation
        return PixelPreparation(self.db).prepare(list(sample_ids), checkpoint=checkpoint,
            record=record, memory_bytes=memory_bytes)

    def assert_indexed(self, sample_ids: Iterable[str]) -> None:
        with self.db.connection() as connection:
            missing = connection.execute('''SELECT COUNT(*) FROM json_each(?) requested
                LEFT JOIN samples s ON s.sample_id=requested.value
                LEFT JOIN sample_pixel_index pixels ON pixels.sample_id=requested.value
                WHERE pixels.sample_id IS NULL OR pixels.compare_profile<>?
                    OR pixels.file_revision_json IS NULL
                    OR (s.source_file_json IS NOT NULL AND pixels.file_revision_json<>s.source_file_json)''',
                (json.dumps(sorted(set(sample_ids))), PixelContent.COMPARE_PROFILE)).fetchone()[0]
        if missing:
            raise ConsistencyError('INDEX_NOT_READY', f'原始像素索引未就绪：{missing} 张图片尚未准备。请先完成检查准备。')

    def get(self, sample_id: str, connection: Optional[Connection] = None) -> Optional[PixelIndexEntry]:
        with nullcontext(connection) if connection is not None else self.db.connection() as connection:
            row = connection.execute('SELECT * FROM sample_pixel_index WHERE sample_id=?', (sample_id,)).fetchone()
        return self.entry(row) if row is not None else None

    def members(self, group_id: str, *, page: int = 1, page_size: int = 100) -> PixelMembers:
        if isinstance(page, bool) or not isinstance(page, int) or page < 1:
            raise ValueError('Page must be a positive integer')
        if isinstance(page_size, bool) or not isinstance(page_size, int) or not 1 <= page_size <= 200:
            raise ValueError('Page size must be between 1 and 200')
        with self.db.connection() as connection:
            connection.execute('BEGIN')
            if connection.execute('SELECT 1 FROM image_content_groups WHERE group_id=?', (group_id,)).fetchone() is None:
                raise LookupError('Content group not found')
            total = connection.execute('SELECT count(*) FROM sample_pixel_index WHERE content_group_id=?', (group_id,)).fetchone()[0]
            rows = connection.execute('''SELECT * FROM sample_pixel_index WHERE content_group_id=?
                ORDER BY sample_id LIMIT ? OFFSET ?''', (group_id, page_size, (page - 1) * page_size)).fetchall()
        return PixelMembers(items=[self.entry(row) for row in rows], total=total, page=page, page_size=page_size)

    @staticmethod
    def entry(row) -> PixelIndexEntry:
        return PixelIndexEntry(**{key: row[key] for key in PixelIndexEntry.model_fields if key != 'descriptor'},
            descriptor=PixelDescriptor.model_validate_json(row['descriptor_json']))

    @staticmethod
    def collect_unused_groups(connection: Connection) -> None:
        connection.execute('''DELETE FROM main.image_content_groups WHERE NOT EXISTS
            (SELECT 1 FROM main.sample_pixel_index WHERE content_group_id=image_content_groups.group_id)''')


class PixelScan:
    """Stage prepared pixels privately and publish their content groups atomically."""

    def __init__(self, connection: Connection, *, cache_bytes: int = 256 * 1024 * 1024, force: bool = False):
        self.connection = connection
        self.scan_ref = 'scan_' + uuid.uuid4().hex
        self.indexed_at = datetime.now(timezone.utc).isoformat()
        self.cache = DecodedPixels(cache_bytes)
        self.force = force
        self.reused_samples = self.decoded_images = self.compared_pairs = 0
        connection.execute('CREATE TEMP TABLE sample_pixel_index AS SELECT *,CAST(NULL AS TEXT) AS image_path FROM main.sample_pixel_index WHERE 0')
        connection.execute('CREATE UNIQUE INDEX temp.scan_pixel_sample ON sample_pixel_index(sample_id)')
        connection.execute('CREATE INDEX temp.scan_pixel_candidate ON sample_pixel_index(compare_profile,pixel_key,content_group_id)')
        connection.execute('CREATE INDEX temp.scan_pixel_group ON sample_pixel_index(content_group_id)')

    def stage(self, sample_id: str, image_path: str, image_sha256: Optional[str],
              image: Optional[Image.Image] = None, unavailable_reason: Optional[str] = None,
              descriptor: Optional[PixelDescriptor] = None, scan_ref: Optional[str] = None,
              file_revision: Optional[FileRevision] = None) -> None:
        conn = self.connection
        group_id = None
        old = conn.execute('SELECT * FROM main.sample_pixel_index WHERE sample_id=?', (sample_id,)).fetchone()
        if unavailable_reason is not None:
            descriptor = PixelDescriptor(decode_status='UNAVAILABLE', reason=unavailable_reason)
        elif (old is not None and image_sha256 and old['image_sha256'] == image_sha256 and not self.force
              and ((descriptor is None and old['compare_profile'] == PixelContent.COMPARE_PROFILE)
                   or (descriptor is not None and descriptor.decode_status == 'COMPLETE' and old['content_group_id'] is not None))):
            if descriptor is None:
                descriptor = PixelDescriptor.model_validate_json(old['descriptor_json'])
                self.reused_samples += 1
            else:
                self.decoded_images += 1
            group_id = old['content_group_id']
        else:
            content = None
            if descriptor is None:
                content = PixelContent.read(image if image is not None else image_path)
                descriptor = content.descriptor
            self.decoded_images += 1
            if descriptor.decode_status == 'COMPLETE':
                candidates = conn.execute('''SELECT content_group_id FROM temp.sample_pixel_index
                    WHERE compare_profile=? AND pixel_key=? AND content_group_id IS NOT NULL
                    UNION SELECT content_group_id FROM main.sample_pixel_index
                    WHERE compare_profile=? AND pixel_key=? AND content_group_id IS NOT NULL''',
                    (descriptor.compare_profile, descriptor.pixel_key) * 2).fetchall()
                for candidate in candidates:
                    if content is None:
                        content = PixelContent.read(image_path)
                        self.decoded_images += 1
                    representative = self.cache.get(candidate[0])
                    if representative is None:
                        members = conn.execute('''SELECT image_path,image_sha256 FROM temp.sample_pixel_index
                            WHERE content_group_id=? UNION ALL
                            SELECT s.image_path,p.image_sha256 FROM main.sample_pixel_index p
                            JOIN main.samples s ON s.sample_id=p.sample_id
                            WHERE p.content_group_id=? AND s.is_excluded=0 AND NOT EXISTS
                            (SELECT 1 FROM temp.sample_pixel_index t WHERE t.sample_id=p.sample_id)''',
                            (candidate[0], candidate[0]))
                        for member in members:
                            try:
                                payload = Path(member['image_path']).read_bytes()
                                representative = PixelContent.read_bytes(payload)
                                self.decoded_images += 1
                            except (OSError, ValueError):
                                continue
                            if representative.descriptor.decode_status == 'COMPLETE':
                                self.cache.put(candidate[0], representative)
                                break
                            representative = None
                    if representative is not None:
                        comparison = content.compare(representative)
                        self.compared_pairs += 1
                        if comparison.exact_equal:
                            group_id = candidate[0]
                            break
                if group_id is None:
                    group_id = 'content_' + uuid.uuid4().hex
                    if content is not None:
                        self.cache.put(group_id, content)
        try:
            file_revision = file_revision or FileRevision.read(image_path)
            file_size, mtime_ns = file_revision.size, file_revision.mtime_ns
        except OSError:
            file_size = mtime_ns = None
        conn.execute('''INSERT INTO temp.sample_pixel_index
            (sample_id,scan_ref,image_sha256,content_group_id,compare_profile,pixel_key,descriptor_json,
             file_size,mtime_ns,indexed_at,file_revision_json,image_path) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)''',
            (sample_id, scan_ref or self.scan_ref, image_sha256, group_id, descriptor.compare_profile,
             descriptor.pixel_key, descriptor.model_dump_json(), file_size, mtime_ns, self.indexed_at,
             file_revision.model_dump_json() if file_revision else None, image_path))

    def publish(self, dataset_id: str) -> PixelScanSummary:
        conn = self.connection
        conn.execute('''INSERT INTO image_content_groups(group_id,created_at)
            SELECT DISTINCT p.content_group_id,? FROM temp.sample_pixel_index p
            JOIN main.samples s ON s.sample_id=p.sample_id
            WHERE s.dataset_id=? AND s.is_excluded=0 AND p.content_group_id IS NOT NULL
            ON CONFLICT(group_id) DO NOTHING''', (self.indexed_at, dataset_id))
        columns = [row[1] for row in conn.execute('PRAGMA main.table_info(sample_pixel_index)')]
        fields = ','.join(columns)
        updates = ','.join(f'{name}=excluded.{name}' for name in columns if name != 'sample_id')
        conn.execute(f'''INSERT INTO main.sample_pixel_index({fields})
            SELECT {','.join('p.'+name for name in columns)} FROM temp.sample_pixel_index p
            JOIN main.samples s ON s.sample_id=p.sample_id WHERE s.dataset_id=? AND s.is_excluded=0
            ON CONFLICT(sample_id) DO UPDATE SET {updates}''', (dataset_id,))
        conn.execute('''DELETE FROM main.sample_pixel_index WHERE sample_id IN
            (SELECT sample_id FROM main.samples WHERE dataset_id=? AND is_excluded=1)''', (dataset_id,))
        PixelIndex.collect_unused_groups(conn)
        counts = dict(conn.execute('''SELECT json_extract(p.descriptor_json,'$.decode_status'),count(*)
            FROM temp.sample_pixel_index p JOIN main.samples s ON s.sample_id=p.sample_id
            WHERE s.dataset_id=? GROUP BY json_extract(p.descriptor_json,'$.decode_status')''', (dataset_id,)).fetchall())
        return PixelScanSummary(scan_ref=self.scan_ref, coverage=CoverageCount(total=sum(counts.values()),
            completed=counts.get('COMPLETE', 0), unsupported=counts.get('UNSUPPORTED', 0), failed=counts.get('UNAVAILABLE', 0)),
            reused_samples=self.reused_samples, decoded_images=self.decoded_images,
            compared_pairs=self.compared_pairs, cache_peak_bytes=self.cache.peak_bytes)
