import hashlib
import json
from typing import List, Optional

from iad_core.dataset.path_safety import validate_sample_image_path
from iad_core.dataset.registry import DatasetRegistry
from iad_core.evidence.images import file_sha256
from iad_core.evidence.masks import MaskImages
from iad_core.knowledge.models import KnowledgeKind, KnowledgeSnapshot, KnowledgeSource
from iad_core.storage.database import Database
from iad_core.storage.repositories import AnnotationRepository, ReviewRepository, SampleRepository


class KnowledgeSources:
    def __init__(self, db: Database):
        self.db = db
        self.registry = DatasetRegistry(db)
        self.samples, self.annotations, self.reviews = SampleRepository(db), AnnotationRepository(db), ReviewRepository(db)

    def eligible(self, dataset_id: str, kind: KnowledgeKind, normal: Optional[KnowledgeSnapshot] = None) -> dict:
        if kind == 'normal':
            eligible = self.registry.references(dataset_id, limit=None, use_selection=False)
            with self.db.connection() as conn:
                selected = json.loads(conn.execute('SELECT reference_sample_ids_json FROM datasets WHERE dataset_id=?',
                                                  (dataset_id,)).fetchone()[0])
        else:
            with self.db.connection() as conn:
                eligible = [row[0] for row in conn.execute("""SELECT s.sample_id FROM samples s WHERE dataset_id=?
                    AND NOT EXISTS(SELECT 1 FROM import_issues i WHERE i.sample_id=s.sample_id
                                   AND i.severity IN ('ERROR','WARNING')) ORDER BY s.relative_path,s.sample_id""", (dataset_id,))]
            selected = []
        suspects = {finding.sample_id for finding in normal.findings if finding.judgment.status != 'refuted'} if normal else set()
        qualifications = {}
        for sample_id in eligible:
            sample = self.samples.get(sample_id)
            decision = self.reviews.get_decision(sample_id)
            if kind == 'normal':
                qualifications[sample_id] = ('human_pass' if decision and decision.decision == 'PASS' else
                    'human_hard_normal' if decision and decision.decision == 'HARD_NORMAL' else
                    'manual_selection' if sample_id in selected else 'raw_pass' if sample.quality_status == 'PASS' else
                    'initial_unannotated')
            elif decision and decision.decision == 'FAIL':
                qualifications[sample_id] = 'human_fail'
            elif any(annotation.bbox and annotation.geometry_status != 'INVALID'
                     for annotation in self.annotations.list_by_sample(sample_id)):
                qualifications[sample_id] = 'annotated_candidate'
            elif sample_id in suspects:
                qualifications[sample_id] = 'normal_suspect'
        return qualifications

    def collect(self, dataset_id: str, sample_ids: List[str], kind: KnowledgeKind,
                normal: Optional[KnowledgeSnapshot] = None) -> List[KnowledgeSource]:
        eligible = self.eligible(dataset_id, kind, normal)
        sources = []
        for sample_id in sample_ids:
            if sample_id not in eligible:
                raise ValueError('Knowledge source qualification changed during mining')
            sample = self.samples.get(sample_id)
            decision = self.reviews.get_decision(sample_id)
            annotations = self.annotations.list_by_sample(sample_id)
            for annotation in annotations:
                if annotation.annotation_type == 'mask' and annotation.geometry_status != 'INVALID':
                    MaskImages.load(annotation, sample)
            sources.append(KnowledgeSource(sample_id=sample_id,
                sha256=file_sha256(validate_sample_image_path(sample, self.db.db_path)), qualification=eligible[sample_id],
                annotations_sha256=hashlib.sha256(json.dumps([a.model_dump(mode='json') for a in annotations], sort_keys=True).encode()).hexdigest(),
                review_sha256=hashlib.sha256(decision.model_dump_json().encode() if decision else b'null').hexdigest()))
        return sources
