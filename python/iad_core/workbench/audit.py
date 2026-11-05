import hashlib
import json
import os
import uuid
from typing import List, Optional, TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, Field

from iad_core.advisory.repository import AuditSuggestionRepository
from iad_core.advisory.analysis import AuditAnalysis, AuditConsistencyReference, AuditConsistencyEvidenceReference, NonBlankText
from iad_core.advisory.schemas import AuditSuggestion, ConclusionStatus, EvidenceRefItem, HypothesisItem, ObservationItem, RecommendedAction
from iad_core.dataset.registry import DatasetRegistry
from iad_core.evidence.images import EvidenceImages
from iad_core.evidence.sources import SampleContent
from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository
from iad_core.workbench.query import SampleFilters, SampleQuery, WorkbenchQuery

from iad_core.workbench.vision import VlmClient, MODEL_PROMPT_CONTRACT, GENERATION_PARAMETERS
from iad_core.workbench.audit_prompts import AUDIT_PROMPTS, DEFAULT_AUDIT_PROMPT
from iad_core.workbench.joint import OUTPUT_RESERVE_TOKENS
from iad_core.workbench.inspection import SampleInspection
from iad_core.workbench.audit_synthesis import AuditSynthesis
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.calls import ModelCalls
from iad_core.workbench.job_models import ChildJobError
from iad_core.workbench.knowledge import InspectionKnowledge
from iad_core.consistency.audit import AuditConsistency
from iad_core.consistency.audit_repository import AuditConsistencyRepository
from iad_core.consistency.models import DatasetScope, ConsistencyScopesSnapshot, CorpusScope, Mode, SampleScope
from iad_core.consistency.scopes import ConsistencyScopes
from iad_core.feature.profiles import ImageEncoders

if TYPE_CHECKING:
    from iad_core.workbench.runtime import WorkbenchRuntime

AUDIT_GENERATION_VERSION = 'dataset-audit-v7'

