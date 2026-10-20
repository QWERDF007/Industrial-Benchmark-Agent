import json
import uuid
from dataclasses import dataclass
from typing import List, Optional

from iad_core.advisory.analysis import RegionImage
from iad_core.evidence.images import PreparedImage
from iad_core.knowledge.mining import KnowledgeInput, OUTPUT_TOKENS
from iad_core.knowledge.models import (FindingTarget, LearnedCheck, KnowledgeEvidence, KnowledgeFinding,
                                      KnowledgeVerification, VerificationStep)
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.vision import VlmClient

EVIDENCE_SCOPE_INSTRUCTION = """依据planned_roi_evidence_ids区分候选完整范围与本轮实际分块。
仅见部分ROI时，局部正常不能排除其他未观察部位；缺证使用insufficient，明确可见的异常可supported。
有child_results时，当前图像是全图和代表性ROI，其他分块及比较依据已在子步骤真实观察；
结合全部子记录综合，不把未重发图像当作没有异常，不伪称重新观察全部局部，不按多数正常抹除少数异常或未消解矛盾。
"""


@dataclass(frozen=True)
class VerificationOutcome:
    findings: List[KnowledgeFinding]
    evidence: List[KnowledgeEvidence]
    steps: List[VerificationStep]


@dataclass(frozen=True)
class VerificationGroup:
    result: KnowledgeVerification
    roots: List[VerificationStep]


