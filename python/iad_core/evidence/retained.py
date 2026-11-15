from pathlib import Path
import threading

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.evidence_models import EvidenceBlob
from iad_core.duplicate.pixels import PixelContent
from iad_core.duplicate.index import DecodedPixels,PixelIndexEntry
from iad_core.consistency.retrieval_sources import SourceImage
from iad_core.evidence.files import ImageFiles
from iad_core.storage.database import Database


class RetainedImages:
    def __init__(self, db: Database):
        self.db=db
        self.files=ImageFiles(Path(db.db_path).resolve().parent/'evidence'/'consistency'/'images')
        self.decoded=DecodedPixels(256*1024*1024)
        self.blobs: dict[str,EvidenceBlob]={}
        self.lock=threading.RLock()

    def capture(self,source: SourceImage,published: PixelIndexEntry | None) -> tuple[EvidenceBlob,PixelContent]:
        """Reuse decoded pixels by their published content group."""
        group=published.content_group_id if published is not None else None
        with self.lock:
            content=self.decoded.get(group) if group else None
            if content is not None:
                blob=self.blobs[group]
                return blob,content.with_annotation_coordinates(published.descriptor.annotation_coordinates)
            content=source.pixels()
            blob=self.pixels(content)
            if group:
                self.decoded.put(group,content)
                self.blobs[group]=blob
                self.blobs={identity:value for identity,value in self.blobs.items() if identity in self.decoded.items}
            return blob,content

    def close(self):
        with self.lock:
            self.decoded=DecodedPixels(self.decoded.byte_budget)
            self.blobs.clear()

    def path(self, blob: EvidenceBlob) -> str:
        return self.files.path(blob.sha256)

    def store(self, payload: bytes) -> EvidenceBlob:
        _,sha=self.files.store(payload)
        return EvidenceBlob(sha256=sha,byte_count=len(payload))

    def pixels(self, content: PixelContent) -> EvidenceBlob:
        if content.descriptor.decode_status!='COMPLETE':raise ConsistencyError('UNSUPPORTED_IMAGE',content.descriptor.reason)
        with self.db.connection() as connection:
            rows=connection.execute('SELECT sha256,byte_count FROM consistency_pixel_evidence WHERE pixel_key=?',(content.descriptor.pixel_key,)).fetchall()
        for row in rows:
            blob=EvidenceBlob(**dict(row))
            path=self.files.find(blob.sha256)
            if path is None:
                with self.db.connection() as connection:
                    connection.execute('DELETE FROM consistency_pixel_evidence WHERE pixel_key=? AND sha256=? AND byte_count=?',
                        (content.descriptor.pixel_key,blob.sha256,blob.byte_count))
                continue
            if content.compare(PixelContent.read(path)).exact_equal:return blob
        blob=self.store(content.png())
        with self.db.connection() as connection:
            connection.execute('INSERT OR IGNORE INTO consistency_pixel_evidence VALUES(?,?,?)',
                (content.descriptor.pixel_key,blob.sha256,blob.byte_count))
        return blob
