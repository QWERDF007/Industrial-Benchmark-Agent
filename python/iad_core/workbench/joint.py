import json
import math
import threading
from dataclasses import dataclass
from typing import Callable, List, Optional, Tuple

from iad_core.advisory.analysis import InspectionProgress, RegionEvidence, SynthesisStep, VlmResult
from iad_core.evidence.images import EvidenceImages, PreparedImage
from iad_core.workbench.vision import VlmClient

# Bound each request's visual and observation context without limiting total coverage.
ROI_PER_REQUEST = 8


@dataclass(frozen=True)
class JointNode:
    step: SynthesisStep
    representative: PreparedImage


class JointInspection:
    def __init__(self, client: VlmClient, images: EvidenceImages):
        self.client, self.images = client, images

    def inspect(self, context: str, overview: PreparedImage, regions: List[RegionEvidence], model_name: str,
                cancel: Optional[threading.Event], phase: Callable[[InspectionProgress], None], profile_id: str) -> List[SynthesisStep]:
        work: List[Tuple[List[RegionEvidence], List[JointNode]]] = [
            (regions[i:i + ROI_PER_REQUEST], []) for i in range(0, len(regions), ROI_PER_REQUEST)
        ]
        count, total = len(work), len(work)
        while count > 1:
            count = math.ceil(count / ROI_PER_REQUEST)
            total += count
        steps = []
        while work:
            nodes = []
            for batch, children in work:
                if cancel and cancel.is_set():
                    raise InterruptedError("Audit cancelled")
                if children:
                    images = [overview, *[child.representative for child in children]]
                    observations = json.dumps([child.step.model_dump() for child in children], ensure_ascii=False)
                    instruction = "综合所列子批次的完整分析，并重新查看全图和各子批次的代表性 ROI。每个子批次已独立查看其全部图像；不要用当前批次的正常现象否定其他批次的异常证据。"
                else:
                    images = [overview, *[PreparedImage(region.image, self.images.path(region.image)) for region in batch]]
                    observations = json.dumps([region.model_dump() for region in batch], ensure_ascii=False)
                    instruction = "重新查看全图与本批全部 ROI 图，综合良品模式和局部观察。仅判断本批区域，其他批次不属于本批缺证；不得遗漏本批异常。"
                phase(InspectionProgress(phase="SYNTHESIS", profile_id=profile_id, inspected_regions=len(regions),
                                         planned_regions=len(regions), completed_batches=len(steps), total_batches=total))
                result = self.client.generate(VlmResult, context + instruction +
                    "分别解释位置、光照、矛盾与缺证。evidence_ids 只能引用所附图像ID或所列子批次已经引用的ID，不要编造。\n阶段观察：" + observations,
                    images, model_name)
                available = {image.evidence.evidence_id for image in images} | {
                    eid for child in children for eid in child.step.result.evidence_ids
                }
                if not set(result.evidence_ids) <= available:
                    raise ValueError("MLLM cited unknown visual evidence")
                step = SynthesisStep(step_id=f"joint_{len(steps) + 1}", input_evidence_ids=[image.evidence.evidence_id for image in images],
                                     child_step_ids=[child.step.step_id for child in children], result=result)
                steps.append(step)
                representative = next((image for image in images[1:] if image.evidence.evidence_id in result.evidence_ids), images[1])
                nodes.append(JointNode(step, representative))
                phase(InspectionProgress(phase="SYNTHESIS", profile_id=profile_id, inspected_regions=len(regions),
                                         planned_regions=len(regions), completed_batches=len(steps), total_batches=total))
            if len(nodes) == 1:
                return steps
            work = [([], nodes[i:i + ROI_PER_REQUEST]) for i in range(0, len(nodes), ROI_PER_REQUEST)]
        raise ValueError("No ROI evidence available for joint inspection")
