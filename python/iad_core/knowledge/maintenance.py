import hashlib
from datetime import datetime, timezone

from iad_core.knowledge.models import CheckRevision, KnowledgeCheckRemoval, KnowledgeSnapshot, KnowledgeVersion
from iad_core.knowledge.repository import KnowledgeRepository
from iad_core.storage.database import Database


class KnowledgeMaintenance:
    def __init__(self, db: Database):
        self.db, self.repository = db, KnowledgeRepository(db)

    def remove_check(self, version_id: str, request: KnowledgeCheckRemoval) -> KnowledgeVersion:
        target_id = 'knowledge_edit_' + request.submission_id.hex
        with self.db.connection() as conn:
            conn.execute('BEGIN IMMEDIATE')
            existing = conn.execute('SELECT snapshot_json FROM knowledge_versions WHERE version_id=?', (target_id,)).fetchone()
            if existing:
                snapshot = KnowledgeSnapshot.model_validate_json(existing[0])
                if snapshot.parent_version_id != version_id or snapshot.manual_edit != request:
                    raise ValueError('同一维护提交ID不可用于不同内容')
            else:
                parent = self.repository.get(version_id)
                if not any(check.check_id == request.check_id for check in parent.checks):
                    raise LookupError('该知识版本不包含所选条目')
                snapshot = parent.model_copy(deep=True, update=dict(version_id=target_id,
                    parent_version_id=version_id, signature=hashlib.sha256((parent.signature + request.model_dump_json()).encode()).hexdigest(),
                    checks=[check.model_copy(deep=True) for check in parent.checks if check.check_id != request.check_id],
                    summary='', manual_edit=request, knowledge_preset=[version_id],
                    observed_source_ids=[] if parent.observed_source_ids is not None else None,
                    revisions=[CheckRevision(previous_check_id=request.check_id, current_check_titles=[], reason='人工移除知识条目')],
                    created_at=datetime.now(timezone.utc).isoformat()))

                def validate():
                    active = conn.execute("""SELECT 1 FROM job_runs WHERE job_type=? AND status IN ('PENDING','RUNNING')
                        AND COALESCE(json_extract(payload_json,'$.request.dataset_id'),json_extract(payload_json,'$.dataset_id'))=?""",
                        ('NORMAL_KNOWLEDGE' if parent.kind == 'normal' else 'DEFECT_KNOWLEDGE', parent.dataset_id)).fetchone()
                    if active:
                        raise ValueError('请先取消当前知识挖掘作业，等待结束后再移除条目')

                self.repository.publish(snapshot, connection=conn, expected_head_version_id=version_id, validate=validate)
        return next(version for version in self.repository.versions(snapshot.dataset_id, snapshot.kind) if version.version_id == target_id)
