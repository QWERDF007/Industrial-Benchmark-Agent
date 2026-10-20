from typing import Optional

from iad_core.advisory.analysis import AnalysisModel, AuditAnalysis, VisualEvidence
from iad_core.advisory.repository import AuditSuggestionRepository
from iad_core.evidence.images import EvidenceImages
from iad_core.storage.database import Database
from iad_core.storage.models import Sample
from iad_core.storage.repositories import SampleRepository


class InspectionReference(AnalysisModel):
    dataset_id: str
    sample_id: str
    suggestion_id: str
    finding_id: Optional[str] = None
    evidence_id: Optional[str] = None


class InspectionSnapshot(AnalysisModel):
    reference: InspectionReference
    sample: Sample
    analysis: AuditAnalysis
    evidence: list[VisualEvidence]
    audit_run_id: Optional[str]
    origin_session_id: Optional[str]
    is_latest: bool


class InspectionContext:
    def __init__(self, db: Database):
        self.db = db
        self.samples = SampleRepository(db)
        self.suggestions = AuditSuggestionRepository(db)

    def resolve(self, reference: InspectionReference) -> InspectionSnapshot:
        sample = self.samples.get(reference.sample_id)
        if not sample:
            raise LookupError('样本不存在，无法读取追问上下文')
        if sample.dataset_id != reference.dataset_id:
            raise ValueError('样本不属于所选数据集')
        suggestion = self.suggestions.get(reference.suggestion_id)
        if not suggestion or not suggestion.analysis:
            raise LookupError('模型建议不存在或没有结构化证据')
        if suggestion.sample_id != sample.sample_id:
            raise ValueError('模型建议不属于所选样本')
        analysis = suggestion.analysis
        images = {image.evidence_id: image for image in [analysis.overview,
            *[region.image for region in analysis.regions], *analysis.auxiliary_evidence]}
        finding = next((item for item in analysis.findings if item.finding_id == reference.finding_id), None)
        if reference.finding_id and not finding:
            raise LookupError('疑点引用不存在，请重新选择')
        if reference.evidence_id and reference.evidence_id not in images:
            raise LookupError('证据引用不存在，请重新选择')
        if finding and reference.evidence_id and reference.evidence_id not in [analysis.overview.evidence_id, *finding.evidence_ids]:
            raise ValueError('证据未关联所选疑点')
        ids = list(dict.fromkeys([analysis.overview.evidence_id, *(finding.evidence_ids if finding else []),
                                  *([reference.evidence_id] if reference.evidence_id else [])]))
        for evidence_id in list(ids):
            image = images[evidence_id]
            if image.representation != 'raw':
                raw = next((item for item in images.values() if item.representation == 'raw'
                            and item.crop_bbox == image.crop_bbox and item.source_sha256 == image.source_sha256), None)
                if raw is None:
                    raise LookupError('标注定位图缺少配对原图证据')
                if raw.evidence_id not in ids:
                    ids.append(raw.evidence_id)
        evidence = [images[evidence_id] for evidence_id in ids]
        for image in evidence:
            try:
                EvidenceImages(self.db.db_path).path(image)
            except FileNotFoundError as error:
                raise LookupError('冻结图像证据缺失或内容已变化，无法提交追问') from error
        latest = self.suggestions.latest_by_sample(sample.sample_id)
        return InspectionSnapshot(reference=reference, sample=sample, analysis=analysis, evidence=evidence,
            audit_run_id=suggestion.audit_run_id, origin_session_id=suggestion.session_id,
            is_latest=latest is not None and latest.suggestion_id == suggestion.suggestion_id)
