import hashlib
import json
import math
from typing import List, Optional

from iad_core.advisory.analysis import RegionImage, RegionOrigin
from iad_core.evidence.images import EvidenceImages
from iad_core.knowledge.mining import KnowledgeInput
from iad_core.knowledge.models import FindingTarget, KnowledgeDraft, KnowledgeEvidence, KnowledgeSnapshot
from iad_core.knowledge.findings import FindingVerification, VerificationOutcome
from iad_core.knowledge.candidates import AuditCandidates
from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository, AnnotationRepository
from iad_core.dataset.registry import DatasetRegistry
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.vision import VlmClient



class KnowledgeVerification:
    def __init__(self, db: Database, client: VlmClient, context: JobContext):
        self.db, self.client, self.context = db, client, context
        self.images, self.samples = EvidenceImages(db.db_path), SampleRepository(db)
        self.candidates = AuditCandidates(db)

    def review(self, draft: KnowledgeDraft, inputs: List[KnowledgeInput], model_name: str,
               parent: Optional[KnowledgeSnapshot] = None) -> VerificationOutcome:
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
            origin = RegionOrigin(source="model", annotation_id=None, label=proposal.description, bbox=bbox)
            target_by_id[finding_id] = FindingTarget(finding_id=finding_id, sample_id=sample.sample_id,
                bbox=bbox, proposal=proposal, origins=[origin], regions=[])
        by_sample = {item.source.sample_id: item for item in inputs}
        for item in inputs:
            for target in self.candidates.targets(item.source):
                target_by_id[target.finding_id] = target
        for previous in parent.findings if parent else []:
            source = by_sample.get(previous.sample_id)
            if source is None or not previous.is_current_candidate(source.source.sha256, source.source.audit_suggestion_ids):
                continue
            if previous.finding_id not in target_by_id:
                target_by_id[previous.finding_id] = FindingTarget(finding_id=previous.finding_id,
                    sample_id=previous.sample_id, bbox=previous.bbox, proposal=None, origins=previous.origins,
                    origin_finding_id=previous.finding_id, origin_suggestion_id=previous.origin_suggestion_id,
                    audit_finding=previous.audit_finding, regions=[])
            elif not previous.origin_suggestion_id:
                target_by_id[previous.finding_id].origin_finding_id = previous.finding_id
        targets = list(target_by_id.values())
        if not targets:
            return VerificationOutcome([], [], [])
        self.context.update(phase="VERIFYING_KNOWLEDGE")
        for target in targets:
            source = by_sample[target.sample_id]
            sample = self.samples.get(target.sample_id)
            if not target.origins:
                raise ValueError('Knowledge finding is missing its region origin')
            origin = target.origins[0]
            dataset_format = DatasetRegistry(self.db).get(sample.dataset_id).dataset.format
            if dataset_format == 'folder_classification':
                overview = self.overviews[sample.sample_id]
                target.regions = [RegionImage(**origin.model_dump(), origins=target.origins,
                    crop_bbox=overview.evidence.crop_bbox, image=overview.evidence)]
                continue
            annotations = AnnotationRepository(self.db).list_by_sample(sample.sample_id)
            for tile in self.images.tiles(sample, target.bbox, 0.2):
                image = self.images.capture(sample, "roi", origin.source, tile, source.source.sha256).with_source(
                    sample, dataset_format, annotations)
                self.by_id[image.evidence.evidence_id] = image
                extra[image.evidence.evidence_id] = KnowledgeEvidence(sample_id=sample.sample_id, image=image.evidence)
                target.regions.append(RegionImage(**origin.model_dump(), origins=target.origins, crop_bbox=tile, image=image.evidence))
        outcome = FindingVerification(self.db, self.client, self.context).review(
            targets, inputs, list(self.overviews.values()), self.by_id, draft.checks, model_name,
            'verification')
        return VerificationOutcome(outcome.findings, list(extra.values()), outcome.steps)
