from __future__ import annotations

import hashlib
import json
import threading
from typing import TYPE_CHECKING
from datetime import datetime,timezone
from uuid import uuid4

from iad_core.consistency.batch_repository import BatchRepository
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.job_models import BatchFailure,BatchPlan,BatchStep,ConsistencyBatch,ConsistencyBatchList,NoWork,Started,StartResult
from iad_core.consistency.job_worker import ConsistencyWorker
from iad_core.consistency.models import ConsistencyCoverage,ConsistencyStart,CoverageCount,ImageIndexPrepare
from iad_core.consistency.scopes import ConsistencyScopes
from iad_core.feature.profiles import ImageEncoderConfig,ImageEncoders

if TYPE_CHECKING:
    from iad_core.workbench.runtime import WorkbenchRuntime


class ConsistencyJobs:
    def __init__(self,runtime: WorkbenchRuntime):
        self.runtime=runtime
        self.db=runtime.db
        self.repository=BatchRepository(self.db)
        self.repository.recover()
        self.lock=threading.RLock()
        self.worker=ConsistencyWorker(runtime)

    def start(self,request: ConsistencyStart) -> StartResult:
        request=ConsistencyStart.model_validate(request)
        fingerprint=hashlib.sha256(json.dumps(request.model_dump(mode='json'),sort_keys=True).encode()).hexdigest()
        with self.lock:
            existing=self.repository.request(request.request_id,fingerprint)
            if existing:return self._start_result(existing)
            scopes=ConsistencyScopes(self.db).freeze(request.subjects,request.corpus_scope)
            steps=[]
            encoder=None
            if scopes.subjects.samples and request.mode!='exact':
                encoder=self.encoder(request.profile_id)
                indexed={sample.sample_id:sample for scope in (scopes.corpus,scopes.subjects) for sample in scope.samples}
                for dataset_id in sorted(set(scopes.corpus.dataset_ids) | set(scopes.subjects.dataset_ids)):
                    selected=sorted((sample for sample in indexed.values() if sample.dataset_id==dataset_id),key=lambda sample:sample.sample_id)
                    if selected:steps.append(BatchStep(dataset_id=dataset_id,task_id=selected[0].task_id,
                        sample_ids=[sample.sample_id for sample in selected],kind='IMAGE_INDEX'))
            for dataset_id in scopes.subjects.dataset_ids:
                selected=[sample for sample in scopes.subjects.samples if sample.dataset_id==dataset_id]
                if selected:steps.append(BatchStep(dataset_id=dataset_id,task_id=selected[0].task_id,
                    sample_ids=[sample.sample_id for sample in selected],kind='DATA_CONSISTENCY'))
            identity='batch_'+uuid4().hex
            plan=self.repository.save(BatchPlan(batch_id=identity,request=request,fingerprint=fingerprint,kind='consistency',scopes=scopes,
                encoder=encoder,selected_ids=[sample.sample_id for sample in scopes.subjects.samples],steps=steps,created_at=datetime.now(timezone.utc),root_batch_id=identity))
            self._advance(plan.batch_id)
            return self._start_result(plan)

    def encoder(self,profile_id: str | None) -> ImageEncoderConfig:
        encoders=ImageEncoders(self.db)
        resources=encoders.read().resources
        profile=encoders.profile(profile_id)
        return ImageEncoderConfig(profile=profile,**resources.model_dump())

    def prepare(self,request: ImageIndexPrepare) -> StartResult:
        request=ImageIndexPrepare.model_validate(request)
        fingerprint=hashlib.sha256(json.dumps(request.model_dump(mode='json'),sort_keys=True).encode()).hexdigest()
        with self.lock:
            existing=self.repository.request(request.request_id,fingerprint)
            if existing:return self._start_result(existing)
            scopes=ConsistencyScopes(self.db).freeze(request.corpus_scope,request.corpus_scope)
            encoder=self.encoder(request.profile_id) if scopes.corpus.samples else None
            steps=[]
            for dataset_id in scopes.corpus.dataset_ids:
                selected=[sample for sample in scopes.corpus.samples if sample.dataset_id==dataset_id]
                if selected:steps.append(BatchStep(dataset_id=dataset_id,task_id=selected[0].task_id,
                    sample_ids=[sample.sample_id for sample in selected],kind='IMAGE_INDEX'))
            identity='batch_'+uuid4().hex
            plan=self.repository.save(BatchPlan(batch_id=identity,request=request,fingerprint=fingerprint,kind='index',scopes=scopes,
                encoder=encoder,selected_ids=[sample.sample_id for sample in scopes.corpus.samples],steps=steps,
                created_at=datetime.now(timezone.utc),root_batch_id=identity))
            self._advance(plan.batch_id)
            return self._start_result(plan)

    def _start_result(self,plan: BatchPlan) -> StartResult:
        if not plan.selected_ids or not plan.steps:
            empty=CoverageCount(total=0)
            return NoWork(reason='No failed or unprocessed samples remain' if plan.selected_ids else 'No samples match the frozen check scope',
                coverage=ConsistencyCoverage(corpus=empty,verification=empty,annotation=empty))
        return Started(batch_id=plan.batch_id,status=self.status(plan.batch_id).status)

    def _advance(self,batch_id: str) -> None:
        with self.lock:
            plan,cancelled=self.repository.get(batch_id)
            interrupted,error=self.repository.state(batch_id)
            if cancelled or interrupted or error or self.runtime.jobs.closing:return
            children=self.repository.children(batch_id)
            for index,step in enumerate(plan.steps):
                if index in children:
                    status=self.runtime.jobs.status(children[index])
                    if status['status'] in ('PENDING','RUNNING','CANCELLED','INTERRUPTED'):return
                    continue
                try:
                    child=self.runtime.jobs.start(step.kind,step.task_id,
                        {'dataset_id':step.dataset_id,'sample_ids':step.sample_ids,'batch_id':batch_id,
                            'embedding_profile':plan.encoder.profile.model_dump(mode='json') if plan.encoder else None},
                        lambda context:self.worker.execute(plan,step,context),'准备一致性检查',
                        persist=lambda connection,run_id:self.repository.link(batch_id,index,run_id,connection))
                except (LookupError,ValueError) as failure:
                    self.repository.fail(batch_id,BatchFailure(code='SOURCE_UNAVAILABLE' if isinstance(failure,LookupError) else 'INVALID_SCOPE',message=str(failure)))
                    return
                self.runtime.jobs.after_finished(child['run_id'],lambda:self._advance(batch_id))
                return

    def status(self,batch_id: str) -> ConsistencyBatch:
        with self.lock:
            plan,cancelled=self.repository.get(batch_id)
            interrupted,error=self.repository.state(batch_id)
            snapshots=[self.runtime.jobs.snapshot(identity) for identity in self.repository.children(batch_id).values()]
            children=[child.model_dump() for child in snapshots]
            selected=set(plan.selected_ids)
            partition=plan.partition(snapshots)
            successful,failed=partition.completed,partition.failed
            active=any(child['status'] in ('PENDING','RUNNING') for child in children)
            running=any(child['status']=='RUNNING' for child in children)
            finished=len(children)==len(plan.steps) and not active
            pair_count=self.repository.result_count(batch_id)
            plan_failed=any(child['failed'] for child in children)
            status=('RUNNING' if running else 'PENDING' if active else 'CANCELLED' if cancelled or any(child['status']=='CANCELLED' for child in children)
                else 'INTERRUPTED' if interrupted or any(child['status']=='INTERRUPTED' for child in children)
                else ('PARTIAL' if successful or pair_count else 'FAILED') if error else 'PENDING' if not finished
                else 'PARTIAL' if (failed or plan_failed or selected-successful-failed) and (successful or pair_count)
                else 'FAILED' if failed or plan_failed else 'COMPLETED')
            return ConsistencyBatch(batch_id=batch_id,root_batch_id=plan.root_batch_id,parent_batch_id=plan.parent_batch_id,kind=plan.kind,
                scopes=plan.scopes,status=status,cancel_requested=cancelled,error=error,total=len(selected),completed=len(successful),failed=len(failed),
                unprocessed=len(selected-successful-failed),pair_count=pair_count,children=snapshots,created_at=plan.created_at)

    def results(self,batch_id: str):return self.repository.results(batch_id)

    def list(self) -> ConsistencyBatchList:
        return ConsistencyBatchList(items=[self.status(identity) for identity in self.repository.recent()])

    def retry(self,batch_id: str,*,request_id: str,sample_ids: list[str] | None = None) -> StartResult:
        fingerprint=hashlib.sha256(json.dumps({'retry':batch_id,'request_id':request_id,'sample_ids':sample_ids},sort_keys=True).encode()).hexdigest()
        with self.lock:
            existing=self.repository.request(request_id,fingerprint)
            if existing:return self._start_result(existing)
            parent,_=self.repository.get(batch_id)
            previous=self.status(batch_id)
            if previous.status in ('PENDING','RUNNING'):raise ConsistencyError('INVALID_SCOPE','The batch must stop before retry')
            with self.db.connection() as connection:
                connection.execute('BEGIN')
                for scope in (parent.scopes.subjects,parent.scopes.corpus):ConsistencyScopes(self.db).assert_current(scope,connection)
            completed=set(parent.inherited_completed_ids)
            progress_kind='IMAGE_INDEX' if parent.kind=='index' else 'DATA_CONSISTENCY'
            for relative in self.repository.lineage(parent.root_batch_id):
                state=self.status(relative)
                if state.status in ('PENDING','RUNNING'):raise ConsistencyError('INVALID_SCOPE','A retry of this batch is already active')
                for child in state.children:
                    if child.job_type==progress_kind:completed.update(child.completed_sample_ids)
            remaining=set(parent.selected_ids)-completed
            if sample_ids is not None:
                if not sample_ids or len(set(sample_ids))!=len(sample_ids) or not set(sample_ids).issubset(remaining):
                    raise ConsistencyError('INVALID_SCOPE','Retry selection must contain distinct failed or unprocessed samples')
                remaining=set(sample_ids)
            steps=[]
            for step in parent.steps if remaining else []:
                selected=step.sample_ids if step.kind=='IMAGE_INDEX' and parent.kind=='consistency' else [identity for identity in step.sample_ids if identity in remaining]
                if selected:steps.append(step.model_copy(update={'sample_ids':selected}))
            identity='batch_'+uuid4().hex
            plan=self.repository.save(BatchPlan(**{**parent.model_dump(),'batch_id':identity,'parent_batch_id':batch_id,
                'request':parent.request.model_copy(update={'request_id':request_id}), 'fingerprint':fingerprint,
                'inherited_completed_ids':sorted(completed & set(parent.selected_ids)), 'steps':steps,'created_at':datetime.now(timezone.utc)}))
            self._advance(plan.batch_id)
            return self._start_result(plan)

    def cancel(self,batch_id: str) -> ConsistencyBatch:
        with self.lock:
            current=self.status(batch_id)
            if current.status not in ('PENDING','RUNNING'):return current
            self.repository.cancel(batch_id)
            for child in current.children:
                if child.status in ('PENDING','RUNNING'):self.runtime.jobs.cancel(child.run_id,(child.job_type,))
            return self.status(batch_id)
