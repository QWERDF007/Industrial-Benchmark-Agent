from iad_core.workbench.job_models import ChildJobError
import json
from typing import Annotated, Literal
from uuid import UUID, uuid4, uuid5

from pydantic import Field, RootModel, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText
from iad_core.exploration.models import FrozenExplorationPrompt
from iad_core.knowledge.repository import KnowledgeRepository
from iad_core.knowledge.instructions import FrozenMiningPrompt, SubmittedMiningPrompt
from iad_core.knowledge.sources import KnowledgeSources
from iad_core.consistency.workflow import ConsistencyWorkflow
from iad_core.consistency.models import Mode, SimilarityThreshold, DEFAULT_MIN_SIMILARITY
from iad_core.consistency.group_analysis_prompts import DEFAULT_CONSISTENCY_PROMPT
from iad_core.consistency.group_analysis_models import DEFAULT_CANDIDATE_BATCH_SIZE
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.analysis_job_views import AnalysisJobViews


class SelectedDatasets(AnalysisModel):
    submission_id: UUID = Field(default_factory=uuid4)
    dataset_ids: list[str] = Field(min_length=1)

    @model_validator(mode='after')
    def distinct_datasets(self):
        if len(self.dataset_ids) != len(set(self.dataset_ids)):
            raise ValueError('子数据集不能重复')
        return self


class ExplorationWorkflowStart(SelectedDatasets):
    analysis_kind: Literal['exploration'] = 'exploration'
    initial_batch_size: int = Field(default=16, ge=3, le=200)
    batch_size: int = Field(default=8, ge=2, le=199)
    normal_images: list[str] = Field(default_factory=list)
    defect_images: list[str] = Field(default_factory=list)
    prompt: FrozenExplorationPrompt | None = None
    objective: NonBlankText = '探索当前数据集值得核查的外观方向'


class KnowledgeWorkflowStart(SelectedDatasets):
    analysis_kind: Literal['knowledge'] = 'knowledge'
    batch_size: int = Field(default=12, ge=1, le=200)
    mining_prompt: SubmittedMiningPrompt


class ConsistencyWorkflowStart(SelectedDatasets):
    analysis_kind: Literal['consistency'] = 'consistency'
    mode: Mode = 'combined'
    min_similarity: SimilarityThreshold = DEFAULT_MIN_SIMILARITY
    batch_size: int = Field(default=12, ge=2, le=200)
    candidate_batch_size: int = Field(default=DEFAULT_CANDIDATE_BATCH_SIZE, ge=1, le=200)
    instruction: NonBlankText = DEFAULT_CONSISTENCY_PROMPT


class AnalysisWorkflowStart(RootModel[Annotated[
    ExplorationWorkflowStart | KnowledgeWorkflowStart | ConsistencyWorkflowStart,
    Field(discriminator='analysis_kind')]]):
    pass


