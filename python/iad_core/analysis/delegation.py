import json
from uuid import NAMESPACE_URL, uuid5

from iad_core.evidence.registrations import PreparedRegistration
from iad_core.analysis.delegation_models import ExplorationBatchReport, AnalysisBatchTask, AnalysisWave, AnalysisWorkerMaterials
from iad_core.analysis.batch_evidence import AnalysisBatchEvidence
from iad_core.knowledge.observation_models import KnowledgeBatchReport
from iad_core.exploration.observation_models import ExplorationEvidenceReport
from iad_core.knowledge.observation_models import KnowledgeEvidenceReport


class AnalysisDelegation:
    """Persist batch assignments and evidence-checked reports; DSH owns child execution."""

    def __init__(self, jobs):
        self.jobs, self.db = jobs, jobs.db

    @staticmethod
    def report_schema(snapshot):
        if snapshot.context_policy == 'evidence-on-demand-v1':
            return KnowledgeEvidenceReport if snapshot.module == 'knowledge' else ExplorationEvidenceReport
        return KnowledgeBatchReport if snapshot.module == 'knowledge' else ExplorationBatchReport

    def wave(self, run_id: str) -> AnalysisWave:
        snapshot, context = self.jobs.snapshot(run_id), self.jobs.context(run_id)
        if snapshot.execution_mode != 'dsh-subagents' or context.round and context.round.round_id == 1:
            raise ValueError('首批需要先由主Agent观察并提交，才能分派子代理')
        with self.jobs.jobs.lock, self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            rows = connection.execute('SELECT * FROM analysis_batch_tasks WHERE job_id=? AND review_json IS NULL ORDER BY round_id',
                (run_id,)).fetchall()
            if not rows and context.round:
                wave_id = connection.execute('SELECT COALESCE(MAX(wave_id),0)+1 FROM analysis_batch_tasks WHERE job_id=?',
                    (run_id,)).fetchone()[0]
                rounds = [item for item in snapshot.plan.rounds if item.round_id >= context.round.round_id][:snapshot.settings.concurrency]
                connection.executemany('''INSERT INTO analysis_batch_tasks
                    (job_id,round_id,wave_id,session_id,catalog_revision,catalog_json) VALUES(?,?,?,?,?,?)''',
                    [(run_id, item.round_id, wave_id, snapshot.module + '-observer-' + uuid5(NAMESPACE_URL, run_id + ':' + str(item.round_id)).hex,
                        context.revision, context.catalog.model_dump_json()) for item in rounds])
                rows = connection.execute('SELECT * FROM analysis_batch_tasks WHERE job_id=? AND wave_id=? ORDER BY round_id',
                    (run_id, wave_id)).fetchall()
            tasks = [AnalysisBatchTask(round=snapshot.plan.rounds[row['round_id'] - 1], wave_id=row['wave_id'],
                session_id=row['session_id'], catalog_revision=row['catalog_revision'], catalog=json.loads(row['catalog_json']),
                report=json.loads(row['report_json']) if row['report_json'] else None, reviewed=row['review_json'] is not None) for row in rows]
        return AnalysisWave(wave_id=tasks[0].wave_id if tasks else None, tasks=tasks)

    def task(self, run_id: str, session_id: str) -> AnalysisBatchTask:
        snapshot = self.jobs.snapshot(run_id)
        with self.db.connection() as connection:
            row = connection.execute('SELECT * FROM analysis_batch_tasks WHERE job_id=? AND session_id=?', (run_id, session_id)).fetchone()
        if row is None:
            raise ValueError('子代理没有本批登记授权')
        return AnalysisBatchTask(round=snapshot.plan.rounds[row['round_id'] - 1], wave_id=row['wave_id'],
            session_id=row['session_id'], catalog_revision=row['catalog_revision'], catalog=json.loads(row['catalog_json']),
            report=json.loads(row['report_json']) if row['report_json'] else None, reviewed=row['review_json'] is not None)

    def materials(self, run_id: str, session_id: str) -> AnalysisWorkerMaterials:
        from iad_core.analysis.evidence import AnalysisEvidence
        task = self.task(run_id, session_id)
        evidence = AnalysisEvidence(self.jobs)
        snapshot = self.jobs.snapshot(run_id)
        sources = {record.sample.sample_id:record for record in snapshot.manifest.records}
        return AnalysisWorkerMaterials(job_id=run_id, task=task,
            selected_directions=snapshot.selected_directions,
            sources=[sources[target.sample_id] for target in task.round.targets], registrations=[
            evidence.prepare(run_id, target.sample_id, session_id=session_id).page() for target in task.round.targets])

    def report(self, run_id: str, session_id: str, request: dict) -> AnalysisBatchTask:
        task = self.task(run_id, session_id)
        snapshot = self.jobs.snapshot(run_id)
        knowledge = snapshot.module == 'knowledge'
        report = self.report_schema(snapshot).model_validate(request)
        canonical = report.model_dump_json()
        if task.report is not None:
            if task.report.model_dump() != report.model_dump():
                raise ValueError('已保存的子代理报告不可用不同内容覆盖')
            return task
        expected = {(target.dataset_id, target.sample_id) for target in task.round.targets}
        joint = snapshot.exploration_tasks is not None or snapshot.knowledge_tasks is not None
        submitted = {(item.dataset_id, item.sample_id) for item in report.observations}
        if submitted - expected or ((knowledge or not joint) and (len(report.observations) != len(expected) or submitted != expected)):
            raise ValueError('子代理观察只能引用本批登记；知识报告及历史逐图协议须覆盖全部登记')
        with self.jobs.jobs.lock, self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            if connection.execute('SELECT status FROM job_runs WHERE job_id=?', (run_id,)).fetchone()[0] != 'RUNNING':
                raise InterruptedError('作业已停止，不能提交子代理报告')
            media = {value.sample_id:value for row in connection.execute('SELECT media_json FROM analysis_sample_media WHERE job_id=?', (run_id,))
                for value in [PreparedRegistration.model_validate_json(row[0])]}
            batch = AnalysisBatchEvidence(connection, run_id, session_id, task.round.targets, media) if joint else None
            delivered = batch.evidence_ids if batch else {row[0] for row in connection.execute('''SELECT d.evidence_id FROM analysis_media_deliveries d
                JOIN model_calls c ON c.call_id=d.call_id WHERE d.job_id=? AND json_extract(c.summary_json,'$.session_id')=?
                AND json_extract(c.summary_json,'$.finished_at') IS NOT NULL
                AND json_extract(c.summary_json,'$.finish_reason') NOT IN ('error','aborted')
                AND json_extract(c.summary_json,'$.error') IS NULL''', (run_id, session_id))}
            observed = set(batch.evidence_ids) if batch else set()
            for item in report.observations:
                source = media.get(item.sample_id)
                if source is None or set(item.evidence_ids) - {image.image.evidence_id for image in source.images}:
                    raise ValueError('观察引用不属于本批登记的媒体')
                if set(item.evidence_ids) - delivered:
                    raise ValueError('子代理观察没有自身实际成功模型请求的媒体送达')
                if item.report_preparation_error:
                    if not source.error:
                        raise ValueError('本批登记没有实际材料错误')
                elif (source.error and not joint) or source.evidence_id not in item.evidence_ids or {
                        image.image.evidence_id for image in source.images if image.required} - delivered:
                    raise ValueError('子代理必须实际请求完整原图及全部必需局部后才能提交观察')
                if knowledge and source.evidence_id:
                    refs = [value.direction_ref for value in item.directions]
                    if set(refs) != {value.ref for value in snapshot.selected_directions} or len(refs) != len(set(refs)):
                        raise ValueError('每条登记需记录全部所选方向适用性')
                observed.update(item.evidence_ids)
            whole_samples = {source.evidence_id:sid for sid, source in media.items() if (sid in {target.sample_id for target in task.round.targets}) and source.evidence_id}
            references = [*report.key_evidence_ids, *(eid for item in report.assessments for eid in item.evidence_ids),
                *(eid for item in report.discoveries for eid in ([*item.support_evidence_ids,*item.counter_evidence_ids] if knowledge else item.evidence_ids))]
            if set(references) - observed or set(references) - whole_samples.keys():
                raise ValueError('报告引用必须是本批已观察的完整原图')
            known = {item.check_id for item in task.catalog.checks} if knowledge else {item.direction_id for item in task.catalog.directions}
            reported = {item.check_id if knowledge else item.direction_id for item in report.assessments}
            if reported - known or (not joint and reported != known):
                raise ValueError('关系必须引用冻结目录中的方向；历史逐图协议还须核对全部旧方向')
            if len({item.candidate_id for item in report.discoveries}) != len(report.discoveries):
                raise ValueError('新现象候选编号不得重复')
            selected = set(report.key_evidence_ids)
            if len(selected) != len(report.key_evidence_ids) or any(not selected.intersection([*item.support_evidence_ids,*item.counter_evidence_ids] if knowledge else item.evidence_ids) for item in report.discoveries):
                raise ValueError('每个新现象必须有关键原图，精选引用不得重复')
            if knowledge:
                refs = {value.ref for value in snapshot.selected_directions}
                for candidate in report.discoveries:
                    if not set(candidate.direction_refs).issubset(refs):
                        raise ValueError('候选知识只能关联冻结的所选方向')
                    if not set(candidate.dataset_ids).issubset(snapshot.manifest.dataset_ids):
                        raise ValueError('候选知识范围超出冻结清单')
            groups = {record.sample.sample_id:record.sampling_group for record in snapshot.manifest.records}
            for item in report.assessments:
                if item.role == 'normal_control' and (not item.evidence_ids or any(groups[whole_samples[eid]] != 'normal' for eid in item.evidence_ids)):
                    raise ValueError('正常对照必须引用本批真实良品组原图')
            connection.execute('UPDATE analysis_batch_tasks SET report_json=? WHERE job_id=? AND session_id=?', (canonical, run_id, session_id))
        return self.task(run_id, session_id)
