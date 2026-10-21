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


class FrozenPreset(AnalysisModel):
    snapshot: KnowledgeSnapshot
    qualified_sources: List[KnowledgeSource]
    comparison_sources: List[KnowledgeSource]


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
            if version.dataset_id != dataset_id:
                raise ValueError('知识预设必须属于本图组数据集')
            baseline = self.repository.get(version.normal_version_id) if version.normal_version_id else None
            eligible = self.sources.eligible(dataset_id, version.kind, baseline).require_available(
                [source.sample_id for source in version.sources + version.comparison_sources])
            pending = self.recheck.pending(version)
            allowed = {conflict.sample_id for conflict in version.conflicts
                       if any(event.conflict_id == conflict.conflict_id for event in pending)}
            qualified, comparison = [], []
            for source in version.sources + version.comparison_sources:
                review = ReviewRepository(self.db).get_decision(source.sample_id)
                qualification = eligible.get(source.sample_id, 'human_' + review.decision.lower() if review else source.qualification)
                actual = self.sources.capture(source.sample_id, qualification, source)
                changed = {field for field in type(source).model_fields if getattr(source, field) != getattr(actual, field)}
                if changed and (source.sample_id not in allowed or review is None
                                or not changed <= {'qualification', 'review_sha256'}):
                    raise ValueError('知识预设来源已变化，请重新核验')
                if source.sample_id not in eligible:
                    if source not in version.comparison_sources and (source.sample_id not in allowed or review is None):
                        raise ValueError('知识预设来源资格已变化，请重新核验')
                    comparison.append(actual)
                else:
                    qualified.append(actual)
            for item in version.evidence:
                EvidenceImages(self.db.db_path).path(item.image)
            versions.append(FrozenPreset(snapshot=version, qualified_sources=qualified, comparison_sources=comparison))
        return versions

    def validate(self, request: dict, generation_signature: str):
        required = {'model_profile', 'preset_signatures', 'review_events', 'support_policy', 'support_groups',
                    'publication_base_version_id', 'input_sources', 'knowledge_preset', 'generation_signature', 'preset_sources'}
        if request.get('request_version') != 3 or not required <= request.keys():
            raise ValueError('旧作业缺少完整冻结输入，只能查看；请重新启动')
        if request.get('scope_run_id'):
            self.scopes.validate_group(request['scope_run_id'], request['sample_ids'], request['parent_version_id'], request['scope_fingerprint'], request['normal_version_id'])
        if request['generation_signature'] != generation_signature or request['model_profile'] != self.client.profile.model_dump():
            raise ValueError('模型配置或知识生成规则已变化，请重新启动')
        captured = self.presets(request['knowledge_preset'] or [], request['dataset_id'])
        versions = [item.snapshot for item in captured]
        actual = {item.snapshot.version_id: item.model_dump(exclude={'snapshot'}) for item in captured}
        if actual != request['preset_sources']:
            raise ValueError('冻结预设来源或人工资格已变化，请重新启动')
        if {version.version_id: version.signature for version in versions} != request['preset_signatures']:
            raise ValueError('冻结知识预设已变化，请重新启动')
        normal = next((version for version in versions if version.version_id == request['normal_version_id']), None)
        parent = next((version for version in versions if version.version_id == request['parent_version_id']), None)
        events = [event.model_dump(mode='json') for event in self.recheck.pending(parent)]
        if events != request['review_events']:
            raise ValueError('冻结人工处置已变化，请重新启动重核验')
        frozen_sources = [KnowledgeSource.model_validate(item) for item in request['input_sources']]
        for source in frozen_sources:
            try:
                actual_metadata = self.sources.capture_metadata(source.sample_id, source.qualification)
            except (OSError, LookupError) as error:
                raise ValueError('冻结图组来源无法核验，请重新启动：' + str(error)) from error
            if actual_metadata.model_dump() != source.model_dump(exclude={'pixel_sha256'}):
                raise ValueError('冻结图组来源已变化，请重新启动')
        sources = self.sources.collect(request['dataset_id'], request['sample_ids'], request['kind'], normal,
                                       frozen_sources=frozen_sources)
        if [source.model_dump() for source in sources] != request['input_sources']:
            raise ValueError('冻结图组来源已变化，请重新启动')
        inherited = {source.sample_id: source for item in captured if parent and item.snapshot.version_id == parent.version_id
                     for source in item.qualified_sources}
        inherited.update({source.sample_id: source for source in sources})
        if (self.support.configured().model_dump() != request['support_policy'] or
                self.support.groups(list(inherited.values())) != request['support_groups']):
            raise ValueError('来源支持策略或独立性分组已变化，请重新启动')
        head = self.repository.current(request['dataset_id'], request['kind'])
        if (head.version_id if head else None) != request['publication_base_version_id']:
            raise ValueError('Knowledge head changed during mining; restart with the current version')
