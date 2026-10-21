import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional


from iad_core.dataset.registry import DatasetRegistry
from iad_core.evidence.images import EvidenceImages, OVERVIEW_MAX_SIDE, PreparedImage
from iad_core.knowledge.mining import KnowledgeInput, KnowledgeMiner
from iad_core.knowledge.models import (KnowledgeCorrection, KnowledgeEvidence, KnowledgeSnapshot,
                                      KnowledgeKind, KnowledgeSupportPolicy, KnowledgeSource)
from iad_core.knowledge.defect import DefectVerification, DEFECT_INSTRUCTION
from iad_core.knowledge.evolution import KnowledgeEvolution
from iad_core.knowledge.repository import KnowledgeRepository
from iad_core.knowledge.sources import KnowledgeSources
from iad_core.knowledge.verification import NormalVerification
from iad_core.knowledge.findings import VerificationOutcome
from iad_core.knowledge.trace import KnowledgeTrace
from iad_core.knowledge.requests import MiningStart
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

from iad_core.knowledge.generation import GENERATION_VERSION, NORMAL_INSTRUCTION, generation_signature

KNOWLEDGE_JOB_TYPES = ("NORMAL_KNOWLEDGE", "DEFECT_KNOWLEDGE")


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

    def start(self, *, request: MiningStart, kind: KnowledgeKind, model_name: Optional[str] = None,
              origin_session_id: Optional[str] = None, scope_run_id: Optional[str] = None) -> dict:
        request = MiningStart.model_validate(request)
        if kind not in ('normal', 'defect'):
            raise ValueError('Knowledge kind must be normal or defect')
        model_name = self.client.resolve_model(model_name)
        samples = [SampleRepository(self.db).get(sid) for sid in request.images]
        if any(sample is None for sample in samples):
            raise ValueError('images必须使用已导入且存在的sample_id；不能使用相对路径或猜测引用')
        dataset_ids = {sample.dataset_id for sample in samples}
        if len(dataset_ids) != 1:
            raise ValueError('一个图组必须属于同一数据集')
        dataset_id = samples[0].dataset_id
        config = self.registry.resolve(dataset_id=dataset_id)
        captured_presets = self.frozen.presets(request.knowledge_preset or [], dataset_id)
        presets = [item.snapshot for item in captured_presets]
        if len({version.kind for version in presets}) != len(presets):
            raise ValueError('每种知识类型最多选择一个预设')
        if kind == 'normal' and any(version.kind != 'normal' for version in presets):
            raise ValueError('良品挖掘只接受良品知识预设')
        parent = next((version for version in presets if version.kind == kind), None)
        normal = next((version for version in presets if version.kind == 'normal'), None) if kind == 'defect' else None
        scope_run_id = scope_run_id or self.scopes.active(origin_session_id, dataset_id, kind)
        scope_fingerprint = self.scopes.validate_group(scope_run_id, request.images, parent.version_id if parent else None, normal_version_id=normal.version_id if normal else None) if scope_run_id else None
        review_events = self.recheck.pending(parent)
        if parent and parent.checks and all(check.status == 'conflicted' for check in parent.checks) and not review_events:
            raise ValueError('全部预设判据待人工核实，暂无可用依据继续挖掘')
        if parent and parent.observed_source_ids is None:
            raise ValueError('旧知识缺少显式图组观察信息，请重新核验来源后建立续用版本')
        if parent and parent.kind == 'defect' and normal and parent.normal_version_id and parent.normal_version_id != normal.version_id:
            raise ValueError('异常预设与良品基准依赖不一致')
        if normal and any(item.snapshot.version_id == normal.version_id and
                          (item.comparison_sources != normal.comparison_sources or item.qualified_sources != normal.sources) for item in captured_presets):
            raise ValueError('良品比较基准的人审资格已变化，请先明确重核验正常知识')
        if normal and not any(check.status == 'supported' for check in normal.checks):
            raise ValueError('正常比较知识没有可用判据')
        eligible = self.sources.eligible(dataset_id, kind, normal).require_available(request.images)
        invalid = [sid for sid in request.images if sid not in eligible]
        if invalid:
            raise ValueError('图组包含不合格知识来源：' + json.dumps(invalid, ensure_ascii=False))
        sources = self.sources.collect(dataset_id, request.images, kind, normal)
        head = self.repository.current(dataset_id, kind)
        support_sources = {source.sample_id: source for item in captured_presets if parent and item.snapshot.version_id == parent.version_id
                           for source in item.qualified_sources}
        support_sources.update({source.sample_id: source for source in sources})
        payload = {**request.model_dump(), 'request_version': 3, 'dataset_id': dataset_id, 'kind': kind,
                   'model_name': model_name, 'origin_session_id': origin_session_id, 'scope_run_id': scope_run_id, 'scope_fingerprint': scope_fingerprint, 'model_profile': self.client.profile.model_dump(),
                   'sample_ids': request.images, 'requested_sample_ids': request.images,
                   'preset_signatures': {version.version_id: version.signature for version in presets},
                   'preset_sources': {item.snapshot.version_id: item.model_dump(exclude={'snapshot'}) for item in captured_presets},
                   'review_events': [event.model_dump(mode='json') for event in review_events],
                   'support_policy': self.support.configured().model_dump(),
                   'support_groups': self.support.groups(list(support_sources.values())),
                   'input_sources': [source.model_dump() for source in sources],
                   'generation_signature': self.generation_signature(), 'corrections': [],
                   'comparison_sources': [source.model_dump() for item in captured_presets if parent and item.snapshot.version_id == parent.version_id for source in item.comparison_sources],
                   'parent_version_id': parent.version_id if parent else None,
                   'normal_version_id': normal.version_id if normal else None,
                   'publication_base_version_id': head.version_id if head else None}
        return self.jobs.start('NORMAL_KNOWLEDGE' if kind == 'normal' else 'DEFECT_KNOWLEDGE',
                               config.task.task_id, payload, self.mine, '准备图组知识挖掘')

    def mine(self, context: JobContext):
        payload = context.payload
        context.checkpoint()
        self.frozen.validate(payload['request'], self.generation_signature())
        parent = self.repository.get(payload['parent_version_id']) if payload['parent_version_id'] else None
        review_events = [KnowledgeReviewEvent.model_validate(item) for item in payload['review_events']]
        corrections = [KnowledgeCorrection(check_id=cid, instruction=event.instruction or event.reason)
                       for event in review_events for cid in next(item.check_ids for item in parent.conflicts if item.conflict_id == event.conflict_id)
                       if cid in {check.check_id for check in parent.checks} and event.action in ('revise', 'retire')]
        evolution = KnowledgeEvolution(parent, corrections)
        normal = self.repository.get(payload['normal_version_id']) if payload.get('normal_version_id') else None
        defect = DefectVerification(self.db, self.client, context)
        references = defect.references(normal) if normal else []
        context.update(phase='PREPARING_KNOWLEDGE')
        sources = self.sources.collect(payload['dataset_id'], payload['sample_ids'], payload['kind'], normal)
        if [source.model_dump() for source in sources] != payload['input_sources']:
            raise ValueError('知识来源已变化，请重新启动挖掘')
        signature = hashlib.sha256(json.dumps([payload['generation_signature'], payload.get("normal_version_id"), payload["kind"],
            payload["dataset_id"], payload["model_name"], payload.get("scope_run_id"), payload.get("scope_fingerprint"), payload["model_profile"], payload["knowledge_preset"], payload["preset_sources"], payload["comparison_sources"], payload["support_policy"], payload["support_groups"], payload["review_events"], payload['corrections'], [source.model_dump() for source in sources]], sort_keys=True).encode()).hexdigest()
        current = self.repository.current(payload["dataset_id"], payload["kind"])
        if (current.version_id if current else None) != payload['publication_base_version_id']:
            raise ValueError('Knowledge head changed during mining; restart with the current version')
        if current and current.signature == signature:
            context.record([source.sample_id for source in sources], knowledge_version_id=current.version_id, phase="KNOWLEDGE_REUSED")
            return
        evidence_images = EvidenceImages(self.db.db_path)
        inputs = []
        for source in sources:
            context.checkpoint()
            sample = SampleRepository(self.db).get(source.sample_id)
            images = [evidence_images.capture(sample, "overview" if payload["kind"] == "defect" else "normal", "global" if payload["kind"] == "defect" else "reference", source_sha256=source.sha256)]
            annotations = AnnotationRepository(self.db).list_by_sample(source.sample_id)
            if max(sample.width, sample.height) > OVERVIEW_MAX_SIDE or annotations:
                for region in evidence_images.capture_regions(sample, evidence_images.plan(sample, annotations, []), annotations, source.sha256):
                    images.append(PreparedImage(region.image, evidence_images.path(region.image)))
            inputs.append(KnowledgeInput(source, images))
        KnowledgeTrace(context).inputs(inputs + references)
        observer = KnowledgeObserver(self.client, context)
        observations = observer.observe(parent, inputs, payload['model_name']) if parent else []
        if parent:
            observer.compare(parent, inputs, payload['model_name'], evidence_images)
        evolution_instruction = evolution.instruction
        miner = KnowledgeMiner(self.client, context, observations, parent)
        if normal:
            verification = defect.review(normal, inputs, references, payload['model_name'])
            inputs = [KnowledgeInput(item.source, item.images,
                [finding for finding in verification.findings if finding.sample_id == item.source.sample_id]) for item in inputs]
            context.update(phase='LEARNING_DEFECT')
            instruction = DEFECT_INSTRUCTION + json.dumps({'normal_version_id': normal.version_id,
                'normal_checks': [check.criterion_context() for check in normal.checks]}, ensure_ascii=False) + '\n来源：'
            draft = miner.learn(instruction, inputs + references, payload['model_name'], evolution_instruction).result
            draft = draft.model_copy(deep=True)
            defect.qualify(draft, verification)
        elif payload['kind'] == 'defect':
            context.update(phase='LEARNING_DEFECT')
            instruction = "联合观察本组异常候选全图与真实局部，仅整理可见异常假设。缺少独立正常基准，所有判据保持provisional；标签和区域标注不是缺陷真值。保留正常替代解释和限制。来源："
            draft = miner.learn(instruction, inputs, payload['model_name'], evolution_instruction).result.model_copy(deep=True)
            for check in draft.checks:
                check.status = 'provisional'
            verification = VerificationOutcome([], [], [])
        else:
            context.update(phase='LEARNING_NORMAL')
            draft = miner.learn(NORMAL_INSTRUCTION, inputs, payload['model_name'], evolution_instruction).result
            proposals = {(item.evidence_id, tuple(item.bbox_1000)): item for step in miner.steps for item in step.result.suspects}
            proposals.update({(item.evidence_id, tuple(item.bbox_1000)): item for step in observations if step.purpose == 'current'
                              for observation in step.result.observations for item in observation.suspects})
            draft = draft.model_copy(deep=True, update={'suspects': list(proposals.values())})
            verification = NormalVerification(self.db, self.client, context).review(draft, inputs, payload['model_name'], parent)
        if self.sources.collect(payload['dataset_id'], payload['sample_ids'], payload['kind'], normal) != sources:
            raise ValueError('Knowledge sources changed during mining')
        checks = evolution.checks(draft)
        if parent:
            observer.revisions(parent, draft, checks, inputs, payload['model_name'], evidence_images)
        if payload['kind'] == 'defect' and normal is None:
            for check in checks:
                if check.status == 'supported':
                    check.status = 'provisional'
        for finding in verification.findings:
            if normal:
                for check in checks:
                    if set(check.support_evidence_ids) & {region.image.evidence_id for region in finding.regions}:
                        check.finding_ids.append(finding.finding_id)
                        check.normal_check_ids = list(dict.fromkeys([*check.normal_check_ids, *finding.affected_check_ids]))
            else:
                finding.affected_check_ids = [check.check_id for check in checks if check.title in finding.judgment.affected_check_titles]
        evidence = {image.evidence.evidence_id: KnowledgeEvidence(sample_id=item.source.sample_id, image=image.evidence)
                    for item in inputs + references for image in item.images}
        evidence.update({item.image.evidence_id: item for item in verification.evidence})
        inherited_sources = {source['sample_id']: KnowledgeSource.model_validate(source)
                             for source in payload['preset_sources'][parent.version_id]['qualified_sources']} if parent else {}
        inherited_sources.update({source.sample_id: source for source in sources})
        inherited_evidence = {item.image.evidence_id: item for item in parent.evidence} if parent else {}
        inherited_evidence.update(evidence)
        for check in checks:
            check.support_evidence_ids = [eid for eid in check.support_evidence_ids
                if eid in inherited_evidence and inherited_evidence[eid].sample_id not in {source['sample_id'] for source in payload['comparison_sources']}]
        inherited_findings = {item.finding_id: item for item in parent.findings} if parent else {}
        inherited_findings.update({item.finding_id: item for item in verification.findings})
        support_policy = KnowledgeSupportPolicy.model_validate(payload['support_policy'])
        if self.support.groups(list(inherited_sources.values())) != payload['support_groups']:
            raise ValueError('来源独立性分组已变化，请重新核验')
        conflicts = KnowledgeConflicts.reconcile(parent, checks, observations, list(inherited_evidence.values()), payload['support_groups'])
        applications = self.recheck.evaluate(parent, draft, inputs, review_events, context, self.client, evidence_images, payload['model_name'])
        self.recheck.apply(conflicts, checks, draft, review_events, applications)
        KnowledgeConflicts.quarantine(conflicts, checks, list(inherited_evidence.values()), payload['support_groups'], parent)
        self.support.assess(checks, list(inherited_evidence.values()), payload['support_groups'], support_policy)
        if payload['kind'] == 'defect' and normal is None:
            for check in checks:
                check.support_limitations.append('本次未提供独立正常比较基准')
        snapshot = KnowledgeSnapshot(version_id="knowledge_" + uuid.uuid4().hex, dataset_id=payload["dataset_id"],
            kind=payload["kind"], parent_version_id=payload["parent_version_id"], normal_version_id=payload.get("normal_version_id"),
            model_name=payload["model_name"], generation_version=GENERATION_VERSION, signature=signature,
            summary=draft.summary, checks=checks, revisions=draft.revisions, corrections=corrections,
            comparison_sources=payload['comparison_sources'],
            suspects=draft.suspects, limitations=list(dict.fromkeys([*(parent.limitations if parent else []), *draft.limitations])), sources=list(inherited_sources.values()),
            support_policy=support_policy, support_groups=payload["support_groups"],
            scope_run_id=payload.get("scope_run_id"), observed_source_ids=payload["sample_ids"], knowledge_preset=payload["knowledge_preset"] or [],
            evidence=list(inherited_evidence.values()),
            mining_steps=miner.steps, observation_steps=observations, conflicts=conflicts,
            review_applications=[*(parent.review_applications if parent else []), *applications], findings=list(inherited_findings.values()), verification_steps=verification.steps,
            created_at=datetime.now(timezone.utc).isoformat())
        context.record([source.sample_id for source in sources], persist=lambda conn: self.repository.publish(snapshot, conn, expected_head_version_id=payload['publication_base_version_id'],
            validate=lambda: self.frozen.validate(payload['request'], self.generation_signature())),
                       knowledge_version_id=snapshot.version_id, phase="KNOWLEDGE_PUBLISHED")

    def status(self, run_id: str) -> dict:
        return self.jobs.status(run_id, KNOWLEDGE_JOB_TYPES)

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
        return self.jobs.list(dataset_id, KNOWLEDGE_JOB_TYPES)

    def cancel(self, run_id: str) -> dict:
        return self.jobs.cancel(run_id, KNOWLEDGE_JOB_TYPES)

    def wait(self, run_id: str, timeout: float):
        self.jobs.wait(run_id, timeout)

    def close(self):
        if self.owns_jobs:
            self.jobs.close()
            self.client.close()
