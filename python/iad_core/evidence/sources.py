import hashlib
import json
from typing import Optional

from iad_core.advisory.analysis import AnalysisModel
from iad_core.dataset.path_safety import validate_sample_image_path
from iad_core.evidence.images import file_sha256
from iad_core.evidence.masks import MaskImages
from iad_core.storage.database import Database
from iad_core.storage.repositories import AnnotationRepository, SampleRepository
from iad_core.storage.models import Sample, Annotation


class SampleContent(AnalysisModel):
    sample_id: str
    sha256: str
    annotations_sha256: str
    quality_status: Optional[str] = None
    quality_source: Optional[str] = None

    @property
    def fingerprint(self) -> str:
        return hashlib.sha256(self.model_dump_json().encode()).hexdigest()

    @classmethod
    def describe(cls, sample: Sample, annotations: list[Annotation], sha256: str) -> 'SampleContent':
        return cls(sample_id=sample.sample_id, sha256=sha256,
            annotations_sha256=hashlib.sha256(json.dumps(
                [a.model_dump(mode='json') for a in annotations], sort_keys=True).encode()).hexdigest(),
            quality_status=sample.quality_status, quality_source=sample.quality_source)

    @classmethod
    def capture(cls, db: Database, sample_id: str) -> "SampleContent":
        sample = SampleRepository(db).get(sample_id)
        if not sample:
            raise LookupError("Sample not found")
        if sample.is_excluded:
            raise ValueError('Sample is excluded from the current dataset scope')
        annotations = AnnotationRepository(db).list_by_sample(sample_id)
        for annotation in annotations:
            if annotation.annotation_type == 'mask' and annotation.geometry_status != 'INVALID':
                MaskImages.load(annotation, sample)
        validate_sample_image_path(sample, db.db_path)
        return cls.describe(sample, annotations, file_sha256(sample.image_path))
