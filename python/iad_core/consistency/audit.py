from typing import Callable
from uuid import uuid4

from iad_core.consistency.audit_models import AuditConsistencyRecord, AuditResultReference
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.evidence_models import ConsistencyCompare
from iad_core.consistency.models import ConsistencyScopesSnapshot, ImageRetrieve, Mode, SampleScope
from iad_core.consistency.result_models import ConsistencyQuery, ScopeSelection
from iad_core.consistency.result_queries import ResultQueries
from iad_core.consistency.scopes import ConsistencyScopes
from iad_core.consistency.service import ConsistencyService


class AuditConsistency:
    def __init__(self, service: ConsistencyService):
        self.service = service

    def published(self, sample_id: str, scopes: ConsistencyScopesSnapshot) -> list[AuditResultReference]:
        references = []
        for scope in (scopes.subjects, scopes.corpus):
            ConsistencyScopes(self.service.db).assert_current(scope)
        request = ConsistencyQuery(selection=ScopeSelection(subjects=SampleScope(sample_ids=[sample_id]),
            corpus_scope=scopes.corpus.selector), relation='EXACT', page_size=100)
        while True:
            page = ResultQueries(self.service.db).query(request)
            for item in page.items:
                if item.evidence_available:
                    references.append(AuditResultReference(
                        sample_id=item.sample_b if item.sample_a == sample_id else item.sample_a,
                        result_id=item.result.result_id, evidence_id=item.result.evidence_id))
            if not page.next_cursor:
                break
            request.cursor = page.next_cursor
        for scope in (scopes.subjects, scopes.corpus):
            ConsistencyScopes(self.service.db).assert_current(scope)
        return references

    def retained(self, run_id: str, sample_id: str, scopes: ConsistencyScopesSnapshot, *,
                 mode: Mode = 'exact', profile_id: str | None = None) -> AuditConsistencyRecord:
        record = AuditConsistencyRecord(check_id='audit_check_' + uuid4().hex, run_id=run_id,
            sample_id=sample_id, scope_id=scopes.corpus.scope_id, mode=mode,
            profile_id=profile_id, status='PARTIAL', reason='审计已停止；保留已发布的精确证据，未继续检索')
        try:
            record.references = self.published(sample_id, scopes)
        except ConsistencyError as error:
            record.status = 'FAILED'
            record.error_code, record.reason = error.code, str(error)
        return record

    def check(self, run_id: str, sample_id: str, scopes: ConsistencyScopesSnapshot, *,
              mode: Mode = 'exact', profile_id: str | None = None,
              checkpoint: Callable[[], None] | None = None) -> AuditConsistencyRecord:
        record = AuditConsistencyRecord(check_id='audit_check_' + uuid4().hex, run_id=run_id,
            sample_id=sample_id, scope_id=scopes.corpus.scope_id, mode=mode,
            profile_id=profile_id, status='COMPLETE')
        try:
            ConsistencyScopes(self.service.db).assert_current(scopes.subjects)
            if mode == 'visual' and profile_id is None:
                raise ConsistencyError('PROFILE_NOT_CONFIGURED', '启动审计时未配置视觉索引')
            page = self.service.retrieve_full(ImageRetrieve(query={'kind': 'sample', 'sample_id': sample_id},
                corpus_scope=scopes.corpus.selector, mode='exact' if mode == 'combined' and profile_id is None else mode, profile_id=profile_id),
                frozen_scope=scopes.corpus, checkpoint=checkpoint, prepare_query=False)
            record.coverage = page.coverage
            record.profile_id = page.profile_id
            if mode == 'combined' and profile_id is None:
                record.status = 'PARTIAL'
                record.error_code, record.reason = 'PROFILE_NOT_CONFIGURED', '启动审计时未配置视觉索引，仅完成精确检查'
            if page.retrieval_completeness == 'PARTIAL' or page.coverage.annotation.failed:
                record.status = 'PARTIAL'
                branch = next((branch for branch in (page.exact, page.visual) if branch.error_code), None)
                record.error_code = branch.error_code if branch else 'INDEX_NOT_READY'
                record.reason = branch.reason if branch else '检索或标注检查未完整覆盖'
            record.references = self.published(sample_id, scopes)
            seen = {ref.sample_id for ref in record.references}
            for branch in (page.exact, page.visual):
                for group in branch.groups:
                    for member in group.members:
                        if member.sample_id in seen:
                            continue
                        seen.add(member.sample_id)
                        if (member.relation == 'EXACT' and member.annotation is not None
                                and not any(difference.type != 'POLICY_UNCONFIRMED' for difference in member.annotation.differences)):
                            continue
                        if checkpoint:
                            checkpoint()
                        left, right = sorted((sample_id, member.sample_id))
                        result = self.service.compare(ConsistencyCompare(sample_a=left, sample_b=right),
                            frozen_scopes=scopes, checkpoint=checkpoint)
                        record.references.append(AuditResultReference(sample_id=member.sample_id,
                            result_id=result.result_id, evidence_id=result.evidence_id))
        except ConsistencyError as error:
            record.status = 'PARTIAL' if record.references else 'FAILED'
            record.error_code, record.reason = error.code, str(error)
        except InterruptedError:
            return self.retained(run_id, sample_id, scopes, mode=mode, profile_id=profile_id)
        return record
