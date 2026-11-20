import json
from pathlib import PurePosixPath

from iad_core.audit.models import AuditAgentContext, AuditConsistencyContext, AuditSampleRun, AuditWorkflowSnapshot
from iad_core.audit.quality_models import QUALITY_SCORE_VERSION
from iad_core.consistency.repository import ConsistencyRepository
from iad_core.evidence.sources import SampleContent
from iad_core.workbench.analysis_manifest import AnalysisRegistration
from iad_core.storage.models import sample_uuid
from iad_core.workbench.session_models import ImageSessionLocation


class AuditState:
    def __init__(self, db):
        self.db = db
        self._snapshots = {}

    def owns(self, run_id: str) -> bool:
        with self.db.connection() as connection:
            return connection.execute('SELECT 1 FROM audit_workflow_runs WHERE job_id=?', (run_id,)).fetchone() is not None

    def is_archived(self, run_id: str) -> bool:
        with self.db.connection() as connection:
            row=connection.execute("SELECT json_extract(snapshot_json,'$.schema_version') FROM audit_workflow_runs WHERE job_id=?",(run_id,)).fetchone()
        if row is None:
            raise LookupError('原生审计作业不存在')
        return row[0] not in (4, 5, 6)

    def snapshot(self, run_id: str) -> AuditWorkflowSnapshot:
        if run_id in self._snapshots:
            return self._snapshots[run_id]
        with self.db.connection() as connection:
            row = connection.execute("SELECT snapshot_json,json_extract(snapshot_json,'$.schema_version') FROM audit_workflow_runs WHERE job_id=?", (run_id,)).fetchone()
        if row is None:
            raise LookupError('原生审计作业不存在')
        if row[1] not in (4, 5, 6):
            raise ValueError('历史审计已归档，请查看冻结报告或新建作业')
        snapshot = AuditWorkflowSnapshot.model_validate_json(row[0])
        self._snapshots[run_id] = snapshot
        return snapshot

    def scoring_snapshot(self, run_id: str) -> AuditWorkflowSnapshot:
        snapshot = self.snapshot(run_id)
        if snapshot.quality_score_version != QUALITY_SCORE_VERSION:
            raise ValueError('历史评分观察保持冻结，请新建审计作业使用当前规则')
        return snapshot

    def consistency_records(self, run_id: str, sample_id: str | None = None):
        from iad_core.consistency.agent_result_models import ConsistencyConclusionRecord, AnchorResultSummary
        if self.snapshot(run_id).settings.audit_scope == 'consistency':
            with self.db.connection() as connection:
                rows = connection.execute('SELECT record_json FROM audit_upstream_records WHERE job_id=?'
                    + (' AND sample_id=?' if sample_id is not None else '') + ' ORDER BY ordinal',
                    (run_id, sample_id) if sample_id is not None else (run_id,))
                return [ConsistencyConclusionRecord.model_validate_json(row[0]) for row in rows]
        return [ConsistencyConclusionRecord(summary=AnchorResultSummary.model_validate(
            sample.consistency.model_dump(include=set(AnchorResultSummary.model_fields))), result=sample.consistency.result)
            for sample in ([self.sample(run_id, sample_id)] if sample_id is not None else self.samples(run_id)) if sample.consistency.result]

    @staticmethod
    def _sample(row) -> AuditSampleRun:
        return AuditSampleRun(**{key:row[key] for key in ('job_id','sample_id','ordinal','session_id','state')},
            result_revision=row['result_revision'],
            session_created=bool(row['session_created']), consistency=json.loads(row['consistency_json']),
            result=json.loads(row['result_json']) if row['result_json'] else None)

    def samples(self, run_id: str) -> list[AuditSampleRun]:
        self.snapshot(run_id)
        with self.db.connection() as connection:
            rows = connection.execute('SELECT * FROM audit_sample_runs WHERE job_id=? ORDER BY ordinal', (run_id,)).fetchall()
        return [self._sample(row) for row in rows]

    def sample(self, run_id: str, sample_id: str) -> AuditSampleRun:
        with self.db.connection() as connection:
            row = connection.execute('SELECT * FROM audit_sample_runs WHERE job_id=? AND sample_id=?', (run_id,sample_id)).fetchone()
        if row is None:
            raise LookupError('主图不属于当前审计作业')
        return self._sample(row)

    def context(self, run_id: str, sample_id: str) -> AuditAgentContext:
        from iad_core.audit.batches import AuditBatches
        from iad_core.audit.observation_notes import AuditObservationNotes
        snapshot, sample = self.snapshot(run_id), self.sample(run_id, sample_id)
        review = next((item for item in AuditBatches(self).rechecks(run_id) if item.sample_id==sample_id),None)
        from iad_core.audit.stages import AuditStages
        profile = AuditStages(self).profile(run_id)
        return AuditAgentContext(defect_profile=profile, quality_score_version=snapshot.quality_score_version,job_id=run_id, sample_id=sample_id, session_id=sample.session_id,
            target=next(record for record in snapshot.manifest.records if record.sample.sample_id == sample_id),
            consistency=AuditConsistencyContext.capture(sample.consistency),
            knowledge=snapshot.knowledge,saved_progress=sample.result if sample.result and sample.result.execution_status!='completed' else None,
            batch=AuditBatches(self).for_sample(run_id,sample_id),review=review,
            prior_result=sample.result if review else None,
            observation_notes=AuditObservationNotes(self.db).read(run_id,sample.session_id))

    def record(self, run_id: str, target_id: str, sample_id: str) -> AnalysisRegistration:
        sample = self.sample(run_id, target_id)
        from iad_core.audit.batches import AuditBatches
        from iad_core.audit.stages import AuditStages
        profile = AuditStages(self).profile(run_id)
        if (profile and any(ref.sample_id == sample_id for feature in profile.features for ref in feature.references)) or sample_id == target_id or any(ref.sample_id == sample_id
                for review in AuditBatches(self).rechecks(run_id,pending_only=False)
                if review.sample_id == target_id for ref in review.conflict_refs):
            return next(record for record in self.snapshot(run_id).manifest.records if record.sample.sample_id == sample_id)
        references = [ref for ref in [*sample.consistency.evidence,*sample.consistency.captured_evidence] if ref.candidate_id == sample_id]
        if not references:
            raise ValueError('图像不属于本场主图或已选一致性anchor的候选')
        saved = ConsistencyRepository(self.db).get(references[0].evidence_id)
        source = next(source for source in (saved.sources.left, saved.sources.right) if source.sample.sample_id == sample_id)
        if source.annotations.dataset_format is None:
            raise ValueError('上游候选没有记录冻结标注格式')
        return AnalysisRegistration(sample=source.sample, annotations=source.annotations.annotations,
            dataset_format=source.annotations.dataset_format,
            source_fingerprint=SampleContent.describe(source.sample, source.annotations.annotations, source.source_sha256).fingerprint)

    def session_location(self, session_id: str) -> ImageSessionLocation:
        with self.db.connection() as connection:
            report = connection.execute('SELECT job_id FROM audit_report_runs WHERE session_id=?', (session_id,)).fetchone()
        if report:
            with self.db.connection() as connection:
                row = connection.execute("SELECT json_extract(payload_json,'$.submitted_at') FROM job_runs WHERE job_id=?", (report[0],)).fetchone()
            return ImageSessionLocation(job_id=report[0],submitted_at=row[0],image_name='report',image_id='report')
        with self.db.connection() as connection:
            row = connection.execute('''SELECT a.job_id,a.sample_id,json_extract(j.payload_json,'$.submitted_at') submitted_at
                FROM audit_sample_runs a JOIN job_runs j ON j.job_id=a.job_id WHERE a.session_id=?''', (session_id,)).fetchone()
        if row is None:
            raise LookupError('审计主图Session不存在')
        record = next(record for record in self.snapshot(row['job_id']).manifest.records if record.sample.sample_id == row['sample_id'])
        return ImageSessionLocation(job_id=row['job_id'], submitted_at=row['submitted_at'],
            image_name=PurePosixPath(record.sample.relative_path).name, image_id=sample_uuid(row['sample_id']))
