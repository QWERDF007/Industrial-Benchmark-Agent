from sqlite3 import Connection
from typing import TYPE_CHECKING
from uuid import UUID, uuid5

from iad_core.consistency.agent_models import (AnchorResult, AnchorTraceEvent, CombinedCandidatePolicy, ConsistencyAgentStart,
    ConsistencyAnchorRun, ConsistencyCheckConfiguration, ConsistencyCheckSnapshot, ConsistencyModelRoles,
    ExactCandidatePolicy, NoCandidateResult)
from iad_core.consistency.candidate_selection import AnchorCandidates
from iad_core.consistency.agent_results import ConsistencyAgentResults
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.models import ConsistencyRetrievalSettings, ImageRetrieve
from iad_core.consistency.policy import AnnotationPolicy
from iad_core.consistency.identity_prompts import IDENTITY_PIPELINE, IDENTITY_PROMPT_VERSION, identity_prompt_defaults, task_prompt_defaults
from iad_core.consistency.scopes import ConsistencyScopes
from iad_core.dataset.registry import DatasetRegistry
from iad_core.feature.profiles import ImageEncoders
from iad_core.workbench.analysis_job_views import AnalysisJobViews
from iad_core.workbench.module_settings import ModuleSettings
from iad_core.workbench.job_models import JobExecutionError

if TYPE_CHECKING:
    from iad_core.workbench.runtime import WorkbenchRuntime


