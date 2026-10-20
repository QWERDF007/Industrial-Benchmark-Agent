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
        criteria = knowledge.context(self.db, sample_id, overview.evidence.source_sha256)
        annotations = AnnotationRepository(self.db).list_by_sample(sample_id)
        planned = self.images.plan(sample, annotations, [])
        joint = JointInspection(self.client, self.images)
        outcome, masks = None, {}
        while True:
            views = self.images.capture_regions(sample, planned, annotations, overview.evidence.source_sha256)
            regions = [view for view in views if view.image.representation == "raw"]
            masks.update({view.image.evidence_id: PreparedImage(view.image, self.images.path(view.image))
                          for view in views if view.image.representation == "annotation_mask"})
            outcome = joint.inspect(criteria.instruction, overview, regions, model_name, cancel, phase,
                                    list(masks.values()), check_ids=criteria.check_ids, previous=outcome)
            steps = outcome.steps
            proposals = [proposal for step in steps for proposal in step.result.region_requests]
            expanded = {tuple(region.crop_bbox): region for region in self.images.plan(sample, annotations, proposals)}
            known = {tuple(region.crop_bbox) for region in outcome.regions}
            planned = [region for box, region in expanded.items() if box not in known]
            if not planned:
                break
        for evidence in outcome.regions:
            evidence.origins = expanded[tuple(evidence.crop_bbox)].origins
        evidence = outcome.regions
        global_view = outcome.global_view
        coverage = Coverage(planned_regions=len(expanded), inspected_regions=len(evidence), complete=True)
        result = VlmResult.model_validate(steps[-1].result.model_dump(exclude={'global_view', 'region_observations', 'check_assessments'}))
        assessments = [assessment.model_copy(deep=True) for assessment in steps[-1].result.check_assessments]
        for assessment in assessments:
            earlier_anomalies = [(step.step_id, earlier) for step in steps[:-1] for earlier in step.result.check_assessments
                if earlier.check_id == assessment.check_id and earlier.status == 'anomaly'
                and earlier.check_id in criteria.independent_check_ids]
            if earlier_anomalies and assessment.status in ('normal', 'not_applicable'):
                assessment.status = 'insufficient'
                for step_id, earlier in earlier_anomalies:
                    conflict = f'{assessment.check_id}在{step_id}仍有异常观察：{earlier.description}'
                    assessment.limitations.append(conflict)
                    result.conflicts.append(conflict)
                assessment.evidence_ids = list(dict.fromkeys([*assessment.evidence_ids,
                    *[eid for _, earlier in earlier_anomalies for eid in earlier.evidence_ids]]))
            if assessment.inspection_regions:
                assessment.status = 'insufficient'
                assessment.limitations.append('模型仍要求补充局部细节，当前证据未能消解该检查项的疑问')
            if assessment.status == 'not_applicable':
                continue
            if assessment.check_id not in criteria.independent_check_ids:
                assessment.status = 'insufficient'
                assessment.limitations.append('知识尚未核实或缺少独立于待审图的支持')
            if assessment.status == 'insufficient':
                result.missing_evidence.append(f'{assessment.check_id}：{assessment.description}；' + '；'.join(assessment.limitations))
            elif result.suggested_label == 'PASS' and assessment.status == 'anomaly':
                result.conflicts.append(f'{assessment.check_id}指出异常：{assessment.description}')
        for step in steps[:-1]:
            if result.suggested_label == "PASS" and (step.result.suggested_label == "FAIL" or (step.result.suggested_label == "UNCERTAIN" and not step.result.region_requests)):
                result.conflicts.append(f"{step.step_id} 建议 {step.result.suggested_label}：{step.result.description}")
            result.conflicts.extend(step.result.conflicts)
            result.missing_evidence.extend(step.result.missing_evidence)
        applicable_normal = any(assessment.check_id in criteria.normal_check_ids & criteria.independent_check_ids
            and assessment.status != 'not_applicable' for assessment in assessments)
        if not applicable_normal:
            result.missing_evidence.append('没有适用且具独立支持的正常判据')
        unsupported_failure = result.suggested_label == 'FAIL' and not any(assessment.status == 'anomaly'
            and assessment.check_id in criteria.independent_check_ids for assessment in assessments)
        if unsupported_failure:
            result.missing_evidence.append('异常结论缺少适用且具独立支持的检查项依据')
        if not applicable_normal or unsupported_failure or (result.suggested_label == "PASS" and (result.conflicts or result.missing_evidence)):
            result.suggested_label = "UNCERTAIN"
            result.reason_category = "INSUFFICIENT_EVIDENCE"
        if file_sha256(target_path) != overview.evidence.source_sha256:
            raise ValueError("Target image changed during inspection")
        return AuditAnalysis(normal_version_id=knowledge.normal.version_id,
            defect_version_id=knowledge.defect.version_id if knowledge.defect else None,
            knowledge_limitations=criteria.limitations, reference_sample_ids=criteria.reference_sample_ids, check_assessments=assessments,
            overview=overview.evidence, coverage=coverage, global_view=global_view, regions=evidence,
            auxiliary_evidence=[mask.evidence for mask in masks.values()], conclusion=result, joint_steps=steps)
