import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional


from iad_core.dataset.registry import DatasetRegistry
from iad_core.evidence.images import EvidenceImages, PreparedImage
from iad_core.knowledge.mining import KnowledgeInput, KnowledgeMiner
from iad_core.knowledge.models import (KnowledgeCorrection, KnowledgeEvidence, KnowledgeSnapshot,
                                      KnowledgeSupportPolicy, KnowledgeSource, KNOWLEDGE_JOB_TYPES)
from iad_core.knowledge.evolution import KnowledgeEvolution
from iad_core.knowledge.repository import KnowledgeRepository
from iad_core.knowledge.sources import KnowledgeSources
from iad_core.knowledge.verification import KnowledgeVerification
from iad_core.knowledge.trace import KnowledgeTrace
from iad_core.knowledge.requests import MiningStart
from iad_core.knowledge.instructions import FrozenMiningPrompt
from iad_core.knowledge.observation import KnowledgeObserver
from iad_core.knowledge.support import KnowledgeSupport
from iad_core.knowledge.frozen import MiningFreeze
from iad_core.knowledge.conflicts import KnowledgeConflicts
from iad_core.knowledge.recheck import KnowledgeRecheck
from iad_core.workbench.knowledge_review import KnowledgeReview, KnowledgeReviewEvent
from iad_core.storage.database import Database
from iad_core.storage.repositories import AnnotationRepository, SampleRepository
from iad_core.workbench.jobs import JobContext, JobRunner
from iad_core.workbench.vision import VlmClient

from iad_core.knowledge.generation import GENERATION_VERSION, generation_signature


