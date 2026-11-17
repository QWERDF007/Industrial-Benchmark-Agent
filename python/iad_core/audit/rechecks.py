import json
from uuid import uuid4

from iad_core.audit.delegation_models import AuditReviewRequest


class AuditRechecks:
    """One active review per image; every transition is bound to its result version."""

    @staticmethod
    def enqueue(connection, run_id: str, request: AuditReviewRequest, batch_number: int) -> str:
        active = connection.execute("SELECT * FROM audit_rechecks WHERE job_id=? AND sample_id=? AND state IN ('PENDING','RUNNING')",
            (run_id, request.sample_id)).fetchall()
        if len(active) > 1:
            raise ValueError('同图存在多个活动复核')
        if active:
            row = active[0]
            prior = AuditReviewRequest.model_validate_json(row['request_json'])
            if row['state'] != 'PENDING' or prior.result_revision != request.result_revision:
                raise ValueError('运行中复核或基础版本不同，不能合并请求')
            refs = {ref.model_dump_json(): ref for ref in [*prior.conflict_refs, *request.conflict_refs]}
            reasons = list(dict.fromkeys([*prior.reason.split('\n'), *request.reason.split('\n')]))
            merged = request.model_copy(update={'reason': '\n'.join(reasons), 'conflict_refs': list(refs.values())})
            connection.execute('UPDATE audit_rechecks SET request_json=? WHERE job_id=? AND review_id=?',
                (merged.model_dump_json(), run_id, row['review_id']))
            return row['review_id']
        review_id = 'review_' + uuid4().hex
        connection.execute('''INSERT INTO audit_rechecks(job_id,review_id,batch_number,sample_id,result_revision,request_json,workflow_version)
            VALUES(?,?,?,?,?,?,6)''', (run_id, review_id, batch_number, request.sample_id, request.result_revision, request.model_dump_json()))
        return review_id

    @staticmethod
    def start(connection, run_id: str, sample_id: str, review_id: str | None, result_revision: int):
        active = connection.execute("SELECT * FROM audit_rechecks WHERE job_id=? AND sample_id=? AND state IN ('PENDING','RUNNING')",
            (run_id, sample_id)).fetchall()
        if review_id is None:
            if active:
                raise ValueError('启动复核必须指定复核 ID')
            return
        if len(active) != 1 or active[0]['review_id'] != review_id or active[0]['result_revision'] != result_revision:
            raise ValueError('复核 ID 或基础结果版本已失效')
        connection.execute("UPDATE audit_rechecks SET state='RUNNING' WHERE job_id=? AND review_id=?", (run_id, review_id))

    @staticmethod
    def running(connection, run_id: str, sample_id: str, review_id: str | None, result_revision: int):
        active = connection.execute("SELECT review_id,result_revision,state FROM audit_rechecks WHERE job_id=? AND sample_id=? AND state IN ('PENDING','RUNNING')",
            (run_id, sample_id)).fetchall()
        if review_id is None and not active:
            return None
        if len(active) != 1 or active[0]['state'] != 'RUNNING' or active[0]['review_id'] != review_id or active[0]['result_revision'] != result_revision:
            raise ValueError('提交复核必须对应运行中的复核 ID 和基础结果版本')
        return active[0]
