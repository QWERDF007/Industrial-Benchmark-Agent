import hashlib
import json

from iad_core.advisory.analysis import AnalysisModel
from iad_core.dataset.path_safety import validate_sample_image_path
from iad_core.evidence.images import file_sha256
from iad_core.evidence.masks import MaskImages
from iad_core.storage.database import Database
from iad_core.storage.repositories import AnnotationRepository, SampleRepository


class SampleContent(AnalysisModel):
    sample_id: str
    sha256: str
    annotations_sha256: str

    @classmethod
    def capture(cls, db: Database, sample_id: str) -> "SampleContent":
        sample = SampleRepository(db).get(sample_id)
        if not sample:
            raise LookupError("Sample not found")
        annotations = AnnotationRepository(db).list_by_sample(sample_id)
        for annotation in annotations:
            if annotation.annotation_type == 'mask' and annotation.geometry_status != 'INVALID':
                MaskImages.load(annotation, sample)
        return cls(sample_id=sample_id, sha256=file_sha256(validate_sample_image_path(sample, db.db_path)),
            annotations_sha256=hashlib.sha256(json.dumps(
                [a.model_dump(mode='json') for a in annotations], sort_keys=True).encode()).hexdigest())
