from datetime import datetime, timezone
from typing import Optional

from iad_core.dataset.path_safety import PathSafetyError
from iad_core.dataset.registry import DatasetRegistry
from iad_core.knowledge.models import KnowledgeFreshness, KnowledgeKind, KnowledgeQuery, KnowledgeSnapshot, KnowledgeSourceChange
from iad_core.knowledge.repository import KnowledgeRepository
from iad_core.knowledge.service import KnowledgeService
from iad_core.knowledge.sources import KnowledgeSources
from iad_core.storage.database import Database


class KnowledgeReader:
    def __init__(self, db: Database):
        self.db = db
        self.repository = KnowledgeRepository(db)
        self.sources = KnowledgeSources(db)

    def read(self, dataset_id: Optional[str] = None, kind: Optional[KnowledgeKind] = None,
             version_id: Optional[str] = None) -> KnowledgeQuery:
        if version_id:
            snapshot = self.repository.get(version_id)
            if dataset_id and snapshot.dataset_id != dataset_id:
                raise ValueError('Knowledge version belongs to another dataset')
            if kind and snapshot.kind != kind:
                raise ValueError('Knowledge version has a different kind')
            dataset_id, kind = snapshot.dataset_id, snapshot.kind
        else:
            if kind not in ('normal', 'defect'):
                raise ValueError('Knowledge kind must be normal or defect')
            DatasetRegistry(self.db).get(dataset_id)
            snapshot = self.repository.current(dataset_id, kind)
        return KnowledgeQuery(knowledge=snapshot, versions=self.repository.versions(dataset_id, kind),
                              freshness=self.freshness(snapshot) if snapshot else None)

    def freshness(self, snapshot: KnowledgeSnapshot) -> KnowledgeFreshness:
        normal = self.repository.get(snapshot.normal_version_id) if snapshot.normal_version_id else None
        current = self.repository.current(snapshot.dataset_id, snapshot.kind)
        current_normal = self.repository.current(snapshot.dataset_id, 'normal')
        availability = self.sources.eligible(snapshot.dataset_id, snapshot.kind, normal)
        eligible = availability.qualifications
        changes = []
        fields = {'sha256': 'image', 'annotations_sha256': 'annotations', 'review_sha256': 'review',
                  'audit_suggestion_ids': 'audit_candidates', 'qualification': 'qualification'}
        for source in snapshot.sources:
            reasons = []
            if source.sample_id in availability.unavailable:
                reasons.append('unavailable')
            else:
                try:
                    actual = self.sources.capture(source.sample_id, eligible.get(source.sample_id, source.qualification))
                    reasons.extend(reason for field, reason in fields.items() if getattr(actual, field) != getattr(source, field))
                except (OSError, LookupError, ValueError, PathSafetyError):
                    reasons.append('unavailable')
                if source.sample_id not in eligible:
                    reasons.append('qualification')
            if reasons:
                changes.append(KnowledgeSourceChange(sample_id=source.sample_id, reasons=reasons))
        with self.db.connection() as conn:
            row = conn.execute("""SELECT json_extract(payload_json,'$.request.generation_signature') FROM job_runs
                WHERE json_extract(payload_json,'$.knowledge_version_id')=? ORDER BY id DESC LIMIT 1""",
                (snapshot.version_id,)).fetchone()
        generation_changed = row[0] != KnowledgeService.generation_signature() if row and row[0] else None
        normal_version_changed = bool(normal and (not current_normal or current_normal.version_id != normal.version_id))
        normal_sources_changed = bool(normal and self.freshness(normal).status != 'current')
        changed = bool(changes or generation_changed or normal_version_changed or normal_sources_changed)
        return KnowledgeFreshness(status='changed' if changed else 'unverified' if generation_changed is None else 'current',
            checked_at=datetime.now(timezone.utc).isoformat(), current_version_id=current.version_id if current else None,
            current_normal_version_id=current_normal.version_id if current_normal else None,
            source_changes=changes, additional_source_ids=sorted(set(eligible) - {source.sample_id for source in snapshot.sources}),
            generation_changed=generation_changed, normal_version_changed=normal_version_changed,
            normal_sources_changed=normal_sources_changed)
