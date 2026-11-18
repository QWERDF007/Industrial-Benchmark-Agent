"""Report conflict evidence uses actual frozen comparisons and keeps both sides together."""
from collections import defaultdict
from pathlib import PurePosixPath

from iad_core.audit.report_models import AuditEvidencePair, AuditReportImage
from iad_core.audit.state import AuditState
from iad_core.consistency.agent_result_models import AnchorResultSummary, ConsistencyConclusionRecord
from iad_core.consistency.repository import ConsistencyRepository
from iad_core.evidence.images import EvidenceImages
from iad_core.evidence.retained import RetainedImages
from iad_core.workbench.analysis_manifest import AnalysisRegistration

REPORT_EVIDENCE_LIMIT = 10


class AuditReportEvidence:
    def __init__(self, db):
        self.db, self.state = db, AuditState(db)

    def groups(self, run_id: str) -> dict[str, list[AuditEvidencePair]]:
        snapshot = self.state.snapshot(run_id)
        if snapshot.settings.audit_scope == 'consistency':
            from iad_core.audit.consistency_summary import ConsistencyAudit
            records = ConsistencyAudit(self.db).records(run_id)
        else:
            samples = self.state.samples(run_id)
            records = [ConsistencyConclusionRecord(
                summary=AnchorResultSummary.model_validate(s.consistency.model_dump(include=set(AnchorResultSummary.model_fields))),
                result=s.consistency.result, evidence=[*s.consistency.evidence, *s.consistency.captured_evidence])
                for s in samples if s.consistency.result]
        selected, seen = defaultdict(list), defaultdict(set)
        for record in records:
            main_id = record.summary.anchor_id
            for issue in record.result.issues:
                key = 'consistency:' + issue.type
                for reference in issue.evidence:
                    candidate_id = reference.candidate_id
                    identity = tuple(sorted((main_id, candidate_id)))
                    if identity in seen[key]:
                        pair = next(pair for pair in selected[key] if tuple(sorted((pair.main.sample_id,pair.candidate.sample_id))) == identity)
                        if issue.issue_id not in pair.issue_ids:
                            pair.issue_ids.append(issue.issue_id)
                        continue
                    if len(selected[key]) >= REPORT_EVIDENCE_LIMIT:
                        continue
                    frozen_ref = next((r for r in record.evidence if r.candidate_id == candidate_id), None)
                    if frozen_ref is None:
                        raise ValueError('冲突图证缺少实际对比的冻结图像引用')
                    frozen = ConsistencyRepository(self.db).get(frozen_ref.evidence_id)
                    sources = {s.sample.sample_id:s for s in (frozen.sources.left, frozen.sources.right)}
                    if main_id not in sources or candidate_id not in sources:
                        raise ValueError('冲突图证的实际图像对不匹配')
                    pair = AuditEvidencePair(pair_id=f'{main_id}:{candidate_id}', source_job_id=snapshot.consistency_job_id,
                        issue_ids=[issue.issue_id], main=self.image(run_id, main_id, sources[main_id], 'representative'),
                        candidate=self.image(run_id, main_id, sources[candidate_id], 'counter'))
                    selected[key].append(pair)
                    seen[key].add(identity)
        return dict(selected)

    def image(self, run_id, target_id, source, role):
        with self.db.connection() as connection:
            saved = connection.execute('SELECT image_json FROM audit_report_media WHERE job_id=? AND target_id=? AND sample_id=?',
                (run_id,target_id,source.sample.sample_id)).fetchone()
        if saved:
            return AuditReportImage.model_validate_json(saved[0]).model_copy(update={'role': role})
        original = source.sample
        sample = original.model_copy(update={'image_path':RetainedImages(self.db).path(source.image)})
        record = AnalysisRegistration(sample=sample, source_fingerprint=None,
            annotations=source.annotations.annotations, dataset_format=source.annotations.dataset_format)
        prepared = EvidenceImages(self.db.db_path).capture(sample, 'overview', 'coverage',
            source_sha256=source.image.sha256, full_resolution=True).with_source(sample, record.dataset_format, record.annotations)
        image = AuditReportImage(sample_id=sample.sample_id, target_id=target_id, role=role,
            caption=PurePosixPath(sample.relative_path).name, reason='', image=prepared.evidence, source=record)
        with self.db.connection() as connection:
            connection.execute('''INSERT INTO audit_report_media(job_id,target_id,sample_id,image_json)
                VALUES(?,?,?,?) ON CONFLICT(job_id,target_id,sample_id) DO NOTHING''',
                (run_id,target_id,sample.sample_id,image.model_dump_json()))
        return image
