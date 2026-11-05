from dataclasses import dataclass
from typing import List, Optional

from iad_core.evidence.images import EvidenceImages
from iad_core.knowledge.models import KnowledgeEvidence, KnowledgeSnapshot
from iad_core.knowledge.support import KnowledgeSupport
from iad_core.knowledge.repository import KnowledgeRepository
from iad_core.storage.database import Database


@dataclass(frozen=True)
class InspectionCriteria:
    context: dict
    limitations: List[str]
    check_ids: frozenset[str]
    independent_check_ids: frozenset[str]
    reference_sample_ids: List[str]
    visual_references: List[KnowledgeEvidence]


@dataclass(frozen=True)
class InspectionKnowledge:
    snapshot: KnowledgeSnapshot

    @classmethod
    def resolve(cls, db: Database, dataset_id: str, knowledge_version_id: Optional[str] = None) -> 'InspectionKnowledge':
        repository = KnowledgeRepository(db)
        snapshot = repository.get(knowledge_version_id) if knowledge_version_id else repository.current(dataset_id)
        if not snapshot or snapshot.dataset_id != dataset_id or snapshot.kind is not None:
            raise ValueError('请先生成同子数据集的统一知识，再启动审计')
        return cls(snapshot)

    def context(self, db: Database, sample_id: str, source_sha256: str) -> InspectionCriteria:
        checks, independent_ids, references, visuals = [], set(), [], {}
        limitations = []
        images = EvidenceImages(db.db_path)
        groups = KnowledgeSupport(db).groups([source for snapshot in [self.snapshot]
            for source in snapshot.sources], target_sample_id=sample_id)
        for snapshot in [self.snapshot]:
            by_id = {item.image.evidence_id: item for item in snapshot.evidence}
            for check in snapshot.checks:
                independent = []
                for evidence_id in check.support_evidence_ids:
                    evidence = by_id[evidence_id]
                    if (evidence.sample_id != sample_id and evidence.image.source_sha256 != source_sha256
                            and evidence.image.representation == 'raw' and sample_id in groups and evidence.sample_id in groups
                            and groups[evidence.sample_id] != groups[sample_id]):
                        images.path(evidence.image)
                        independent.append(evidence)
                usable = check.status == 'supported' and bool(independent)
                record = check.criterion_context()
                selected = independent[:1]
                counter = [by_id[eid] for eid in check.counter_evidence_ids
                    if by_id[eid].sample_id != sample_id and by_id[eid].image.representation == 'raw'][:1]
                for item in [*selected, *counter]:
                    visuals[item.image.evidence_id] = item
                checks.append({**record, 'independent_support': usable,
                    'support_evidence_ids': [item.image.evidence_id for item in selected],
                    'counter_evidence_ids': [item.image.evidence_id for item in counter]})
                if usable:
                    references.extend(item.sample_id for item in independent)
                if usable:
                    independent_ids.add(check.check_id)
                if not usable:
                    limitation = f'{check.check_id}（{check.title}）：知识尚未核实或缺少独立于待审图的支持'
                    limitations.append(limitation)
            limitations.extend(snapshot.limitations)
        context = {'knowledge_version_id': self.snapshot.version_id,
                'checks': checks, 'limitations': limitations}
        return InspectionCriteria(context, list(dict.fromkeys(limitations)),
            frozenset(check['check_id'] for check in checks),
            frozenset(independent_ids), list(dict.fromkeys(references)), list(visuals.values()))