class AuditStart(BaseModel):
    model_config = ConfigDict(extra="forbid")
    dataset_id: str
    submission_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    origin_session_id: Optional[str] = None
    model_name: Optional[str] = None
    knowledge_version_id: Optional[str] = None
    sample_ids: Optional[List[str]] = None
    filters: SampleFilters = Field(default_factory=SampleFilters)
    consistency_mode: Mode = 'exact'
    consistency_profile_id: Optional[str] = None
    corpus_scope: CorpusScope = Field(default_factory=lambda data: DatasetScope(dataset_ids=[data['dataset_id']]))
    instruction: NonBlankText = DEFAULT_AUDIT_PROMPT


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
        return hashlib.sha256(json.dumps([AUDIT_GENERATION_VERSION, AUDIT_PROMPTS, MODEL_PROMPT_CONTRACT, GENERATION_PARAMETERS,
            OUTPUT_RESERVE_TOKENS, AuditAnalysis.model_json_schema()], sort_keys=True).encode()).hexdigest()

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
            repository.save(consistency.retained(audit_run_id, sample_id, scopes, **axis_options))
            raise
        except Exception as failure:
            error = context.failure(failure)
        if SampleContent.capture(self.db, sample_id).model_dump() != expected:
            raise ValueError('源图像或标注内容已变化，请重新启动审计')
        context.update(phase='COMPARING', current_sample_id=sample_id)
        axis = consistency.check(audit_run_id, sample_id, scopes, **axis_options, checkpoint=context.checkpoint)
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
                model_name, context.payload['instruction'], context.cancel, phase)
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
            return existing
        request.model_name = request.model_name or self.client.profile.model_id or os.environ.get('LIVE_VLM_MODEL')
        if request.model_name:
            request.model_name = self.client.resolve_model(request.model_name)
        config = self.registry.resolve(dataset_id=request.dataset_id)
        knowledge = InspectionKnowledge.resolve(self.db, request.dataset_id, request.knowledge_version_id)
        if request.sample_ids is None:
            filters = {**request.filters.model_dump(), "dataset_id": request.dataset_id, "page": 1, "page_size": 200}
            query = SampleQuery.model_validate(filters)
            sample_ids = []
            while True:
                page = WorkbenchQuery(self.db).samples(query)
                sample_ids.extend(item["sample_id"] for item in page["items"])
                if query.page * query.page_size >= page["total"]:
                    break
                query.page += 1
        else:
            sample_ids = list(dict.fromkeys(request.sample_ids))
            for sid in sample_ids:
                sample = SampleRepository(self.db).get(sid)
                if not sample or sample.dataset_id != request.dataset_id:
                    raise ValueError("Audit samples must belong to the selected dataset")
        if not sample_ids:
            raise ValueError("No samples match the audit filters")
        scopes = ConsistencyScopes(self.db).freeze(SampleScope(sample_ids=sample_ids), request.corpus_scope)
        if request.consistency_mode != 'exact':
            encoders = ImageEncoders(self.db)
            selected = encoders.read().selection
            if request.consistency_profile_id is not None or selected is not None:
                request.consistency_profile_id = encoders.profile(request.consistency_profile_id).profile_id
        payload = {"dataset_id": request.dataset_id, "model_name": request.model_name, "sample_ids": sample_ids,
                   "instruction":request.instruction,
                   "submission": submission,
                   "origin_session_id": request.origin_session_id, "model_profile": self.client.profile.model_dump(),
                   "generation_signature": self.generation_signature,
                   "consistency_scopes": scopes.model_dump(mode='json'),
                   "consistency_mode": request.consistency_mode,
                   "consistency_profile_id": request.consistency_profile_id,
                   "input_sources": [source.model_dump() for source in SampleContent.capture_many(self.db, sample_ids)],
                   "knowledge_version_id": knowledge.snapshot.version_id}
        return self.jobs.start("MODEL_AUDIT", config.task.task_id, payload, self.run, "准备冻结知识审计")

    def run(self, context: JobContext):
        payload = context.payload
        if payload['generation_signature'] != self.generation_signature:
            raise ValueError('模型审计规则已变化，请重新启动审计')
        from iad_core.knowledge.repository import KnowledgeRepository
        repository = KnowledgeRepository(self.db)
        knowledge = InspectionKnowledge(repository.get(payload['knowledge_version_id']))
        model_error = None
        model_name = payload['model_name']
        try:
            model_name = self.client.resolve_model(model_name)
            context.update(model_name=model_name, request={**payload['request'], 'model_name': model_name})
        except Exception as error:
            model_error = context.failure(error)
        pending = set(payload['sample_ids'])
        sources = {source['sample_id']: source for source in payload['input_sources']}
        task_id = self.registry.get(payload['dataset_id']).task.task_id
        context.update(phase='AUDITING_IMAGES')

        def execute_image(child):
            sample_id = child.payload['sample_ids'][0]
            child.payload.update(input_sources=[sources[sample_id]],
                instruction=payload['instruction'],
                **{key:payload[key] for key in ('consistency_scopes','consistency_mode','consistency_profile_id')})
            with ModelCalls(self.db).bind(context.run_id, child.checkpoint, state_run_id=child.run_id):
                self.audit_sample(sample_id, model_name, knowledge, child, model_error, audit_run_id=context.run_id)

        def children():
            for sample_id in payload['sample_ids']:
                context.checkpoint()
                yield self.jobs.start('MODEL_AUDIT_SAMPLE', task_id,
                    dict(dataset_id=payload['dataset_id'], sample_ids=[sample_id], audit_run_id=context.run_id,
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
        return self.jobs.status(run_id, ("MODEL_AUDIT",))

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
        return self.jobs.list(dataset_id, ("MODEL_AUDIT",))

    def cancel(self, run_id: str) -> dict:
        return self.jobs.cancel(run_id, ("MODEL_AUDIT",))

    def wait(self, run_id: str, timeout: float):
        self.jobs.wait(run_id, timeout)

    def close(self):
        if self.owns_runtime:
            self.runtime.close()
