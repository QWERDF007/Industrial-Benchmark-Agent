import hashlib
import json
import threading

from pydantic import Field, create_model
from typing import Literal

from iad_core.advisory.analysis import AuditAnalysis, AuditBasis, AuditConclusion, AuditImageSource, AuditSliceCandidate, InspectionProgress
from iad_core.advisory.conclusions import NonBlankConclusion
from iad_core.consistency.audit_models import AuditConsistencyRecord
from iad_core.consistency.repository import ConsistencyRepository
from iad_core.dataset.registry import DatasetRegistry
from iad_core.evidence.images import EvidenceImages, PreparedImage
from iad_core.evidence.sources import SampleContent
from iad_core.storage.database import Database
from iad_core.storage.repositories import AnnotationRepository, SampleRepository
from iad_core.workbench.joint import OUTPUT_RESERVE_TOKENS
from iad_core.workbench.knowledge import InspectionKnowledge
from iad_core.workbench.vision import VlmClient


class AuditSynthesis:
    """Produce the saved conclusion from frozen facts and actual visual comparisons."""

    def __init__(self, db: Database, client: VlmClient):
        self.db, self.client = db, client
        self.images = EvidenceImages(db.db_path)

    def conclude(self, analysis: AuditAnalysis, knowledge: InspectionKnowledge, axis: AuditConsistencyRecord,
                 model_name: str, instruction: str, cancel: threading.Event, phase) -> AuditAnalysis:
        if cancel.is_set():
            raise InterruptedError('Audit cancelled')
        criteria = knowledge.context(self.db, axis.sample_id, analysis.overview.source_sha256)
        comparisons = [ConsistencyRepository(self.db).get(ref.evidence_id).result for ref in axis.references]
        supplied = {analysis.overview.evidence_id: analysis.overview}
        needed = set(analysis.conclusion.evidence_ids)
        needed.update(eid for item in analysis.findings for eid in item.evidence_ids)
        needed.update(eid for item in analysis.check_assessments for eid in item.evidence_ids)
        supplied.update({item.image.evidence_id: item.image for item in analysis.regions if item.image.evidence_id in needed})
        supplied.update({item.image.evidence_id: item.image for item in criteria.visual_references})
        owners = {image.evidence_id: axis.sample_id for image in supplied.values()}
        owners.update({item.image.evidence_id: item.sample_id for item in criteria.visual_references})
        original_sources = {item.sample_id: item for item in knowledge.snapshot.sources}
        frozen_visuals = knowledge.snapshot.evidence
        sources, prepared = [], []
        for sample_id in dict.fromkeys([axis.sample_id, *[item.sample_id for item in criteria.visual_references]]):
            sample = SampleRepository(self.db).get(sample_id)
            annotations = AnnotationRepository(self.db).list_by_sample(sample_id)
            content = SampleContent.capture(self.db, sample_id)
            if sample_id != axis.sample_id:
                expected = original_sources[sample_id].model_dump(include=set(SampleContent.model_fields))
                if content.model_dump() != expected:
                    raise ValueError('知识比较图像或标注已变化，不能与冻结知识混用')
                overview = next((item.image for item in frozen_visuals if item.sample_id == sample_id
                    and item.image.representation == 'raw' and item.image.role == 'overview'
                    and item.image.crop_bbox == [0, 0, sample.width, sample.height]), None)
                if overview is None:
                    raise ValueError('冻结知识比较证据缺少对应整图')
                supplied[overview.evidence_id] = overview
                owners[overview.evidence_id] = sample_id
            else:
                overview = analysis.overview
            dataset_format = DatasetRegistry(self.db).get(sample.dataset_id).dataset.format
            source = AuditImageSource(sample=sample, dataset_format=dataset_format,
                annotations=annotations, overview_evidence_id=overview.evidence_id)
            for annotation in annotations:
                if annotation.annotation_type == 'mask' and annotation.geometry_status != 'INVALID':
                    mask = self.images.capture(sample, 'overview', 'annotation', source_sha256=content.sha256,
                        annotations=[annotation], annotation_mode='annotation_mask', full_resolution=True)
                    source.mask_evidence_ids[annotation.annotation_id] = mask.evidence.evidence_id
                    supplied[mask.evidence.evidence_id] = mask.evidence
                    owners[mask.evidence.evidence_id] = sample_id
            sources.append(source)
            for image in list(supplied.values()):
                if owners[image.evidence_id] == sample_id:
                    prepared.append(PreparedImage(image, self.images.path(image)).with_source(sample, dataset_format, annotations))
        for image in analysis.auxiliary_evidence:
            if any(view.evidence.crop_bbox == image.crop_bbox and view.evidence.source_sha256 == image.source_sha256
                   for view in prepared if view.evidence.representation == 'raw'):
                supplied[image.evidence_id] = image
                owners[image.evidence_id] = axis.sample_id
                anchor = sources[0]
                prepared.append(PreparedImage(image, self.images.path(image)).with_source(anchor.sample,
                    DatasetRegistry(self.db).get(anchor.sample.dataset_id).dataset.format, anchor.annotations))
        frozen = dict(knowledge=criteria.context,
            consistency=dict(record=axis.model_dump(mode='json'), results=[item.model_dump(mode='json') for item in comparisons]),
            visual_observations=analysis.model_dump(mode='json', exclude={'reference_evidence', 'image_sources'}), image_owners=owners)
        prompt = instruction+'\n冻结综合审计：'+json.dumps(frozen, ensure_ascii=False)
        raw = tuple(image.evidence.evidence_id for image in prepared if image.evidence.representation == 'raw')
        result_ids = tuple(item.result_id for item in comparisons)
        basis = create_model('AuditBasis', __base__=AuditBasis, text=(NonBlankConclusion, ...),
            evidence_ids=(list[Literal[raw]], Field(min_length=1)),
            knowledge_check_ids=(list[Literal[tuple(criteria.check_ids)]] if criteria.check_ids else list[str],
                Field(..., **({} if criteria.check_ids else {'max_length': 0}))),
            consistency_result_ids=(list[Literal[result_ids]] if result_ids else list[str],
                Field(..., **({} if result_ids else {'max_length': 0}))))
        response_type = create_model('AuditConclusion', __base__=AuditConclusion,
            analysis_text=(NonBlankConclusion, ...), description=(NonBlankConclusion, ...),
            observation=(NonBlankConclusion, ...), applicable_rule=(NonBlankConclusion, ...),
            normal_alternative=(NonBlankConclusion, ...),
            proposed_slice=(list[create_model('AuditSliceCandidate', __base__=AuditSliceCandidate,
                name=(NonBlankConclusion, ...), observation=(NonBlankConclusion, ...),
                evidence_ids=(list[Literal[raw]], Field(min_length=1)))], ...),
            evidence_ids=(list[Literal[raw]], Field(min_length=1)), basis=(list[basis], Field(min_length=1)))
        phase(InspectionProgress(phase='SYNTHESIS', inspected_regions=analysis.coverage.inspected_regions,
            planned_regions=analysis.coverage.planned_regions, completed_batches=len(analysis.joint_steps),
            total_batches=len(analysis.joint_steps)+1))
        plan = self.client.plan(response_type, prompt, prepared, model_name, OUTPUT_RESERVE_TOKENS)
        result = self.client.generate(plan)
        if cancel.is_set():
            raise InterruptedError('Audit cancelled')
        analysis.conclusion = AuditConclusion.model_validate(result.model_dump())
        analysis.input_snapshot_signature = hashlib.sha256(json.dumps(dict(prompt=prompt,
            images=[image.model_context() for image in prepared]), sort_keys=True, ensure_ascii=False).encode()).hexdigest()
        analysis.image_sources = sources
        known = {analysis.overview.evidence_id, *[region.image.evidence_id for region in analysis.regions],
            *[image.evidence_id for image in analysis.auxiliary_evidence]}
        analysis.reference_evidence = [image for eid, image in supplied.items() if eid not in known]
        analysis.reference_sample_ids = [source.sample.sample_id for source in sources[1:]]
        return analysis
