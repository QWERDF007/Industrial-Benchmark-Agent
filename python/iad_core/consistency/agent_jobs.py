from sqlite3 import Connection
from typing import TYPE_CHECKING
from uuid import UUID, uuid5

from iad_core.consistency.agent_models import (AnchorResult, AnchorTraceEvent, CombinedCandidatePolicy, ConsistencyAgentStart,
    ConsistencyAnchorRun, ConsistencyCheckConfiguration, ConsistencyCheckSnapshot, ConsistencyModelRoles,
    ExactCandidatePolicy, NoCandidateResult)
from iad_core.consistency.candidate_selection import AnchorCandidates
from iad_core.consistency.agent_prompts import AGENT_REVIEW_INSTRUCTION, VISUAL_OBSERVATION_INSTRUCTION
from iad_core.consistency.agent_results import ConsistencyAgentResults
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.models import ConsistencyRetrievalSettings, ImageRetrieve
from iad_core.consistency.policy import AnnotationPolicy
from iad_core.consistency.scopes import ConsistencyScopes
from iad_core.dataset.registry import DatasetRegistry
from iad_core.feature.profiles import ImageEncoders
from iad_core.workbench.analysis_job_views import AnalysisJobViews
from iad_core.workbench.model_profile import ModelLimits
from iad_core.workbench.model_settings import WorkbenchModels
from iad_core.workbench.module_settings import ConsistencySettingsValues, ModuleSettings
from iad_core.workbench.job_models import JobExecutionError

if TYPE_CHECKING:
    from iad_core.workbench.runtime import WorkbenchRuntime


