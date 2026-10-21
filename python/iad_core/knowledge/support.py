import os
from collections import defaultdict
from typing import List, Optional

from iad_core.dataset.path_safety import validate_sample_image_path
from iad_core.evidence.images import file_sha256, image_pixel_sha256
from iad_core.duplicate.repository import load_verified_duplicates
from iad_core.knowledge.models import KnowledgeCheck, KnowledgeEvidence, KnowledgeSource, KnowledgeSupportPolicy
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
        task_id = repository.get(sources[0].sample_id).task_id
        samples = repository.list_by_task(task_id)
        pairs, groups = load_verified_duplicates(task_id)
        by_hash = defaultdict(list)
        for source in sources:
            by_hash['file:' + source.sha256].append(source.sample_id)
            if source.pixel_sha256:
                by_hash['pixels:' + source.pixel_sha256].append(source.sample_id)
        if target_sample_id:
            target = repository.get(target_sample_id)
            path = validate_sample_image_path(target, self.db.db_path)
            sha256 = file_sha256(path)
            by_hash['file:' + sha256].append(target_sample_id)
            by_hash['pixels:' + image_pixel_sha256(path, sha256)].append(target_sample_id)
        _, mapping = build_split_groups(samples, verified_pairs=pairs,
                                        verified_groups=[*groups, *by_hash.values()], gold_records={})
        original_ids = {sample.sample_id for sample in samples if sample.data_origin != DataOrigin.AUGMENTED}
        ids = {source.sample_id for source in sources} | ({target_sample_id} if target_sample_id else set())
        return {sid: mapping[sid] for sid in ids if sid in original_ids or sid == target_sample_id}

    @staticmethod
    def assess(checks: List[KnowledgeCheck], evidence: List[KnowledgeEvidence],
               groups: dict[str, str], policy: KnowledgeSupportPolicy):
        owners = {item.image.evidence_id: item.sample_id for item in evidence if item.image.representation == 'raw'}
        for check in checks:
            check.support_limitations = []
            if check.status != 'supported':
                continue
            supports = {groups[owners[eid]] for eid in check.support_evidence_ids
                        if eid in owners and owners[eid] in groups}
            if check.counter_evidence_ids:
                check.status = 'conflicted'
                check.support_limitations = ['存在尚未消解的反对证据']
            elif policy.min_source_groups is None:
                check.status = 'provisional'
                check.support_limitations = ['未配置独立来源支持策略']
            elif len(supports) < policy.min_source_groups:
                check.status = 'provisional'
                check.support_limitations = ['独立来源支持未达配置策略']
