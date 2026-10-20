import threading
from typing import Callable, List, Optional

from iad_core.advisory.analysis import AuditAnalysis, Coverage, InspectionProgress, RegionImage, VlmResult
from iad_core.dataset.path_safety import validate_sample_image_path
from iad_core.dataset.registry import DatasetRegistry
from iad_core.evidence.images import EvidenceImages, file_sha256
from iad_core.storage.database import Database
from iad_core.storage.repositories import AnnotationRepository, SampleRepository
from iad_core.workbench.normal import NormalProfiles
from iad_core.workbench.vision import VlmClient
from iad_core.workbench.joint import JointInspection


class SampleInspection:
    def __init__(self, db: Database, client: VlmClient):
        self.db, self.client = db, client
        self.profiles = NormalProfiles(db, client)
        self.images = EvidenceImages(db.db_path)

    def inspect(self, sample_id: str, model_name: str, references: List[str], cancel: Optional[threading.Event],
                phase: Callable[[InspectionProgress], None]) -> AuditAnalysis:
        sample = SampleRepository(self.db).get(sample_id)
        target_path = validate_sample_image_path(sample, self.db.db_path)
        phase(InspectionProgress(phase="LEARNING_NORMAL"))
        profile = self.profiles.ensure(sample.dataset_id, model_name, references, cancel)
        context = f"检测目标：{DatasetRegistry(self.db).get(sample.dataset_id).task.inspection_target}。\n已学习的良品模式：{profile.patterns.model_dump_json()}\n"
        if cancel and cancel.is_set():
            raise InterruptedError("Audit cancelled")
        overview = self.images.capture(sample, "overview", "global")
        annotations = AnnotationRepository(self.db).list_by_sample(sample_id)
        planned = self.images.plan(sample, annotations, [])
        regions = [RegionImage(**region.model_dump(), image=self.images.capture(
            sample, "roi", region.source, region.crop_bbox, overview.evidence.source_sha256).evidence) for region in planned]
        joint = JointInspection(self.client, self.images)
        outcome = joint.inspect(context, overview, regions, model_name, cancel, phase, profile.profile_id)
        steps = outcome.steps
        proposals = [proposal for step in steps for proposal in step.result.global_view.suspect_regions]
        expanded = {tuple(region.crop_bbox): region for region in self.images.plan(sample, annotations, proposals)}
        known = {tuple(region.crop_bbox) for region in regions}
        if expanded.keys() - known:
            regions = [RegionImage(**region.model_dump(), image=self.images.capture(
                sample, "roi", region.source, region.crop_bbox, overview.evidence.source_sha256).evidence) for region in expanded.values()]
            outcome = joint.inspect(context + "初次联合观察提出新增区域，请结合全部图像复核。", overview, regions,
                                    model_name, cancel, phase, profile.profile_id)
            for step in outcome.steps:
                step.step_id = "followup_" + step.step_id
                step.child_step_ids = ["followup_" + sid for sid in step.child_step_ids]
            steps += outcome.steps
        for evidence in outcome.regions:
            evidence.origins = expanded[tuple(evidence.crop_bbox)].origins
        evidence = outcome.regions
        global_view = outcome.global_view
        inspected_boxes = {tuple(region.crop_bbox) for region in evidence}
        all_proposals = [proposal for step in steps for proposal in step.result.global_view.suspect_regions]
        remaining = {tuple(region.crop_bbox) for region in self.images.plan(sample, annotations, all_proposals)} - inspected_boxes
        missing = [f"候选区域尚无局部证据：{list(box)}" for box in sorted(remaining)]
        coverage = Coverage(planned_regions=len(evidence) + len(remaining), inspected_regions=len(evidence), complete=not missing, missing=missing)
        result = VlmResult.model_validate(steps[-1].result.model_dump(exclude={'global_view', 'region_observations'}))
        result.missing_evidence.extend(missing)
        for step in steps[:-1]:
            if result.suggested_label == "PASS" and step.result.suggested_label != "PASS":
                result.conflicts.append(f"{step.step_id} 建议 {step.result.suggested_label}：{step.result.description}")
            result.conflicts.extend(step.result.conflicts)
            result.missing_evidence.extend(step.result.missing_evidence)
        if result.suggested_label == "PASS" and (result.conflicts or result.missing_evidence):
            result.suggested_label = "UNCERTAIN"
            result.reason_category = "INSUFFICIENT_EVIDENCE"
        if file_sha256(target_path) != overview.evidence.source_sha256:
            raise ValueError("Target image changed during inspection")
        return AuditAnalysis(profile_id=profile.profile_id, overview=overview.evidence, coverage=coverage, global_view=global_view, regions=evidence, conclusion=result, joint_steps=steps)
