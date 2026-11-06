import os
import uuid
from typing import List, Optional, TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, Field, model_validator

from iad_core.advisory.repository import AuditSuggestionRepository
from iad_core.advisory.analysis import AuditConsistencyReference, AuditConsistencyEvidenceReference, NonBlankText
from iad_core.advisory.schemas import AuditSuggestion, ConclusionStatus, EvidenceRefItem, HypothesisItem, ObservationItem, RecommendedAction
from iad_core.dataset.registry import DatasetRegistry
from iad_core.evidence.images import EvidenceImages
from iad_core.evidence.sources import SampleContent
from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository
from iad_core.workbench.query import SampleFilters, SampleQuery, WorkbenchQuery

from iad_core.workbench.vision import VlmClient
from iad_core.workbench.audit_prompts import DEFAULT_AUDIT_PROMPT
from iad_core.workbench.audit_protocol import audit_generation_signature
from iad_core.workbench.inspection import SampleInspection
from iad_core.workbench.audit_synthesis import AuditSynthesis
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.job_families import JobFamilies
from iad_core.workbench.calls import ModelCalls
from iad_core.workbench.job_models import ChildJobError
from iad_core.workbench.knowledge import InspectionKnowledge
from iad_core.consistency.audit import AuditConsistency
from iad_core.consistency.audit_repository import AuditConsistencyRepository
from iad_core.consistency.models import DatasetScope, ConsistencyScopesSnapshot, CorpusScope, Mode, SampleScope
from iad_core.consistency.scopes import ConsistencyScopes
from iad_core.feature.profiles import ImageEncoders
from iad_core.workbench.audit_sources import AuditSources, FrozenAuditSources

if TYPE_CHECKING:
    from iad_core.workbench.runtime import WorkbenchRuntime

class AuditStart(BaseModel):
    model_config = ConfigDict(extra="forbid")
    dataset_id: str
    subset_ids: Optional[List[str]] = None
    submission_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    origin_session_id: Optional[str] = None
    model_name: Optional[str] = None
    knowledge_version_id: Optional[str] = None
    knowledge_job_id: Optional[str] = None
    knowledge_entry_ids: Optional[List[str]] = None
    consistency_job_ids: Optional[List[str]] = None
    sample_ids: Optional[List[str]] = None
    filters: SampleFilters = Field(default_factory=SampleFilters)
    consistency_mode: Mode = 'exact'
    consistency_profile_id: Optional[str] = None
    corpus_scope: CorpusScope = Field(default_factory=lambda data: DatasetScope(dataset_ids=[data['dataset_id']]))
    instruction: NonBlankText = DEFAULT_AUDIT_PROMPT

    @model_validator(mode='after')
    def selected_sources_complete(self):
        if any(value is not None for value in (self.knowledge_job_id, self.knowledge_entry_ids, self.consistency_job_ids)):
            if not all((self.knowledge_job_id, self.knowledge_version_id, self.knowledge_entry_ids, self.consistency_job_ids)):
                raise ValueError('请选择知识挖掘作业、知识条目及已完成的一致性作业')
        return self


