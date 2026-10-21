import hashlib
import json
import math
from typing import List

from iad_core.advisory.analysis import RegionImage, RegionOrigin
from iad_core.evidence.images import EvidenceImages, PreparedImage
from iad_core.knowledge.findings import FindingVerification, VerificationOutcome
from iad_core.knowledge.candidates import AuditCandidates
from iad_core.knowledge.mining import KnowledgeInput
from iad_core.knowledge.models import FindingTarget, KnowledgeDraft, KnowledgeSnapshot
from iad_core.storage.database import Database
from iad_core.storage.repositories import AnnotationRepository, SampleRepository
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.vision import VlmClient

DEFECT_VERIFICATION_INSTRUCTION = """依据冻结的良品知识联合核验可能异常。一起观察目标全图、真实ROI、二值标注图和正常比较图，
结合部件关系、位置和光照分析。标注类别、人工异常和先前疑点只是待核实线索，不是本次视觉结论。
audit_finding保留历史审计观察，其中evidence_ids不是本轮视觉依据，须重新引用当前实际raw与比较图。
annotation_mask白色仅定位标注前景，黑色为其外/空洞，不表示产品颜色或外观；必须与同crop_bbox的raw联合观察。
每个finding_id恰好返回一项，引用其真实raw ROI和正常比较证据。affected_check_titles只用给定正常检查项。
supported为图像支持异常，refuted为正常变化/反光/错标的解释成立，insufficient为无法排除或缺证。
目标或同内容哈希不能作为其自身唯一正常比较；保留正常替代解释、限制和未消解矛盾。不修改任何标签或人审。
待核验疑点："""
DEFECT_INSTRUCTION = """从已核验异常及其正常比较中归纳该数据集可复用的不良知识。
不要假定产品或预设缺陷类别。标注名不等于缺陷事实；refuted与insufficient不能成为已验证异常规则的支持。
每条规则包含可观察异常判据、位置/适用条件、与良品的区别、合理正常变化和证据限制。
supported规则必须引用status=supported的finding所见真实raw ROI；正常来源仅用于比较/反对。
没有已核验异常时checks可以为空；假设只可provisional并说明缺证，不能伪造异常类别。
全图与原生ROI一起解释位置、光照和结构，二值annotation_mask只用于定位，不能将染色当成产品外观。
冻结知识与已核验异常："""