class KnowledgeService:
    def __init__(self, db: Database, client: Optional[VlmClient] = None, jobs: Optional[JobRunner] = None):
        self.db, self.client = db, client or VlmClient()
        self.owns_jobs = jobs is None
        self.jobs = jobs or JobRunner(db, KNOWLEDGE_JOB_TYPES)
        self.registry = DatasetRegistry(db)
        self.repository = KnowledgeRepository(db)
        self.sources = KnowledgeSources(db)
        self.support = KnowledgeSupport(db)
        self.recheck = KnowledgeRecheck(KnowledgeReview(db))
        self.frozen = MiningFreeze(db, self.recheck, self.client)
        self.scopes = self.frozen.scopes

    generation_signature = staticmethod(generation_signature)

    def start(self, *, request: MiningStart, mining_prompt: FrozenMiningPrompt, model_name: Optional[str] = None,
              origin_session_id: Optional[str] = None, scope_run_id: Optional[str] = None) -> dict:
        request = MiningStart.model_validate(request)
        model_name = self.client.resolve_model(model_name)
        samples = SampleRepository(self.db).get_many(request.images)
        if len(samples) != len(request.images):
            raise ValueError('images必须使用已导入且存在的sample_id')
        dataset_ids = {sample.dataset_id for sample in samples}
        if len(dataset_ids) != 1:
            raise ValueError('一个图组必须属于同一子数据集')
        dataset_id = samples[0].dataset_id
        config = self.registry.resolve(dataset_id=dataset_id)
        captured = self.frozen.presets(request.knowledge_preset or [], dataset_id)
        parent = captured[0].snapshot if captured else None
        scope_run_id = scope_run_id or self.scopes.active(origin_session_id, dataset_id)
        scope_fingerprint = self.scopes.validate_group(scope_run_id, request.images,
            parent.version_id if parent else None) if scope_run_id else None
        if parent and parent.observed_source_ids is None:
            raise ValueError('父版本缺少可核验的观察信息，请重新建立范围')
        sources = self.sources.collect_registered(dataset_id, request.images)
        inherited = {source.sample_id: source for preset in captured for source in preset.sources}
        inherited.update({source.sample_id: source for source in sources})
        head = self.repository.current(dataset_id)
        payload = {**request.model_dump(), 'request_version': 5, 'dataset_id': dataset_id,
            'mining_prompt': mining_prompt.model_dump(), 'model_name': model_name,
            'origin_session_id': origin_session_id, 'scope_run_id': scope_run_id, 'scope_fingerprint': scope_fingerprint,
            'model_profile': self.client.profile.model_dump(), 'sample_ids': request.images, 'requested_sample_ids': request.images,
            'preset_signatures': {preset.snapshot.version_id: preset.snapshot.signature for preset in captured},
            'preset_sources': {preset.snapshot.version_id: [source.model_dump() for source in preset.sources] for preset in captured},
            'review_events': [event.model_dump(mode='json') for event in self.recheck.pending(parent)],
            'support_policy': self.support.configured().model_dump(),
            'support_groups': self.support.groups(list(inherited.values())),
            'input_sources': [source.model_dump() for source in sources],
            'generation_signature': self.generation_signature(), 'corrections': [],
            'parent_version_id': parent.version_id if parent else None,
            'publication_base_version_id': head.version_id if head else None}
        return self.jobs.start('KNOWLEDGE', config.task.task_id, payload, self.mine, '准备图组知识挖掘')

    def mine(self, context: JobContext):
        payload = context.payload
        mining_prompt = FrozenMiningPrompt.model_validate(payload['mining_prompt'])
        context.checkpoint()
        self.frozen.validate(payload['request'], self.generation_signature())
        parent = self.repository.get(payload['parent_version_id']) if payload['parent_version_id'] else None
        review_events = [KnowledgeReviewEvent.model_validate(item) for item in payload['review_events']]
        corrections = [KnowledgeCorrection(check_id=cid, instruction=event.instruction or event.reason)
            for event in review_events for cid in next(item.check_ids for item in parent.conflicts if item.conflict_id == event.conflict_id)
            if cid in {check.check_id for check in parent.checks} and event.action in ('revise', 'retire')]
        evolution = KnowledgeEvolution(parent, corrections)
        context.update(phase='PREPARING_KNOWLEDGE')
        sources = self.sources.collect_registered(payload['dataset_id'], payload['sample_ids'])
        if [source.model_dump() for source in sources] != payload['input_sources']:
            raise ValueError('知识来源已变化，请重新启动挖掘')
        signature = hashlib.sha256(json.dumps([payload['generation_signature'], payload['dataset_id'],
            payload['model_name'], mining_prompt.model_dump(), payload['scope_run_id'], payload['scope_fingerprint'],
            payload['model_profile'], payload['knowledge_preset'], payload['preset_sources'], payload['support_policy'],
            payload['support_groups'], payload['review_events'], payload['corrections'], payload['input_sources']], sort_keys=True).encode()).hexdigest()
        current = self.repository.current(payload['dataset_id'])
        if (current.version_id if current else None) != payload['publication_base_version_id']:
            raise ValueError('Knowledge head changed during mining; restart with the current version')
        if current and current.signature == signature:
            context.record(payload['sample_ids'], knowledge_version_id=current.version_id, phase='KNOWLEDGE_REUSED')
            return
        evidence_images = EvidenceImages(self.db.db_path)
        dataset_format = self.registry.get(payload['dataset_id']).dataset.format
        inputs = []
        for source in sources:
            context.checkpoint()
            sample = SampleRepository(self.db).get(source.sample_id)
            annotations = AnnotationRepository(self.db).list_by_sample(source.sample_id)
            inputs.append(KnowledgeInput(source, evidence_images.prepare(sample, dataset_format, annotations,
                source.sha256, role='overview')))
        KnowledgeTrace(context).inputs(inputs)
        observer = KnowledgeObserver(self.client, context)
        observations = observer.observe(parent, inputs, payload['model_name']) if parent else []
        if parent:
            affected = {item.check_id for step in observations if step.purpose=='current'
                for item in step.result.observations if item.status=='contradicts'}
            observer.compare(parent, inputs, payload['model_name'], evidence_images, affected=affected)
        miner = KnowledgeMiner(self.client, context, observations, parent, mining_prompt=mining_prompt)
        context.update(phase='LEARNING_KNOWLEDGE')
        draft = miner.learn({}, inputs, payload['model_name'], evolution.context).result
        proposals = {(item.evidence_id, tuple(item.bbox_1000)): item for step in miner.steps for item in step.result.suspects}
        proposals.update({(item.evidence_id, tuple(item.bbox_1000)): item for step in observations if step.purpose=='current'
            for observation in step.result.observations for item in observation.suspects})
        draft = draft.model_copy(deep=True, update={'suspects': list(proposals.values())})
        verification = KnowledgeVerification(self.db, self.client, context).review(draft, inputs, payload['model_name'], parent)
        if verification.findings:
            verified_inputs = [KnowledgeInput(item.source,
                [*item.images, *[PreparedImage(extra.image, evidence_images.path(extra.image))
                    for extra in verification.evidence if extra.sample_id == item.source.sample_id]],
                [finding for finding in verification.findings if finding.sample_id == item.source.sample_id])
                for item in inputs]
            context.update(phase='LEARNING_KNOWLEDGE')
            draft = miner.learn({'prior_draft': draft.model_dump()}, verified_inputs, payload['model_name'], evolution.context).result
        if self.sources.collect_registered(payload['dataset_id'], payload['sample_ids']) != sources:
            raise ValueError('Knowledge sources changed during mining')
        checks = evolution.checks(draft)
        if parent:
            observer.revisions(parent, draft, checks, inputs, payload['model_name'], evidence_images)
        for finding in verification.findings:
            finding.affected_check_ids = [check.check_id for check in checks if check.title in finding.judgment.affected_check_titles]
        evidence = {image.evidence.evidence_id: KnowledgeEvidence(sample_id=item.source.sample_id, image=image.evidence)
            for item in inputs for image in item.images}
        evidence.update({item.image.evidence_id: item for item in verification.evidence})
        inherited_sources = {source['sample_id']: KnowledgeSource.model_validate(source)
            for source in payload['preset_sources'].get(payload['parent_version_id'], [])}
        inherited_sources.update({source.sample_id: source for source in sources})
        inherited_evidence = {item.image.evidence_id: item for item in parent.evidence} if parent else {}
        inherited_evidence.update(evidence)
        inherited_findings = {item.finding_id: item for item in parent.findings} if parent else {}
        inherited_findings.update({item.finding_id: item for item in verification.findings})
        policy = KnowledgeSupportPolicy.model_validate(payload['support_policy'])
        if self.support.groups(list(inherited_sources.values())) != payload['support_groups']:
            raise ValueError('来源独立性分组已变化，请重新核验')
        conflicts = KnowledgeConflicts.reconcile(parent, checks, observations, list(inherited_evidence.values()), payload['support_groups'])
        applications = self.recheck.evaluate(parent, draft, inputs, review_events, context, self.client, evidence_images, payload['model_name'])
        self.recheck.apply(conflicts, checks, draft, review_events, applications)
        KnowledgeConflicts.quarantine(conflicts, checks, list(inherited_evidence.values()), payload['support_groups'], parent)
        self.support.assess(checks, list(inherited_evidence.values()), payload['support_groups'], policy)
        snapshot = KnowledgeSnapshot(version_id='knowledge_' + uuid.uuid4().hex, dataset_id=payload['dataset_id'],
            parent_version_id=payload['parent_version_id'], model_name=payload['model_name'],
            generation_version=GENERATION_VERSION, signature=signature, summary=draft.summary,
            checks=checks, revisions=draft.revisions, corrections=corrections, suspects=draft.suspects,
            limitations=list(dict.fromkeys([*(parent.limitations if parent else []), *draft.limitations])),
            sources=list(inherited_sources.values()), evidence=list(inherited_evidence.values()),
            support_policy=policy, support_groups=payload['support_groups'], scope_run_id=payload['scope_run_id'],
            observed_source_ids=list(dict.fromkeys([*(parent.observed_source_ids or [] if parent else []), *payload['sample_ids']])),
            knowledge_preset=payload['knowledge_preset'] or [], mining_steps=miner.steps, observation_steps=observations,
            conflicts=conflicts, mining_prompt=mining_prompt, review_applications=[*(parent.review_applications if parent else []), *applications],
            findings=list(inherited_findings.values()), verification_steps=verification.steps,
            created_at=datetime.now(timezone.utc).isoformat())
        context.record(payload['sample_ids'], persist=lambda conn: self.repository.publish(snapshot, conn,
            expected_head_version_id=payload['publication_base_version_id'],
            validate=lambda: self.frozen.validate(payload['request'], self.generation_signature())),
            knowledge_version_id=snapshot.version_id, phase='KNOWLEDGE_PUBLISHED')

    def status(self, run_id: str) -> dict:
        return self.jobs.status(run_id, (*KNOWLEDGE_JOB_TYPES, 'KNOWLEDGE_BATCH'))

    def retry(self, run_id: str, sample_ids: Optional[List[str]] = None) -> dict:
        def validate(request):
            if sample_ids is not None and list(sample_ids) != request['sample_ids']:
                raise ValueError('知识联合归纳须重试同一有序冻结图组；改变来源范围请重新启动挖掘')
            self.frozen.validate(request, self.generation_signature())
        return self.jobs.retry(run_id, KNOWLEDGE_JOB_TYPES, self.mine, sample_ids, validate)

    def stop_scope(self, scope_run_id: str) -> dict:
        stopped = self.scopes.set_active(scope_run_id, False)
        for run_id in stopped.active_run_ids:
            self.cancel(run_id)
        return self.scopes.read(scope_run_id).model_dump()

    def list(self, dataset_id: str) -> list:
        return self.jobs.list(dataset_id, (*KNOWLEDGE_JOB_TYPES, 'KNOWLEDGE_BATCH'))

    def cancel(self, run_id: str) -> dict:
        return self.jobs.cancel(run_id, (*KNOWLEDGE_JOB_TYPES, 'KNOWLEDGE_BATCH'))

    def delete(self, run_id: str) -> dict:
        return self.jobs.delete(run_id, (*KNOWLEDGE_JOB_TYPES, 'KNOWLEDGE_BATCH'))

    def wait(self, run_id: str, timeout: float):
        self.jobs.wait(run_id, timeout)

    def close(self):
        if self.owns_jobs:
            self.jobs.close()
            self.client.close()
