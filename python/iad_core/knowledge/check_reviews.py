from datetime import datetime, timezone

from iad_core.knowledge.models import KnowledgeCheckReview, KnowledgeCheckReviewSubmission
from iad_core.knowledge.repository import KnowledgeRepository
from iad_core.storage.database import Database


class KnowledgeCheckReviews:
    """Human assessments of an exact frozen criterion; model evidence remains immutable."""

    def __init__(self, db: Database):
        self.db = db

    def read(self, version_id: str) -> dict[str, KnowledgeCheckReview]:
        with self.db.connection() as conn:
            rows = conn.execute('''SELECT check_id,review_json FROM knowledge_check_reviews r
                WHERE version_id=? AND revision=(SELECT MAX(revision) FROM knowledge_check_reviews
                    WHERE version_id=r.version_id AND check_id=r.check_id)''', (version_id,)).fetchall()
        return {row['check_id']: KnowledgeCheckReview.model_validate_json(row['review_json']) for row in rows}

    def submit(self, request: KnowledgeCheckReviewSubmission) -> KnowledgeCheckReview:
        version = KnowledgeRepository(self.db).get(request.version_id)
        if request.check_id not in {check.check_id for check in version.checks}:
            raise LookupError('该知识版本不包含所选条目')
        with self.db.connection() as conn:
            conn.execute('BEGIN IMMEDIATE')
            existing = conn.execute('SELECT submission_json,review_json FROM knowledge_check_reviews WHERE submission_id=?',
                                    (str(request.submission_id),)).fetchone()
            if existing:
                if KnowledgeCheckReviewSubmission.model_validate_json(existing['submission_json']) != request:
                    raise ValueError('同一人工提交ID不可用于不同内容')
                return KnowledgeCheckReview.model_validate_json(existing['review_json'])
            revision = conn.execute('SELECT COALESCE(MAX(revision),0) FROM knowledge_check_reviews WHERE version_id=? AND check_id=?',
                                    (request.version_id, request.check_id)).fetchone()[0]
            if revision != request.expected_revision:
                raise ValueError('人工核实记录已变化，请重新读取后保存')
            review = KnowledgeCheckReview(status=request.status, note=request.note, revision=revision + 1,
                                          created_at=datetime.now(timezone.utc).isoformat())
            conn.execute('''INSERT INTO knowledge_check_reviews
                (submission_id,version_id,check_id,revision,submission_json,review_json) VALUES(?,?,?,?,?,?)''',
                (str(request.submission_id), request.version_id, request.check_id, review.revision,
                 request.model_dump_json(), review.model_dump_json()))
        return review
