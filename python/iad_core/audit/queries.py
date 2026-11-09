from collections import Counter
from datetime import datetime, timezone

from iad_core.audit.models import AuditMediaView, NativeAuditSampleDetail
from iad_core.audit.state import AuditState
from iad_core.evidence.images import EvidenceImages
from iad_core.evidence.registrations import PreparedRegistration
from iad_core.workbench.audit_result_models import AuditSampleItem, AuditSamplePage, AuditSampleQuery, AuditRunReport
from iad_core.workbench.job_families import JobFamilies


class AuditQueries:
    def __init__(self, db):
        self.db, self.state = db, AuditState(db)

    def projection(self, run_id: str) -> list[AuditSampleItem]:
        snapshot = self.state.snapshot(run_id)
        with self.db.connection() as connection:
            rows = connection.execute('''SELECT a.sample_id,
                COALESCE(json_extract(a.result_json,'$.state'),'unprocessed') audit_state,
                COALESCE(json_array_length(a.result_json,'$.findings'),0)>0 has_findings,
                COALESCE(json_extract(a.result_json,'$.state')='insufficient',0) insufficient_evidence,
                json_extract(a.consistency_json,'$.verdict')='MATERIAL' consistency_pending,
                CASE WHEN a.session_created THEN a.session_id END session_id,
                (SELECT json_extract(image.value,'$.image.evidence_id') FROM json_each(m.media_json,'$.images') image
                    WHERE json_extract(image.value,'$.image.role')='overview' LIMIT 1) overview_evidence_id
                FROM audit_sample_runs a LEFT JOIN audit_sample_media m ON m.job_id=a.job_id AND m.target_id=a.sample_id
                    AND m.media_key='sample:'||a.sample_id WHERE a.job_id=? ORDER BY a.ordinal''', (run_id,)).fetchall()
        records = {record.sample.sample_id:record for record in snapshot.manifest.records}
        return [AuditSampleItem(run_id=run_id, dataset_id=record.sample.dataset_id,
            filename=record.sample.relative_path, width=record.sample.width, height=record.sample.height,
            **dict(row))
            for row in rows for record in [records[row['sample_id']]]]

    def samples(self, query: AuditSampleQuery) -> AuditSamplePage:
        items = self.projection(query.run_id)
        counts = Counter(item.audit_state for item in items)
        selected = [item for item in items if (query.status == 'all' or item.audit_state == query.status)
            and query.search.casefold() in item.filename.casefold()]
        start = (query.page - 1) * query.page_size
        return AuditSamplePage(run_id=query.run_id, total=len(selected), page=query.page, page_size=query.page_size,
            distribution={state: counts[state] for state in ('suspect','insufficient','normal','unprocessed')},
            items=selected[start:start + query.page_size])

    def sample(self, run_id: str, sample_id: str) -> NativeAuditSampleDetail:
        context = self.state.context(run_id, sample_id)
        sample = self.state.sample(run_id, sample_id)
        item = next(item for item in self.projection(run_id) if item.sample_id == sample_id)
        job = JobFamilies(self.db).snapshot(run_id, ('MODEL_AUDIT',))
        with self.db.connection() as connection:
            rows = connection.execute('SELECT media_key,media_json FROM audit_sample_media WHERE job_id=? AND target_id=? ORDER BY rowid', (run_id,sample_id)).fetchall()
        visuals = {}
        for row in rows:
            media = PreparedRegistration.model_validate_json(row['media_json'])
            source = None if row['media_key'].startswith('reference:') else self.state.record(run_id,sample_id,media.sample_id)
            for image in media.images:
                visuals[image.image.evidence_id] = AuditMediaView(sample_id=image.sample_id, image=image.image, source=source)
        return NativeAuditSampleDetail(sample=item, final=sample.result, knowledge=context.knowledge,
            consistency=context.consistency, evidence=list(visuals.values()),
            errors=[error.message for error in job.errors if error.sample_id == sample_id])

    def evidence(self, run_id: str, sample_id: str, evidence_id: str) -> dict:
        image = next((item.image for item in self.sample(run_id,sample_id).evidence if item.image.evidence_id == evidence_id), None)
        if image is None:
            raise LookupError('证据不属于当前审计主图')
        return {'path': EvidenceImages(self.db.db_path).path(image), 'media_type': image.media_type}

    def report(self, run_id: str) -> AuditRunReport:
        with self.db.connection() as connection:
            row = connection.execute('SELECT summary_json FROM audit_workflow_runs WHERE job_id=?', (run_id,)).fetchone()
        if row and row[0]:
            return AuditRunReport.model_validate_json(row[0])
        job = JobFamilies(self.db).snapshot(run_id, ('MODEL_AUDIT',))
        items = self.projection(run_id)
        counts = Counter(item.audit_state for item in items)
        audited = len(items) - counts['unprocessed']
        return AuditRunReport(run_id=run_id, dataset_id=job.dataset_id, status=job.status, total_samples=len(items),
            audited_samples=audited, coverage_percent=round(100 * audited / len(items), 2) if items else None,
            suspect_samples=counts['suspect'], insufficient_samples=counts['insufficient'],
            consistency_pending_samples=sum(item.consistency_pending for item in items),
            distribution={state: counts[state] for state in ('suspect','insufficient','normal','unprocessed')},
            knowledge_version_id=job.knowledge_version_id, model_name=job.model_name,
            submitted_at=job.submitted_at, finished_at=job.finished_at,
            generated_at=datetime.now(timezone.utc).isoformat(),
            analysis=f'本作业冻结 {len(items)} 张图像，已保存 {audited} 张独立审计终稿，尚有 {counts["unprocessed"]} 张未产生终稿。',
            conclusion=f'发现疑点 {counts["suspect"]} 张，证据不足 {counts["insufficient"]} 张。',
            limitations=['统计仅覆盖本作业的冻结范围和图级终稿，不代表人工真值或准确率。'],
            key_evidence=[item for item in items if item.audit_state != 'unprocessed'])

    def export(self, run_id: str) -> dict[str, str]:
        with self.db.connection() as connection:
            row = connection.execute('SELECT report_html FROM audit_workflow_runs WHERE job_id=?', (run_id,)).fetchone()
        if row is None or row[0] is None:
            raise ValueError('本作业报告尚未生成')
        return {'filename':f'audit-{run_id}.html', 'html':row[0]}
