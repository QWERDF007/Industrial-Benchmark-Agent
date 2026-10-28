import json
from contextlib import nullcontext
from sqlite3 import Connection

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.retrieval_sources import SourceImage
from iad_core.duplicate.index import PixelIndex
from iad_core.storage.database import Database


class StrictContentGroup(AnalysisModel):
    group_id: str
    sample_ids: list[str]


class ContentRelations:
    def __init__(self, db: Database):
        self.db = db

    def groups(self, sample_ids: list[str], connection: Connection | None = None) -> list[StrictContentGroup]:
        groups: dict[str, list[str]] = {}
        with nullcontext(connection) if connection is not None else self.db.connection() as conn:
            if not conn.in_transaction:
                conn.execute('BEGIN')
            rows = conn.execute('''SELECT p.*,s.image_path,d.scan_ref AS dataset_scan_ref
                FROM sample_pixel_index p JOIN samples s ON s.sample_id=p.sample_id
                JOIN datasets d ON d.dataset_id=s.dataset_id WHERE s.is_excluded=0
                AND p.content_group_id IN (SELECT content_group_id FROM sample_pixel_index
                    WHERE sample_id IN (SELECT value FROM json_each(?)))
                ORDER BY p.content_group_id,p.sample_id''', (json.dumps(sample_ids),)).fetchall()
            for row in rows:
                if row['scan_ref'] != row['dataset_scan_ref']:
                    raise ConsistencyError('SOURCE_UNAVAILABLE', 'Published content scan is no longer current')
                entry = PixelIndex.entry(row)
                SourceImage.read(row['image_path'], entry)
                groups.setdefault(entry.content_group_id, []).append(entry.sample_id)
        return [StrictContentGroup(group_id=identity, sample_ids=members) for identity, members in groups.items()]
