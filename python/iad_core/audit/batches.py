from __future__ import annotations

import json
from uuid import uuid4

from iad_core.audit.delegation_models import AuditBatch, AuditClue, AuditClueIndex, AuditRecheck
from iad_core.audit.report_models import AuditBatchCommit, AuditBatchDelta, AuditDiscovery, AuditDiscoveryIndex, AuditGlobalState
from iad_core.audit.discoveries import AuditDiscoveries
from iad_core.audit.reports import AuditReports


class AuditBatches:
    def __init__(self, state):
        self.state, self.db = state, state.db

    def list(self, run_id: str) -> list[AuditBatch]:
        on_demand = self.state.snapshot(run_id).context_policy == 'evidence-on-demand-v1'
        with self.db.connection() as connection:
            versions = {0:[]}
            for row in connection.execute('SELECT revision,submission_json FROM audit_global_versions WHERE job_id=?',(run_id,)):
                clues = []
                for item in json.loads(row[1])['discoveries']:
                    if item['status'] == 'withdrawn' or not item['next_batch_focus']: continue
                    if on_demand:
                        counts = AuditDiscoveryIndex.capture(AuditDiscovery.model_validate(item))
                        clues.append(AuditClueIndex(**{key:item[key] for key in AuditClueIndex.model_fields
                            if key not in ('support_image_count', 'counter_image_count')},
                            support_image_count=counts.support_image_count, counter_image_count=counts.counter_image_count))
                    else:
                        clues.append(AuditClue.model_validate({key:item[key] for key in AuditClue.model_fields}))
                versions[row[0]] = clues
            rows = connection.execute('SELECT * FROM audit_batches WHERE job_id=? ORDER BY number',(run_id,)).fetchall()
        return [AuditBatch(number=row['number'],sample_ids=json.loads(row['sample_ids_json']),state=row['state'],
            clues_revision=row['clues_revision'],clues=versions[row['clues_revision'] or 0],review_revision=row['review_revision']) for row in rows]

    def for_sample(self, run_id: str, sample_id: str) -> AuditBatch | None:
        return next((batch for batch in self.list(run_id) if sample_id in batch.sample_ids),None)

    def rechecks(self, run_id: str, *, pending_only: bool = True) -> list[AuditRecheck]:
        with self.db.connection() as connection:
            rows = connection.execute('SELECT * FROM audit_rechecks WHERE job_id=? ORDER BY rowid',(run_id,)).fetchall()
        return [AuditRecheck(**json.loads(row['request_json']),review_id=row['review_id'],batch_number=row['batch_number'],state=row['state'],error=row['error'])
            for row in rows if not pending_only or row['state'] in ('PENDING','RUNNING')]

    def history(self, run_id: str, sample_id: str):
        from iad_core.audit.models import AuditResultVersion
        self.state.sample(run_id,sample_id)
        with self.db.connection() as connection:
            return [AuditResultVersion(revision=row['revision'],final=json.loads(row['result_json']),review_id=row['review_id'])
                for row in connection.execute('SELECT * FROM audit_image_versions WHERE job_id=? AND sample_id=? ORDER BY revision',(run_id,sample_id))]

    def begin(self, run_id: str) -> AuditBatch | None:
        with self.db.connection() as connection:
            row = connection.execute("SELECT * FROM audit_batches WHERE job_id=? AND state!='COMPLETED' ORDER BY number LIMIT 1",(run_id,)).fetchone()
            if row is None:
                return None
            if row['clues_revision'] is None:
                revision = connection.execute('SELECT COALESCE(MAX(revision),0) FROM audit_global_versions WHERE job_id=?',(run_id,)).fetchone()[0]
                connection.execute("UPDATE audit_batches SET state='AUDITING',clues_revision=? WHERE job_id=? AND number=?",(revision,run_id,row['number']))
        return next(batch for batch in self.list(run_id) if batch.number==row['number'])

    def results(self, run_id: str, batch: AuditBatch | None):
        samples = self.state.samples(run_id)
        if batch is None:
            return samples
        ids = set(batch.sample_ids) | {review.sample_id for review in self.rechecks(run_id,pending_only=False)
            if review.batch_number==batch.number}
        return [sample for sample in samples if sample.sample_id in ids]

    def context(self, run_id: str) -> dict:
        from iad_core.audit.master_models import AuditMasterContext, AuditMasterRecord
        from iad_core.consistency.annotation_issues import ISSUE_TYPES_BY_FORMAT
        batch = self.begin(run_id)
        reports = AuditReports(self.db)
        session = reports.session(run_id)
        snapshot = self.state.snapshot(run_id)
        on_demand = snapshot.context_policy == 'evidence-on-demand-v1'
        selected = [] if on_demand and batch is None else self.results(run_id,batch)
        return AuditMasterContext.model_validate(dict(kind='audit_records',job_id=run_id,phase='review' if batch else 'report',
            batch=batch.model_dump(mode='json') if batch else None,revision=session.revision,
            items=[AuditMasterRecord.capture(sample) for sample in selected],
            discoveries=[AuditDiscoveryIndex.capture(item) for item in session.discoveries] if on_demand else session.discoveries,
            reviews=[item.model_dump(mode='json') for item in self.rechecks(run_id,pending_only=False)
                if not on_demand or batch and item.batch_number == batch.number],
            context_policy=snapshot.context_policy,
            dataset_profile=snapshot.dataset_profile.model_dump(mode='json'),
            applicable_issue_types=ISSUE_TYPES_BY_FORMAT[snapshot.dataset_profile.dataset_format],
            statistics=reports.statistics(run_id).model_dump(mode='json'),knowledge=snapshot.knowledge)).model_dump(mode='json',
                exclude_computed_fields=True, exclude=set() if on_demand else {'context_policy'})

    def publish(self, run_id: str, request: dict) -> AuditGlobalState:
        on_demand = self.state.snapshot(run_id).context_policy == 'evidence-on-demand-v1'
        submission = (AuditBatchDelta if on_demand else AuditBatchCommit).model_validate(request)
        command = submission.model_dump_json(exclude_computed_fields=True)
        reports = AuditReports(self.db)
        with self.db.connection() as connection:
            saved = connection.execute('SELECT revision,submission_json,request_json FROM audit_global_versions WHERE job_id=? AND commit_key=?',
                (run_id,submission.commit_key)).fetchone()
            if saved:
                if json.loads(saved[2] or saved[1]) != json.loads(command):
                    raise ValueError('同一提交键不能用于不同内容')
                return AuditGlobalState(revision=saved[0],discoveries=json.loads(saved[1])['discoveries'])
        current = reports.session(run_id)
        if isinstance(submission, AuditBatchDelta):
            discoveries = AuditDiscoveries(reports).apply(current.discoveries, submission)
            materialized = AuditBatchCommit(commit_key=submission.commit_key, batch_number=submission.batch_number,
                base_revision=submission.base_revision, discoveries=discoveries, review_requests=submission.review_requests)
        else:
            materialized = submission
        canonical = materialized.model_dump_json(exclude_computed_fields=True)
        batch = self.begin(run_id)
        if batch is None or batch.number != submission.batch_number or current.revision != submission.base_revision:
            raise ValueError('联合分析须对应当前批次与全局版本')
        samples = self.results(run_id,batch)
        if any(sample.state in ('PENDING','RUNNING') for sample in samples):
            raise ValueError('本批图级处理尚未结束')
        if {(sample.sample_id,sample.result_revision) for sample in samples} - reports.read_versions(run_id):
            raise ValueError('主 Agent 尚未实际读取本批全部有效结果')
        if self.rechecks(run_id):
            raise ValueError('定向复审尚未结束')
        reports.validate_discoveries(run_id,materialized.discoveries)
        if {item.group_id for item in current.discoveries} - {item.group_id for item in materialized.discoveries}:
            raise ValueError('保留发现历史，证据不成立时标记撤回')
        revision = current.revision+1
        if len({request.sample_id for request in submission.review_requests}) != len(submission.review_requests):
            raise ValueError('同一次联合分析不能重复请求同图复审')
        for request in submission.review_requests:
            sample = self.state.sample(run_id,request.sample_id)
            if sample.state!='COMPLETED' or sample.result_revision != request.result_revision:
                raise ValueError('定向复审须针对当前有效终稿')
            reports.validate_references(run_id,request.conflict_refs)
        with self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            if connection.execute('SELECT status FROM job_runs WHERE job_id=?',(run_id,)).fetchone()[0]!='RUNNING':
                raise ValueError('审计已停止，不能发布联合分析')
            connection.execute('INSERT INTO audit_global_versions(job_id,revision,batch_number,commit_key,submission_json,request_json) VALUES(?,?,?,?,?,?)',
                (run_id,revision,batch.number,submission.commit_key,canonical,command if on_demand else None))
            for request in submission.review_requests:
                connection.execute('''INSERT INTO audit_rechecks(job_id,review_id,batch_number,sample_id,result_revision,request_json)
                    VALUES(?,?,?,?,?,?)''',(run_id,'review-'+uuid4().hex,batch.number,request.sample_id,request.result_revision,request.model_dump_json()))
            connection.execute('UPDATE audit_batches SET state=?,review_revision=? WHERE job_id=? AND number=?',
                ('RECHECKING' if submission.review_requests else 'COMPLETED',revision,run_id,batch.number))
        return AuditGlobalState(revision=revision,discoveries=materialized.discoveries)
