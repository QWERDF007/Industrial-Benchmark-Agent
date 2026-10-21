import json

from dataclasses import dataclass
from typing import List, Optional

from iad_core.workbench.audit_prompts import AUDIT_PROMPTS
from iad_core.evidence.images import EvidenceImages
from iad_core.knowledge.models import KnowledgeSnapshot
from iad_core.knowledge.support import KnowledgeSupport
from iad_core.knowledge.repository import KnowledgeRepository
from iad_core.storage.database import Database


@dataclass(frozen=True)
class InspectionCriteria:
    instruction: str
    limitations: List[str]
    check_ids: frozenset[str]
    normal_check_ids: frozenset[str]
    independent_check_ids: frozenset[str]
    reference_sample_ids: List[str]


@dataclass(frozen=True)
class InspectionKnowledge:
    normal: KnowledgeSnapshot
    defect: Optional[KnowledgeSnapshot]

    @classmethod
    def resolve(cls, db: Database, dataset_id: str, normal_version_id: Optional[str] = None,
                defect_version_id: Optional[str] = None) -> 'InspectionKnowledge':
        repository = KnowledgeRepository(db)
        normal = repository.get(normal_version_id) if normal_version_id else repository.current(dataset_id, 'normal')
        if not normal or normal.dataset_id != dataset_id or normal.kind != 'normal' or not any(check.status == 'supported' for check in normal.checks):
            raise ValueError('请先挖掘可用的同数据集良品知识，再启动审计')
        defect = repository.get(defect_version_id) if defect_version_id else repository.current(dataset_id, 'defect')
        if defect and (defect.dataset_id != dataset_id or defect.kind != 'defect' or defect.normal_version_id != normal.version_id):
            if defect_version_id:
                raise ValueError('不良知识必须属于同数据集且依据所选良品版本')
            defect = None
        return cls(normal, defect)

    def context(self, db: Database, sample_id: str, source_sha256: str) -> InspectionCriteria:
        checks, independent_ids, references = [], set(), []
        limitations = [] if self.defect else ['尚无匹配的不良知识，仅依据正常判据筛查异常']
        images = EvidenceImages(db.db_path)
        groups = KnowledgeSupport(db).groups([source for snapshot in [self.normal, *([self.defect] if self.defect else [])]
            for source in snapshot.sources], target_sample_id=sample_id)
        for snapshot in [self.normal, *([self.defect] if self.defect else [])]:
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
                checks.append({**record, 'kind': snapshot.kind, 'independent_support': usable})
                if usable and snapshot.kind == 'normal':
                    references.extend(item.sample_id for item in independent)
                if usable:
                    independent_ids.add(check.check_id)
                if not usable:
                    limitation = f'{check.check_id}（{check.title}）：知识尚未核实或缺少独立于待审图的支持'
                    limitations.append(limitation)
            limitations.extend(snapshot.limitations)
        instruction = (AUDIT_PROMPTS["criteria"]
            + json.dumps({'normal_version_id': self.normal.version_id, 'defect_version_id': self.defect.version_id if self.defect else None,
                'checks': checks, 'limitations': limitations}, ensure_ascii=False) + '\n')
        return InspectionCriteria(instruction, list(dict.fromkeys(limitations)),
            frozenset(check['check_id'] for check in checks), frozenset(check.check_id for check in self.normal.checks),
            frozenset(independent_ids), list(dict.fromkeys(references)))