class ConsistencyAgentJobs:
    def __init__(self, runtime: 'WorkbenchRuntime'):
        self.runtime, self.db, self.jobs = runtime, runtime.db, runtime.jobs
        self.results = ConsistencyAgentResults(self.db)

    def configuration(self) -> ConsistencyCheckConfiguration:
        configured = ModuleSettings(self.db).read('consistency')
        models = WorkbenchModels(self.db).read()
        return ConsistencyCheckConfiguration(settings_revision=configured.revision, settings=configured.settings,
            model_limits=models.selection.limits if models.selection else ModelLimits())

    def start(self, request: dict, *, roles: dict | None = None,
              configuration: dict | ConsistencyCheckConfiguration | None = None) -> dict:
        submitted = ConsistencyAgentStart.model_validate(request)
        submission = {**submitted.model_dump(mode='json', exclude_unset=True),
            'submission_id': str(submitted.submission_id), 'analysis_kind': 'consistency'}
        if existing := self.jobs.submitted('ANALYSIS_WORKFLOW', submission):
            return {**AnalysisJobViews(self.db).view(existing['run_id']), 'created': False}
        configured = ConsistencyCheckConfiguration.model_validate(configuration) if configuration is not None else self.configuration()
        overrides = submitted.model_dump(include=set(ConsistencyRetrievalSettings.model_fields), exclude_unset=True)
        settings = ConsistencySettingsValues.model_validate({**configured.settings.model_dump(), **overrides})
        retrieval = (ExactCandidatePolicy(max_exact_candidates=settings.max_exact_candidates) if settings.mode == 'exact'
            else CombinedCandidatePolicy.model_validate(settings.model_dump(include=set(ConsistencyRetrievalSettings.model_fields))))
        scope = {'kind': 'datasets', 'dataset_ids': submitted.dataset_ids}
        scopes = ConsistencyScopes(self.db).freeze(submitted.subjects or scope, submitted.corpus_scope or scope)
        if not scopes.subjects.samples:
            raise ValueError('未选择可检查的图片')
        registry = DatasetRegistry(self.db)
        snapshot = ConsistencyCheckSnapshot(settings_revision=configured.settings_revision, retrieval=retrieval, scopes=scopes,
            model_call_logging='native-v1', phase_logging='timeline-v1',
            model=settings.model, agent_model=settings.agent_model,
            model_limits=configured.model_limits,
            roles=ConsistencyModelRoles.model_validate(roles or {}),
            image_encoder=ImageEncoders(self.db).read().selection if settings.mode == 'combined' else None,
            policies={dataset_id: AnnotationPolicy.model_validate(registry.get(dataset_id).annotations.model_dump(
                include=set(AnnotationPolicy.model_fields))) for dataset_id in sorted(set(scopes.subjects.dataset_ids + scopes.corpus.dataset_ids))},
            instruction=submitted.instruction, agent_instruction=AGENT_REVIEW_INSTRUCTION,
            visual_instruction=VISUAL_OBSERVATION_INSTRUCTION)
        sample_ids = [sample.sample_id for sample in scopes.subjects.samples]
        units = [dict(dataset_id=dataset_id, request=dict(sample_ids=[sample.sample_id for sample in scopes.subjects.samples
            if sample.dataset_id == dataset_id])) for dataset_id in scopes.subjects.dataset_ids]
        payload = dict(submission=submission, consistency_check=snapshot.model_dump(mode='json'),
            dataset_id=scopes.subjects.dataset_ids[0], dataset_ids=scopes.subjects.dataset_ids,
            analysis_kind='consistency', sample_ids=sample_ids, units=units)

        created = False

        def persist(connection: Connection, run_id: str):
            nonlocal created
            namespace = UUID(run_id.removeprefix('analysis_'))
            connection.executemany('''INSERT INTO consistency_anchor_runs(job_id,anchor_id,ordinal,session_id,state,phase)
                VALUES(?,?,?,?,?,?)''', [(run_id, sample_id, ordinal, 'consistency-' + uuid5(namespace, sample_id).hex,
                    'PENDING', 'CREATING_SESSION') for ordinal, sample_id in enumerate(sample_ids)])
            created = True

        job = self.jobs.start('ANALYSIS_WORKFLOW', scopes.subjects.samples[0].task_id,
            payload, None, '准备逐主图一致性审核', persist=persist)
        return {**AnalysisJobViews(self.db).view(job['run_id']), 'created': created}

    def snapshot(self, run_id: str) -> ConsistencyCheckSnapshot:
        return self.results.snapshot(run_id)

    def anchors(self, run_id: str) -> list[ConsistencyAnchorRun]:
        return self.results.anchors(run_id)

    def anchor(self, run_id: str, anchor_id: str) -> ConsistencyAnchorRun:
        return self.results.anchor(run_id, anchor_id)

    def attempt(self, run_id: str, anchor_id: str, attempt: int) -> ConsistencyAnchorRun:
        anchor = self.anchor(run_id, anchor_id)
        if anchor.attempt != attempt:
            raise ValueError('过期的主图审核 attempt')
        return anchor

    def cancel(self, run_id: str) -> dict:
        self.snapshot(run_id)
        self.jobs.cancel(run_id, ('ANALYSIS_WORKFLOW',))
        with self.db.connection() as connection:
            connection.execute("""UPDATE consistency_anchor_runs SET state='CANCELLED',phase='CANCELLED'
                WHERE job_id=? AND state IN ('PENDING','RUNNING') AND result_json IS NULL""", (run_id,))
        return AnalysisJobViews(self.db).view(run_id)

    def resume(self, run_id: str) -> dict:
        self.snapshot(run_id)

        def persist(connection: Connection):
            connection.execute("""UPDATE consistency_anchor_runs SET attempt=attempt+1,
                state=CASE WHEN session_created THEN 'RUNNING' ELSE 'PENDING' END,phase='RESUMING',
                trace_state='OPEN',trace_error=NULL WHERE job_id=? AND result_json IS NULL""", (run_id,))

        self.jobs.resume_external(run_id, persist=persist)
        return AnalysisJobViews(self.db).view(run_id)

    def interrupt(self, run_id: str) -> dict:
        self.snapshot(run_id)
        self.jobs.interrupt_external(run_id)
        with self.db.connection() as connection:
            connection.execute("""UPDATE consistency_anchor_runs SET state='INTERRUPTED',phase='INTERRUPTED'
                WHERE job_id=? AND state IN ('PENDING','RUNNING') AND result_json IS NULL""", (run_id,))
        return AnalysisJobViews(self.db).view(run_id)

    def session_created(self, run_id: str, anchor_id: str) -> ConsistencyAnchorRun:
        self.jobs.update(run_id, phase='CREATING_ANCHOR_SESSIONS')
        with self.db.connection() as connection:
            connection.execute('''UPDATE consistency_anchor_runs SET session_created=1,state='RUNNING',phase='RETRIEVING'
                WHERE job_id=? AND anchor_id=? AND session_created=0''', (run_id, anchor_id))
        return self.anchor(run_id, anchor_id)

    def phase(self, run_id: str, anchor_id: str, phase: str) -> None:
        self.jobs.update(run_id, phase=phase, current_sample_id=anchor_id)
        with self.db.connection() as connection:
            connection.execute('UPDATE consistency_anchor_runs SET phase=? WHERE job_id=? AND anchor_id=?',
                (phase, run_id, anchor_id))

    def retrieve(self, run_id: str, anchor_id: str) -> AnchorCandidates:
        anchor = self.anchor(run_id, anchor_id)
        if anchor.candidates is not None:
            return anchor.candidates
        if not anchor.session_created:
            raise ValueError('主图内部会话尚未创建')
        snapshot = self.snapshot(run_id)
        self.phase(run_id, anchor_id, 'RETRIEVING_ANCHOR')
        values = snapshot.retrieval.model_dump()
        if snapshot.retrieval.mode == 'exact':
            settings = ConsistencyRetrievalSettings(mode='exact', max_exact_candidates=snapshot.retrieval.max_exact_candidates)
            request = ImageRetrieve(query={'kind': 'sample', 'sample_id': anchor_id},
                corpus_scope=snapshot.scopes.corpus.selector, mode='exact')
        else:
            if snapshot.image_encoder is None:
                raise ConsistencyError('PROFILE_NOT_CONFIGURED', '作业未配置整图编码器')
            settings = ConsistencyRetrievalSettings.model_validate(values)
            request = ImageRetrieve(query={'kind': 'sample', 'sample_id': anchor_id},
                corpus_scope=snapshot.scopes.corpus.selector, mode='combined', top_k=None,
                min_similarity=settings.min_similarity, profile_id=snapshot.image_encoder.profile.profile_id)
        retrieved = self.runtime.consistency_service.retrieve_full(request, frozen_scope=snapshot.scopes.corpus,
            encoder=snapshot.image_encoder)
        selected = AnchorCandidates.select(retrieved, settings)
        with self.db.connection() as connection:
            connection.execute('''UPDATE consistency_anchor_runs SET candidates_json=?,phase=? WHERE job_id=? AND anchor_id=?''',
                (selected.model_dump_json(), 'AWAITING_REVIEW' if selected.candidates else 'RULE_READY', run_id, anchor_id))
        return selected

    def submit_empty(self, run_id: str, anchor_id: str, *, attempt: int = 1) -> NoCandidateResult:
        anchor = self.attempt(run_id, anchor_id, attempt)
        if anchor.candidates is None or anchor.candidates.candidates:
            raise ValueError('规则通过要求成功冻结的零候选清单')
        return self.complete(run_id, anchor_id, NoCandidateResult(), attempt=attempt)

    def complete(self, run_id: str, anchor_id: str, result: AnchorResult, *, attempt: int) -> AnchorResult:
        with self.jobs.lock:
            anchor = self.attempt(run_id, anchor_id, attempt)
            if anchor.result is not None:
                if anchor.result != result:
                    raise ValueError('本主图已有不同终稿，不能覆盖')
                return anchor.result

            def persist(connection: Connection):
                changed = connection.execute('''UPDATE consistency_anchor_runs SET state='COMPLETED',phase='SUBMITTED',result_json=?
                    WHERE job_id=? AND anchor_id=? AND attempt=?''', (result.model_dump_json(), run_id, anchor_id, attempt))
                if not changed.rowcount:
                    raise ValueError('过期的主图审核 attempt')

            self.jobs.record(run_id, anchor_id, persist=persist)
            return result

    def fail(self, run_id: str, anchor_id: str, message: str, code: str | None = None, *, attempt: int = 1,
             source_run_id: str | None = None, source_phase: str | None = None) -> ConsistencyAnchorRun:
        anchor = self.attempt(run_id, anchor_id, attempt)
        def persist(connection: Connection):
            changed = connection.execute("UPDATE consistency_anchor_runs SET state='FAILED',phase='FAILED' WHERE job_id=? AND anchor_id=? AND attempt=?",
                (run_id, anchor_id, attempt))
            if not changed.rowcount:
                raise ValueError('过期的主图审核 attempt')

        self.jobs.record(run_id, anchor_id, JobExecutionError(message, source_run_id=source_run_id or run_id,
            source_phase=source_phase or anchor.phase, code=code), persist=persist)
        return self.anchor(run_id, anchor_id)

    def trace_event(self, run_id: str, anchor_id: str) -> AnchorTraceEvent:
        anchor = self.anchor(run_id, anchor_id)
        return AnchorTraceEvent(job_id=run_id, anchor_id=anchor_id, session_id=anchor.session_id,
            attempt=anchor.attempt, state=anchor.state, result=anchor.result,
            errors=[error for error in self.jobs.snapshot(run_id).errors if error.sample_id == anchor_id])

    def trace_status(self, run_id: str, anchor_id: str, error: str | None) -> ConsistencyAnchorRun:
        self.anchor(run_id, anchor_id)
        with self.db.connection() as connection:
            connection.execute('UPDATE consistency_anchor_runs SET trace_state=?,trace_error=? WHERE job_id=? AND anchor_id=?',
                ('PENDING' if error is not None else 'CLOSED', error, run_id, anchor_id))
        return self.anchor(run_id, anchor_id)
