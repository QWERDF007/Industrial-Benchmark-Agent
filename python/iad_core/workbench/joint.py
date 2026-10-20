import json
import threading
from dataclasses import dataclass
from typing import Callable, List, Optional

from iad_core.advisory.analysis import GlobalAnalysis, InspectionProgress, JointAnalysis, RegionEvidence, RegionImage, SynthesisStep, ViewAnalysis
from iad_core.evidence.images import EvidenceImages, PreparedImage
from iad_core.workbench.vision import VlmClient

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
                if previous:
                    instruction += '\n此前实际联合观察与证据记录：' + json.dumps([step.model_dump() for step in previous.steps], ensure_ascii=False)
                    instruction += '当前只追加尚缺的原图细节。结合此前证据与新图逐项重审；已补齐的缺证可消解，尚未消解的异常、冲突和限制须保留。'
                if children:
                    instruction += "综合各子批次完整分析，结合当前全图和代表性ROI重新判断；不得用正常批次否定其他批次的异常证据。"
                    instruction += json.dumps([child.step.model_dump() for child in children], ensure_ascii=False)
                else:
                    instruction += "在同一次分析中同时观察全图与所附全部ROI，关联整体结构、各区域关系和产品知识。"
                instruction += (
                    "第一张是全图，其余为同一原图的ROI及配对的二值定位图。annotation_mask白色只表示标注覆盖，"
                    "黑色表示其外或空洞，不代表产品颜色；必须结合相同crop_bbox的raw图观察，不把定位图另计为ROI。"
                    "坐标均为原图像素坐标，裁剪没有拉伸；将局部现象定位回全图，"
                    "综合周边结构、位置与光照解释，标注只是待核实线索，不是缺陷真值。"
                    "global_view描述整体；region_observations必须按region_index为每个输入ROI各给一项观察，从1开始，不遗漏或重复。"
                    "最终结论关联全图与局部证据；evidence_ids只能用所附证据ID或子批次已引用的ID。"
                    "suspect_regions仅列需要补充细看的新线索，用整图0..1000归一化坐标。每项观察简洁明确。区域顺序与来源："
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
                }
                if previous:
                    available.update(eid for step in previous.steps for eid in step.input_evidence_ids)
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
                steps.append(step)
                representative = next((region for region in inputs if region.image.evidence_id in result.evidence_ids), inputs[0])
                nodes.append(JointNode(step, representative))
                phase(InspectionProgress(phase="SYNTHESIS", inspected_regions=len(inspected),
                                         planned_regions=planned_count, completed_batches=len(steps), total_batches=total))
            if len(nodes) == 1:
                return JointOutcome(result.global_view, inspected, steps)
            if level_size and len(nodes) >= level_size:
                raise ValueError("MLLM context cannot combine two child analyses")
            pending = [([], nodes)]
            total += 1
        raise ValueError("No ROI evidence available for joint inspection")
