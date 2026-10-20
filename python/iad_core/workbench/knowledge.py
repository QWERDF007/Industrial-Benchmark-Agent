import json
from dataclasses import dataclass
from typing import List, Optional

from iad_core.evidence.images import EvidenceImages
from iad_core.knowledge.models import KnowledgeSnapshot
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
        for snapshot in [self.normal, *([self.defect] if self.defect else [])]:
            by_id = {item.image.evidence_id: item for item in snapshot.evidence}
            for check in snapshot.checks:
                independent = []
                for evidence_id in check.support_evidence_ids:
                    evidence = by_id[evidence_id]
                    if (evidence.sample_id != sample_id and evidence.image.source_sha256 != source_sha256
                            and evidence.image.representation == 'raw'):
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
        instruction = ('依据冻结的数据集知识联合分析真实全图与全部ROI，逐项核验可观察判据，结合结构、位置、光照与允许变化。'
            '不要预设产品或缺陷清单。知识规则是可追溯的判据，不是当前图像的事实；本次结论只能引用实际输入图像。'
            'independent_support=false的规则仅为待验证线索，不能作为唯一判定依据；未知、冲突或不可观察不得给确定PASS。'
            'check_assessments必须覆盖所有冻结check_id各一次；不适用或不可观察必须给出原因和图像依据。'
            '每项须引用至少一张实际raw图像，二值定位图不能独立支持外观判断。'
            '正常判据偏离或异常判据命中均标记anomaly，不可用标注类别直接推断。'
            '若某检查项缺少局部细节，使用其inspection_regions提出实际位置，由系统追加原图裁剪；不要猜测不存在的证据。'
            'findings记录需要复核的实际疑点，每项关联检查点、所见现象、异常假设、合理正常解释、限制与具体复核动作。'
            'location局部位置使用原图像素坐标bbox并引用实际覆盖该位置的raw证据；整体关系疑点使用global位置且引用全图，不伪造局部框。'
            'location.scope=local用于孔内异物、表面色差等可定位现象，必须给出原图bbox；global仅用于整体结构关系，不能用它跳过局部定位。'
            'priority仅表示复核顺序，不是缺陷概率；每个anomaly检查项须关联至少一个finding，无疑点时findings为空。'
            '以一句简短综合建议指出最需要人工复核的位置，避免长篇重复视觉描述。冻结知识：'
            + json.dumps({'normal_version_id': self.normal.version_id, 'defect_version_id': self.defect.version_id if self.defect else None,
                'checks': checks, 'limitations': limitations}, ensure_ascii=False) + '\n')
        return InspectionCriteria(instruction, list(dict.fromkeys(limitations)),
            frozenset(check['check_id'] for check in checks), frozenset(check.check_id for check in self.normal.checks),
            frozenset(independent_ids), list(dict.fromkeys(references)))
