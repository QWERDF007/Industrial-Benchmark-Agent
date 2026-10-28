import hashlib
import json
import time
from datetime import datetime, timezone
from uuid import uuid4

from iad_core.dataset.registry import DatasetRegistry
from iad_core.evidence.images import EvidenceImages
from iad_core.exploration.models import DirectionDraft, ExploredDirection, ExplorationSnapshot, ExplorationStart
from iad_core.exploration.repository import ExplorationRepository
from iad_core.exploration.prompts import ExplorationPrompts
from iad_core.exploration.models import FrozenExplorationPrompt
from iad_core.knowledge.models import KnowledgeEvidence
from iad_core.knowledge.sources import KnowledgeSources
from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository
from iad_core.workbench.jobs import JobContext, JobRunner
from iad_core.workbench.vision import VlmClient


EXPLORATION_JOBS = ('DIRECTION_EXPLORATION',)



class DirectionExploration:
    def __init__(self, db: Database, client: VlmClient, jobs: JobRunner):
        self.db, self.client, self.jobs = db, client, jobs
        self.sources = KnowledgeSources(db)
        self.repository = ExplorationRepository(db)

    def freeze(self, request: ExplorationStart) -> dict:
        config = DatasetRegistry(self.db).resolve(dataset_id=request.dataset_id)
        samples = SampleRepository(self.db)
        for sid in request.normal_images + request.defect_images:
            sample = samples.get(sid)
            if sample is None or sample.dataset_id != request.dataset_id:
                raise ValueError('探索图组必须是当前数据集已导入的真实sample_id')
        return {'normal_sources': [s.model_dump() for s in self.sources.collect(request.dataset_id, request.normal_images, 'normal')],
                'defect_sources': [s.model_dump() for s in self.sources.collect(request.dataset_id, request.defect_images, 'defect')],
                'task_id': config.task.task_id}

    def validate(self, payload: dict):
        current = self.freeze(ExplorationStart.model_validate(payload['exploration_request']))
        if any(current[key] != payload[key] for key in ('normal_sources', 'defect_sources')):
            raise ValueError('探索来源已变化，请重新选择图组启动')
        FrozenExplorationPrompt(text=payload['instruction'])
        prompt = payload['exploration_request'].get('prompt')
        if prompt and FrozenExplorationPrompt.model_validate(prompt).text != payload['instruction']:
            raise ValueError('探索提示词与冻结正文不一致')
        if payload['schema'] != DirectionDraft.model_json_schema():
            raise ValueError('探索生成契约已变化，请重新启动')
        if payload['model_profile'] != self.client.profile.model_dump():
            raise ValueError('模型配置已变化，请重新启动探索')

    def start(self, request: ExplorationStart, model_name: str | None = None, origin_session_id: str | None = None):
        request = ExplorationStart.model_validate(request)
        if request.prompt is None:
            request = request.model_copy(update={'prompt': ExplorationPrompts(self.db).default()})
        captured = self.freeze(request)
        payload = {**captured, 'dataset_id': request.dataset_id, 'exploration_request': request.model_dump(),
                   'sample_ids': request.normal_images + request.defect_images,
                   'input_sources': captured['normal_sources'] + captured['defect_sources'],
                   'model_name': self.client.resolve_model(model_name), 'model_profile': self.client.profile.model_dump(),
                   'instruction': request.prompt.text, 'schema': DirectionDraft.model_json_schema(),
                   'origin_session_id': origin_session_id}
        return self.jobs.start('DIRECTION_EXPLORATION', captured['task_id'], payload, self.explore, '准备联合方向探索')

    def explore(self, context: JobContext):
        payload = context.payload
        self.validate(payload['request'])
        request = ExplorationStart.model_validate(payload['exploration_request'])
        context.update(phase='PREPARING_EXPLORATION', prepared_sources=0)
        images, metadata = [], []
        updated_at = time.monotonic()
        source_by_id = {s['sample_id']: s for s in payload['input_sources']}
        for role, ids in [('normal', request.normal_images), ('defect', request.defect_images)]:
            for sid in ids:
                context.checkpoint()
                sample = SampleRepository(self.db).get(sid)
                image = EvidenceImages(self.db.db_path).capture(sample, 'overview', 'global', source_sha256=source_by_id[sid]['sha256'])
                images.append(image)
                metadata.append({'sample_id': sid, 'candidate_role': role, 'evidence_id': image.evidence.evidence_id})
                if time.monotonic() - updated_at >= .2 or len(images) == len(payload['sample_ids']):
                    context.update(prepared_sources=len(images))
                    updated_at = time.monotonic()
        context.update(phase='CHECKING_CAPACITY')
        instruction = payload['instruction'] + '\n用户探索目标：' + request.objective + '\n本次图组：' + json.dumps(metadata, ensure_ascii=False)
        plan = self.client.plan(DirectionDraft, instruction, images, payload['model_name'], output_reserve=8192)
        context.checkpoint()
        context.update(phase='EXPLORING_DIRECTIONS')
        draft = self.client.generate(plan)
        context.checkpoint()
        context.update(phase='PUBLISHING_DIRECTIONS')
        available = {i.evidence.evidence_id for i in images}
        if any(set(d.evidence_ids) - available for d in draft.directions):
            raise ValueError('探索方向引用了未送入模型的图像')
        self.validate(payload['request'])
        snapshot = ExplorationSnapshot(**draft.model_dump(exclude={'directions'}),
            directions=[ExploredDirection(**d.model_dump(), direction_id='direction_' + uuid4().hex) for d in draft.directions],
            version_id='exploration_' + uuid4().hex, dataset_id=request.dataset_id, run_id=context.run_id,
            created_at=datetime.now(timezone.utc).isoformat(), model_name=payload['model_name'],
            signature=hashlib.sha256(json.dumps(payload['request'], sort_keys=True).encode()).hexdigest(), request=request,
            normal_sources=payload['normal_sources'], defect_sources=payload['defect_sources'],
            evidence=[KnowledgeEvidence(sample_id=m['sample_id'], image=i.evidence) for m, i in zip(metadata, images)])
        context.record(payload['sample_ids'], exploration_version_id=snapshot.version_id, phase='DIRECTIONS_PUBLISHED',
            persist=lambda conn: conn.execute('''INSERT INTO direction_explorations(version_id,dataset_id,run_id,created_at,snapshot_json)
                VALUES(?,?,?,?,?)''', (snapshot.version_id, snapshot.dataset_id, snapshot.run_id, snapshot.created_at, snapshot.model_dump_json())))

    def retry(self, run_id: str):
        return self.jobs.retry(run_id, EXPLORATION_JOBS, self.explore, validate=self.validate)
