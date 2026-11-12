import json
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
            rows = connection.execute('''SELECT a.sample_id,a.state execution_status,
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
        rows = [{**dict(row),'audit_state':row['audit_state'] if row['execution_status']=='COMPLETED' else 'incomplete'} for row in rows]
        return [AuditSampleItem(run_id=run_id, dataset_id=record.sample.dataset_id,
            filename=record.sample.relative_path, width=record.sample.width, height=record.sample.height,
            **dict(row))
            for row in rows for record in [records[row['sample_id']]]]

    def samples(self, query: AuditSampleQuery) -> AuditSamplePage:
        if self.state.is_archived(query.run_id):
            return AuditSamplePage(run_id=query.run_id,total=0,page=query.page,page_size=query.page_size,distribution={},items=[],archived=True)
        items = self.projection(query.run_id)
        counts = Counter(item.audit_state for item in items)
        selected = [item for item in items if (query.status == 'all' or item.audit_state == query.status)
            and query.search.casefold() in item.filename.casefold()]
        if query.group_id:
            from iad_core.audit.reports import AuditReports
            group = next((group for group in AuditReports(self.db).session(query.run_id).discoveries if group.group_id==query.group_id),None)
            ids = {ref.sample_id for ref in [*group.support_refs,*group.counter_refs]} if group else set()
            selected = [item for item in selected if item.sample_id in ids]
        if query.issue_type or query.consistency_assessment or query.knowledge_id:
            from iad_core.audit.reports import AuditReports
            from iad_core.audit.report_models import AuditRecordQuery
            ids = {sample.sample_id for sample in AuditReports(self.db).matching(query.run_id,AuditRecordQuery(
                issue_type=query.issue_type,consistency_assessment=query.consistency_assessment,knowledge_id=query.knowledge_id))}
            selected = [item for item in selected if item.sample_id in ids]
        states = ('suspect','normal','incomplete')
        start = (query.page - 1) * query.page_size
        return AuditSamplePage(run_id=query.run_id, total=len(selected), page=query.page, page_size=query.page_size,
            distribution={state: counts[state] for state in states},
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
            if row['media_key'].startswith('reference:'):
                from iad_core.analysis.queries import AnalysisQueries
                source = AnalysisQueries(self.db).sample_evidence(context.knowledge.selection.version_id,media.sample_id).registration if context.knowledge else None
            else:
                source = self.state.record(run_id,sample_id,media.sample_id)
            for image in media.images:
                visuals[image.image.evidence_id] = AuditMediaView(sample_id=image.sample_id, image=image.image, source=source)
        from iad_core.audit.presentation import AuditNarrative
        final = AuditNarrative(self.state,run_id).project(sample.result) if sample.result else None
        return NativeAuditSampleDetail(sample=item, final=final, knowledge=context.knowledge,
            consistency=sample.consistency, evidence=list(visuals.values()),
            errors=[error.message for error in job.errors if error.sample_id == sample_id])

    def evidence(self, run_id: str, sample_id: str, evidence_id: str) -> dict:
        image = next((item.image for item in self.sample(run_id,sample_id).evidence if item.image.evidence_id == evidence_id), None)
        if image is None:
            raise LookupError('证据不属于当前审计主图')
        return {'path': EvidenceImages(self.db.db_path).path(image), 'media_type': image.media_type}

    def report(self, run_id: str) -> AuditRunReport:
        with self.db.connection() as connection:
            row=connection.execute('SELECT summary_json FROM audit_workflow_runs WHERE job_id=?',(run_id,)).fetchone()
        if self.state.is_archived(run_id):
            if row[0] is None:
                raise ValueError('历史作业没有已保存的报告产物')
            summary=json.loads(row[0])
            return AuditRunReport.model_validate({**{key:value for key,value in summary.items() if key in AuditRunReport.model_fields},'archived':True})
        if row[0]:
            return AuditRunReport.model_validate_json(row[0])
        from iad_core.audit.presentation import AuditPresentation
        return AuditPresentation(self).report(run_id)

    def report_data(self, run_id: str) -> AuditRunReport:
        job = JobFamilies(self.db).snapshot(run_id, ('MODEL_AUDIT',))
        items = self.projection(run_id)
        snapshot = self.state.snapshot(run_id)
        from iad_core.audit.reports import AuditReports
        reports = AuditReports(self.db)
        statistics, session = reports.statistics(run_id), reports.session(run_id)
        final = session.result
        selected = set(final.discovery_ids) if final else {item.group_id for item in session.discoveries if item.status!='withdrawn'}
        discoveries = [item for item in session.discoveries if item.group_id in selected]
        from iad_core.audit.report_models import AuditReportedCapability
        capabilities=[]
        tracks={'hard_normal':'open_hard_normal','tiny_defect':'small_weak','structural_relation':'global_logical'}
        source=snapshot.dataset_profile.benchmark
        for item in final.capabilities if final else []:
            track=tracks.get(item.tag)
            readiness=getattr(source.readiness,track) if source and source.source_matches_scope and track else None
            capabilities.append(AuditReportedCapability(**item.model_dump(),readiness_status=readiness.status.value.lower() if readiness else 'not_evaluated',
                readiness_track=readiness.track_name if readiness else None))
        return AuditRunReport(run_id=run_id,dataset_id=job.dataset_id,status=job.status,total_samples=statistics.total_images,
            audited_samples=statistics.completed_images,coverage_percent=round(100*statistics.completion_rate,2) if statistics.completion_rate is not None else None,
            suspect_samples=statistics.suspect_images,insufficient_samples=statistics.incomplete_images,
            consistency_pending_samples=sum(item.consistency_pending for item in items),
            distribution={'suspect':statistics.suspect_images,'normal':statistics.normal_images,'incomplete':statistics.incomplete_images},
            knowledge_version_id=job.knowledge_version_id,model_name=job.model_name,submitted_at=job.submitted_at,
            finished_at=job.finished_at,generated_at=datetime.now(timezone.utc).isoformat(),
            conclusion=final.conclusion if final else '',limitations=final.limitations if final else [session.error] if session.error else [],
            statistics=statistics,export_ready=False,discoveries=discoveries,dataset_profile=snapshot.dataset_profile,
            consistency_job_id=snapshot.consistency_job_id,report_state=session.state,report_session_id=session.session_id if session.session_created else None,
            consistency_analysis=final.consistency_analysis if final else '',knowledge_analysis=final.knowledge_analysis if final else '',
            coverage_analysis=final.coverage_analysis if final else '',independence_analysis=final.independence_analysis if final else '',
            coverage_topics=final.coverage_topics if final else [], consistency_analyses=final.consistency_analyses if final else [],
            capabilities=capabilities,usability=final.usability if final else [],review_priorities=final.review_priorities if final else [])

    def export(self, run_id: str) -> dict[str, str]:
        with self.db.connection() as connection:
            row = connection.execute('SELECT report_html FROM audit_workflow_runs WHERE job_id=?', (run_id,)).fetchone()
        if row is None or row[0] is None:
            raise ValueError('本作业报告尚未生成')
        return dict(filename=f'audit-{run_id}.html',html=row[0])
