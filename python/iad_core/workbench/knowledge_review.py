import hashlib
import json
from datetime import datetime, timezone
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.dataset.registry import DatasetRegistry
from iad_core.evidence.images import EvidenceImages
from iad_core.evidence.sources import SampleContent
from iad_core.knowledge.models import KnowledgeCheck, KnowledgeConflict, KnowledgeEvidence, KnowledgeKind
from iad_core.knowledge.repository import KnowledgeRepository
from iad_core.storage.database import Database
from iad_core.storage.models import ReviewDecisionRecord
from iad_core.storage.review_repository import ReviewRepository


class KnowledgeReviewReference(AnalysisModel):
    version_id: str
    conflict_id: str


class KnowledgeReviewSubmission(KnowledgeReviewReference):
    submission_id: UUID
    context_signature: str = Field(pattern='^[a-f0-9]{64}$')
    reviewer: NonBlankText
    action: Literal['retain', 'revise', 'retire', 'need_evidence']
    instruction: str = ''
    reason: NonBlankText

    @model_validator(mode='after')
    def revision_has_instruction(self):
        if self.action == 'revise' and not self.instruction.strip():
            raise ValueError('知识修订须提供待核验建议')
        return self


class KnowledgeReviewEvent(KnowledgeReviewSubmission):
    created_at: str


class KnowledgeReviewItem(KnowledgeReviewReference):
    dataset_id: str
    kind: KnowledgeKind
    sample_id: str
    description: str
    state: Literal['pending_review', 'pending_recheck', 'resolved']


class KnowledgeReviewContext(AnalysisModel):
    scope_run_id: Optional[str]
    reference: KnowledgeReviewReference
    dataset_id: str
    conflict: KnowledgeConflict
    checks: List[KnowledgeCheck]
    evidence: List[KnowledgeEvidence]
    events: List[KnowledgeReviewEvent]
    sample_review: Optional[ReviewDecisionRecord]
    is_latest: bool
    source_current: bool
    state: Literal['pending_review', 'pending_recheck', 'resolved']
    context_signature: str


def review_state(conflict: KnowledgeConflict, events: List[KnowledgeReviewEvent]) -> Literal['pending_review', 'pending_recheck', 'resolved']:
    if conflict.resolution and conflict.resolution.status == 'resolved' and events and conflict.resolution.submission_id == str(events[-1].submission_id):
        return 'resolved'
    return 'pending_recheck' if events and events[-1].action != 'need_evidence' else 'pending_review'


class KnowledgeReview:
    def __init__(self, db: Database):
        self.db = db
        self.repository = KnowledgeRepository(db)

    def events(self, conflict_id: str) -> List[KnowledgeReviewEvent]:
        with self.db.connection() as conn:
            rows = conn.execute('SELECT event_json FROM knowledge_review_events WHERE conflict_id=? ORDER BY rowid',
                                (conflict_id,)).fetchall()
        return [KnowledgeReviewEvent.model_validate_json(row[0]) for row in rows]

    def context(self, reference: KnowledgeReviewReference) -> KnowledgeReviewContext:
        version = self.repository.get(reference.version_id)
        conflict = next((item for item in version.conflicts if item.conflict_id == reference.conflict_id), None)
        if conflict is None:
            raise LookupError('该知识版本不包含所选冲突')
        ids = set(conflict.new_evidence_ids + conflict.comparison_evidence_ids)
        owners = {item.sample_id for item in version.evidence if item.image.evidence_id in ids}
        selected = [item for item in version.evidence if item.image.evidence_id in ids
                    or (item.sample_id in owners and item.image.role in ('normal', 'overview') and item.image.representation == 'raw')]
        for item in selected:
            EvidenceImages(self.db.db_path).path(item.image)
        if ids - {item.image.evidence_id for item in selected}:
            raise LookupError('冲突缺少所引用的冻结证据')
        try:
            content = SampleContent.capture(self.db, conflict.sample_id)
        except (OSError, LookupError, ValueError):
            content = None
        events = self.events(conflict.conflict_id)
        sample_review = ReviewRepository(self.db).get_decision(conflict.sample_id)
        head = self.repository.current(version.dataset_id, version.kind)
        signature = hashlib.sha256(json.dumps([version.signature, head.version_id if head else None,
            content.model_dump() if content else None, sample_review.model_dump(mode='json') if sample_review else None,
            [item.model_dump(mode='json') for item in events]], sort_keys=True).encode()).hexdigest()
        return KnowledgeReviewContext(scope_run_id=version.scope_run_id, reference=reference, dataset_id=version.dataset_id, conflict=conflict,
            checks=[check for check in version.checks if check.check_id in conflict.check_ids], evidence=selected,
            events=events, sample_review=sample_review, is_latest=bool(head and head.version_id == version.version_id),
            source_current=bool(content and content.sha256 == conflict.source_sha256),
            state=review_state(conflict, events),
            context_signature=signature)

    def queue(self, dataset_id: str) -> List[KnowledgeReviewItem]:
        DatasetRegistry(self.db).get(dataset_id)
        items = []
        for kind in ('normal', 'defect'):
            version = self.repository.current(dataset_id, kind)
            for conflict in version.conflicts if version else []:
                reference = KnowledgeReviewReference(version_id=version.version_id, conflict_id=conflict.conflict_id)
                events = self.events(conflict.conflict_id)
                items.append(KnowledgeReviewItem(**reference.model_dump(), dataset_id=dataset_id, kind=kind,
                    sample_id=conflict.sample_id, description=conflict.description,
                    state=review_state(conflict, events)))
        return items

    def submit(self, request: KnowledgeReviewSubmission) -> KnowledgeReviewEvent:
        with self.db.connection() as conn:
            conn.execute('BEGIN IMMEDIATE')
            existing = conn.execute('SELECT event_json FROM knowledge_review_events WHERE submission_id=?',
                                    (str(request.submission_id),)).fetchone()
            if existing:
                saved = KnowledgeReviewEvent.model_validate_json(existing[0])
                if saved.model_dump(exclude={'created_at'}) != request.model_dump():
                    raise ValueError('同一人工提交ID不可用于不同内容')
                return saved
            context = self.context(KnowledgeReviewReference.model_validate(request.model_dump(include={'version_id', 'conflict_id'})))
            if not context.is_latest or not context.source_current or request.context_signature != context.context_signature:
                raise ValueError('复核上下文已变化，请重新读取当前知识冲突')
            event = KnowledgeReviewEvent(**request.model_dump(), created_at=datetime.now(timezone.utc).isoformat())
            conn.execute('INSERT INTO knowledge_review_events(submission_id,version_id,conflict_id,event_json) VALUES(?,?,?,?)',
                         (str(event.submission_id), event.version_id, event.conflict_id, event.model_dump_json()))
            return event
