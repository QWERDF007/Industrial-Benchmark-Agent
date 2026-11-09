import json
import sys
from uuid import uuid4

from iad_core.advisory.analysis import AuditAnalysis, Coverage, GlobalAnalysis, RegionEvidence, VlmResult
from iad_core.advisory.repository import AuditSuggestionRepository
from iad_core.advisory.schemas import AuditSuggestion, HypothesisItem, ObservationItem
from iad_core.evidence.images import EvidenceImages
from iad_core.evidence.sources import SampleContent
from iad_core.storage.database import Database
from iad_core.storage.repositories import AnnotationRepository, SampleRepository


db = Database(sys.argv[1])
sample = SampleRepository(db).get(sys.argv[2])
content = SampleContent.capture(db, sample.sample_id)
images = EvidenceImages(db.db_path)
annotations = AnnotationRepository(db).list_by_sample(sample.sample_id)
prepared = images.prepare(sample, 'labelme', annotations, content.sha256)
observation = dict(description='左孔存在局部颜色差异', position_analysis='主体左孔', illumination_analysis='当前照明下可见')
regions = images.capture_regions(sample, images.plan(sample, annotations, []), annotations, content.sha256)
raw_regions = [region for region in regions if region.image.representation == 'raw']
analysis = AuditAnalysis(overview=prepared[0].evidence,
    coverage=Coverage(planned_regions=len(raw_regions), inspected_regions=len(raw_regions), complete=True),
    global_view=GlobalAnalysis(**observation),
    regions=[RegionEvidence(**region.model_dump(), observation=observation) for region in raw_regions],
    auxiliary_evidence=[region.image for region in regions if region.image.representation != 'raw'],
    conclusion=VlmResult(**observation, suggested_label='UNCERTAIN', reason_category='appearance', confidence=.8,
        evidence_ids=[prepared[0].evidence.evidence_id, *[region.image.evidence_id for region in raw_regions]]))
suggestion = AuditSuggestionRepository(db).save(AuditSuggestion(suggestion_id='suggestion_'+uuid4().hex,
    task_id=sample.task_id, sample_id=sample.sample_id, confidence=.8, source_fingerprint=content.fingerprint,
    analysis=analysis, hypotheses=[HypothesisItem(label='UNCERTAIN')],
    observations=[ObservationItem(phenomenon='局部外观',description=observation['description'])]))
print(suggestion.model_dump_json())
