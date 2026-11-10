import os
from collections import defaultdict
from typing import List, Optional

from iad_core.dataset.path_safety import validate_sample_image_path
from iad_core.evidence.images import file_sha256, image_pixel_sha256
from iad_core.duplicate.repository import load_leakage_relations
from iad_core.duplicate.index import PixelIndex
from iad_core.knowledge.models import KnowledgeEvidence, KnowledgeSource, KnowledgeStatus, KnowledgeSupportAssessment, KnowledgeSupportPolicy
from iad_core.split.group import build_split_groups
from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository
from iad_core.storage.models import DataOrigin


class KnowledgeSupport:
    def __init__(self, db: Database):
        self.db = db

    @staticmethod
    def configured() -> KnowledgeSupportPolicy:
        value = os.environ.get('IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES')
        return KnowledgeSupportPolicy(min_source_groups=int(value) if value else None)

    def groups(self, sources: List[KnowledgeSource], target_sample_id: Optional[str] = None) -> dict[str, str]:
        if not sources:
            return {}
        repository = SampleRepository(self.db)
        ids = {source.sample_id for source in sources} | ({target_sample_id} if target_sample_id else set())
        selected = repository.get_many(sorted(ids))
        if ids != {sample.sample_id for sample in selected}:
            raise LookupError('知识支持来源或待审图像不存在')
        task_ids = sorted({sample.task_id for sample in selected})
        samples = [sample for task_id in task_ids for sample in repository.list_by_task(task_id)]
        by_hash = defaultdict(list)
        versions = {source.sample_id: source.sha256 for source in sources}
        for source in sources:
            by_hash['file:' + source.sha256].append(source.sample_id)
            if source.pixel_sha256:
                by_hash['pixels:' + source.pixel_sha256].append(source.sample_id)
        if target_sample_id:
            target = repository.get(target_sample_id)
            path = validate_sample_image_path(target, self.db.db_path)
            sha256 = file_sha256(path)
            versions[target_sample_id] = sha256
            by_hash['file:' + sha256].append(target_sample_id)
            by_hash['pixels:' + image_pixel_sha256(path, sha256)].append(target_sample_id)
        current_ids = [sample.sample_id for sample in samples if sample.sample_id in versions
            and os.path.isfile(sample.image_path) and file_sha256(sample.image_path) == versions[sample.sample_id]
            and (entry := PixelIndex(self.db).get(sample.sample_id)) is not None
            and entry.image_sha256 == versions[sample.sample_id]]
        relations = [load_leakage_relations(self.db, task_id, sample_ids=current_ids) for task_id in task_ids]
        pairs = [pair for relation in relations for pair in relation.near_leakage_pairs]
        groups = [group for relation in relations for group in relation.groups]
        _, mapping = build_split_groups(samples, verified_pairs=pairs,
                                        verified_groups=[*groups, *by_hash.values()], gold_records={})
        original_ids = {sample.sample_id for sample in samples if sample.data_origin != DataOrigin.AUGMENTED}
        return {sid: mapping[sid] for sid in ids if sid in original_ids or sid == target_sample_id}

    @staticmethod
    def assess(support_evidence_ids: list[str], counter_evidence_ids: list[str], suggested_status: KnowledgeStatus,
               evidence: List[KnowledgeEvidence], groups: dict[str, str], policy: KnowledgeSupportPolicy) -> KnowledgeSupportAssessment:
        owners = {item.image.evidence_id: item.sample_id for item in evidence if item.image.representation == 'raw'}
        supports = {groups[owners[eid]] for eid in support_evidence_ids if eid in owners and owners[eid] in groups}
        status, limitations = suggested_status, []
        if counter_evidence_ids:
            status, limitations = 'conflicted', ['存在尚未消解的反对证据']
        elif not support_evidence_ids:
            status, limitations = 'provisional', ['当前主张没有有效支持论据']
        elif suggested_status == 'supported':
            if policy.min_source_groups is None:
                status, limitations = 'provisional', ['未配置独立来源支持策略']
            elif len(supports) < policy.min_source_groups:
                status, limitations = 'provisional', ['独立来源支持未达配置策略']
        reason = '；'.join(limitations) or (
            f'完整有效支持来自{len(supports)}个独立图像来源组，达到冻结策略{policy.min_source_groups}，无未解决有效反例'
            if status == 'supported' else f'模型建议{suggested_status}，宿主保留该状态；完整有效支持为{len(supports)}个独立图像来源组')
        return KnowledgeSupportAssessment(status=status,suggested_status=suggested_status,independent_source_count=len(supports),
            support_limitations=limitations,assessment_reason=reason)
