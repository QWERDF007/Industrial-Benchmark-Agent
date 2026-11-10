import json

from iad_core.audit.models import AuditCommit, AuditFinal
from iad_core.audit.evidence import AuditEvidence
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
            history = connection.execute('SELECT submission_json FROM audit_image_commits WHERE job_id=? AND sample_id=? AND commit_key=?',
                (run_id,sample_id,submission.commit_key)).fetchone()
            if history:
                if history[0] != canonical:
                    raise ValueError('同一终稿提交键不可用于不同内容')
                return AuditCommit.model_validate_json(history[0]).final
            if row['commit_key'] == submission.commit_key:
                if row['submission_json'] != canonical:
                    raise ValueError('同一终稿提交键不可用于不同内容')
                return AuditFinal.model_validate_json(row['result_json'])
            if row['state'] == 'COMPLETED':
                raise ValueError('本场主图终稿已经提交')
            status = connection.execute('SELECT status FROM job_runs WHERE job_id=?', (run_id,)).fetchone()[0]
            if status != 'RUNNING':
                raise InterruptedError('审计已停止，不能写入迟到终稿')
            saved_main = connection.execute('SELECT media_json FROM audit_sample_media WHERE job_id=? AND target_id=? AND media_key=?',
                (run_id,sample_id,'sample:'+sample_id)).fetchone()
            delivered = AuditEvidence(self.jobs).observed(run_id,sample_id)
            final = submission.final
            observed = set(final.evidence_ids + [eid for finding in final.findings for eid in finding.evidence_ids]
                + [eid for assessment in final.check_assessments for eid in assessment.evidence_ids]
                + [eid for observation in final.observations for eid in observation.evidence_ids])
            if observed - delivered:
                raise ValueError('终稿引用没有本场已完成请求的实发证据')
            whole_images = {item.image.evidence_id for media in connection.execute(
                'SELECT media_json FROM audit_sample_media WHERE job_id=? AND target_id=?',(run_id,sample_id))
                for item in PreparedRegistration.model_validate_json(media[0]).images
                if item.image.is_whole_image and item.image.representation == 'raw'}
            referenced = observed | {eid for review in final.consistency_review for eid in review.evidence_ids}
            if referenced - whole_images:
                raise ValueError('审计证据只引用实际观察的完整原图，局部图关联所属原图')
            main = PreparedRegistration.model_validate_json(saved_main[0]) if saved_main else None
            if final.execution_status == 'completed' and (main is None or main.error or not main.images or main.evidence_id not in observed
                    or not {item.image.evidence_id for item in main.images if item.required}.issubset(delivered)):
                raise ValueError('须观察本场主图整图及全部必需ROI的实发证据')
            selected = {entry.check.check_id for entry in snapshot.knowledge.entries} if snapshot.knowledge else set()
            assessed = [item.check_id for item in final.check_assessments]
            if (set(assessed) - selected or len(assessed) != len(set(assessed))
                    or final.execution_status == 'completed' and set(assessed) != selected):
                raise ValueError('check_assessments须恰好覆盖本场选中知识check_id='
                    + json.dumps(sorted(selected),ensure_ascii=False) + '；收到check_id='
                    + json.dumps(assessed,ensure_ascii=False) + '。未选知识时填写[]；普通图像观察写入analysis和basis，不自拟知识ID。')
            if any(set(finding.check_ids) - selected for finding in final.findings):
                raise ValueError('疑点引用了本场未选择的知识')
            upstream = self.jobs.sample(run_id, sample_id).consistency.result
            source_ids = {issue.issue_id for issue in upstream.issues} if upstream else set()
            reviewed_ids = [item.source_issue_id for item in final.consistency_review]
            if (set(reviewed_ids) - source_ids or len(reviewed_ids) != len(set(reviewed_ids))
                    or final.execution_status == 'completed' and set(reviewed_ids) != source_ids):
                raise ValueError('须逐项处理本图全部上游差异，不能引用外部差异')
            if any(set(item.evidence_ids) - delivered for item in final.consistency_review):
                raise ValueError('一致性处理引用没有本场实发证据')
            record = next(record for record in snapshot.manifest.records if record.sample.sample_id == sample_id)
            annotation_ids = {item.annotation_id for item in record.annotations}
            if any(set(observation.annotation_ids) - annotation_ids for observation in final.observations):
                raise ValueError('观察引用不属于本图冻结标注')
            for finding in final.findings:
                if set(finding.annotation_ids) - annotation_ids or set(finding.consistency_issue_refs) - source_ids:
                    raise ValueError('疑点引用不属于本图冻结标注或一致性差异')
                if (record.dataset_format == 'folder_classification') != (finding.type == 'image_label_mismatch'):
                    raise ValueError('疑点分类与本图标注类型不符')
            for review in final.consistency_review:
                linked = any(review.source_issue_id in finding.consistency_issue_refs for finding in final.findings)
                if review.assessment == 'supported' and not linked or review.assessment == 'unsupported' and linked:
                    raise ValueError('上游差异处理意见与已保存疑点的来源引用不一致')
            if len({finding.finding_id for finding in final.findings}) != len(final.findings):
                raise ValueError('同图疑点ID不能重复')
            connection.execute('INSERT INTO audit_image_commits VALUES(?,?,?,?)',(run_id,sample_id,submission.commit_key,canonical))
            state = 'COMPLETED' if final.execution_status == 'completed' else 'RUNNING'
            connection.execute('''UPDATE audit_sample_runs SET state=?,result_json=?,commit_key=?,submission_json=?
                WHERE job_id=? AND sample_id=?''', (state,final.model_dump_json(),submission.commit_key,canonical,run_id,sample_id))
            if state == 'COMPLETED':
                self.jobs.jobs.record(run_id, sample_id, connection=connection)
            return final
