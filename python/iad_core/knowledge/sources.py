import hashlib
import json

from dataclasses import dataclass
from typing import List, Optional

from iad_core.dataset.path_safety import PathSafetyError, validate_sample_image_path
from iad_core.dataset.registry import DatasetRegistry
from iad_core.evidence.images import file_sha256, image_pixel_sha256
from iad_core.evidence.sources import SampleContent
from iad_core.knowledge.models import KnowledgeFinding, KnowledgeKind, KnowledgeSnapshot, KnowledgeSource, KnowledgeSourceMetadata, KnowledgeSourceItem
from iad_core.knowledge.candidates import AuditCandidates
from iad_core.storage.database import Database
from iad_core.storage.repositories import AnnotationRepository, SampleRepository
from iad_core.storage.review_repository import ReviewRepository


@dataclass(frozen=True)
class KnowledgeEligibility:
    qualifications: dict[str, str]
    unavailable: dict[str, Exception]

    def require_available(self, sample_ids: Optional[List[str]] = None) -> dict[str, str]:
        selected = set(sample_ids) if sample_ids is not None else set(self.unavailable)
        for sample_id, error in self.unavailable.items():
            if sample_id in selected:
                raise error
        return self.qualifications


class KnowledgeSources:
    def __init__(self, db: Database):
        self.db = db
        self.registry = DatasetRegistry(db)
        self.samples, self.annotations, self.reviews = SampleRepository(db), AnnotationRepository(db), ReviewRepository(db)
        self.candidates = AuditCandidates(db)

    def eligible(self, dataset_id: str, kind: KnowledgeKind, normal: Optional[KnowledgeSnapshot] = None) -> KnowledgeEligibility:
        if kind == 'normal':
            eligible = self.registry.references(dataset_id, limit=None)
            with self.db.connection() as conn:
                selected = json.loads(conn.execute('SELECT reference_sample_ids_json FROM datasets WHERE dataset_id=?',
                                                  (dataset_id,)).fetchone()[0])
        else:
            with self.db.connection() as conn:
                eligible = [row[0] for row in conn.execute("""SELECT s.sample_id FROM samples s WHERE dataset_id=? AND s.is_excluded=0
                    AND NOT EXISTS(SELECT 1 FROM import_issues i WHERE i.sample_id=s.sample_id
                                   AND i.severity IN ('ERROR','WARNING')) ORDER BY s.relative_path,s.sample_id""", (dataset_id,))]
            selected = []
        suspects: dict[str, List[KnowledgeFinding]] = {}
        for finding in normal.findings if normal else []:
            suspects.setdefault(finding.sample_id, []).append(finding)
        qualifications, unavailable = {}, {}
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
            elif decision:
                continue
            elif any(annotation.bbox and annotation.geometry_status != 'INVALID'
                     for annotation in self.annotations.list_by_sample(sample_id)):
                qualifications[sample_id] = 'annotated_candidate'
            elif sample.quality_status == 'FAIL':
                qualifications[sample_id] = 'raw_fail'
            else:
                try:
                    candidates = self.candidates.matching(sample)
                    current_suspects = []
                    if sample_id in suspects:
                        sha256 = file_sha256(validate_sample_image_path(sample, self.db.db_path))
                        current_suspects = [finding for finding in suspects[sample_id]
                            if finding.is_current_candidate(sha256, [item.suggestion_id for item in candidates])]
                except (OSError, PathSafetyError) as error:
                    unavailable[sample_id] = error
                    continue
                if current_suspects:
                    qualifications[sample_id] = 'normal_suspect'
                elif candidates:
                    qualifications[sample_id] = 'audit_suspect'
        return KnowledgeEligibility(qualifications, unavailable)

    def list_candidates(self, dataset_id: str, kind: KnowledgeKind, normal: Optional[KnowledgeSnapshot], search: str = '') -> tuple[KnowledgeEligibility, List[KnowledgeSourceItem]]:
        availability = self.eligible(dataset_id, kind, normal)
        with self.db.connection() as conn:
            rows = conn.execute("""SELECT sample_id,relative_path FROM samples
                WHERE sample_id IN (SELECT value FROM json_each(?)) AND instr(lower(relative_path),lower(?))>0
                ORDER BY relative_path,sample_id""", (json.dumps(list(availability.qualifications)), search)).fetchall()
        return availability, [KnowledgeSourceItem(**dict(row), qualification=availability.qualifications[row['sample_id']]) for row in rows]

    def collect(self, dataset_id: str, sample_ids: List[str], kind: KnowledgeKind,
                normal: Optional[KnowledgeSnapshot] = None, *, frozen_sources: Optional[List[KnowledgeSource]] = None) -> List[KnowledgeSource]:
        eligible = self.eligible(dataset_id, kind, normal).require_available(sample_ids)
        sources = []
        frozen = {source.sample_id: source for source in frozen_sources or []}
        for sample_id in sample_ids:
            if sample_id not in eligible:
                raise ValueError('知识来源资格已变化，请重新选择或核验')
            sources.append(self.capture(sample_id, eligible[sample_id], frozen.get(sample_id)))
        return sources

    def capture_metadata(self, sample_id: str, qualification: str) -> KnowledgeSourceMetadata:
        sample = self.samples.get(sample_id)
        content = SampleContent.capture(self.db, sample_id)
        candidates = self.candidates.matching(sample, content.sha256)
        decision = self.reviews.get_decision(sample_id)
        return KnowledgeSourceMetadata(**content.model_dump(), qualification=qualification,
            audit_suggestion_ids=[item.suggestion_id for item in candidates],
            review_sha256=hashlib.sha256(decision.model_dump_json().encode() if decision else b'null').hexdigest())

    def capture(self, sample_id: str, qualification: str, frozen: Optional[KnowledgeSource] = None) -> KnowledgeSource:
        sample = self.samples.get(sample_id)
        content = self.capture_metadata(sample_id, qualification)
        if frozen and content.sha256 == frozen.sha256 and frozen.pixel_sha256:
            digest = frozen.pixel_sha256
        else:
            digest = image_pixel_sha256(sample.image_path, content.sha256)
        return KnowledgeSource(**content.model_dump(), pixel_sha256=digest)
