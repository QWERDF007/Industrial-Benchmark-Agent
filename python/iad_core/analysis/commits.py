from iad_core.evidence.registrations import PreparedRegistration
import json
from uuid import NAMESPACE_URL, uuid5

from iad_core.analysis.catalog import AnalysisCatalogs
from iad_core.analysis.models import (AnalysisCatalog, AnalysisCommitReceipt,
    ExplorationCommit, KnowledgeCommit)
from iad_core.workbench.job_models import JobExecutionError


class AnalysisCommits:
    """Accept observation, coverage and catalog changes in one job transaction."""

    def __init__(self, jobs):
        self.jobs, self.db = jobs, jobs.db

    def accept(self, run_id: str, request: dict) -> AnalysisCommitReceipt:
        snapshot = self.jobs.snapshot(run_id)
        schema = ExplorationCommit if snapshot.module == 'exploration' else KnowledgeCommit
        submission = schema.model_validate(request)
        canonical = json.dumps(submission.model_dump(mode='json'), ensure_ascii=False, sort_keys=True)
        with self.jobs.jobs.lock, self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            previous = connection.execute('''SELECT submission_json,receipt_json FROM analysis_workflow_commits
                WHERE job_id=? AND round_id=? AND commit_key=?''', (run_id, submission.round_id, submission.commit_key)).fetchone()
            if previous is not None:
                if previous['submission_json'] != canonical:
                    raise ValueError('同一提交键不可用于不同内容')
                return AnalysisCommitReceipt.model_validate_json(previous['receipt_json'])
            job = connection.execute('SELECT status,payload_json FROM job_runs WHERE job_id=?', (run_id,)).fetchone()
            if job['status'] != 'RUNNING':
                raise InterruptedError('作业已停止，不能提交迟到的观察')
            if connection.execute('SELECT 1 FROM analysis_finalizations WHERE job_id=?',(run_id,)).fetchone():
                raise ValueError('已进入全局定稿，请使用本模块的定稿工具')
            payload = json.loads(job['payload_json'])
            state = connection.execute('SELECT revision,catalog_json FROM analysis_workflow_runs WHERE job_id=?', (run_id,)).fetchone()
            if state['revision'] != submission.base_revision:
                raise ValueError('目录版本已变化，请读取当前目录后提交')
            processed = set(payload['completed_sample_ids'] + payload['failed_sample_ids'])
            current = next((round for round in snapshot.plan.rounds if any(target.sample_id not in processed for target in round.targets)), snapshot.plan.rounds[-1])
            if submission.round_id != current.round_id:
                raise ValueError('提交不属于当前业务轮')
            targets = {(target.dataset_id, target.sample_id) for target in current.targets}
            media = {value.sample_id: value for row in connection.execute('SELECT media_json FROM analysis_sample_media WHERE job_id=?', (run_id,))
                for value in [PreparedRegistration.model_validate_json(row[0])]}
            delivered = {row[0] for row in connection.execute('''SELECT d.evidence_id FROM analysis_media_deliveries d
                JOIN model_calls c ON c.call_id=d.call_id WHERE d.job_id=?
                AND json_extract(c.summary_json,'$.finished_at') IS NOT NULL
                AND json_extract(c.summary_json,'$.finish_reason') NOT IN ('error','aborted')
                AND json_extract(c.summary_json,'$.error') IS NULL''', (run_id,))}
            observed = set()
            covered = {}
            for row in connection.execute('SELECT sample_id,observation_json FROM analysis_sample_observations WHERE job_id=?', (run_id,)):
                ids = json.loads(row['observation_json'])['evidence_ids']
                observed.update(ids)
                covered.setdefault(row['sample_id'], set()).update(ids)
            refs = {direction.ref for direction in snapshot.selected_directions}
            failure_reports = set()
            for observation in submission.observations:
                sid = observation.sample_id
                if (observation.dataset_id, sid) not in targets or sid in processed:
                    raise ValueError('观察不属于本场当前轮的待处理登记')
                if sid not in media:
                    raise ValueError('观察没有本场准备的媒体')
                available = {image.image.evidence_id for image in media[sid].images}
                if set(observation.evidence_ids) - available:
                    raise ValueError('观察引用不属于本场该登记的媒体')
                if set(observation.evidence_ids) - delivered:
                    raise ValueError('观察引用未进入实际模型请求的媒体')
                if observation.report_preparation_error:
                    if not media[sid].error:
                        raise ValueError('该登记没有已记录的取证错误')
                    failure_reports.add(sid)
                elif not observation.evidence_ids:
                    raise ValueError('观察需要实发图像证据或已记录的取证错误')
                if snapshot.module == 'knowledge' and not observation.report_preparation_error:
                    observed_refs = [item.direction_ref for item in observation.directions]
                    if set(observed_refs) != refs or len(observed_refs) != len(refs):
                        raise ValueError('每条登记需记录本场全部已选方向的适用性与观察')
                covered.setdefault(sid, set()).update(observation.evidence_ids)
                observed.update(observation.evidence_ids)
            affected = list(dict.fromkeys(observation.sample_id for observation in submission.observations))
            successes = [sid for sid in affected if not media[sid].error
                and media[sid].evidence_id in covered[sid]
                and {image.image.evidence_id for image in media[sid].images if image.required}.issubset(delivered)]
            failures = [sid for sid in affected if sid in failure_reports]
            revision = state['revision'] + 1
            ids = ['observation_' + uuid5(NAMESPACE_URL, json.dumps([run_id, current.round_id, submission.commit_key, index])).hex
                for index in range(len(submission.observations))]
            receipt = AnalysisCommitReceipt(commit_key=submission.commit_key, revision=revision, round_id=current.round_id,
                observation_ids=ids, completed_delta=len(successes), failed_delta=len(failures),
                round_complete=all(target.sample_id in processed.union(successes, failures) for target in current.targets))
            connection.execute('''INSERT INTO analysis_workflow_commits(job_id,commit_key,round_id,revision,submission_json,receipt_json)
                VALUES(?,?,?,?,?,?)''', (run_id, submission.commit_key, current.round_id, revision, canonical, receipt.model_dump_json()))
            connection.executemany('''INSERT INTO analysis_sample_observations(job_id,observation_id,sample_id,round_id,revision,observation_json)
                VALUES(?,?,?,?,?,?)''', [(run_id, oid, item.sample_id, current.round_id, revision, item.model_dump_json())
                for oid, item in zip(ids, submission.observations)])
            catalog = AnalysisCatalogs().apply(snapshot, AnalysisCatalog.model_validate_json(state['catalog_json']),
                submission, media, observed, connection=connection, run_id=run_id, revision=revision)
            connection.execute('UPDATE analysis_workflow_runs SET revision=?,catalog_json=? WHERE job_id=?',
                (revision, catalog.model_dump_json(), run_id))
            if successes:
                self.jobs.jobs.record(run_id, successes, connection=connection)
            for sid in failures:
                self.jobs.jobs.record(run_id, sid, JobExecutionError(media[sid].error, source_run_id=run_id,
                    source_phase='PREPARING_MEDIA', code='SOURCE_UNAVAILABLE'), connection=connection)
            if receipt.round_complete:
                self.jobs.jobs.update(run_id, connection=connection, completed_batches=current.round_id)
            return receipt
