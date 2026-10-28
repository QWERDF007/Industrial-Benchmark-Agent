from __future__ import annotations

from typing import TYPE_CHECKING

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.evidence_models import ConsistencyCompare
from iad_core.consistency.job_models import BatchPlan,BatchResultReference,BatchStep
from iad_core.consistency.models import ImageRetrieve
from iad_core.consistency.batch_repository import BatchRepository
from iad_core.workbench.jobs import JobContext
from iad_core.feature.cache import ContentFeatureCache
from iad_core.consistency.scopes import ConsistencyScopes

if TYPE_CHECKING:
    from iad_core.workbench.runtime import WorkbenchRuntime


class ConsistencyWorker:
    def __init__(self, runtime: WorkbenchRuntime):
        self.runtime=runtime
        self.db=runtime.db
        self.repository=BatchRepository(self.db)
        self.service=runtime.consistency_service

    def execute(self, plan: BatchPlan, step: BatchStep, context: JobContext) -> None:
        with self.db.connection() as connection:
            connection.execute('BEGIN')
            for scope in (plan.scopes.subjects,plan.scopes.corpus):ConsistencyScopes(self.db).assert_current(scope,connection)
        if step.kind=='IMAGE_INDEX':
            self.prepare(plan,step,context)
            return
        service=self.service
        context.update(phase='COMPARING')
        requests=[ImageRetrieve(query={'kind':'sample','sample_id':sample_id},
            corpus_scope=plan.scopes.corpus.selector,mode=plan.request.mode,
            profile_id=plan.encoder.profile.profile_id if plan.encoder else None) for sample_id in context.payload['sample_ids']]
        for outcome in service.retrieve_many(requests,frozen_scope=plan.scopes.corpus,
                checkpoint=context.checkpoint,encoder=plan.encoder,prepare_query=False,
                query_started=lambda query:context.update(current_sample_id=query.sample_id)):
            sample_id=outcome.query.sample_id
            context.checkpoint()
            results=[]
            failure=None
            try:
                if outcome.error is not None:
                    raise outcome.error
                page=outcome.page
                for branch in (page.exact,page.visual):
                    for group in branch.groups:
                        context.checkpoint()
                        for member in group.members:
                            context.checkpoint()
                            pair=tuple(sorted((sample_id,member.sample_id)))
                            if self.repository.has_pair(plan.batch_id,*pair):continue
                            result=service.compare(ConsistencyCompare(sample_a=pair[0],sample_b=pair[1]),checkpoint=context.checkpoint,frozen_scopes=plan.scopes)
                            results.append(BatchResultReference(sample_a=pair[0],sample_b=pair[1],result_id=result.result_id,evidence_id=result.evidence_id))
                if page.retrieval_completeness=='PARTIAL' or page.coverage.annotation.failed:
                    failure=ConsistencyError('INDEX_NOT_READY','Selected-mode retrieval or annotation comparison was incomplete')
            except ConsistencyError as error:failure=error
            context.checkpoint()
            context.record(sample_id,error=failure,persist=lambda connection:self.repository.record_results(plan.batch_id,results,connection))

    def prepare(self,plan: BatchPlan,step: BatchStep,context: JobContext) -> None:
        encoder=plan.encoder
        if encoder is None:raise ConsistencyError('PROFILE_NOT_CONFIGURED','Index preparation requires a frozen image encoder')
        context.update(phase='ENCODING')
        sample_ids=context.payload['sample_ids']
        for offset in range(0,len(sample_ids),encoder.batch_size):
            context.checkpoint()
            chunk=sample_ids[offset:offset+encoder.batch_size]
            failure=None
            prepared=None
            try:
                prepared=ContentFeatureCache(self.db,self.runtime.images).prepare(chunk,encoder,checkpoint=context.checkpoint)
            except ConsistencyError as error:failure=error
            context.checkpoint()
            if offset+len(chunk)==len(sample_ids) and step==[item for item in plan.steps if item.kind=='IMAGE_INDEX'][-1]:
                context.update(phase='INDEXING')
                try:
                    with self.runtime.indexes.acquire(plan.scopes.corpus,encoder.profile.profile_id):pass
                except ConsistencyError as error:failure=error
            outcomes={sample.sample_id:sample for sample in prepared.samples} if prepared else {}
            for sample_id in chunk:
                outcome=outcomes.get(sample_id)
                error=failure
                if error is None and (outcome is None or outcome.status!='COMPLETE'):
                    code=(outcome.error_code or {'UNINDEXED':'UNSUPPORTED_IMAGE','UNAVAILABLE':'SOURCE_UNAVAILABLE','FAILED':'INDEX_NOT_READY'}[outcome.status]) if outcome else 'INDEX_NOT_READY'
                    error=ConsistencyError(code,outcome.error_message or 'Image content could not be prepared' if outcome else 'Image feature is unavailable')
                context.record(sample_id,error=error)

