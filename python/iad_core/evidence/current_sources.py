from dataclasses import dataclass
from sqlite3 import Connection

from iad_core.consistency.annotations import AnnotationSet
from iad_core.consistency.evidence_models import FrozenEvidenceSource,SourceState
from iad_core.duplicate.index import PixelIndex,PixelIndexEntry
from iad_core.storage.database import Database
from iad_core.storage.models import ReviewDecisionRecord,Sample
from iad_core.storage.repositories import SampleRepository
from iad_core.storage.review_repository import ReviewRepository


@dataclass
class CurrentSource:
    sample: Sample | None
    annotations: AnnotationSet | None
    review: ReviewDecisionRecord | None
    published: PixelIndexEntry | None

    @classmethod
    def capture(cls,db: Database,sample_id: str,connection: Connection) -> 'CurrentSource':
        sample=SampleRepository(db).get(sample_id,connection=connection)
        return cls(sample,AnnotationSet.capture(db,sample_id,connection) if sample and not sample.is_excluded else None,
            ReviewRepository(db).get_decision(sample_id,connection=connection),PixelIndex(db).get(sample_id,connection=connection))

    @property
    def metadata_bytes(self) -> int:
        return sum(len(value.model_dump_json().encode()) for value in (self.sample,self.annotations,self.review,self.published) if value is not None)

    def state(self,frozen: FrozenEvidenceSource, *, include_review: bool = True) -> SourceState:
        if self.sample is None:return 'MISSING'
        if frozen.scan_ref is not None and (self.published is None or self.published.scan_ref!=frozen.scan_ref):return 'CHANGED'
        annotations=self.annotations.resolve_geometry() if self.annotations else None
        if (self.sample!=frozen.sample or annotations!=frozen.annotations.resolve_geometry()
                or (include_review and self.review!=frozen.review)):return 'CHANGED'
        return 'CURRENT'
