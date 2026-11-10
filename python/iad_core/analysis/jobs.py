from uuid import NAMESPACE_URL, uuid5

from iad_core.analysis.models import (AnalysisAgentConfiguration, AnalysisAgentContext, AnalysisAgentStart,
    AnalysisCatalog, AnalysisSessionLocation, AnalysisWorkflowSnapshot, AnalysisWorkflowState, ExplorationAgentStart)
from iad_core.analysis.directions import AnalysisDirections
from iad_core.analysis.coverage import AnalysisCoverageReader
from iad_core.analysis.prompt_text import EXPLORATION_WORKFLOW, knowledge_agent_prompt, FINALIZATION_WORKFLOW
from iad_core.knowledge.instructions import FrozenMiningPrompt
from iad_core.knowledge.support import KnowledgeSupport
from iad_core.workbench.analysis_job_views import AnalysisJobViews
from iad_core.workbench.analysis_manifest import AnalysisManifests
from iad_core.workbench.model_profile import FrozenModelRole
from iad_core.workbench.module_settings import ModuleSettings


class AnalysisAgentJobs:
    """One frozen registration scope and private native Session for each analysis job."""

    def __init__(self, runtime):
        self.runtime, self.db, self.jobs = runtime, runtime.db, runtime.jobs

    def configuration(self, module: str) -> AnalysisAgentConfiguration:
        settings = ModuleSettings(self.db).read(module)
        return AnalysisAgentConfiguration(module=module, settings_revision=settings.revision, settings=settings.settings)

    def start(self, request: dict, *, agent: dict,
              configuration: dict | AnalysisAgentConfiguration | None = None) -> dict:
        selected = AnalysisAgentStart.model_validate(request).root
        submission = selected.model_dump(mode='json')
        if existing := self.jobs.submitted('ANALYSIS_WORKFLOW', submission):
            return {**AnalysisJobViews(self.db).view(existing['run_id']), 'created': False}
        configured = AnalysisAgentConfiguration.model_validate(configuration) if configuration is not None else self.configuration(selected.analysis_kind)
        if configured.module != selected.analysis_kind:
            raise ValueError('模块配置不属于当前作业')
        role = FrozenModelRole.model_validate(agent)
        if role.error or not role.profile or not role.native_profile or 'image' not in role.input_modalities:
            raise ValueError('分析模型不可用：' + (role.error or '需要原生工具调用和图像输入能力'))
        if not configured.settings.model or (role.profile.provider_id, role.profile.model_id) != (
                configured.settings.model.provider_id, configured.settings.model.model_id):
            raise ValueError('实际Agent与本次模块模型配置不一致')
        manifest = AnalysisManifests(self.db).freeze(selected.dataset_ids)
        exploration = isinstance(selected, ExplorationAgentStart)
        plan = manifest.plan(selected.analysis_kind, batch_size=configured.settings.batch_size,
            sampling_ratio=configured.settings.sampling_ratio,
            normal_images=selected.normal_images if exploration else (), defect_images=selected.defect_images if exploration else ())
        prompt = selected.prompt if exploration else None
        mining = None if exploration else FrozenMiningPrompt.capture(selected.mining_prompt)
        directions = [] if exploration else AnalysisDirections(self.db).freeze(selected.mining_prompt)
        snapshot = AnalysisWorkflowSnapshot(**configured.model_dump(), schema_version=2, manifest=manifest, plan=plan,
            agent=role, instruction=prompt.text if prompt else mining.instruction, finalization_instruction=FINALIZATION_WORKFLOW, exploration_prompt=prompt, mining_prompt=mining,
            system_prompt=selected.system_prompt or (EXPLORATION_WORKFLOW if exploration else knowledge_agent_prompt()),
            support_policy=KnowledgeSupport.configured(), selected_directions=directions)
        payload = dict(submission=submission, analysis_workflow_version=2, analysis_kind=selected.analysis_kind,
            dataset_id=manifest.records[0].sample.dataset_id, dataset_ids=manifest.dataset_ids,
            sample_ids=[record.sample.sample_id for record in manifest.records])
        created = False

        def persist(connection, run_id):
            nonlocal created
            session_id = selected.analysis_kind + '-' + uuid5(NAMESPACE_URL, run_id).hex
            connection.execute('''INSERT INTO analysis_workflow_runs(job_id,session_id,snapshot_json,catalog_json)
                VALUES(?,?,?,?)''', (run_id, session_id, snapshot.model_dump_json(), AnalysisCatalog().model_dump_json()))
            self.jobs.update(run_id, connection=connection, completion_pending=True)
            created = True

        job = self.jobs.start('ANALYSIS_WORKFLOW', manifest.records[0].sample.task_id, payload,
            None, '准备所选范围的原生分析', persist=persist)
        return {**AnalysisJobViews(self.db).view(job['run_id']), 'created': created}

    def snapshot(self, run_id: str) -> AnalysisWorkflowSnapshot:
        with self.db.connection() as connection:
            row = connection.execute('SELECT snapshot_json FROM analysis_workflow_runs WHERE job_id=?', (run_id,)).fetchone()
        if row is None:
            raise LookupError('原生分析作业不存在')
        return AnalysisWorkflowSnapshot.model_validate_json(row[0])

    def state(self, run_id: str) -> AnalysisWorkflowState:
        with self.db.connection() as connection:
            row = connection.execute('''SELECT job_id,session_id,session_created,revision,catalog_json
                FROM analysis_workflow_runs WHERE job_id=?''', (run_id,)).fetchone()
        if row is None:
            raise LookupError('原生分析作业不存在')
        return AnalysisWorkflowState(job_id=row['job_id'], session_id=row['session_id'],
            session_created=bool(row['session_created']), revision=row['revision'], catalog=AnalysisCatalog.model_validate_json(row['catalog_json']))

    def context(self, run_id: str) -> AnalysisAgentContext:
        state, snapshot = self.state(run_id), self.snapshot(run_id)
        job = self.jobs.status(run_id)
        processed = set(job['completed_sample_ids'] + job['failed_sample_ids'])
        current = next((round for round in snapshot.plan.rounds if any(target.sample_id not in processed for target in round.targets)), None)
        coverage = AnalysisCoverageReader(self.db)
        targets = {target.sample_id for target in current.targets} if current else set()
        return AnalysisAgentContext(**state.model_dump(), round=current,
            registrations=[record for record in snapshot.manifest.records if current and record.sample.sample_id in
                targets], selected_directions=snapshot.selected_directions,
            completed_sample_ids=job['completed_sample_ids'], failed_sample_ids=job['failed_sample_ids'],
            accepted_observations=coverage.observations(run_id,current.round_id) if current else [],
            media_progress=[record.model_context() for record in coverage.read(run_id).records if record.sample_id in targets],
            catalog_counts=dict(directions=len(state.catalog.directions),checks=len(state.catalog.checks)))

    def session_location(self, session_id: str) -> AnalysisSessionLocation:
        with self.db.connection() as connection:
            row = connection.execute('''SELECT r.job_id,json_extract(r.snapshot_json,'$.module') module,
                json_extract(j.payload_json,'$.submitted_at') submitted_at
                FROM analysis_workflow_runs r JOIN job_runs j ON j.job_id=r.job_id WHERE r.session_id=?''', (session_id,)).fetchone()
        if row is None:
            raise LookupError('作业内部Session不存在')
        return AnalysisSessionLocation.model_validate(dict(row))

    def session_created(self, run_id: str):
        self.snapshot(run_id)
        with self.db.connection() as connection:
            connection.execute('UPDATE analysis_workflow_runs SET session_created=1 WHERE job_id=?', (run_id,))
        self.jobs.update(run_id, phase='ANALYZING_SCOPE')
        return self.state(run_id)

    def cancel(self, run_id: str) -> dict:
        self.snapshot(run_id)
        self.jobs.cancel(run_id, ('ANALYSIS_WORKFLOW',))
        from iad_core.analysis.publications import AnalysisPublications
        AnalysisPublications(self.db).publish(run_id)
        return AnalysisJobViews(self.db).view(run_id)

    def resume(self, run_id: str) -> dict:
        self.snapshot(run_id)
        def persist(connection):
            connection.execute("DELETE FROM analysis_sample_media WHERE job_id=? AND json_extract(media_json,'$.error') IS NOT NULL", (run_id,))
        self.jobs.resume_external(run_id, persist=persist)
        self.jobs.update(run_id, execution_error=None, phase='ANALYZING_SCOPE')
        return AnalysisJobViews(self.db).view(run_id)

    def interrupt(self, run_id: str) -> dict:
        self.snapshot(run_id)
        self.jobs.interrupt_external(run_id)
        from iad_core.analysis.publications import AnalysisPublications
        AnalysisPublications(self.db).publish(run_id)
        return AnalysisJobViews(self.db).view(run_id)
