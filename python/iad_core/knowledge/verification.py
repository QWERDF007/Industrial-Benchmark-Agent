import hashlib
import json
import math
import uuid
from dataclasses import dataclass
from typing import List, Optional

from iad_core.advisory.analysis import RegionImage, RegionOrigin
from iad_core.evidence.images import EvidenceImages, PreparedImage
from iad_core.knowledge.mining import KnowledgeInput, OUTPUT_TOKENS
from iad_core.knowledge.models import (FindingTarget, KnowledgeDraft, KnowledgeEvidence, KnowledgeFinding,
                                      KnowledgeVerification, VerificationStep)
from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.vision import VlmClient

VERIFICATION_INSTRUCTION = """联合核验候选良品中的疑点。观察各目标全图、真实ROI和其他来源，关联位置、结构与光照。
来源资格与先前提议都不是事实。区分可支持的异常、正常变化/反光解释、证据不足。
目标不能成为其自身结论的唯一正常支持，相同内容哈希不能当作独立来源。
每个finding_id恰好返回一项，引用其实际ROI和比较证据；affected_check_titles只能使用所给检查项title。
supported表示图像支持疑点，refuted表示正常解释可支持，insufficient表示无法排除或缺证。
不得用正常区域淹没异常，保留分歧、正常替代解释及限制。此结果只供人工核实，不修改标签。
待核验疑点："""


@dataclass(frozen=True)
class VerificationOutcome:
    findings: List[KnowledgeFinding]
    evidence: List[KnowledgeEvidence]
    steps: List[VerificationStep]


@dataclass(frozen=True)
class VerificationGroup:
    result: KnowledgeVerification
    roots: List[VerificationStep]


class NormalVerification:
    def __init__(self, db: Database, client: VlmClient, context: JobContext):
        self.client, self.context = client, context
        self.images, self.samples = EvidenceImages(db.db_path), SampleRepository(db)
        self.steps: List[VerificationStep] = []

    def review(self, draft: KnowledgeDraft, inputs: List[KnowledgeInput], model_name: str) -> VerificationOutcome:
        if not draft.suspects:
            return VerificationOutcome([], [], [])
        self.context.update(phase="VERIFYING_NORMAL")
        self.inputs = inputs
        self.draft = draft
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
            regions = []
            origin = RegionOrigin(source="model", annotation_id=None, label=proposal.description, bbox=bbox)
            for tile in self.images.tiles(sample, bbox, 0.2):
                image = self.images.capture(sample, "roi", "model", tile, source.source.sha256)
                self.by_id[image.evidence.evidence_id] = image
                extra[image.evidence.evidence_id] = KnowledgeEvidence(sample_id=sample.sample_id, image=image.evidence)
                regions.append(RegionImage(**origin.model_dump(), origins=[origin], crop_bbox=tile, image=image.evidence))
            target_by_id[finding_id] = FindingTarget(finding_id=finding_id, sample_id=sample.sample_id,
                                                     bbox=bbox, proposal=proposal, regions=regions)
        targets = list(target_by_id.values())
        result = self._evaluate(targets, list(self.overviews.values()), model_name).result
        judgments = {item.finding_id: item.model_copy(deep=True) for item in result.findings}
        actions: dict[tuple[str, str], List[KnowledgeFinding]] = {}
        findings = []
        for target in targets:
            judgment = judgments[target.finding_id]
            observations = [item for step in self.steps for item in step.result.findings if item.finding_id == target.finding_id]
            statuses = {item.status for item in observations}
            if {'supported', 'refuted'} <= statuses or any(item.conflicts for item in observations):
                judgment.status = "insufficient"
                judgment.conflicts = list(dict.fromkeys([*judgment.conflicts, "核验步骤存在未消解的分歧"]))
            source_sha = self.overviews[target.sample_id].evidence.source_sha256
            if not any(self.by_id[eid].evidence.source_sha256 != source_sha for eid in judgment.evidence_ids):
                judgment.status = "insufficient"
                judgment.limitations.append("缺少独立来源的比较证据")
            finding = KnowledgeFinding(**target.model_dump(), judgment=judgment)
            findings.append(finding)
            for title in judgment.affected_check_titles:
                actions.setdefault((target.sample_id, title), []).append(finding)
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
                        *[item.proposal.evidence_id for item in affected]]))
                    if not check.support_evidence_ids or any(item.judgment.status == 'insufficient' for item in affected):
                        check.status = 'conflicted'
        return VerificationOutcome(findings, list(extra.values()), self.steps)

    def _evaluate(self, targets: List[FindingTarget], references: List[PreparedImage], model_name: str,
                  children: Optional[List[VerificationStep]] = None) -> VerificationGroup:
        self.context.checkpoint()
        children = children or []
        supplied = {image.evidence.evidence_id: image for image in references}
        for target in targets:
            overview = self.overviews[target.sample_id]
            supplied[overview.evidence.evidence_id] = overview
            supplied.update({region.image.evidence_id: self.by_id[region.image.evidence_id] for region in target.regions})
        payload = {'findings': [target.model_dump() for target in targets],
                   'checks': [check.model_dump() for check in self.draft.checks],
                   'sources': [{'source':item.source.model_dump(), 'overview_evidence_id':item.images[0].evidence.evidence_id}
                               for item in self.inputs if item.images[0].evidence.evidence_id in supplied],
                   'child_results': [child.model_dump() for child in children]}
        prompt = VERIFICATION_INSTRUCTION + json.dumps(payload, ensure_ascii=False)
        images = list(supplied.values())
        if not self.client.fits(KnowledgeVerification, prompt, images, model_name, OUTPUT_TOKENS):
            if children:
                raise ValueError("Model context cannot combine normal verification results")
            if len(targets) > 1:
                middle = len(targets)//2
                nodes = [self._evaluate(group, references, model_name) for group in [targets[:middle], targets[middle:]]]
                return VerificationGroup(KnowledgeVerification(findings=[item for node in nodes for item in node.result.findings]),
                                         [root for node in nodes for root in node.roots])
            if len(references) > 1:
                middle = len(references)//2
                nodes = [self._evaluate(targets, group, model_name) for group in [references[:middle], references[middle:]]]
                return self._evaluate(targets, [], model_name, [root for node in nodes for root in node.roots])
            raise ValueError("Model context cannot fit a normal suspect and its visual evidence")
        self.context.checkpoint()
        result = self.client.generate(KnowledgeVerification, prompt, images, model_name, OUTPUT_TOKENS)
        self.context.checkpoint()
        expected = {target.finding_id for target in targets}
        if len(result.findings) != len(expected) or {item.finding_id for item in result.findings} != expected:
            raise ValueError("Normal verification must cover each requested finding exactly once")
        allowed = set(supplied) | {eid for child in children for item in child.result.findings for eid in item.evidence_ids}
        titles = {check.title for check in self.draft.checks}
        for target in targets:
            judgment = next(item for item in result.findings if item.finding_id == target.finding_id)
            if not set(judgment.evidence_ids) <= allowed or not set(judgment.affected_check_titles) <= titles:
                raise ValueError("Normal verification references unknown evidence or checks")
            if not set(judgment.evidence_ids) & {region.image.evidence_id for region in target.regions}:
                raise ValueError("Normal verification must cite the actual suspect ROI")
        step = VerificationStep(step_id="verification_" + uuid.uuid4().hex, input_evidence_ids=list(supplied),
                                child_step_ids=[child.step_id for child in children], result=result)
        self.steps.append(step)
        self.context.update(verification_steps=[step.model_dump() for step in self.steps])
        return VerificationGroup(result, [step])