class AnalysisWorkflows:
    """One selected-scope job with internal domain batches and version chains."""

    def __init__(self, services, runtime):
        self.services, self.runtime = services, runtime
        self.jobs, self.db = runtime.jobs, runtime.db

    def start(self, request: dict, *, model_name: str | None = None) -> dict:
        if request.get('analysis_kind') == 'consistency':
            from iad_core.workbench.module_settings import ModuleSettings
            request = ModuleSettings(self.db).consistency_request(request)
        selected = AnalysisWorkflowStart.model_validate(request).root
        submission = selected.model_dump(mode='json')
        if existing := self.jobs.submitted('ANALYSIS_WORKFLOW', submission):
            return AnalysisJobViews(self.db).summary(self.status(existing['run_id']))
        units = []
        try:
            for dataset_id in selected.dataset_ids:
                config = self.services.knowledge.registry.get(dataset_id)
                identity = str(uuid5(selected.submission_id, dataset_id))
                if isinstance(selected, ExplorationWorkflowStart):
                    sources = KnowledgeSources(self.db)
                    normal = sources.eligible(dataset_id, 'normal').require_available()
                    registered = sources.registered(dataset_id).require_available()
                    defect = {sid: qualification for sid, qualification in registered.items() if sid not in normal}
                    normals = [sid for sid in selected.normal_images if sid in normal]
                    normals += sorted(set(normal) - set(normals))
                    defects = [sid for sid in selected.defect_images if sid in defect and sid not in normal]
                    defects += sorted(set(defect) - set(normal) - set(defects))
                    payload = self.services.exploration_batches.prepare(dict(dataset_id=dataset_id,
                        submission_id=identity, normal_images=normals, defect_images=defects,
                        initial_batch_size=selected.initial_batch_size, batch_size=selected.batch_size,
                        prompt=selected.prompt, objective=selected.objective), model_name=model_name)
                    job_type = 'EXPLORATION_BATCH'
                elif isinstance(selected, KnowledgeWorkflowStart):
                    payload = self.services.knowledge_batches.prepare(dict(dataset_id=dataset_id,
                        submission_id=identity, batch_size=selected.batch_size,
                        mining_prompt=selected.mining_prompt.model_dump()), model_name=model_name)
                    job_type = 'KNOWLEDGE_BATCH'
                else:
                    payload = self.services.consistency_model_batches.prepare(dict(submission_id=identity,
                        subjects=dict(kind='datasets', dataset_ids=[dataset_id]), batch_size=selected.batch_size,
                        candidate_batch_size=selected.candidate_batch_size, instruction=selected.instruction), model_name=model_name)
                    job_type = 'CONSISTENCY_MODEL_BATCH'
                units.append(dict(dataset_id=dataset_id, task_id=config.task.task_id, job_type=job_type, request=payload))
            payload = dict(submission=submission, dataset_id=selected.dataset_ids[0], dataset_ids=selected.dataset_ids,
                analysis_kind=selected.analysis_kind,
                sample_ids=[sid for unit in units for sid in unit['request']['sample_ids']], units=units,
                model_name=self.services.client.resolve_model(model_name), model_profile=self.services.client.profile.model_dump())
            result = self.jobs.start('ANALYSIS_WORKFLOW', units[0]['task_id'], payload, self.execute, '准备所选子数据集的全量分析')
            if result['request']['units'] != units:
                self.release(units)
            return AnalysisJobViews(self.db).summary(result)
        except BaseException:
            self.release(units)
            raise

    def release(self, units):
        for unit in units:
            if unit['job_type'] == 'KNOWLEDGE_BATCH':
                self.services.knowledge.scopes.set_active(unit['request']['scope_run_id'], False)

    def engine(self, job_type):
        return {'EXPLORATION_BATCH': self.services.exploration_batches,
                'KNOWLEDGE_BATCH': self.services.knowledge_batches,
                'CONSISTENCY_MODEL_BATCH': self.services.consistency_model_batches}[job_type]

    def validate(self, request):
        for unit in request['units']:
            self.engine(unit['job_type']).validate(unit['request'])

    def retry(self, run_id: str) -> dict:
        latest = self.status(run_id)
        result = self.jobs.retry(latest['run_id'], ('ANALYSIS_WORKFLOW',), self.execute, validate=self.validate)
        return self.status(result['run_id'])

    def status(self, run_id: str) -> dict:
        return AnalysisJobViews(self.db).status(run_id)

    def list(self, dataset_id: str, analysis_kind: str) -> list:
        return AnalysisJobViews(self.db).list(dataset_id, analysis_kind)

    def execute(self, context: JobContext):
        request = context.payload['request']
        with self.db.connection() as connection:
            rows = connection.execute("""SELECT payload_json FROM job_runs WHERE job_type='ANALYSIS_WORKFLOW'
                AND json_extract(payload_json,'$.root_run_id')=? ORDER BY id""", (context.payload['root_run_id'],)).fetchall()
        unit_runs = {key: rid for row in rows for key, rid in json.loads(row[0]).get('unit_runs', {}).items()}
        pending, results = set(request['sample_ids']), {}
        context.update(unit_runs=unit_runs, dataset_results=[], phase='ANALYZING_SELECTED_DATASETS')
        if request['analysis_kind']=='consistency':
            ConsistencyWorkflow(self.runtime,self.services.client).execute(context)
            return
        model_completed = set()
        wanted = {unit['dataset_id']:pending.intersection(unit['request']['sample_ids']) for unit in request['units']}

        def children():
            for unit in request['units']:
                context.checkpoint()
                dataset_id = unit['dataset_id']
                if not wanted[dataset_id]:
                    continue
                engine = self.engine(unit['job_type'])
                if dataset_id in unit_runs:
                    child = self.jobs.status(unit_runs[dataset_id])
                    if child['status'] not in ('PENDING', 'RUNNING', 'COMPLETED'):
                        child = engine.retry(child['run_id'])
                else:
                    child = self.jobs.start(unit['job_type'], unit['task_id'], unit['request'], engine.execute, '分析当前子数据集')
                yield child

        def observe(state):
            dataset_id = state['dataset_id']
            unit_runs[dataset_id] = state['run_id']
            model_completed.update(state['completed_sample_ids'])
            done = wanted[dataset_id].intersection(state['completed_sample_ids'])
            if done:
                context.record(sorted(done))
                pending.difference_update(done)
                wanted[dataset_id].difference_update(done)
            results[dataset_id] = dict(dataset_id=dataset_id, run_id=state['run_id'], status=state['status'],
                exploration_version_id=state.get('exploration_version_id'), knowledge_version_id=state.get('knowledge_version_id'))
            context.update(unit_runs=dict(unit_runs), dataset_results=list(results.values()))

        for child in context.join_all(children(), on_progress=observe):
            unresolved = wanted[child['dataset_id']] - model_completed
            if unresolved:
                context.record(sorted(unresolved), ChildJobError(child))
                pending.difference_update(unresolved)
