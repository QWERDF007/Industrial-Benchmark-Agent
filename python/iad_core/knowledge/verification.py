import hashlib
import json
import math
from typing import List, Optional

from iad_core.advisory.analysis import RegionImage, RegionOrigin
from iad_core.evidence.images import EvidenceImages
from iad_core.knowledge.mining import KnowledgeInput
from iad_core.knowledge.models import FindingTarget, KnowledgeDraft, KnowledgeEvidence, KnowledgeFinding, KnowledgeSnapshot
from iad_core.knowledge.findings import FindingVerification, VerificationOutcome
from iad_core.knowledge.candidates import AuditCandidates
from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.vision import VlmClient

VERIFICATION_INSTRUCTION = """联合核验候选良品中的疑点。观察各目标全图、真实ROI和其他来源，关联位置、结构与光照。
来源资格与先前提议都不是事实。区分可支持的异常、正常变化/反光解释、证据不足。
audit_finding保留历史审计观察，其中evidence_ids不是本轮视觉依据，须重新引用当前实际raw与比较图。
目标不能成为其自身结论的唯一正常支持，相同内容哈希不能当作独立来源。
每个finding_id恰好返回一项，引用其实际ROI和比较证据；affected_check_titles只能使用所给检查项title。
supported表示图像支持疑点，refuted表示正常解释可支持，insufficient表示无法排除或缺证。
不得用正常区域淹没异常，保留分歧、正常替代解释及限制。此结果只供人工核实，不修改标签。
待核验疑点："""


class NormalVerification:
    def __init__(self, db: Database, client: VlmClient, context: JobContext):
        self.db, self.client, self.context = db, client, context
        self.images, self.samples = EvidenceImages(db.db_path), SampleRepository(db)
        self.candidates = AuditCandidates(db)

    def review(self, draft: KnowledgeDraft, inputs: List[KnowledgeInput], model_name: str,
               parent: Optional[KnowledgeSnapshot] = None) -> VerificationOutcome:
        self.overviews = {item.source.sample_id: item.images[0] for item in inputs}
        self.by_id = {image.evidence.evidence_id: image for item in inputs for image in item.images}
        owners = {image.evidence.evidence_id: item for item in inputs for image in item.images}
        target_by_id: dict[str, FindingTarget] = {}
        extra: dict[str, KnowledgeEvidence] = {}
        for proposal in draft.suspects:
            self.context.checkpoint()
            source = owners[proposal.evidence_id]
            sample = self.samples.get(source.source.sample_id)
            x, y, x2, y2 = self.by_id[proposal.evidence_id].evidence.crop_bbox
            nx1, ny1, nx2, ny2 = proposal.bbox_1000
            bbox = [math.floor(x + nx1 * (x2-x)/1000), math.floor(y + ny1 * (y2-y)/1000),
                    math.ceil(x + nx2 * (x2-x)/1000), math.ceil(y + ny2 * (y2-y)/1000)]
            identity = json.dumps([sample.sample_id, bbox])
            finding_id = "finding_" + hashlib.sha256(identity.encode()).hexdigest()
            origin = RegionOrigin(source="model", annotation_id=None, label=proposal.description, bbox=bbox)
            target_by_id[finding_id] = FindingTarget(finding_id=finding_id, sample_id=sample.sample_id,
                bbox=bbox, proposal=proposal, origins=[origin], regions=[])
        by_sample = {item.source.sample_id: item for item in inputs}
        for item in inputs:
            for target in self.candidates.targets(item.source):
                target_by_id[target.finding_id] = target
        for previous in parent.findings if parent else []:
            source = by_sample.get(previous.sample_id)
            if source is None or not previous.is_current_candidate(source.source.sha256, source.source.audit_suggestion_ids):
                continue
            if previous.finding_id not in target_by_id:
                target_by_id[previous.finding_id] = FindingTarget(finding_id=previous.finding_id,
                    sample_id=previous.sample_id, bbox=previous.bbox, proposal=None, origins=previous.origins,
                    origin_finding_id=previous.finding_id, origin_suggestion_id=previous.origin_suggestion_id,
                    audit_finding=previous.audit_finding, regions=[])
            elif not previous.origin_suggestion_id:
                target_by_id[previous.finding_id].origin_finding_id = previous.finding_id
        targets = list(target_by_id.values())
        if not targets:
            return VerificationOutcome([], [], [])
        self.context.update(phase="VERIFYING_NORMAL")
        for target in targets:
            source = by_sample[target.sample_id]
            sample = self.samples.get(target.sample_id)
            if not target.origins:
                raise ValueError('Knowledge finding is missing its region origin')
            origin = target.origins[0]
            for tile in self.images.tiles(sample, target.bbox, 0.2):
                image = self.images.capture(sample, "roi", origin.source, tile, source.source.sha256)
                self.by_id[image.evidence.evidence_id] = image
                extra[image.evidence.evidence_id] = KnowledgeEvidence(sample_id=sample.sample_id, image=image.evidence)
                target.regions.append(RegionImage(**origin.model_dump(), origins=target.origins, crop_bbox=tile, image=image.evidence))
        outcome = FindingVerification(self.db, self.client, self.context).review(
            targets, inputs, list(self.overviews.values()), self.by_id, draft.checks, model_name,
            VERIFICATION_INSTRUCTION)
        findings = outcome.findings
        actions: dict[tuple[str, str], List[KnowledgeFinding]] = {}
        for finding in findings:
            for title in finding.judgment.affected_check_titles:
                actions.setdefault((finding.sample_id, title), []).append(finding)
        for (sample_id, title), affected in actions.items():
            sample_eids = {image.evidence.evidence_id for item in inputs if item.source.sample_id == sample_id for image in item.images}
            sample_eids.update(item.image.evidence_id for item in extra.values() if item.sample_id == sample_id)
            for check in draft.checks:
                if check.title != title:
                    continue
                if all(item.judgment.status == 'refuted' for item in affected):
                    check.counter_evidence_ids = [eid for eid in check.counter_evidence_ids if eid not in sample_eids]
                    check.allowed_variations = list(dict.fromkeys([*check.allowed_variations,
                        *[item.judgment.normal_explanation for item in affected if item.judgment.normal_explanation]]))
                else:
                    check.support_evidence_ids = [eid for eid in check.support_evidence_ids if eid not in sample_eids]
                    counter = [eid for item in affected for eid in item.judgment.evidence_ids if eid in sample_eids]
                    check.counter_evidence_ids = list(dict.fromkeys([*check.counter_evidence_ids, *counter,
                        *[item.proposal.evidence_id for item in affected if item.proposal]]))
                    if not check.support_evidence_ids or any(item.judgment.status == 'insufficient' for item in affected):
                        check.status = 'conflicted'
        return VerificationOutcome(findings, list(extra.values()), outcome.steps)