class DefectVerification:
    def __init__(self, db: Database, client: VlmClient, context: JobContext):
        self.db, self.client, self.context = db, client, context
        self.images = EvidenceImages(db.db_path)
        self.candidates = AuditCandidates(db)

    def references(self, normal: KnowledgeSnapshot) -> List[KnowledgeInput]:
        support = {eid for check in normal.checks if check.status == 'supported' for eid in check.support_evidence_ids}
        selected = [item for item in normal.evidence if item.image.evidence_id in support]
        sample_ids = {item.sample_id for item in selected}
        inputs = []
        for source in normal.sources:
            if source.sample_id not in sample_ids:
                continue
            evidence = [item for item in normal.evidence if item.sample_id == source.sample_id]
            overviews = [item for item in evidence if item.image.role == 'normal' and item.image.representation == 'raw']
            if not overviews:
                raise ValueError('Frozen normal knowledge is missing its source overview')
            crops = {tuple(item.image.crop_bbox) for item in selected if item.sample_id == source.sample_id}
            chosen = {item.image.evidence_id: item for item in [overviews[0], *[
                item for item in evidence if tuple(item.image.crop_bbox) in crops]]}
            inputs.append(KnowledgeInput(source, [PreparedImage(item.image, self.images.path(item.image)) for item in chosen.values()]))
        return inputs

    def review(self, normal: KnowledgeSnapshot, inputs: List[KnowledgeInput],
               references: List[KnowledgeInput], model_name: str) -> VerificationOutcome:
        self.context.update(phase='VERIFYING_DEFECT')
        by_id = {image.evidence.evidence_id: image for item in inputs + references for image in item.images}
        targets = []
        for item in inputs:
            sample = SampleRepository(self.db).get(item.source.sample_id)
            annotations = AnnotationRepository(self.db).list_by_sample(sample.sample_id)
            candidates = [(annotation.bbox, None, [RegionOrigin(source='annotation', annotation_id=annotation.annotation_id,
                           label=annotation.raw_label, bbox=[math.floor(annotation.bbox[0]), math.floor(annotation.bbox[1]),
                               math.ceil(annotation.bbox[2]), math.ceil(annotation.bbox[3])])], None)
                          for annotation in annotations if annotation.bbox and annotation.geometry_status != 'INVALID']
            candidates += [(finding.bbox, finding.proposal, finding.origins, finding.finding_id)
                           for finding in normal.findings if finding.sample_id == sample.sample_id
                           and not finding.origin_suggestion_id
                           and finding.is_current_candidate(item.source.sha256, item.source.audit_suggestion_ids)]
            audit_targets = self.candidates.targets(item.source)
            if not candidates and not audit_targets:
                label = '人工异常待核实' if item.source.qualification == 'human_fail' else '目录异常待核实'
                candidates = [([0, 0, sample.width, sample.height], None,
                               [RegionOrigin(source='coverage', label=label, bbox=[0, 0, sample.width, sample.height])], None)]
            pending = []
            for box, proposal, origins, origin_finding_id in candidates:
                bbox = [math.floor(box[0]), math.floor(box[1]), math.ceil(box[2]), math.ceil(box[3])]
                if not origins:
                    origins = [RegionOrigin(source='model', label=proposal.description, bbox=bbox)]
                identity = json.dumps([sample.sample_id, bbox, [origin.model_dump() for origin in origins], origin_finding_id], sort_keys=True)
                pending.append(FindingTarget(finding_id='finding_' + hashlib.sha256(identity.encode()).hexdigest(),
                    sample_id=sample.sample_id, bbox=bbox, proposal=proposal, origins=origins,
                    origin_finding_id=origin_finding_id, regions=[]))
            pending.extend(audit_targets)
            for target in pending:
                origins = target.origins
                bbox = target.bbox
                linked = [annotation for annotation in annotations if annotation.annotation_id in {origin.annotation_id for origin in origins}]
                regions = []
                for tile in self.images.tiles(sample, bbox, 0.2):
                    raw = self.images.capture(sample, 'roi', origins[0].source, tile, item.source.sha256)
                    views = [raw]
                    if linked:
                        views.append(self.images.capture(sample, 'roi', 'annotation', tile, item.source.sha256,
                                                         annotations=linked, annotation_mode='annotation_mask'))
                    for image in views:
                        by_id[image.evidence.evidence_id] = image
                        regions.append(RegionImage(**origins[0].model_dump(), origins=origins, crop_bbox=tile, image=image.evidence))
                        if image.evidence.evidence_id not in {image.evidence.evidence_id for image in item.images}:
                            item.images.append(image)
                target.regions = regions
                targets.append(target)
        outcome = FindingVerification(self.client, self.context).review(targets, inputs + references,
            [image for item in references for image in item.images], by_id,
            [check for check in normal.checks if check.status == 'supported'], model_name,
            DEFECT_VERIFICATION_INSTRUCTION, normal.version_id)
        checks_by_title = {check.title: check.check_id for check in normal.checks}
        for finding in outcome.findings:
            finding.affected_check_ids = [checks_by_title[title] for title in finding.judgment.affected_check_titles]
        return outcome

    @staticmethod
    def qualify(draft: KnowledgeDraft, outcome: VerificationOutcome):
        for check in draft.checks:
            supported = {region.image.evidence_id for finding in outcome.findings if finding.judgment.status == 'supported'
                         for region in finding.regions if region.image.representation == 'raw'
                         and region.image.evidence_id in finding.judgment.evidence_ids}
            check.support_evidence_ids = [eid for eid in check.support_evidence_ids if eid in supported]
            if not check.support_evidence_ids:
                check.status = 'provisional'
                check.limitations = list(dict.fromkeys([*check.limitations, '缺少已核验异常区域的正例支持']))
