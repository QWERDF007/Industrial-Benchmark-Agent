from datetime import datetime, timezone

from iad_core.analysis.publications import AnalysisPublications
from iad_core.analysis.queries import AnalysisQueries
from iad_core.knowledge.check_reviews import KnowledgeCheckReviews
from iad_core.knowledge.models import KnowledgeCheckRemoval, KnowledgeVersion


class AnalysisMaintenance:
    """Derive a knowledge edition from a frozen publication without changing its observations."""

    def __init__(self, db):
        self.db = db

    def remove_check(self, version_id: str, request: KnowledgeCheckRemoval) -> KnowledgeVersion:
        target_id = 'analysis_version_edit_' + request.submission_id.hex
        publications = AnalysisPublications(self.db)
        with self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            existing = connection.execute('SELECT 1 FROM analysis_publications WHERE version_id=?', (target_id,)).fetchone()
            if existing:
                publication = publications.get(target_id)
                if publication.parent_version_id != version_id or publication.manual_edit != request:
                    raise ValueError('同一维护提交ID不可用于不同内容')
            else:
                parent = publications.get(version_id)
                if parent.module != 'knowledge' or request.check_id not in {check.check_id for check in parent.catalog.checks}:
                    raise LookupError('该知识版本不包含所选条目')
                status = connection.execute('SELECT status FROM job_runs WHERE job_id=?', (parent.job_id,)).fetchone()[0]
                if status in ('PENDING','RUNNING'):
                    raise ValueError('请先取消当前知识挖掘作业，等待结束后再移除条目')
                head = connection.execute('SELECT version_id FROM analysis_publications WHERE job_id=? ORDER BY rowid DESC LIMIT 1',
                    (parent.job_id,)).fetchone()[0]
                if head != version_id:
                    raise ValueError('知识版本已变化，请读取当前版本后再维护')
                checks = [check for check in parent.catalog.checks if check.check_id != request.check_id]
                publication = parent.model_copy(deep=True,update=dict(version_id=target_id,parent_version_id=version_id,
                    manual_edit=request,created_at=datetime.now(timezone.utc).isoformat(),
                    catalog=parent.catalog.model_copy(deep=True,update=dict(checks=checks,summary='')),
                    inherited_reviews=KnowledgeCheckReviews(self.db).inherit(parent,parent.revision,
                        {check.check_id for check in checks},connection=connection)))
                connection.execute('INSERT INTO analysis_publications(version_id,job_id,revision,execution_status,publication_json) VALUES(?,?,?,?,?)',
                    (target_id,publication.job_id,publication.revision,publication.execution_status,publication.model_dump_json()))
        dataset_id = publication.coverage.records[0].dataset_id
        return next(version for version in AnalysisQueries(self.db).versions(dataset_id,'knowledge') if version.version_id == target_id)
