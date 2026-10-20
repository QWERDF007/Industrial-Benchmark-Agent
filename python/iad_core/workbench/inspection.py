import json
import threading
from typing import Callable, List, Optional

from iad_core.advisory.analysis import AuditAnalysis, Coverage, GlobalAnalysis, InspectionProgress, RegionEvidence, ViewAnalysis, VlmResult
from iad_core.dataset.path_safety import validate_sample_image_path
from iad_core.dataset.registry import DatasetRegistry
from iad_core.evidence.images import EvidenceImages, PreparedImage, file_sha256
from iad_core.storage.database import Database
from iad_core.storage.repositories import AnnotationRepository, SampleRepository
from iad_core.workbench.normal import NormalProfiles
from iad_core.workbench.vision import VlmClient


class SampleInspection:
    def __init__(self, db: Database, client: VlmClient):
        self.db, self.client = db, client
        self.profiles = NormalProfiles(db, client)
        self.images = EvidenceImages(db.db_path)

    def inspect(self, sample_id: str, model_name: str, references: List[str], cancel: Optional[threading.Event],
                phase: Callable[[InspectionProgress], None], max_regions: int = 12) -> AuditAnalysis:
        sample = SampleRepository(self.db).get(sample_id)
        target_path = validate_sample_image_path(sample, self.db.db_path)
        phase(InspectionProgress(phase="LEARNING_NORMAL"))
        profile = self.profiles.ensure(sample.dataset_id, model_name, references, cancel)
        context = f"检测目标：{DatasetRegistry(self.db).get(sample.dataset_id).task.inspection_target}。\n已学习的良品模式：{profile.patterns.model_dump_json()}\n"
        if cancel and cancel.is_set():
            raise InterruptedError("Audit cancelled")
        overview = self.images.capture(sample, "overview", "global")
        phase(InspectionProgress(phase="GLOBAL", profile_id=profile.profile_id))
        global_view = self.client.generate(GlobalAnalysis, context +
            f"先观察整幅待审图（原图 {sample.width}×{sample.height}，送模概览 {overview.evidence.sent_size}），比较整体结构、位置、光照和允许的正常变化。"
            "记录可观察证据，不要仅凭位置偏移或亮度变化判断缺陷。若有可疑部位，suspect_regions.bbox_1000 用当前所见整图的 0..1000 归一化坐标标出。", [overview], model_name)
        planned = self.images.plan(sample, AnnotationRepository(self.db).list_by_sample(sample_id), global_view.suspect_regions)
        evidence = []
        for region in planned[:max_regions]:
            if cancel and cancel.is_set():
                raise InterruptedError("Audit cancelled")
            phase(InspectionProgress(phase="REGIONS", profile_id=profile.profile_id, inspected_regions=len(evidence), planned_regions=len(planned)))
            image = self.images.capture(sample, "roi", region.source, region.crop_bbox, overview.evidence.source_sha256)
            observation = self.client.generate(ViewAnalysis, context +
                f"结合整图观察 {global_view.model_dump_json()}，细看此原分辨率局部裁剪。原图候选区域 {region.bbox}，含上下文的实际裁剪 {region.crop_bbox}。"
                f"区域来源与线索：{json.dumps([o.model_dump() for o in region.origins], ensure_ascii=False)}。标注只是待验证线索，不代表缺陷成立。比较局部纹理、边缘、相对位置与光照，解释与良品模式的差异。",
                [image], model_name)
            evidence.append(RegionEvidence(**region.model_dump(), image=image.evidence, observation=observation))
        missing = [f"{r.source}: {r.crop_bbox}" for r in planned[max_regions:]]
        coverage = Coverage(planned_regions=len(planned), inspected_regions=len(evidence), complete=not missing, missing=missing)
        if cancel and cancel.is_set():
            raise InterruptedError("Audit cancelled")
        phase(InspectionProgress(phase="SYNTHESIS", profile_id=profile.profile_id, inspected_regions=len(evidence), planned_regions=len(planned)))
        result = self.client.generate(VlmResult, context + f"重新查看所附全图与全部已检查 ROI 图，综合良品模式及阶段观察作判断。覆盖信息：{coverage.model_dump_json()}。evidence_ids 必须引用所附视觉证据的真实ID；分别说明位置/光照、矛盾与缺证，排除合理正常变化。缺证或覆盖未完成不得建议 PASS。\n整图观察：" +
            global_view.model_dump_json() + "\n局部观察：" + json.dumps([r.model_dump() for r in evidence], ensure_ascii=False),
            [overview, *[PreparedImage(region.image, self.images.path(region.image)) for region in evidence]], model_name)
        available = {overview.evidence.evidence_id, *[region.image.evidence_id for region in evidence]}
        if not set(result.evidence_ids) <= available:
            raise ValueError("MLLM cited unknown visual evidence")
        if not coverage.complete:
            result.missing_evidence.extend(coverage.missing)
        if result.suggested_label == "PASS" and (not coverage.complete or result.conflicts or result.missing_evidence):
            result.suggested_label = "UNCERTAIN"
            result.reason_category = "INSUFFICIENT_EVIDENCE"
        if file_sha256(target_path) != overview.evidence.source_sha256:
            raise ValueError("Target image changed during inspection")
        return AuditAnalysis(profile_id=profile.profile_id, overview=overview.evidence, coverage=coverage, global_view=global_view, regions=evidence, conclusion=result)