class FindingVerification:
    def __init__(self, client: VlmClient, context: JobContext):
        self.client, self.context = client, context
        self.steps: List[VerificationStep] = []

    def review(self, targets: List[FindingTarget], inputs: List[KnowledgeInput], references: List[PreparedImage],
               images: dict[str, PreparedImage], checks: List[LearnedCheck], model_name: str,
               instruction: str, normal_version_id: Optional[str] = None) -> VerificationOutcome:
        self.inputs, self.by_id, self.checks = inputs, images, checks
        self.targets = {target.finding_id: target for target in targets}
        self.owners = {image.evidence.evidence_id: item.source.sample_id for item in inputs for image in item.images}
        self.instruction, self.normal_version_id = EVIDENCE_SCOPE_INSTRUCTION + instruction, normal_version_id
        self.reference_ids = {image.evidence.evidence_id for image in references if image.evidence.representation == 'raw'}
        self.overviews = {}
        for item in inputs:
            self.overviews.setdefault(item.source.sample_id, item.images[0])
        result = self._evaluate(targets, references, model_name).result
        judgments = {item.finding_id: item.model_copy(deep=True) for item in result.findings}
        findings = []
        for target in targets:
            judgment = judgments[target.finding_id]
            observations = [item for step in self.steps for item in step.result.findings if item.finding_id == target.finding_id]
            judgment.evidence_ids = list(dict.fromkeys(eid for item in observations for eid in item.evidence_ids))
            judgment.affected_check_titles = list(dict.fromkeys(title for item in observations for title in item.affected_check_titles))
            judgment.limitations = list(dict.fromkeys(limit for item in observations for limit in item.limitations))
            judgment.conflicts = list(dict.fromkeys(conflict for item in observations for conflict in item.conflicts))
            statuses = {item.status for item in observations}
            if {'supported', 'refuted'} <= statuses or any(item.conflicts for item in observations):
                judgment.status = 'insufficient'
                judgment.conflicts = list(dict.fromkeys([*judgment.conflicts, '核验步骤存在未消解的分歧']))
            source_sha = self.overviews[target.sample_id].evidence.source_sha256
            if not any(eid in self.reference_ids and self.by_id[eid].evidence.source_sha256 != source_sha
                       for eid in judgment.evidence_ids):
                judgment.status = 'insufficient'
                judgment.limitations.append('缺少独立来源的比较证据')
            findings.append(KnowledgeFinding(**target.model_dump(), judgment=judgment))
        return VerificationOutcome(findings, [], self.steps)

    def _evaluate(self, targets: List[FindingTarget], references: List[PreparedImage], model_name: str,
                  children: Optional[List[VerificationStep]] = None) -> VerificationGroup:
        self.context.checkpoint()
        children = children or []
        views = targets
        if children:
            views = []
            order = {'supported': 0, 'insufficient': 1, 'refuted': 2}
            for target in targets:
                observations = sorted([judgment for child in children for judgment in child.result.findings
                                       if judgment.finding_id == target.finding_id], key=lambda item: order[item.status])
                raw = {region.image.evidence_id: region for region in target.regions if region.image.representation == 'raw'}
                representative = next((raw[eid] for item in observations for eid in item.evidence_ids if eid in raw), None)
                if representative is None:
                    raise ValueError('Child verification is missing actual target ROI evidence')
                views.append(target.model_copy(update={'regions': [region for region in target.regions
                    if region.crop_bbox == representative.crop_bbox]}))
        supplied = {image.evidence.evidence_id: image for image in references}
        for target in views:
            overview = self.overviews[target.sample_id]
            supplied[overview.evidence.evidence_id] = overview
            supplied.update({region.image.evidence_id: self.by_id[region.image.evidence_id] for region in target.regions})
        payload = {'normal_version_id': self.normal_version_id, 'findings': [target.model_dump() for target in views],
                   'planned_roi_evidence_ids': {target.finding_id: [region.image.evidence_id
                       for region in self.targets[target.finding_id].regions if region.image.representation == 'raw'] for target in targets},
                   'checks': [check.model_dump() for check in self.checks],
                   'sources': [{'source':item.source.model_dump(), 'overview_evidence_id':item.images[0].evidence.evidence_id}
                               for item in self.inputs if item.images[0].evidence.evidence_id in supplied],
                   'child_results': [child.model_dump() for child in children]}
        prompt = self.instruction + json.dumps(payload, ensure_ascii=False)
        images = list(supplied.values())
        if not self.client.fits(KnowledgeVerification, prompt, images, model_name, OUTPUT_TOKENS):
            if children:
                raise ValueError("Model context cannot combine knowledge verification results")
            if len(targets) > 1:
                middle = len(targets)//2
                nodes = [self._evaluate(group, references, model_name) for group in [targets[:middle], targets[middle:]]]
                return VerificationGroup(KnowledgeVerification(findings=[item for node in nodes for item in node.result.findings]),
                                         [root for node in nodes for root in node.roots])
            region_bundles: dict[tuple[int, ...], List[RegionImage]] = {}
            for region in targets[0].regions:
                region_bundles.setdefault(tuple(region.crop_bbox), []).append(region)
            regions = list(region_bundles.values())
            if len(regions) > 1:
                middle = len(regions)//2
                nodes = [self._evaluate([targets[0].model_copy(update={'regions': [region for bundle in group for region in bundle]})],
                                       references, model_name) for group in [regions[:middle], regions[middle:]]]
                return self._evaluate(targets, [], model_name, [root for node in nodes for root in node.roots])
            reference_bundles: dict[tuple[str, tuple[int, ...]], List[PreparedImage]] = {}
            for image in references:
                reference_bundles.setdefault((self.owners[image.evidence.evidence_id], tuple(image.evidence.crop_bbox)), []).append(image)
            comparison_groups = list(reference_bundles.values())
            if len(comparison_groups) > 1:
                middle = len(comparison_groups)//2
                nodes = [self._evaluate(targets, [image for bundle in group for image in bundle], model_name)
                         for group in [comparison_groups[:middle], comparison_groups[middle:]]]
                return self._evaluate(targets, [], model_name, [root for node in nodes for root in node.roots])
            raise ValueError("Model context cannot fit a finding and its visual evidence")
        self.context.checkpoint()
        result = self.client.generate(KnowledgeVerification, prompt, images, model_name, OUTPUT_TOKENS)
        self.context.checkpoint()
        expected = {target.finding_id for target in targets}
        if len(result.findings) != len(expected) or {item.finding_id for item in result.findings} != expected:
            raise ValueError("Knowledge verification must cover each requested finding exactly once")
        allowed = set(supplied) | {eid for child in children for item in child.result.findings for eid in item.evidence_ids}
        titles = {check.title for check in self.checks}
        for target in targets:
            judgment = next(item for item in result.findings if item.finding_id == target.finding_id)
            if not set(judgment.evidence_ids) <= allowed or not set(judgment.affected_check_titles) <= titles:
                raise ValueError("Knowledge verification references unknown evidence or checks")
            if not set(judgment.evidence_ids) & {region.image.evidence_id for region in target.regions
                                                if region.image.representation == 'raw'}:
                raise ValueError("Knowledge verification must cite the actual raw ROI")
        step = VerificationStep(step_id="verification_" + uuid.uuid4().hex, input_evidence_ids=list(supplied),
                                child_step_ids=[child.step_id for child in children], result=result)
        self.steps.append(step)
        self.context.update(verification_steps=[step.model_dump() for step in self.steps])
        return VerificationGroup(result, [step])
