import json

import threading
from dataclasses import dataclass
from typing import Callable, List, Optional

from iad_core.workbench.audit_prompts import AUDIT_PROMPTS
from iad_core.advisory.analysis import GlobalAnalysis, InspectionProgress, JointAnalysis, RegionEvidence, RegionImage, SynthesisStep, ViewAnalysis
from iad_core.evidence.images import EvidenceImages, PreparedImage
from iad_core.workbench.vision import VlmClient
from iad_core.workbench.findings import FindingLedger

OUTPUT_TOKENS = 16384


@dataclass(frozen=True)
class JointNode:
    step: SynthesisStep
    representative: RegionImage


@dataclass(frozen=True)
class JointOutcome:
    global_view: GlobalAnalysis
    regions: List[RegionEvidence]
    steps: List[SynthesisStep]
    finding_ledger: FindingLedger


class JointInspection:
    def __init__(self, client: VlmClient, images: EvidenceImages):
        self.client, self.images = client, images

    def inspect(self, context: str, overview: PreparedImage, regions: List[RegionImage], model_name: str,
                cancel: Optional[threading.Event], phase: Callable[[InspectionProgress], None],
                annotation_masks: Optional[List[PreparedImage]] = None, *, check_ids: frozenset[str],
                previous: Optional[JointOutcome] = None) -> JointOutcome:
        pending = [(regions, [])]
        steps = list(previous.steps) if previous else []
        inspected = list(previous.regions) if previous else []
        ledger = previous.finding_ledger if previous else FindingLedger()
        planned_count = len(inspected) + len(regions)
        total = len(steps) + 1
        while pending:
            nodes = []
            level_size = sum(len(children) for _, children in pending)
            while pending:
                batch, children = pending.pop(0)
                if cancel and cancel.is_set():
                    raise InterruptedError("Audit cancelled")
                inputs = [child.representative for child in children] if children else batch
                images = [overview]
                for region in inputs:
                    images.append(PreparedImage(region.image, self.images.path(region.image)))
                    images.extend(mask for mask in annotation_masks or [] if mask.evidence.crop_bbox == region.crop_bbox)
                instruction = context
                if ledger.context:
                    instruction += AUDIT_PROMPTS["pending_label"] + json.dumps(ledger.context, ensure_ascii=False) + '\n'
                    instruction += AUDIT_PROMPTS["followup"]
                if previous:
                    instruction += AUDIT_PROMPTS["previous_label"] + json.dumps([step.model_dump() for step in previous.steps], ensure_ascii=False)
                    instruction += AUDIT_PROMPTS["continuation"]
                if children:
                    instruction += AUDIT_PROMPTS["synthesis"]
                    instruction += json.dumps([child.step.model_dump() for child in children], ensure_ascii=False)
                else:
                    instruction += AUDIT_PROMPTS["joint"]
                instruction += (
                    AUDIT_PROMPTS["evidence"]
                    + json.dumps([region.model_dump() for region in inputs], ensure_ascii=False)
                )
                phase(InspectionProgress(phase="SYNTHESIS", inspected_regions=len(inspected),
                                         planned_regions=planned_count, completed_batches=len(steps), total_batches=total))
                if not self.client.fits(JointAnalysis, instruction, images, model_name, OUTPUT_TOKENS):
                    work = children or batch
                    if len(work) < 2:
                        raise ValueError("MLLM context cannot fit the overview, one ROI and reserved output")
                    middle = len(work) // 2
                    pending[0:0] = [([], work[:middle]), ([], work[middle:])] if children else [(work[:middle], []), (work[middle:], [])]
                    total += 1
                    continue
                if cancel and cancel.is_set():
                    raise InterruptedError("Audit cancelled")
                result = self.client.generate(JointAnalysis, instruction, images, model_name, OUTPUT_TOKENS)
                available = {image.evidence.evidence_id for image in images} | {
                    eid for child in children for eid in child.step.result.evidence_ids
                } | {
                    eid for child in children for assessment in child.step.result.check_assessments for eid in assessment.evidence_ids
                } | {
                    eid for child in children for finding in child.step.result.findings for eid in finding.evidence_ids
                }
                if previous:
                    available.update(eid for step in previous.steps for eid in step.input_evidence_ids)
                available.update(eid for finding in ledger.findings for eid in finding.evidence_ids)
                if not set(result.evidence_ids) <= available:
                    raise ValueError("MLLM cited unknown visual evidence")
                assessments = [assessment.check_id for assessment in result.check_assessments]
                if len(assessments) != len(check_ids) or set(assessments) != check_ids:
                    raise ValueError("MLLM check assessments must cover every frozen check exactly once")
                if any(not set(assessment.evidence_ids) <= available for assessment in result.check_assessments):
                    raise ValueError("MLLM check assessment cited unknown visual evidence")
                raw_ids = {image.evidence.evidence_id for image in images if image.evidence.representation == 'raw'}
                raw_ids.update(region.image.evidence_id for region in inspected)
                if any(not set(assessment.evidence_ids) & raw_ids for assessment in result.check_assessments):
                    raise ValueError("MLLM check assessment requires raw visual evidence, not only a localization mask")
                if not {assessment.check_id for assessment in result.check_assessments if assessment.status == 'anomaly'} <= {
                    check_id for finding in result.findings for check_id in finding.check_ids
                }:
                    raise ValueError('MLLM findings must explain every anomalous check')
                if any(not set(region.check_ids) <= check_ids for region in result.region_requests):
                    raise ValueError("MLLM region request cited an unknown check")
                indices = [observation.region_index for observation in result.region_observations]
                if len(indices) != len(inputs) or set(indices) != set(range(1, len(inputs) + 1)):
                    raise ValueError("MLLM ROI observations must cover each supplied region exactly once")
                if not children:
                    observations = {observation.region_index: observation for observation in result.region_observations}
                    inspected.extend(RegionEvidence(**region.model_dump(), observation=ViewAnalysis.model_validate(
                        observations[index].model_dump(exclude={'region_index'}))) for index, region in enumerate(inputs, 1))
                step = SynthesisStep(step_id=f"joint_{len(steps) + 1}", input_evidence_ids=[image.evidence.evidence_id for image in images],
                                     child_step_ids=[child.step.step_id for child in children], result=result)
                visual = {image.evidence.evidence_id: image.evidence for image in [*images, *(annotation_masks or [])]}
                visual.update({region.image.evidence_id: region.image for region in inspected})
                ledger.observe(step.step_id, result, {eid: image for eid, image in visual.items() if eid in available}, check_ids)
                steps.append(step)
                representative = next((region for region in inputs if region.image.evidence_id in result.evidence_ids), inputs[0])
                nodes.append(JointNode(step, representative))
                phase(InspectionProgress(phase="SYNTHESIS", inspected_regions=len(inspected),
                                         planned_regions=planned_count, completed_batches=len(steps), total_batches=total))
            if len(nodes) == 1:
                return JointOutcome(result.global_view, inspected, steps, ledger)
            if level_size and len(nodes) >= level_size:
                raise ValueError("MLLM context cannot combine two child analyses")
            pending = [([], nodes)]
            total += 1
        raise ValueError("No ROI evidence available for joint inspection")
