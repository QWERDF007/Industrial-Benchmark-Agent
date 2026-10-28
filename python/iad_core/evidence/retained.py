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
        """Reuse published array-comparison facts only for unchanged source bytes."""
        if published is not None and source.sha256!=published.image_sha256:
            raise ConsistencyError('SOURCE_UNAVAILABLE','Image source changed after the published pixel comparison')
        group=published.content_group_id if published is not None else None
        with self.lock:
            content=self.decoded.get(group) if group else None
            if content is not None:
                fields=('compare_profile','width','height','channel_semantics','dtype','bit_depth','pixel_key')
                if any(getattr(content.descriptor,name)!=getattr(published.descriptor,name) for name in fields):
                    raise ConsistencyError('SOURCE_UNAVAILABLE','Published group pixel representations disagree')
                blob=self.blobs[group]
                self.path(blob)
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
        try:return self.files.path(blob.sha256,blob.byte_count)
        except (OSError,ValueError) as error:
            raise ConsistencyError('SOURCE_UNAVAILABLE','Retained original or mask is unavailable; historical proof cannot be restored') from error

    def store(self, payload: bytes) -> EvidenceBlob:
        _,sha=self.files.store(payload)
        return EvidenceBlob(sha256=sha,byte_count=len(payload))

    def pixels(self, content: PixelContent) -> EvidenceBlob:
        if content.descriptor.decode_status!='COMPLETE':raise ConsistencyError('UNSUPPORTED_IMAGE',content.descriptor.reason)
        with self.db.connection() as connection:
            rows=connection.execute('SELECT sha256,byte_count FROM consistency_pixel_evidence WHERE pixel_key=?',(content.descriptor.pixel_key,)).fetchall()
        for row in rows:
            blob=EvidenceBlob(**dict(row))
            if content.compare(PixelContent.read(self.path(blob))).exact_equal:return blob
        blob=self.store(content.png())
        with self.db.connection() as connection:
            connection.execute('INSERT OR IGNORE INTO consistency_pixel_evidence VALUES(?,?,?)',
                (content.descriptor.pixel_key,blob.sha256,blob.byte_count))
        return blob
