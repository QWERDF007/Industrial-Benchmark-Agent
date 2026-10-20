import hashlib
import json
from typing import List, Optional

from iad_core.dataset.path_safety import validate_sample_image_path
from iad_core.dataset.registry import DatasetRegistry
from iad_core.evidence.images import file_sha256
from iad_core.evidence.sources import SampleContent
from iad_core.knowledge.models import KnowledgeFinding, KnowledgeKind, KnowledgeSnapshot, KnowledgeSource
from iad_core.knowledge.candidates import AuditCandidates
from iad_core.storage.database import Database
from iad_core.storage.repositories import AnnotationRepository, SampleRepository
from iad_core.storage.review_repository import ReviewRepository


class KnowledgeSources:
    def __init__(self, db: Database):
        self.db = db
        self.registry = DatasetRegistry(db)
        self.samples, self.annotations, self.reviews = SampleRepository(db), AnnotationRepository(db), ReviewRepository(db)
        self.candidates = AuditCandidates(db)

    def eligible(self, dataset_id: str, kind: KnowledgeKind, normal: Optional[KnowledgeSnapshot] = None) -> dict:
        if kind == 'normal':
            eligible = self.registry.references(dataset_id, limit=None)
            with self.db.connection() as conn:
                selected = json.loads(conn.execute('SELECT reference_sample_ids_json FROM datasets WHERE dataset_id=?',
                                                  (dataset_id,)).fetchone()[0])
        else:
            with self.db.connection() as conn:
                eligible = [row[0] for row in conn.execute("""SELECT s.sample_id FROM samples s WHERE dataset_id=?
                    AND NOT EXISTS(SELECT 1 FROM import_issues i WHERE i.sample_id=s.sample_id
                                   AND i.severity IN ('ERROR','WARNING')) ORDER BY s.relative_path,s.sample_id""", (dataset_id,))]
            selected = []
        suspects: dict[str, List[KnowledgeFinding]] = {}
        for finding in normal.findings if normal else []:
            suspects.setdefault(finding.sample_id, []).append(finding)
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
            else:
                candidates = self.candidates.matching(sample)
                current_suspects = []
                if sample_id in suspects:
                    sha256 = file_sha256(validate_sample_image_path(sample, self.db.db_path))
                    current_suspects = [finding for finding in suspects[sample_id]
                        if finding.is_current_candidate(sha256, [item.suggestion_id for item in candidates])]
                if current_suspects:
                    qualifications[sample_id] = 'normal_suspect'
                elif candidates:
                    qualifications[sample_id] = 'audit_suspect'
        return qualifications

    def collect(self, dataset_id: str, sample_ids: List[str], kind: KnowledgeKind,
                normal: Optional[KnowledgeSnapshot] = None) -> List[KnowledgeSource]:
        eligible = self.eligible(dataset_id, kind, normal)
        sources = []
        for sample_id in sample_ids:
            if sample_id not in eligible:
                raise ValueError('Knowledge source qualification changed during mining')
            sample = self.samples.get(sample_id)
            content = SampleContent.capture(self.db, sample_id)
            candidates = self.candidates.matching(sample, content.sha256)
            decision = self.reviews.get_decision(sample_id)
            sources.append(KnowledgeSource(**content.model_dump(), qualification=eligible[sample_id],
                audit_suggestion_ids=[item.suggestion_id for item in candidates],
                review_sha256=hashlib.sha256(decision.model_dump_json().encode() if decision else b'null').hexdigest()))
        return sources
