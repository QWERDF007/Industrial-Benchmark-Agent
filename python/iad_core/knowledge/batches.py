from iad_core.workbench.job_models import failure_message
from typing import Optional
from secrets import randbits
from uuid import UUID, uuid4

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.knowledge.instructions import FrozenMiningPrompt, SubmittedMiningPrompt
from iad_core.knowledge.requests import MiningStart
from iad_core.knowledge.scopes import KnowledgeScopeOpen
from iad_core.knowledge.service import KnowledgeService
from iad_core.workbench.jobs import JobContext


class KnowledgeBatchStart(AnalysisModel):
    submission_id: UUID = Field(default_factory=uuid4)
    dataset_id: str
    mining_prompt: SubmittedMiningPrompt
    batch_size: int = Field(default=6, ge=1, le=200)
    starting_version_id: Optional[str] = None


class KnowledgeBatches:
    """A durable scope orchestrator; each child uses the existing joint-image miner."""

    def __init__(self, knowledge: KnowledgeService):
        self.knowledge = knowledge
        self.jobs = knowledge.jobs

    def start(self, request: KnowledgeBatchStart | dict, *, model_name: Optional[str] = None) -> dict:
        request = KnowledgeBatchStart.model_validate(request)
        submission = request.model_dump(mode='json')
        if existing := self.jobs.submitted('KNOWLEDGE_BATCH', submission):
            return existing
        payload = self.prepare(request, model_name=model_name)
        config = self.knowledge.registry.get(request.dataset_id)
        try:
            result = self.jobs.start('KNOWLEDGE_BATCH', config.task.task_id, payload, self.execute, '准备分批知识挖掘')
            if result['request']['scope_run_id'] != payload['scope_run_id']:
                self.knowledge.scopes.set_active(payload['scope_run_id'], False)
            return result
        except BaseException:
            self.knowledge.scopes.set_active(payload['scope_run_id'], False)
            raise

    def prepare(self, request: KnowledgeBatchStart | dict, *, model_name: Optional[str] = None) -> dict:
        request = KnowledgeBatchStart.model_validate(request)
        submission = request.model_dump(mode='json')
        model_name = self.knowledge.client.resolve_model(model_name)
        mining_prompt = FrozenMiningPrompt.capture(request.mining_prompt)
        scope = self.knowledge.scopes.open(KnowledgeScopeOpen(dataset_id=request.dataset_id,
            objective=mining_prompt.configuration.objective, seed=randbits(63), starting_version_id=request.starting_version_id))
        definition = self.knowledge.scopes.state(scope.scope_run_id).definition
        payload = dict(submission, submission=submission, sample_ids=[source.sample_id for source in definition.sources],
            scope_run_id=scope.scope_run_id, scope_fingerprint=definition.fingerprint,
            mining_prompt=mining_prompt.model_dump(),
            generation_signature=self.knowledge.generation_signature(),
            support_policy=self.knowledge.support.configured().model_dump(),
            model_profile=self.knowledge.client.profile.model_dump(), model_name=model_name,
            knowledge_version_id=request.starting_version_id)
        return payload

    def validate(self, request: dict):
        if request['generation_signature'] != self.knowledge.generation_signature() or request['support_policy'] != self.knowledge.support.configured().model_dump():
            raise ValueError('知识生成逻辑或支持策略已变化，请重新建立范围')
        state = self.knowledge.scopes.state(request['scope_run_id'])
        if state.definition.fingerprint != request['scope_fingerprint'] or state.status != 'ACTIVE':
            raise ValueError('分批任务的冻结范围已变化或停止')
        if state.stale:
            raise ValueError('分批任务的冻结来源已变化，请重新建立范围')

    def retry(self, run_id: str, sample_ids: Optional[list[str]] = None) -> dict:
        return self.jobs.retry(run_id, ('KNOWLEDGE_BATCH',), self.execute, sample_ids, validate=self.validate)

    def execute(self, context: JobContext):
        request = context.payload['request']
        self.validate(request)
        state = self.knowledge.scopes.state(request['scope_run_id'])
        # A child may have committed immediately before its parent was interrupted.
        recovered = [sid for sid in request['sample_ids'] if sid in state.observed - state.stale]
        if recovered:
            context.record(recovered, knowledge_version_id=state.current.version_id if state.current else None)
        remaining = [sid for sid in request['sample_ids'] if sid not in state.observed]
        batches = [remaining[start:start + request['batch_size']] for start in range(0, len(remaining), request['batch_size'])]
        context.update(total_batches=len(batches), completed_batches=0, phase='MINING_BATCHES')
        for index, sample_ids in enumerate(batches):
            context.checkpoint()
            self.validate(request)
            scope = self.knowledge.scopes.read(request['scope_run_id'])
            presets = [value for value in (scope.current_version_id,) if value]
            child = self.knowledge.start(request=MiningStart(image_count=len(sample_ids), images=sample_ids,
                knowledge_preset=list(dict.fromkeys(presets))),
                model_name=request['model_name'], scope_run_id=request['scope_run_id'],
                mining_prompt=FrozenMiningPrompt.model_validate(request['mining_prompt']))
            child = context.join(child)
            if child['status'] != 'COMPLETED':
                raise ValueError(f"图组 {index + 1} 未完成（{child['run_id']}）：" +
                                 failure_message(child['errors']))
            context.record(sample_ids, knowledge_version_id=child['knowledge_version_id'],
                           completed_batches=index + 1, active_batch_run_id=None)
