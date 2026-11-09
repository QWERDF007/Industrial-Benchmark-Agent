import json

from iad_core.audit.models import AuditCommit, AuditFinal
from iad_core.evidence.registrations import PreparedRegistration


class AuditCommits:
    def __init__(self, jobs):
        self.jobs, self.db = jobs, jobs.db

    def accept(self, run_id: str, sample_id: str, request: dict) -> AuditFinal:
        submission = AuditCommit.model_validate(request)
        canonical = json.dumps(submission.model_dump(mode='json'), sort_keys=True, ensure_ascii=False)
        snapshot = self.jobs.snapshot(run_id)
        with self.jobs.jobs.lock, self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            row = connection.execute('SELECT * FROM audit_sample_runs WHERE job_id=? AND sample_id=?', (run_id,sample_id)).fetchone()
            if row is None:
                raise ValueError('主图不属于本场审计')
            if row['commit_key'] == submission.commit_key:
                if row['submission_json'] != canonical:
                    raise ValueError('同一终稿提交键不可用于不同内容')
                return AuditFinal.model_validate_json(row['result_json'])
            if row['result_json'] is not None:
                raise ValueError('本场主图终稿已经提交')
            status = connection.execute('SELECT status FROM job_runs WHERE job_id=?', (run_id,)).fetchone()[0]
            if status != 'RUNNING':
                raise InterruptedError('审计已停止，不能写入迟到终稿')
            saved_main = connection.execute('SELECT media_json FROM audit_sample_media WHERE job_id=? AND target_id=? AND media_key=?',
                (run_id,sample_id,'sample:'+sample_id)).fetchone()
            delivered = {row[0] for row in connection.execute('''SELECT d.evidence_id FROM audit_media_deliveries d
                JOIN model_calls c ON c.call_id=d.call_id WHERE d.job_id=? AND d.target_id=?
                AND json_extract(c.summary_json,'$.finished_at') IS NOT NULL
                AND json_extract(c.summary_json,'$.finish_reason') NOT IN ('error','aborted')
                AND json_extract(c.summary_json,'$.error') IS NULL''', (run_id,sample_id))}
            final = submission.final
            observed = set(final.evidence_ids + [eid for finding in final.findings for eid in finding.evidence_ids]
                + [eid for assessment in final.check_assessments for eid in assessment.evidence_ids])
            if observed - delivered:
                raise ValueError('终稿引用没有本场已完成请求的实发证据')
            main = PreparedRegistration.model_validate_json(saved_main[0]) if saved_main else None
            if main is None or not main.images or not {item.image.evidence_id for item in main.images if item.required}.issubset(observed):
                raise ValueError('须观察本场主图整图及全部必需ROI的实发证据')
            selected = {entry.check.check_id for entry in snapshot.knowledge.entries} if snapshot.knowledge else set()
            assessed = [item.check_id for item in final.check_assessments]
            if set(assessed) != selected or len(assessed) != len(selected):
                raise ValueError('终稿须逐项记录本场全部已选知识的观察')
            if any(set(finding.check_ids) - selected for finding in final.findings):
                raise ValueError('疑点引用了本场未选择的知识')
            if len({finding.finding_id for finding in final.findings}) != len(final.findings):
                raise ValueError('同图疑点ID不能重复')
            if final.state == 'suspect' and not final.findings or final.state == 'normal' and final.findings:
                raise ValueError('图级疑点状态与本场疑点记录不一致')
            connection.execute('''UPDATE audit_sample_runs SET state='COMPLETED',result_json=?,commit_key=?,submission_json=?
                WHERE job_id=? AND sample_id=?''', (final.model_dump_json(),submission.commit_key,canonical,run_id,sample_id))
            self.jobs.jobs.record(run_id, sample_id, connection=connection)
            return final
