from iad_core.audit.state import AuditState
from iad_core.audit.prompt_text import NATIVE_AUDIT_PROMPT
from uuid import NAMESPACE_URL, uuid5

from iad_core.analysis.publications import AnalysisPublications
from iad_core.analysis.queries import AnalysisQueries
from iad_core.analysis.models import AnalysisCoverageSummary
from iad_core.audit.models import (AuditAgentConfiguration, AuditAgentStart,
    AuditKnowledge, AuditKnowledgeDirection, AuditKnowledgeScope, AuditKnowledgeSelection,
    AuditSampleRun, AuditSelectedCheck, AuditWorkflowSnapshot)
from iad_core.consistency.agent_results import ConsistencyAgentResults
from iad_core.knowledge.check_reviews import KnowledgeCheckReviews
from iad_core.knowledge.models import KnowledgeEvidence
from iad_core.workbench.analysis_manifest import AnalysisManifests
from iad_core.workbench.model_profile import FrozenModelRole
from iad_core.workbench.module_settings import ModuleSettings
from iad_core.workbench.job_models import JobExecutionError


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
        if selected - {check.check_id for check in checks}:
            raise ValueError('知识条目不属于所选正式版本')
        reviews = KnowledgeCheckReviews(self.db).read(selection.version_id)
        entries = [AuditSelectedCheck(check=check, review=reviews.get(check.check_id, {})) for check in checks if check.check_id in selected]
        direction_refs = {ref for entry in entries for ref in entry.check.direction_refs}
        directions = [AuditKnowledgeDirection(**direction.model_dump(include=set(AuditKnowledgeDirection.model_fields)))
            for direction in view.selected_directions if direction.ref in direction_refs]
        ids = dict.fromkeys(eid for entry in entries for eid in view.display_evidence_ids(entry.check))
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
        if role.error or not role.profile or not role.native_profile or 'image' not in role.input_modalities:
            raise ValueError('审计需要可用的原生图像分析模型')
        selected = configuration.settings.model
        if selected is None or (selected.provider_id, selected.model_id) != (role.profile.provider_id, role.profile.model_id):
            raise ValueError('实际Agent与审计模块模型配置不一致')
        manifest = AnalysisManifests(self.db).freeze(request.subset_ids)
        upstream = self.jobs.status(request.consistency_job_id, ('ANALYSIS_WORKFLOW',))
        if upstream['status'] != 'COMPLETED' or upstream['deleted_at']:
            raise ValueError('请选择已完成的一致性作业')
        results = ConsistencyAgentResults(self.db)
        anchors = [results.detail(request.consistency_job_id, record.sample.sample_id) for record in manifest.records]
        if any(anchor.result is None or anchor.state != 'COMPLETED' for anchor in anchors):
            raise ValueError('一致性作业尚未形成所选主图的终稿')
        snapshot = AuditWorkflowSnapshot(**configuration.model_dump(), schema_version=2, manifest=manifest, agent=role,
            instruction=request.instruction, consistency_job_id=request.consistency_job_id,
            system_prompt=request.system_prompt or NATIVE_AUDIT_PROMPT,
            knowledge=self.freeze_knowledge(request.knowledge))

        def persist(connection, run_id):
            connection.execute('INSERT INTO audit_workflow_runs(job_id,snapshot_json) VALUES(?,?)', (run_id, snapshot.model_dump_json()))
            connection.executemany('''INSERT INTO audit_sample_runs
                (job_id,sample_id,ordinal,session_id,state,consistency_json) VALUES(?,?,?,?,?,?)''',
                [(run_id, anchor.anchor_id, index, 'audit-' + uuid5(NAMESPACE_URL, run_id + ':' + anchor.anchor_id).hex,
                    'PENDING', anchor.model_dump_json()) for index, anchor in enumerate(anchors)])

        job = self.jobs.start('MODEL_AUDIT', manifest.records[0].sample.task_id,
            dict(audit_workflow_version=2, submission=submission, dataset_id=manifest.dataset_ids[0], dataset_ids=manifest.dataset_ids,
                sample_ids=[record.sample.sample_id for record in manifest.records], instruction=request.instruction,
                model_name=role.profile.model_id, model_profile=role.profile.model_dump(),
                knowledge_version_id=snapshot.knowledge.selection.version_id if snapshot.knowledge else None),
            None, '准备逐图原生审计', persist=persist)
        return {**job, 'created':True}


    def session_created(self, run_id: str, sample_id: str) -> AuditSampleRun:
        self.sample(run_id, sample_id)
        with self.db.connection() as connection:
            connection.execute("UPDATE audit_sample_runs SET session_created=1,state='RUNNING' WHERE job_id=? AND sample_id=?", (run_id,sample_id))
        return self.sample(run_id,sample_id)

    def failure(self, run_id: str, sample_id: str, message: str):
        with self.jobs.lock, self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            sample = connection.execute('SELECT state FROM audit_sample_runs WHERE job_id=? AND sample_id=?', (run_id,sample_id)).fetchone()
            if sample is None:
                raise LookupError('主图不属于当前审计作业')
            if sample['state'] in ('COMPLETED','FAILED'):
                return
            connection.execute("UPDATE audit_sample_runs SET state='FAILED' WHERE job_id=? AND sample_id=?", (run_id,sample_id))
            self.jobs.record(run_id,sample_id,JobExecutionError(message,source_run_id=run_id,source_phase='AUDITING'),connection=connection)

    def cancel(self, run_id: str):
        self.snapshot(run_id)
        self.jobs.cancel(run_id,('MODEL_AUDIT',))
        with self.db.connection() as connection:
            connection.execute("UPDATE audit_sample_runs SET state='CANCELLED' WHERE job_id=? AND state IN ('PENDING','RUNNING')", (run_id,))
        return self.jobs.status(run_id)

    def interrupt(self, run_id: str):
        self.snapshot(run_id)
        self.jobs.interrupt_external(run_id)
        with self.db.connection() as connection:
            connection.execute("UPDATE audit_sample_runs SET state='INTERRUPTED' WHERE job_id=? AND state IN ('PENDING','RUNNING')", (run_id,))
        return self.jobs.status(run_id)

    def resume(self, run_id: str):
        self.snapshot(run_id)
        def persist(connection):
            connection.execute('UPDATE audit_workflow_runs SET summary_json=NULL,report_html=NULL WHERE job_id=?', (run_id,))
            connection.execute("UPDATE audit_sample_runs SET state='PENDING' WHERE job_id=? AND state!='COMPLETED'", (run_id,))
        return self.jobs.resume_external(run_id,persist=persist)