class ConsistencyAgentJobs:
    def __init__(self, runtime: 'WorkbenchRuntime'):
        self.runtime, self.db, self.jobs = runtime, runtime.db, runtime.jobs
        self.results = ConsistencyAgentResults(self.db)

    def configuration(self) -> ConsistencyCheckConfiguration:
        configured = ModuleSettings(self.db).read('consistency')
        return ConsistencyCheckConfiguration(settings_revision=configured.revision, settings=configured.settings)

    def start(self, request: dict, *, roles: dict | None = None,
              configuration: dict | ConsistencyCheckConfiguration | None = None) -> dict:
        submitted = ConsistencyAgentStart.model_validate(request)
        submission = {**submitted.model_dump(mode='json', exclude_unset=True),
            'submission_id': str(submitted.submission_id), 'analysis_kind': 'consistency'}
        if existing := self.jobs.submitted('ANALYSIS_WORKFLOW', submission):
            return {**AnalysisJobViews(self.db).view(existing['run_id']), 'created': False}
        configured = ConsistencyCheckConfiguration.model_validate(configuration) if configuration is not None else self.configuration()
        overrides = submitted.model_dump(include=set(ConsistencyRetrievalSettings.model_fields), exclude_unset=True)
        settings = configured.settings
        retrieval_settings = ConsistencyRetrievalSettings.model_validate({
            **settings.model_dump(include=set(ConsistencyRetrievalSettings.model_fields)), **overrides})
        retrieval = (ExactCandidatePolicy(max_exact_candidates=retrieval_settings.max_exact_candidates) if retrieval_settings.mode == 'exact'
            else CombinedCandidatePolicy.model_validate(retrieval_settings.model_dump()))
        scope = {'kind': 'datasets', 'dataset_ids': submitted.dataset_ids}
        scopes = ConsistencyScopes(self.db).freeze(submitted.subjects or scope, submitted.corpus_scope or scope)
        if not scopes.subjects.samples:
            raise ValueError('未选择可检查的图片')
        registry = DatasetRegistry(self.db)
        from iad_core.consistency.task_types import TASK_TYPES_BY_FORMAT
        dataset_ids = sorted(set(scopes.subjects.dataset_ids + scopes.corpus.dataset_ids))
        formats = {dataset_id: registry.get(dataset_id).dataset.format for dataset_id in dataset_ids}
        if len(set(formats.values())) != 1:
            raise ValueError('主图与候选库应使用相同的已登记标注格式')
        task_type = TASK_TYPES_BY_FORMAT[next(iter(formats.values()))]
        prompts = task_prompt_defaults(task_type)
        snapshot = ConsistencyCheckSnapshot(settings_revision=configured.settings_revision, retrieval=retrieval, scopes=scopes,
            concurrency=settings.concurrency, whole_image_max_side=submitted.whole_image_max_side,
            model_call_logging='native-v1', phase_logging='timeline-v1',
            model=settings.model,
            model_limits=settings.vision_limits,
            position_tolerance=settings.position_tolerance,
            annotation_classification='content-coverage-v1',
            roles=ConsistencyModelRoles.model_validate(roles or {}),
            image_encoder=ImageEncoders(self.db).read().selection if retrieval.mode == 'combined' else None,
            dataset_formats=formats,
            policies={dataset_id: AnnotationPolicy.model_validate(registry.get(dataset_id).annotations.model_dump(
                include=set(AnnotationPolicy.model_fields))) for dataset_id in dataset_ids},
            instruction=submitted.instruction or prompts['user'],
            system_prompt=submitted.system_prompt or prompts['system'],
            review_pipeline=IDENTITY_PIPELINE, task_type=task_type,
            prompts=submitted.identity_prompts.model_dump() if submitted.identity_prompts is not None else identity_prompt_defaults(),
            prompt_version=IDENTITY_PROMPT_VERSION)
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
        snapshot = self.snapshot(run_id)
        if (snapshot.review_pipeline, snapshot.prompt_version) != (IDENTITY_PIPELINE, IDENTITY_PROMPT_VERSION):
            raise ValueError('历史一致性作业只读保留，请新建检查')
        anchor = self.anchor(run_id, anchor_id)
        if anchor.attempt != attempt:
            raise ValueError('过期的主图审核 attempt')
        return anchor

    def cancel(self, run_id: str) -> dict:
        self.snapshot(run_id)
        self.stop_preparation(run_id)
        self.jobs.cancel(run_id, ('ANALYSIS_WORKFLOW',))
        with self.db.connection() as connection:
            connection.execute("""UPDATE consistency_anchor_runs SET state='CANCELLED',phase='CANCELLED'
                WHERE job_id=? AND state IN ('PENDING','RUNNING') AND result_json IS NULL""", (run_id,))
        return AnalysisJobViews(self.db).view(run_id)

    def resume(self, run_id: str) -> dict:
        snapshot = self.snapshot(run_id)
        if snapshot.review_pipeline != IDENTITY_PIPELINE or snapshot.prompt_version != IDENTITY_PROMPT_VERSION:
            raise ValueError('历史一致性作业只读保留，请新建检查以执行图像内容验证')

        def persist(connection: Connection):
            connection.execute("""UPDATE consistency_anchor_runs SET attempt=attempt+1,
                state=CASE WHEN session_created THEN 'RUNNING' ELSE 'PENDING' END,phase='RESUMING',
                trace_state='OPEN',trace_error=NULL WHERE job_id=? AND result_json IS NULL""", (run_id,))

        self.jobs.resume_external(run_id, persist=persist)
        return AnalysisJobViews(self.db).view(run_id)

    def finish(self, run_id: str) -> dict:
        state = self.jobs.status(run_id)
        if state['completed'] + state['failed'] != state['total_samples']:
            raise ValueError('全部主图处理结束后才能汇总结果')
        self.jobs.update(run_id, phase='SUMMARIZING_CONSISTENCY_RESULTS')
        report = self.results.report(run_id)
        if (report.total, report.completed, report.states['FAILED']) != (
                state['total_samples'], state['completed'], state['failed']):
            raise ValueError('主图结果统计与作业进度不一致，不能完成汇总')
        job = self.jobs.finish_external(run_id)
        return AnalysisJobViews(self.db).view(job['run_id'])

    def interrupt(self, run_id: str) -> dict:
        self.snapshot(run_id)
        self.stop_preparation(run_id)
        self.jobs.interrupt_external(run_id)
        with self.db.connection() as connection:
            connection.execute("""UPDATE consistency_anchor_runs SET state='INTERRUPTED',phase='INTERRUPTED'
                WHERE job_id=? AND state IN ('PENDING','RUNNING') AND result_json IS NULL""", (run_id,))
        return AnalysisJobViews(self.db).view(run_id)

    def stop_preparation(self, run_id: str) -> None:
        if batch_id := self.jobs.status(run_id).get('index_batch_id'):
            self.runtime.consistency.cancel(batch_id)

    def session_created(self, run_id: str, anchor_id: str, *, attempt: int = 1) -> ConsistencyAnchorRun:
        with self.jobs.lock, self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            current = connection.execute('''SELECT j.status,a.state,a.attempt FROM consistency_anchor_runs a
                JOIN job_runs j ON j.job_id=a.job_id WHERE a.job_id=? AND a.anchor_id=?''', (run_id, anchor_id)).fetchone()
            if current is None:
                raise LookupError('主图不属于当前作业')
            if current['status'] != 'RUNNING' or current['state'] not in ('PENDING', 'RUNNING'):
                raise InterruptedError('作业已停止')
            if current['attempt'] != attempt:
                raise ValueError('过期的主图审核 attempt')
            connection.execute('''UPDATE consistency_anchor_runs SET session_created=1,state='RUNNING',phase='RETRIEVING'
                WHERE job_id=? AND anchor_id=? AND session_created=0''', (run_id, anchor_id))
        return self.anchor(run_id, anchor_id)

    def phase(self, run_id: str, anchor_id: str, phase: str) -> None:
        self.jobs.update(run_id, phase=phase, current_sample_id=anchor_id)
        with self.db.connection() as connection:
            connection.execute('UPDATE consistency_anchor_runs SET phase=? WHERE job_id=? AND anchor_id=?',
                (phase, run_id, anchor_id))

    def retrieve(self, run_id: str, anchor_id: str) -> AnchorCandidates:
        result = self.retrieve_many(run_id, [anchor_id])[0]
        if result.error:
            raise ConsistencyError(result.error.code, result.error.message)
        return result.candidates

    def retrieve_many(self, run_id: str, anchor_ids: list[str]):
        import json
        from iad_core.consistency.candidate_retrieval import AnchorRetrievalResult

        if not anchor_ids or len(set(anchor_ids)) != len(anchor_ids):
            raise ValueError('候选检索要求非空且不重复的主图清单')
        context, snapshot = self.jobs.context(run_id), self.snapshot(run_id)
        with self.db.connection() as connection:
            rows = connection.execute('''SELECT anchor_id,candidates_json FROM consistency_anchor_runs
                WHERE job_id=? AND anchor_id IN (SELECT value FROM json_each(?))''',
                (run_id, json.dumps(anchor_ids))).fetchall()
        if len(rows) != len(anchor_ids):
            raise ValueError('主图不属于当前作业')
        selected = {row['anchor_id']: AnchorRetrievalResult(anchor_id=row['anchor_id'],
            candidates=AnchorCandidates.model_validate_json(row['candidates_json'])) for row in rows if row['candidates_json']}
        pending = [identity for identity in anchor_ids if identity not in selected]
        if pending:
            if snapshot.retrieval.mode == 'combined' and snapshot.image_encoder is None:
                raise ConsistencyError('PROFILE_NOT_CONFIGURED', '作业未配置整图编码器')
            context.update(phase='RETRIEVING_ANCHOR', current_sample_id=pending[0])
            with self.db.connection() as connection:
                connection.execute('''UPDATE consistency_anchor_runs SET phase='RETRIEVING_ANCHOR'
                    WHERE job_id=? AND anchor_id IN (SELECT value FROM json_each(?))''', (run_id, json.dumps(pending)))
            from iad_core.feature.index_models import IndexLimits
            limit = self.runtime.indexes.limits.query_batch_size if snapshot.retrieval.mode == 'combined' else IndexLimits().query_batch_size
            for offset in range(0, len(pending), limit):
                items = list(self.runtime.candidate_retrieval.select(snapshot, pending[offset:offset+limit], context.checkpoint))
                with self.db.connection() as connection:
                    for item in items:
                        context.checkpoint()
                        if item.candidates is None:
                            continue
                        updated = connection.execute('''UPDATE consistency_anchor_runs SET candidates_json=?,phase=?
                            WHERE job_id=? AND anchor_id=? AND state IN ('PENDING','RUNNING')
                            AND EXISTS(SELECT 1 FROM job_runs WHERE job_id=? AND status='RUNNING')''',
                            (item.candidates.model_dump_json(), 'AWAITING_REVIEW' if item.candidates.candidates else 'RULE_READY',
                                run_id, item.anchor_id, run_id))
                        if updated.rowcount != 1:
                            raise InterruptedError('作业已停止')
                    self.results.refresh_index(run_id, connection=connection)
                selected.update((item.anchor_id, item) for item in items)
        return [selected[identity] for identity in anchor_ids]

    def submit_empty(self, run_id: str, anchor_id: str, *, attempt: int = 1) -> NoCandidateResult:
        anchor = self.attempt(run_id, anchor_id, attempt)
        if anchor.candidates is None or anchor.candidates.candidates:
            raise ValueError('规则通过要求成功冻结的零候选清单')
        return self.complete(run_id, anchor_id, NoCandidateResult(), attempt=attempt)

    def complete(self, run_id: str, anchor_id: str, result: AnchorResult, *, attempt: int,
                 request_id: str | None = None, request_payload: dict | None = None) -> AnchorResult:
        with self.jobs.lock:
            import hashlib
            import json
            request_sha256 = hashlib.sha256(json.dumps(request_payload, sort_keys=True, ensure_ascii=False).encode()).hexdigest() if request_id else None
            with self.db.connection() as connection:
                saved_request = connection.execute('SELECT submission_request_id,submission_sha256 FROM consistency_anchor_runs WHERE job_id=? AND anchor_id=?',
                    (run_id, anchor_id)).fetchone()
            if request_id and saved_request['submission_request_id'] == request_id and saved_request['submission_sha256'] != request_sha256:
                raise ValueError('终稿请求ID已用于不同内容')
            snapshot = self.snapshot(run_id)
            if snapshot.review_pipeline == IDENTITY_PIPELINE:
                from iad_core.consistency.identity import CandidateIdentity
                from iad_core.consistency.identity_outcome import IdentityOutcome
                from iad_core.consistency.annotation_evaluation import AnnotationEvaluation
                from iad_core.consistency.agent_assessments import AnchorAssessments
                from iad_core.consistency.candidate_records import CandidateRecords
                with self.db.connection() as connection:
                    records = AnchorAssessments.list(connection, run_id, anchor_id)
                    active_records = [record.record_id for record in CandidateRecords.history(connection, run_id, anchor_id) if record.active]
                if {item.candidate_id: item for item in result.assessments} != {
                        record.submission.assessment.candidate_id: record.submission.assessment for record in records}:
                    raise ValueError('终稿必须来自已保存的最新候选评估，不能绕过评估写入')
                result = result.model_copy(update={**IdentityOutcome(CandidateIdentity(self.runtime).read(run_id, anchor_id)).assemble(result.assessments),
                    'task_type': snapshot.task_type, 'candidate_record_ids': active_records,
                    'issues': AnnotationEvaluation.aggregate(records)})

            anchor = self.attempt(run_id, anchor_id, attempt)
            if anchor.result is not None:
                if anchor.result != result:
                    raise ValueError('本主图已有不同终稿，不能覆盖')
                return anchor.result

            def persist(connection: Connection):
                if snapshot.review_pipeline == IDENTITY_PIPELINE:
                    latest = [record.record_id for record in CandidateRecords.history(connection, run_id, anchor_id) if record.active]
                    if latest != result.candidate_record_ids:
                        raise ValueError('提交期间候选版本已变化，请重新读取当前评估')
                changed = connection.execute('''UPDATE consistency_anchor_runs SET state='COMPLETED',phase='SUBMITTED',result_json=?,
                    submission_request_id=?,submission_sha256=? WHERE job_id=? AND anchor_id=? AND attempt=? AND state IN ('RUNNING')''',
                    (result.model_dump_json(), request_id, request_sha256, run_id, anchor_id, attempt))
                if not changed.rowcount:
                    raise ValueError('过期的主图审核 attempt')

            self.jobs.record(run_id, anchor_id, persist=persist)
            return result

    def fail(self, run_id: str, anchor_id: str, message: str, code: str | None = None, *, attempt: int = 1,
             source_run_id: str | None = None, source_phase: str | None = None) -> ConsistencyAnchorRun:
        with self.jobs.lock:
            anchor = self.attempt(run_id, anchor_id, attempt)
            if anchor.state not in ('PENDING', 'RUNNING'):
                return anchor

            def persist(connection: Connection):
                changed = connection.execute("UPDATE consistency_anchor_runs SET state='FAILED',phase='FAILED' WHERE job_id=? AND anchor_id=? AND attempt=?",
                    (run_id, anchor_id, attempt))
                if not changed.rowcount:
                    raise ValueError('过期的主图审核 attempt')

            self.jobs.record(run_id, anchor_id, JobExecutionError(message, source_run_id=source_run_id or run_id,
                source_phase=source_phase or anchor.phase, code=code), persist=persist)
            return self.anchor(run_id, anchor_id)

    def fail_preparation(self, run_id: str, error: Exception) -> None:
        pending = [anchor.anchor_id for anchor in self.anchors(run_id) if anchor.state in ('PENDING', 'RUNNING')]
        self.jobs.record(run_id, pending, error, phase='FAILED', persist=lambda connection: connection.execute(
            "UPDATE consistency_anchor_runs SET state='FAILED',phase='FAILED' WHERE job_id=? AND state IN ('PENDING','RUNNING')", (run_id,)))
        self.jobs.finish_external(run_id)

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
