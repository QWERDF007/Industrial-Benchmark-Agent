from typing import List

from iad_core.advisory.analysis import AnalysisModel
from iad_core.evidence.images import EvidenceImages
from iad_core.knowledge.models import KnowledgeSnapshot, KnowledgeSource
from iad_core.knowledge.recheck import KnowledgeRecheck
from iad_core.knowledge.repository import KnowledgeRepository
from iad_core.knowledge.sources import KnowledgeSources
from iad_core.knowledge.support import KnowledgeSupport
from iad_core.knowledge.scopes import KnowledgeScopes
from iad_core.storage.database import Database
from iad_core.storage.review_repository import ReviewRepository
from iad_core.workbench.vision import VlmClient
from iad_core.knowledge.instructions import FrozenMiningPrompt


class FrozenPreset(AnalysisModel):
    snapshot: KnowledgeSnapshot
    sources: List[KnowledgeSource]


class MiningFreeze:
    def __init__(self, db: Database, recheck: KnowledgeRecheck, client: VlmClient):
        self.db, self.recheck, self.client = db, recheck, client
        self.repository = KnowledgeRepository(db)
        self.sources = KnowledgeSources(db)
        self.support = KnowledgeSupport(db)
        self.scopes = KnowledgeScopes(db)

    def presets(self, version_ids: List[str], dataset_id: str) -> List[FrozenPreset]:
        versions = []
        for version_id in version_ids:
            version = self.repository.get(version_id)
            if version.dataset_id != dataset_id or version.kind is not None:
                raise ValueError('父版本须为当前子数据集的统一知识，历史类型知识仅供查看')
            eligible = self.sources.registered(dataset_id).require_available([source.sample_id for source in version.sources])
            pending = self.recheck.pending(version)
            allowed = {conflict.sample_id for conflict in version.conflicts
                if any(event.conflict_id == conflict.conflict_id for event in pending)}
            captured = self.sources.capture_group([source.sample_id for source in version.sources], eligible, frozen_sources=version.sources)
            for source, actual in zip(version.sources, captured):
                review = ReviewRepository(self.db).get_decision(source.sample_id)
                changed = {field for field in type(source).model_fields if getattr(source, field) != getattr(actual, field)}
                if changed and (source.sample_id not in allowed or review is None or not changed <= {'qualification', 'review_sha256'}):
                    raise ValueError('父版本来源已变化，请重新核验')
            for item in version.evidence:
                EvidenceImages(self.db.db_path).path(item.image)
            versions.append(FrozenPreset(snapshot=version, sources=captured))
        return versions

    def validate(self, request: dict, generation_signature: str):
        required = {'model_profile', 'preset_signatures', 'review_events', 'support_policy', 'support_groups',
            'publication_base_version_id', 'input_sources', 'knowledge_preset', 'generation_signature', 'preset_sources', 'mining_prompt'}
        if request.get('request_version') != 5 or not required <= request.keys():
            raise ValueError('旧作业仅供查看，请重新启动统一知识挖掘')
        FrozenMiningPrompt.model_validate(request['mining_prompt'])
        if request.get('scope_run_id'):
            self.scopes.validate_group(request['scope_run_id'], request['sample_ids'], request['parent_version_id'], request['scope_fingerprint'])
        if request['generation_signature'] != generation_signature or request['model_profile'] != self.client.profile.model_dump():
            raise ValueError('模型配置或知识生成规则已变化，请重新启动')
        captured = self.presets(request['knowledge_preset'] or [], request['dataset_id'])
        actual = {item.snapshot.version_id: [source.model_dump() for source in item.sources] for item in captured}
        if actual != request['preset_sources'] or {item.snapshot.version_id: item.snapshot.signature for item in captured} != request['preset_signatures']:
            raise ValueError('冻结父版本来源或签名已变化，请重新启动')
        parent = captured[0].snapshot if captured else None
        if [event.model_dump(mode='json') for event in self.recheck.pending(parent)] != request['review_events']:
            raise ValueError('冻结人工处置已变化，请重新启动重核验')
        sources = self.sources.collect_registered(request['dataset_id'], request['sample_ids'],
            frozen_sources=[KnowledgeSource.model_validate(item) for item in request['input_sources']])
        if [source.model_dump() for source in sources] != request['input_sources']:
            raise ValueError('冻结图组来源已变化，请重新启动')
        inherited = {source.sample_id: source for item in captured for source in item.sources}
        inherited.update({source.sample_id: source for source in sources})
        if self.support.configured().model_dump() != request['support_policy'] or self.support.groups(list(inherited.values())) != request['support_groups']:
            raise ValueError('来源支持策略或独立性分组已变化，请重新启动')
        head = self.repository.current(request['dataset_id'])
        if (head.version_id if head else None) != request['publication_base_version_id']:
            raise ValueError('Knowledge head changed during mining; restart with the current version')
