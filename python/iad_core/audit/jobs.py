from iad_core.audit.state import AuditState
from uuid import NAMESPACE_URL, uuid5

from iad_core.analysis.publications import AnalysisPublications
from iad_core.analysis.queries import AnalysisQueries
from iad_core.analysis.models import AnalysisCoverageSummary
from iad_core.audit.models import AuditAgentConfiguration, AuditAgentStart, AuditSampleRun, AuditWorkflowSnapshot
from iad_core.audit.knowledge_models import AuditKnowledge, AuditKnowledgeDirection, AuditKnowledgeScope, AuditKnowledgeSelection, AuditSelectedCheck
from iad_core.consistency.agent_results import ConsistencyAgentResults
from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.knowledge.check_reviews import KnowledgeCheckReviews
from iad_core.knowledge.models import KnowledgeEvidence
from iad_core.workbench.analysis_manifest import AnalysisManifests
from iad_core.workbench.model_profile import FrozenModelRole
from iad_core.workbench.module_settings import ModuleSettings
from iad_core.workbench.job_models import JobExecutionError
import json
from iad_core.audit.dataset_profile import AuditDatasetProfiles


class AuditAgentJobs(AuditState):
    def __init__(self, runtime):
        super().__init__(runtime.db)
        self.runtime, self.jobs = runtime, runtime.jobs

    def configuration(self) -> AuditAgentConfiguration:
        settings = ModuleSettings(self.db).read('audit')
        return AuditAgentConfiguration(settings_revision=settings.revision, settings=settings.settings)

    def freeze_knowledge(self, selection: AuditKnowledgeSelection | None) -> AuditKnowledge | None:
        if selection is None or not selection.entry_ids:
            return None
        publication = AnalysisPublications(self.db).get(selection.version_id)
        if publication.job_id != selection.job_id or publication.module != 'knowledge':
            raise ValueError('知识版本不属于所选挖掘作业')
        view = AnalysisQueries(self.db).view(selection.version_id)
        checks = view.catalog.checks
        selected = set(selection.entry_ids)
        if len(selected) != len(selection.entry_ids):
            raise ValueError('知识条目不能重复选择')
        if selected - {check.check_id for check in checks}:
            raise ValueError('知识条目不属于所选正式版本')
        reviews = KnowledgeCheckReviews(self.db).read(selection.version_id)
        entries = [AuditSelectedCheck(check=check, review=reviews.get(check.check_id, {})) for check in checks if check.check_id in selected]
        direction_refs = {ref for entry in entries for ref in entry.check.direction_refs}
        directions = [AuditKnowledgeDirection(**direction.model_dump(include=set(AuditKnowledgeDirection.model_fields)))
            for direction in view.selected_directions if direction.ref in direction_refs]
        ids = dict.fromkeys(eid for entry in entries for eid in entry.evidence_ids)
        evidence = {item.evidence_id: KnowledgeEvidence(sample_id=item.sample_id, image=item.image) for item in view.evidence}
        scope = AuditKnowledgeScope(dataset_ids=list(dict.fromkeys(record.dataset_id for record in view.coverage.records)),
            revision=view.revision, execution_status=view.execution_status, execution_error=view.execution_error,
            coverage=AnalysisCoverageSummary(**view.coverage.model_dump(include=set(AnalysisCoverageSummary.model_fields))),
            finalization_complete=view.finalization.complete if view.finalization is not None else None)
        return AuditKnowledge(selection=selection, source_scope=scope, directions=directions,
            entries=entries, evidence=[evidence[eid] for eid in ids])

    def start(self, request: dict, *, agent: dict, configuration=None) -> dict:
        request = AuditAgentStart.model_validate(request)
        submission = request.model_dump(mode='json')
        if existing := self.jobs.submitted('MODEL_AUDIT', submission):
            return {**existing, 'created':False}
        configuration = AuditAgentConfiguration.model_validate(configuration) if configuration is not None else self.configuration()
        role = FrozenModelRole.model_validate(agent)
        if role.error or not role.profile or not role.native_profile:
            raise ValueError('审计需要可用的原生Agent配置')
        selected = configuration.settings.model
        if selected is None or (selected.provider_id, selected.model_id) != (role.profile.provider_id, role.profile.model_id):
            raise ValueError('实际Agent与审计模块模型配置不一致')
        manifest = AnalysisManifests(self.db).freeze(request.subset_ids)
        if len({record.dataset_format for record in manifest.records}) != 1:
            raise ValueError('同一审计作业不能混用图像级和矩形标注类型')
        upstream = self.jobs.status(request.consistency_job_id, ('ANALYSIS_WORKFLOW',))
        if upstream['status'] != 'COMPLETED' or upstream['deleted_at']:
            raise ValueError('请选择已完成的一致性作业')
        source = ConsistencyAgentJobs(self.runtime).snapshot(request.consistency_job_id)
        frozen = {sample.sample_id:sample for sample in source.scopes.subjects.samples}
        if any(record.sample.sample_id not in frozen or frozen[record.sample.sample_id].source_fingerprint != record.source_fingerprint
                or frozen[record.sample.sample_id].quality_status != record.sample.quality_status for record in manifest.records):
            raise ValueError('所选图像或标注版本与一致性作业冻结范围不一致，请先重新检查一致性')
        results = ConsistencyAgentResults(self.db)
        anchors = [results.detail(request.consistency_job_id, record.sample.sample_id) for record in manifest.records]
        if any(anchor.result is None or anchor.state != 'COMPLETED' for anchor in anchors):
            raise ValueError('一致性作业尚未形成所选主图的终稿')
        snapshot = AuditWorkflowSnapshot(**configuration.model_dump(), schema_version=4, context_policy='evidence-on-demand-v1', manifest=manifest, agent=role,
            report_instruction=request.report_instruction, consistency_job_id=request.consistency_job_id,
            knowledge=self.freeze_knowledge(request.knowledge),
            master_prompt=request.master_prompt,observer_prompt=request.observer_prompt,
            dataset_profile=AuditDatasetProfiles(self.db).freeze(manifest,request.benchmark_build_id))

        def persist(connection, run_id):
            connection.execute('INSERT INTO audit_workflow_runs(job_id,snapshot_json) VALUES(?,?)', (run_id, snapshot.model_dump_json()))
            connection.execute('INSERT INTO audit_report_runs(job_id,session_id) VALUES(?,?)',
                (run_id,'audit-report-'+uuid5(NAMESPACE_URL,run_id).hex))
            connection.executemany('''INSERT INTO audit_sample_runs
                (job_id,sample_id,ordinal,session_id,state,consistency_json) VALUES(?,?,?,?,?,?)''',
                [(run_id, anchor.anchor_id, index, 'audit-' + uuid5(NAMESPACE_URL, run_id + ':' + anchor.anchor_id).hex,
                    'PENDING', anchor.model_dump_json(exclude_computed_fields=True)) for index, anchor in enumerate(anchors)])
            sample_ids = [anchor.anchor_id for anchor in anchors]
            connection.executemany('INSERT INTO audit_batches(job_id,number,sample_ids_json) VALUES(?,?,?)',
                [(run_id,index//snapshot.settings.batch_size+1,json.dumps(sample_ids[index:index+snapshot.settings.batch_size]))
                    for index in range(0,len(sample_ids),snapshot.settings.batch_size)])

        job = self.jobs.start('MODEL_AUDIT', manifest.records[0].sample.task_id,
            dict(audit_workflow_version=4, submission=submission, dataset_id=manifest.dataset_ids[0], dataset_ids=manifest.dataset_ids,
                sample_ids=[record.sample.sample_id for record in manifest.records], instruction=request.master_prompt.user_prompt,
                model_name=role.profile.model_id, model_profile=role.profile.model_dump(),
                knowledge_version_id=snapshot.knowledge.selection.version_id if snapshot.knowledge else None),
            None, '准备逐图原生审计', persist=persist)
        self.jobs.update(job['run_id'],phase='PREPARING_AUDIT_INPUT',completion_pending=True)
        return {**job, 'created':True}


    def session_created(self, run_id: str, sample_id: str) -> AuditSampleRun:
        self.sample(run_id, sample_id)
        with self.db.connection() as connection:
            connection.execute("UPDATE audit_sample_runs SET session_created=1,state=CASE WHEN state='COMPLETED' THEN state ELSE 'RUNNING' END WHERE job_id=? AND sample_id=?", (run_id,sample_id))
            connection.execute("UPDATE audit_rechecks SET state='RUNNING' WHERE job_id=? AND sample_id=? AND state='PENDING'",(run_id,sample_id))
        return self.sample(run_id,sample_id)

    def failure(self, run_id: str, sample_id: str, message: str):
        with self.jobs.lock, self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            sample = connection.execute('SELECT state FROM audit_sample_runs WHERE job_id=? AND sample_id=?', (run_id,sample_id)).fetchone()
            if sample is None:
                raise LookupError('主图不属于当前审计作业')
            if sample['state'] in ('COMPLETED','FAILED'):
                connection.execute("UPDATE audit_rechecks SET state='FAILED',error=? WHERE job_id=? AND sample_id=? AND state IN ('PENDING','RUNNING')",(message,run_id,sample_id))
                return
            connection.execute("UPDATE audit_sample_runs SET state='FAILED' WHERE job_id=? AND sample_id=?", (run_id,sample_id))
            self.jobs.record(run_id,sample_id,JobExecutionError(message,source_run_id=run_id,source_phase='AUDITING'),connection=connection)

    def finish(self, run_id: str, error: dict[str, str] | None = None):
        from iad_core.audit.reports import AuditReports
        if error is not None:
            state = self.jobs.status(run_id, ('MODEL_AUDIT',))
            if state['status'] != 'RUNNING':
                return state
            remaining = set(state['sample_ids']) - set(state['completed_sample_ids']) - set(state['failed_sample_ids'])
            with self.jobs.lock, self.db.connection() as connection:
                connection.execute('BEGIN IMMEDIATE')
                connection.execute("UPDATE audit_sample_runs SET state='FAILED' WHERE job_id=? AND state IN ('PENDING','RUNNING')",(run_id,))
                connection.execute("UPDATE audit_report_runs SET state='FAILED',error=? WHERE job_id=? AND state!='COMPLETED'",(error['message'],run_id))
                values = dict(completion_pending=True,execution_error=error)
                if remaining:
                    self.jobs.record(run_id,sorted(remaining),JobExecutionError(error['message'],source_run_id=run_id,
                        source_phase=state.get('phase')),connection=connection,**values)
                else:
                    self.jobs.update(run_id,connection=connection,**values)
            return self.jobs.finish_external(run_id)
        reports = AuditReports(self.db)
        from iad_core.audit.batches import AuditBatches
        reviews = {item.sample_id:item for item in AuditBatches(self).rechecks(run_id,pending_only=False)}
        failed_reviews = [item for item in reviews.values() if item.state=='FAILED']
        pending = dict(completion_pending=reports.session(run_id).state!='COMPLETED' or bool(failed_reviews))
        if failed_reviews:
            pending['execution_error'] = {'type':'AuditRecheckError','message':'定向复核未完成：'+'；'.join(
                item.error or item.reason for item in failed_reviews)}
        self.jobs.update(run_id,**pending)
        try:
            return self.jobs.finish_external(run_id,persist=lambda connection,status,at:
                reports.finalize(run_id,connection=connection,status=status,finished_at=at))
        except Exception as error:
            self.jobs.update(run_id,completion_pending=True,execution_error={'type':'AuditReportOutputError','message':str(error)})
            return self.jobs.finish_external(run_id)

    def cancel(self, run_id: str):
        self.snapshot(run_id)
        self.jobs.cancel(run_id,('MODEL_AUDIT',))
        with self.db.connection() as connection:
            connection.execute("UPDATE audit_report_runs SET state='CANCELLED' WHERE job_id=? AND state!='COMPLETED'",(run_id,))
            connection.execute("UPDATE audit_sample_runs SET state='CANCELLED' WHERE job_id=? AND state IN ('PENDING','RUNNING')", (run_id,))
        return self.jobs.status(run_id)

    def interrupt(self, run_id: str):
        self.snapshot(run_id)
        self.jobs.interrupt_external(run_id)
        with self.db.connection() as connection:
            connection.execute("UPDATE audit_report_runs SET state='INTERRUPTED' WHERE job_id=? AND state!='COMPLETED'",(run_id,))
            connection.execute("UPDATE audit_sample_runs SET state='INTERRUPTED' WHERE job_id=? AND state IN ('PENDING','RUNNING')", (run_id,))
        return self.jobs.status(run_id)

    def resume(self, run_id: str):
        if self.is_archived(run_id):
            raise ValueError('历史审计保留查看与导出，请新建作业使用当前审核流程')
        def persist(connection):
            connection.execute('UPDATE audit_workflow_runs SET summary_json=NULL,report_html=NULL WHERE job_id=?', (run_id,))
            connection.execute("UPDATE audit_sample_runs SET state='PENDING' WHERE job_id=? AND state!='COMPLETED'", (run_id,))
            connection.execute("""UPDATE audit_rechecks SET state='PENDING',error=NULL WHERE job_id=?
                AND state IN ('FAILED','RUNNING') AND rowid IN (
                    SELECT max(rowid) FROM audit_rechecks WHERE job_id=? GROUP BY sample_id)""",(run_id,run_id))
            pending = connection.execute("SELECT COUNT(*) FROM audit_sample_runs WHERE job_id=? AND state!='COMPLETED'",(run_id,)).fetchone()[0]
            pending_reviews = connection.execute("SELECT COUNT(*) FROM audit_rechecks WHERE job_id=? AND state='PENDING'",(run_id,)).fetchone()[0]
            connection.execute("""UPDATE audit_batches SET state='AUDITING',review_revision=NULL WHERE job_id=? AND state='COMPLETED'
                AND EXISTS (SELECT 1 FROM audit_sample_runs a JOIN json_each(audit_batches.sample_ids_json) target ON target.value=a.sample_id
                    WHERE a.job_id=audit_batches.job_id AND a.state!='COMPLETED')""",(run_id,))
            connection.execute("""UPDATE audit_batches SET state='RECHECKING',review_revision=NULL WHERE job_id=?
                AND number IN (SELECT batch_number FROM audit_rechecks WHERE job_id=? AND state='PENDING')""",(run_id,run_id))
            if pending or pending_reviews:
                connection.execute("UPDATE audit_report_runs SET state='PENDING',result_json=NULL,error=NULL WHERE job_id=?",(run_id,))
            else:
                connection.execute("UPDATE audit_report_runs SET state='PENDING',error=NULL WHERE job_id=? AND state!='COMPLETED'",(run_id,))
        self.jobs.resume_external(run_id,persist=persist)
        self.jobs.update(run_id,completion_pending=True,execution_error=None)
        return self.jobs.status(run_id)
