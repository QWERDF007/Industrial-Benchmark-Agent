import json
from datetime import datetime, timezone
from typing import Optional

from iad_core.dataset.path_safety import PathSafetyError
from iad_core.dataset.registry import DatasetRegistry
from iad_core.knowledge.models import (KnowledgeFreshness, KnowledgeKind, KnowledgeQuery, KnowledgeSnapshot,
                                      KnowledgeSourceChange, KnowledgeSourcePage, KnowledgeSourceQuery, KnowledgeCoverage,
                                      KnowledgeDetailQuery, KnowledgeCheckPage, KnowledgeCheckEvidencePage, KnowledgeCheckSummary)
from iad_core.knowledge.models import KnowledgeEvidencePage
from iad_core.knowledge.repository import KnowledgeRepository
from iad_core.knowledge.generation import generation_signature
from iad_core.knowledge.sources import KnowledgeSources
from iad_core.storage.database import Database
from iad_core.knowledge.models import KnowledgeDiscoveryPage
from iad_core.knowledge.check_reviews import KnowledgeCheckReviews
from iad_core.knowledge.display_evidence import KnowledgeDisplayEvidence


class KnowledgeReader:
    def __init__(self, db: Database):
        self.db = db
        self.repository = KnowledgeRepository(db)
        self.sources = KnowledgeSources(db)

    def details(self, query: KnowledgeDetailQuery) -> KnowledgeCheckPage | KnowledgeCheckEvidencePage | KnowledgeDiscoveryPage | KnowledgeEvidencePage:
        version = self.repository.get(query.version_id)
        start = (query.page - 1) * query.page_size
        common = dict(version_id=version.version_id, dataset_id=version.dataset_id, kind=version.kind,
                      page=query.page, page_size=query.page_size)
        if query.section == 'evidence':
            images = KnowledgeDisplayEvidence(version.evidence).images(query.evidence_ids)
            return KnowledgeEvidencePage(version_id=version.version_id, total=len(images), page=query.page,
                page_size=query.page_size, items=images[start:start + query.page_size])
        if query.section == 'discovery':
            discovery = version.mining_steps[-1].result.discovery if version.mining_steps else None
            return KnowledgeDiscoveryPage(**common, recorded=discovery is not None, parts=discovery.parts if discovery else [],
                total=len(discovery.areas) if discovery else 0, items=discovery.areas[start:start + query.page_size] if discovery else [])
        if query.check_id is None:
            reviews = KnowledgeCheckReviews(self.db).read(version.version_id)
            projection = KnowledgeDisplayEvidence(version.evidence)
            items = [projection.summary(check) for check in version.checks]
            for item in items:
                if item.check_id in reviews:
                    item.review = reviews[item.check_id]
            term = query.search.strip().casefold()
            items = [item for item in items if (not term or term in (item.title + ' ' + item.criterion).casefold())
                     and (query.review_status == 'all'
                          or query.review_status == 'conflict' and item.status == 'conflicted'
                          or query.review_status == item.review.status)]
            return KnowledgeCheckPage(**common, total=len(items), items=items[start:start + query.page_size])
        check = next((item for item in version.checks if item.check_id == query.check_id), None)
        if check is None:
            raise LookupError('所选知识版本不包含该判据')
        ids = list(dict.fromkeys([*check.support_evidence_ids, *check.counter_evidence_ids]))
        if query.evidence_role is not None:
            ids = list(dict.fromkeys(check.support_evidence_ids if query.evidence_role == 'support' else check.counter_evidence_ids))
        projection = KnowledgeDisplayEvidence(version.evidence)
        images = projection.images(ids)
        summary = projection.summary(check)
        reviews = KnowledgeCheckReviews(self.db).read(version.version_id)
        if check.check_id in reviews:
            summary.review = reviews[check.check_id]
        return KnowledgeCheckEvidencePage(**common, check=summary,
                                          support_evidence_ids=check.support_evidence_ids, counter_evidence_ids=check.counter_evidence_ids, total=len(images),
                                          items=images[start:start + query.page_size])

    def source_page(self, query: KnowledgeSourceQuery) -> KnowledgeSourcePage:
        DatasetRegistry(self.db).get(query.dataset_id)
        normal = self.repository.get(query.normal_version_id) if query.normal_version_id else None
        if normal and (query.kind != 'defect' or normal.kind != 'normal' or normal.dataset_id != query.dataset_id):
            raise ValueError('Normal knowledge must belong to the selected dataset and defect source query')
        if query.scope_run_id:
            from iad_core.knowledge.scopes import KnowledgeScopes
            return KnowledgeScopes(self.db).source_page(query)
        availability, candidates = self.sources.list_candidates(query.dataset_id, query.kind, normal, query.search)
        rows = [item.model_dump() for item in candidates]
        coverage = None
        if query.uncovered_from_version:
            version = self.repository.get(query.uncovered_from_version)
            if version.dataset_id != query.dataset_id or version.kind != query.kind:
                raise ValueError('覆盖版本必须属于当前数据集与知识类型')
            ancestor, visited, observed = version, set(), set()
            while ancestor:
                if ancestor.version_id in visited or ancestor.observed_source_ids is None:
                    raise ValueError('知识链缺少可验证的图组观察记录，请明确选择图像重新核验')
                visited.add(ancestor.version_id)
                observed.update(ancestor.observed_source_ids)
                ancestor = self.repository.get(ancestor.parent_version_id) if ancestor.parent_version_id else None
            old_sources = {source.sample_id: source for source in version.sources}
            scope = {row['sample_id'] for row in rows}
            stale = set()
            for sample_id in observed & scope:
                try:
                    if self.sources.capture(sample_id, availability.qualifications[sample_id], old_sources[sample_id]) != old_sources[sample_id]:
                        stale.add(sample_id)
                except (OSError, LookupError, ValueError, PathSafetyError):
                    stale.add(sample_id)
            pending = ({finding.sample_id for finding in version.findings if finding.judgment.status != 'refuted'}
                       | {conflict.sample_id for conflict in version.conflicts
                          if not conflict.resolution or conflict.resolution.status != 'resolved'}) & scope
            remaining = scope - observed
            coverage = KnowledgeCoverage(version_id=version.version_id, total=len(scope), observed=len((observed & scope) - stale),
                pending_review=len(pending), stale=len(stale), recheck=len(version.recheck_sample_ids & scope), remaining=len(remaining))
            if not query.include_observed:
                rows = [row for row in rows if row['sample_id'] in remaining]
        if query.recheck_from_version:
            version = self.repository.get(query.recheck_from_version)
            if version.dataset_id != query.dataset_id or version.kind != query.kind:
                raise ValueError('重核验版本须属于当前数据集和知识类型')
            rows = [row for row in candidates if row.sample_id in version.recheck_sample_ids]
            rows = [row.model_dump() for row in rows]
        start = (query.page - 1) * query.page_size
        return KnowledgeSourcePage(dataset_id=query.dataset_id, kind=query.kind,
            normal_version_id=normal.version_id if normal else None, total=len(rows),
            unavailable_source_count=len(availability.unavailable), page=query.page, page_size=query.page_size,
            coverage=coverage, items=[dict(row, qualification=availability.qualifications[row['sample_id']])
                   for row in rows[start:start + query.page_size]])

    def read(self, dataset_id: Optional[str] = None, version_id: Optional[str] = None) -> KnowledgeQuery:
        if version_id:
            snapshot = self.repository.get(version_id)
            if dataset_id and snapshot.dataset_id != dataset_id:
                raise ValueError('Knowledge version belongs to another dataset')
            dataset_id = snapshot.dataset_id
        else:
            DatasetRegistry(self.db).get(dataset_id)
            snapshot = self.repository.current(dataset_id)
        availability = self.sources.registered(dataset_id)
        return KnowledgeQuery(knowledge=snapshot, versions=self.repository.versions(dataset_id),
            freshness=self.freshness(snapshot) if snapshot else None, eligible_source_count=len(availability.qualifications),
            unavailable_source_count=len(availability.unavailable))

    def freshness(self, snapshot: KnowledgeSnapshot) -> KnowledgeFreshness:
        normal = self.repository.get(snapshot.normal_version_id) if snapshot.normal_version_id else None
        current = self.repository.current(snapshot.dataset_id)
        current_normal = None
        availability = self.sources.for_version(snapshot)
        eligible = availability.qualifications
        changes = []
        fields = {'sha256': 'image', 'annotations_sha256': 'annotations', 'review_sha256': 'review',
                  'audit_suggestion_ids': 'audit_candidates', 'qualification': 'qualification',
                  'quality_status': 'qualification', 'quality_source': 'qualification'}
        comparison_ids = {source.sample_id for source in snapshot.comparison_sources}
        for source in snapshot.sources + snapshot.comparison_sources:
            reasons = []
            if source.sample_id in availability.unavailable:
                reasons.append('unavailable')
            else:
                try:
                    actual = self.sources.capture(source.sample_id, eligible.get(source.sample_id, source.qualification), source)
                    reasons.extend(reason for field, reason in fields.items() if getattr(actual, field) != getattr(source, field))
                except (OSError, LookupError, ValueError, PathSafetyError):
                    reasons.append('unavailable')
                if source.sample_id not in eligible and source.sample_id not in comparison_ids:
                    reasons.append('qualification')
            if reasons:
                changes.append(KnowledgeSourceChange(sample_id=source.sample_id, reasons=list(dict.fromkeys(reasons))))
        generated = snapshot
        while generated.manual_edit and generated.parent_version_id:
            generated = self.repository.get(generated.parent_version_id)
        with self.db.connection() as conn:
            row = conn.execute("""SELECT json_extract(payload_json,'$.request.generation_signature') FROM job_runs
                WHERE json_extract(payload_json,'$.knowledge_version_id')=? ORDER BY id DESC LIMIT 1""",
                (generated.version_id,)).fetchone()
        generation_changed = row[0] != generation_signature() if row and row[0] else None
        normal_version_changed = bool(normal and (not current_normal or current_normal.version_id != normal.version_id))
        normal_sources_changed = bool(normal and self.freshness(normal).status != 'current')
        changed = bool(changes or generation_changed or normal_version_changed or normal_sources_changed)
        return KnowledgeFreshness(status='changed' if changed else 'unverified' if generation_changed is None else 'current',
            checked_at=datetime.now(timezone.utc).isoformat(), current_version_id=current.version_id if current else None,
            current_normal_version_id=current_normal.version_id if current_normal else None,
            source_changes=changes, additional_source_ids=sorted(set(eligible) - {source.sample_id for source in snapshot.sources + snapshot.comparison_sources}),
            generation_changed=generation_changed, normal_version_changed=normal_version_changed,
            normal_sources_changed=normal_sources_changed)