class AuditService:
    def __init__(self, db: Database, client: Optional[VlmClient] = None,
                 *, runtime: 'WorkbenchRuntime | None' = None):
        self.db = db
        self.registry = DatasetRegistry(db)
        self.client = client or VlmClient()
        self.inspection = SampleInspection(db, self.client)
        self.owns_runtime = runtime is None
        if runtime is None:
            from iad_core.workbench.runtime import WorkbenchRuntime
            runtime = WorkbenchRuntime(db, self.client)
        self.runtime = runtime
        self.jobs = runtime.jobs

    @property
    def generation_signature(self) -> str:
        return audit_generation_signature()

    def audit_sample(self, sample_id: str, model_name: Optional[str], knowledge: InspectionKnowledge, context: JobContext,
                     model_error: Optional[Exception] = None, *, audit_run_id: str):
        samples = SampleRepository(self.db)
        sample = samples.get(sample_id)
        if not sample:
            raise LookupError("Sample not found")
        expected = next(source for source in context.payload['input_sources'] if source['sample_id'] == sample_id)
        if SampleContent.capture(self.db, sample_id).model_dump() != expected:
            raise ValueError('源图像或标注内容已变化，请重新启动审计')
        def phase(progress):
            context.update(**progress.model_dump(), current_sample_id=sample_id)
        consistency = AuditConsistency(self.runtime.consistency_service)
        selected_sources = context.payload.get('sources')
        scopes = ConsistencyScopesSnapshot.model_validate(context.payload['consistency_scopes'])
        axis_options = {'mode': context.payload['consistency_mode'], 'profile_id': context.payload['consistency_profile_id']}
        repository = AuditConsistencyRepository(self.db)
        error = model_error
        analysis = None
        try:
            if error is None:
                analysis = self.inspection.inspect(sample_id, model_name, knowledge, context.cancel, phase,
                    instruction=context.payload['instruction'])
        except InterruptedError:
            repository.save(consistency.selected(audit_run_id, sample_id, scopes, FrozenAuditSources.model_validate(selected_sources))
                if selected_sources else consistency.retained(audit_run_id, sample_id, scopes, **axis_options))
            raise
        except Exception as failure:
            error = context.failure(failure)
        if SampleContent.capture(self.db, sample_id).model_dump() != expected:
            raise ValueError('源图像或标注内容已变化，请重新启动审计')
        context.update(phase='COMPARING', current_sample_id=sample_id)
        axis = consistency.selected(audit_run_id, sample_id, scopes, FrozenAuditSources.model_validate(selected_sources)) if selected_sources else consistency.check(
            audit_run_id, sample_id, scopes, **axis_options, checkpoint=context.checkpoint)
        if error is not None:
            def persist_failure(conn):
                repository.save(axis, conn)
                self.jobs.record(audit_run_id, sample_id, error, connection=conn)
            try:
                context.record(sample_id, error, persist=persist_failure)
            except InterruptedError:
                repository.save(axis)
                raise
            return
        analysis.consistency = AuditConsistencyReference(check_id=axis.check_id,
            results=[AuditConsistencyEvidenceReference(result_id=ref.result_id, evidence_id=ref.evidence_id) for ref in axis.references])
        try:
            analysis = AuditSynthesis(self.db, self.client).conclude(analysis, knowledge, axis,
                model_name, context.payload['instruction'], context, phase)
        except Exception:
            repository.save(axis)
            raise
        refs = analysis.reference_sample_ids
        result = analysis.conclusion
        suggestion = AuditSuggestion(
            suggestion_id="sug_" + uuid.uuid4().hex, task_id=sample.task_id, sample_id=sample_id,
            session_id=context.payload.get('origin_session_id'),
            source_fingerprint=SampleContent.model_validate(expected).fingerprint,
            model_route=model_name, analysis=analysis, confidence=result.confidence, reference_sample_ids=refs, audit_run_id=audit_run_id,
            observations=[ObservationItem(phenomenon=result.reason_category, description=(result.defect_location + " " + result.description).strip())],
            hypotheses=[HypothesisItem(label=result.suggested_label)],
            conclusion_status=ConclusionStatus.INSUFFICIENT_EVIDENCE if result.suggested_label == "UNCERTAIN" else ConclusionStatus.EVIDENCE_SUPPORTED,
            recommended_action=RecommendedAction.IGNORE_CANDIDATE if result.suggested_label == "PASS" else RecommendedAction.REVIEW,
            evidence_refs=[EvidenceRefItem(kind="normal_reference", sample_id=sid) for sid in refs],
            input_modalities_used=["image", "text"],
        )
        def persist(conn):
            repository.save(axis, conn)
            AuditSuggestionRepository(self.db).save(suggestion, conn)
            self.jobs.record(audit_run_id, sample_id, connection=conn)
        try:
            context.record(sample_id, persist=persist,
                phase="SAMPLE_COMPLETED", inspected_regions=analysis.coverage.inspected_regions,
                planned_regions=analysis.coverage.planned_regions)
        except InterruptedError:
            repository.save(axis)
            raise

    def start(self, **arguments) -> dict:
        request = AuditStart.model_validate(arguments)
        submission = request.model_dump(mode='json')
        if existing := self.jobs.submitted('MODEL_AUDIT', submission):
            return self.status(existing['run_id'])
        request.model_name = request.model_name or self.client.profile.model_id or os.environ.get('LIVE_VLM_MODEL')
        if request.model_name:
            request.model_name = self.client.resolve_model(request.model_name)
        config = self.registry.resolve(dataset_id=request.dataset_id)
        dataset_ids = request.subset_ids if request.subset_ids is not None else [request.dataset_id]
        if not dataset_ids or request.dataset_id not in dataset_ids or len(set(dataset_ids)) != len(dataset_ids):
            raise ValueError('审计子数据集范围不能为空、重复或遗漏知识来源子数据集')
        if len(dataset_ids) > 1:
            import json
            with self.db.connection() as conn:
                groups = conn.execute('SELECT dataset_id,COALESCE(group_id,dataset_id) group_id FROM datasets WHERE dataset_id IN (SELECT value FROM json_each(?))',
                    (json.dumps(dataset_ids),)).fetchall()
            if len(groups) != len(dataset_ids) or len({row['group_id'] for row in groups}) != 1:
                raise ValueError('审计子数据集必须属于同一数据集')
        knowledge = InspectionKnowledge.resolve(self.db, request.dataset_id, request.knowledge_version_id)
        sources = AuditSources(self.db).freeze(request.dataset_id, request.knowledge_job_id, request.knowledge_version_id,
            request.knowledge_entry_ids, request.consistency_job_ids, dataset_ids=dataset_ids) if request.knowledge_job_id else None
        if request.sample_ids is None:
            sample_ids = []
            for dataset_id in dataset_ids:
                query = SampleQuery.model_validate({**request.filters.model_dump(), 'dataset_id':dataset_id, 'page':1, 'page_size':200})
                while True:
                    page = WorkbenchQuery(self.db).samples(query)
                    sample_ids.extend(item['sample_id'] for item in page['items'])
                    if query.page * query.page_size >= page['total']:
                        break
                    query.page += 1
        else:
            sample_ids = list(dict.fromkeys(request.sample_ids))
            for sid in sample_ids:
                sample = SampleRepository(self.db).get(sid)
                if not sample or sample.dataset_id not in dataset_ids:
                    raise ValueError("Audit samples must belong to the selected dataset")
        if not sample_ids:
            raise ValueError("No samples match the audit filters")
        scopes = ConsistencyScopes(self.db).freeze(SampleScope(sample_ids=sample_ids), request.corpus_scope)
        if request.consistency_mode != 'exact':
            encoders = ImageEncoders(self.db)
            selected = encoders.read().selection
            if request.consistency_profile_id is not None or selected is not None:
                request.consistency_profile_id = encoders.profile(request.consistency_profile_id).profile_id
        payload = {"dataset_id": request.dataset_id, "dataset_ids":dataset_ids, "model_name": request.model_name, "sample_ids": sample_ids,
                   "instruction":request.instruction,
                   "submission": submission,
                   "origin_session_id": request.origin_session_id, "model_profile": self.client.profile.model_dump(),
                   "generation_signature": self.generation_signature,
                   "consistency_scopes": scopes.model_dump(mode='json'),
                   "consistency_mode": request.consistency_mode,
                   "consistency_profile_id": request.consistency_profile_id,
                   "input_sources": [source.model_dump() for source in SampleContent.capture_many(self.db, sample_ids)],
                   "knowledge_version_id": knowledge.snapshot.version_id}
        if sources:
            payload['sources'] = sources.model_dump(mode='json')
        return self.jobs.start("MODEL_AUDIT", config.task.task_id, payload, self.run, "准备冻结知识审计")

    def run(self, context: JobContext):
        payload = context.payload
        if payload['generation_signature'] != self.generation_signature:
            raise ValueError('模型审计规则已变化，请重新启动审计')
        from iad_core.knowledge.repository import KnowledgeRepository
        repository = KnowledgeRepository(self.db)
        selection = FrozenAuditSources.model_validate(payload['sources']) if payload.get('sources') else None
        knowledge = InspectionKnowledge(repository.get(payload['knowledge_version_id']),
            frozenset(selection.knowledge_entry_ids) if selection else None)
        model_error = None
        model_name = payload['model_name']
        try:
            model_name = self.client.resolve_model(model_name)
            context.update(model_name=model_name, request={**payload['request'], 'model_name': model_name})
        except Exception as error:
            model_error = context.failure(error)
        pending = set(payload['sample_ids'])
        sources = {source['sample_id']: source for source in payload['input_sources']}
        context.update(phase='AUDITING_IMAGES')

        def execute_image(child):
            sample_id = child.payload['sample_ids'][0]
            child.payload.update(input_sources=[sources[sample_id]],
                instruction=payload['instruction'],
                **{key:payload[key] for key in ('consistency_scopes','consistency_mode','consistency_profile_id')})
            if payload.get('sources'):
                child.payload['sources'] = payload['sources']
            with ModelCalls(self.db).bind(context.run_id, child.checkpoint, state_run_id=child.run_id):
                self.audit_sample(sample_id, model_name, knowledge, child, model_error, audit_run_id=context.run_id)

        def children():
            for sample_id in payload['sample_ids']:
                context.checkpoint()
                sample = SampleRepository(self.db).get(sample_id)
                yield self.jobs.start('MODEL_AUDIT_SAMPLE', sample.task_id,
                    dict(dataset_id=sample.dataset_id, sample_ids=[sample_id], audit_run_id=context.run_id,
                        origin_session_id=payload.get('origin_session_id'),
                        model_name=model_name, model_profile=payload['model_profile'],
                        knowledge_version_id=payload['knowledge_version_id']),
                    execute_image, '审计图像')

        def observe(child):
            if child['status'] in ('PENDING','RUNNING'):
                return
            selected = pending.intersection(child['sample_ids'])
            if selected:
                with self.db.connection() as connection:
                    recorded = connection.execute("""SELECT
                        EXISTS (SELECT 1 FROM json_each(payload_json,'$.completed_sample_ids') WHERE value=?) OR
                        EXISTS (SELECT 1 FROM json_each(payload_json,'$.failed_sample_ids') WHERE value=?)
                        FROM job_runs WHERE job_id=?""", (child['sample_ids'][0],child['sample_ids'][0],context.run_id)).fetchone()[0]
                if not recorded:
                    context.record(sorted(selected), ChildJobError(child))
                pending.difference_update(selected)

        context.join_all(children(), on_progress=observe)

    def status(self, run_id: str) -> dict:
        return JobFamilies(self.db).snapshot(run_id, ('MODEL_AUDIT',)).model_dump()

    def retry(self, run_id: str, sample_ids: Optional[List[str]] = None) -> dict:
        def validate(request):
            try:
                current = [source.model_dump() for source in SampleContent.capture_many(self.db, request['sample_ids'])]
                if current != request['input_sources'] or request['generation_signature'] != self.generation_signature:
                    raise ValueError('源图像或标注内容已变化')
                scopes = ConsistencyScopesSnapshot.model_validate(request['consistency_scopes'])
                for scope in (scopes.subjects, scopes.corpus):
                    ConsistencyScopes(self.db).assert_current(scope)
                from iad_core.knowledge.repository import KnowledgeRepository
                repository = KnowledgeRepository(self.db)
                knowledge = InspectionKnowledge(repository.get(request['knowledge_version_id']))
                for snapshot in [knowledge.snapshot]:
                    for evidence in snapshot.evidence:
                        EvidenceImages(self.db.db_path).path(evidence.image)
            except (ValueError, LookupError, OSError) as error:
                raise ValueError(f'冻结输入不可恢复，请重新启动审计：{error}') from error
        return self.jobs.retry(run_id, ("MODEL_AUDIT",), self.run, sample_ids, validate,
            prepare_request=lambda request: {**request, 'input_sources':
                [source for source in request['input_sources'] if source['sample_id'] in request['sample_ids']]})

    def list(self, dataset_id: str) -> list:
        return [job.model_dump() for job in JobFamilies(self.db).list(dataset_id, ('MODEL_AUDIT',))]

    def cancel(self, run_id: str) -> dict:
        return self.jobs.cancel(self.status(run_id)['run_id'], ("MODEL_AUDIT",))

    def wait(self, run_id: str, timeout: float):
        self.jobs.wait(run_id, timeout)

    def close(self):
        if self.owns_runtime:
            self.runtime.close()
