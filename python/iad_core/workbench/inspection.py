import threading
from typing import Callable, Optional

from iad_core.advisory.analysis import AuditAnalysis, Coverage, InspectionProgress, VlmResult
from iad_core.dataset.path_safety import validate_sample_image_path
from iad_core.evidence.images import EvidenceImages, PreparedImage, file_sha256
from iad_core.storage.database import Database
from iad_core.storage.repositories import AnnotationRepository, SampleRepository
from iad_core.workbench.knowledge import InspectionKnowledge
from iad_core.workbench.vision import VlmClient
from iad_core.workbench.joint import JointInspection


class SampleInspection:
    def __init__(self, db: Database, client: VlmClient):
        self.db, self.client = db, client
        self.images = EvidenceImages(db.db_path)

    def inspect(self, sample_id: str, model_name: str, knowledge: InspectionKnowledge, cancel: Optional[threading.Event],
                phase: Callable[[InspectionProgress], None]) -> AuditAnalysis:
        sample = SampleRepository(self.db).get(sample_id)
        target_path = validate_sample_image_path(sample, self.db.db_path)
        phase(InspectionProgress(phase="PREPARING_KNOWLEDGE"))
        if cancel and cancel.is_set():
            raise InterruptedError("Audit cancelled")
        overview = self.images.capture(sample, "overview", "global")
        context, limitations, blocking, references = knowledge.context(self.db, sample_id, overview.evidence.source_sha256)
        annotations = AnnotationRepository(self.db).list_by_sample(sample_id)
        planned = self.images.plan(sample, annotations, [])
        views = self.images.capture_regions(sample, planned, annotations, overview.evidence.source_sha256)
        regions = [view for view in views if view.image.representation == "raw"]
        masks = [PreparedImage(view.image, self.images.path(view.image)) for view in views if view.image.representation == "annotation_mask"]
        joint = JointInspection(self.client, self.images)
        outcome = joint.inspect(context, overview, regions, model_name, cancel, phase, masks)
        steps = outcome.steps
        proposals = [proposal for step in steps for proposal in step.result.global_view.suspect_regions]
        expanded = {tuple(region.crop_bbox): region for region in self.images.plan(sample, annotations, proposals)}
        known = {tuple(region.crop_bbox) for region in regions}
        if expanded.keys() - known:
            views = self.images.capture_regions(sample, list(expanded.values()), annotations, overview.evidence.source_sha256)
            regions = [view for view in views if view.image.representation == "raw"]
            masks = [PreparedImage(view.image, self.images.path(view.image)) for view in views if view.image.representation == "annotation_mask"]
            outcome = joint.inspect(context + "初次联合观察提出新增区域，请结合全部图像复核。", overview, regions,
                                    model_name, cancel, phase, masks)
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
        result.missing_evidence.extend(blocking)
        for step in steps[:-1]:
            if result.suggested_label == "PASS" and step.result.suggested_label != "PASS":
                result.conflicts.append(f"{step.step_id} 建议 {step.result.suggested_label}：{step.result.description}")
            result.conflicts.extend(step.result.conflicts)
            result.missing_evidence.extend(step.result.missing_evidence)
        if not references or (result.suggested_label == "PASS" and (result.conflicts or result.missing_evidence)):
            result.suggested_label = "UNCERTAIN"
            result.reason_category = "INSUFFICIENT_EVIDENCE"
        if file_sha256(target_path) != overview.evidence.source_sha256:
            raise ValueError("Target image changed during inspection")
        return AuditAnalysis(normal_version_id=knowledge.normal.version_id,
            defect_version_id=knowledge.defect.version_id if knowledge.defect else None,
            knowledge_limitations=limitations, reference_sample_ids=references,
            overview=overview.evidence, coverage=coverage, global_view=global_view, regions=evidence,
            auxiliary_evidence=[mask.evidence for mask in masks], conclusion=result, joint_steps=steps)
