from dataclasses import dataclass,field
from pathlib import Path
from sqlite3 import Connection

from iad_core.consistency.annotations import AnnotationSet
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.evidence_models import FrozenEvidenceSource,SourceState
from iad_core.consistency.retrieval_sources import SourceImage
from iad_core.duplicate.index import PixelIndex,PixelIndexEntry
from iad_core.evidence.masks import MaskImages
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
    _observed: bool = field(default=False,init=False)
    _sha256: str | None = field(default=None,init=False)
    _state: SourceState = field(default='UNKNOWN',init=False)

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
        if not Path(self.sample.image_path).is_file():return 'MISSING'
        if frozen.scan_ref is not None and (self.published is None or self.published.scan_ref!=frozen.scan_ref):return 'CHANGED'
        if self.sample!=frozen.sample or self.annotations!=frozen.annotations or (include_review and self.review!=frozen.review):return 'CHANGED'
        if not self._observed:
            self._observed=True
            try:
                if self.annotations:
                    for annotation in self.annotations.annotations:
                        if annotation.annotation_type=='mask' and annotation.geometry_status!='INVALID':MaskImages.load(annotation,self.sample)
                self._sha256=SourceImage.read(self.sample.image_path).sha256
                self._state='CURRENT'
            except ConsistencyError:self._state='UNKNOWN'
            except (OSError,ValueError):self._state='CHANGED'
        return ('CURRENT' if self._sha256==frozen.source_sha256 else 'CHANGED') if self._state=='CURRENT' else self._state
