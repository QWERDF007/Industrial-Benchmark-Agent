import json
from sqlite3 import Connection


class ConsistencyDeletion:
    """Remove dataset-dependent frozen artifacts within the caller's transaction."""

    def __init__(self, connection: Connection):
        self.connection = connection

    def delete_dataset(self, dataset_id: str) -> None:
        conn = self.connection
        batches = json.dumps([row[0] for row in conn.execute('''SELECT batch_id FROM consistency_runs
            WHERE root_batch_id IN (SELECT root_batch_id FROM consistency_runs
                WHERE EXISTS (SELECT 1 FROM json_each(plan_json,'$.scopes.subjects.dataset_ids') WHERE value=?)
                   OR EXISTS (SELECT 1 FROM json_each(plan_json,'$.scopes.corpus.dataset_ids') WHERE value=?))''',
            (dataset_id, dataset_id))])
        evidence = json.dumps([row[0] for row in conn.execute('''SELECT evidence_id FROM consistency_results
            WHERE json_extract(snapshot_json,'$.sources.left.sample.dataset_id')=?
               OR json_extract(snapshot_json,'$.sources.right.sample.dataset_id')=?''', (dataset_id, dataset_id))])
        jobs = json.dumps([row[0] for row in conn.execute('''SELECT job_id FROM job_runs
            WHERE job_id IN (SELECT run_id FROM consistency_children WHERE batch_id IN (SELECT value FROM json_each(?)))
               OR (job_type='CONSISTENCY_ANALYSIS' AND EXISTS (
                   SELECT 1 FROM json_tree(payload_json,'$.request.frozen_group') WHERE key='dataset_id' AND value=?))''',
            (batches, dataset_id))])
        if conn.execute('''SELECT 1 FROM job_runs WHERE job_id IN (SELECT value FROM json_each(?))
                AND status IN ('PENDING','RUNNING') LIMIT 1''', (jobs,)).fetchone():
            raise ValueError('数据集仍有关联审核作业执行中，请先取消或等待作业结束后删除')
        if conn.execute('''SELECT 1 FROM consistency_runs WHERE batch_id IN (SELECT value FROM json_each(?))
                AND cancel_requested=0 AND interrupted=0 AND error_json IS NULL
                AND (SELECT count(*) FROM consistency_children c WHERE c.batch_id=consistency_runs.batch_id)
                    < json_array_length(plan_json,'$.steps') LIMIT 1''', (batches,)).fetchone():
            raise ValueError('数据集仍有关联一致性批次执行中，请先取消或等待批次结束后删除')
        # Query snapshots have frozen counts and offsets; invalidate the whole snapshot.
        conn.execute('''DELETE FROM consistency_queries WHERE
            EXISTS (SELECT 1 FROM json_each(snapshot_json,'$.scopes.subjects.dataset_ids') WHERE value=?)
            OR EXISTS (SELECT 1 FROM json_each(snapshot_json,'$.scopes.corpus.dataset_ids') WHERE value=?)
            OR query_id IN (SELECT query_id FROM consistency_query_items WHERE evidence_id IN (SELECT value FROM json_each(?)))''',
            (dataset_id, dataset_id, evidence))
        conn.execute('''DELETE FROM audit_consistency_checks WHERE EXISTS (
            SELECT 1 FROM json_each(record_json,'$.references')
            WHERE json_extract(value,'$.evidence_id') IN (SELECT value FROM json_each(?)))''', (evidence,))
        conn.execute('''DELETE FROM consistency_correction_checks WHERE evidence_id IN (SELECT value FROM json_each(?))
            OR decision_id IN (SELECT decision_id FROM consistency_decisions WHERE evidence_id IN (SELECT value FROM json_each(?)))''',
            (evidence, evidence))
        conn.execute('DELETE FROM consistency_decisions WHERE evidence_id IN (SELECT value FROM json_each(?))', (evidence,))
        conn.execute('''DELETE FROM consistency_batch_results WHERE batch_id IN (SELECT value FROM json_each(?))
            OR evidence_id IN (SELECT value FROM json_each(?))''', (batches, evidence))
        conn.execute('DELETE FROM consistency_children WHERE batch_id IN (SELECT value FROM json_each(?))', (batches,))
        conn.execute('DELETE FROM consistency_runs WHERE batch_id IN (SELECT value FROM json_each(?))', (batches,))
        conn.execute('DELETE FROM model_calls WHERE run_id IN (SELECT value FROM json_each(?))', (jobs,))
        conn.execute('DELETE FROM job_runs WHERE job_id IN (SELECT value FROM json_each(?))', (jobs,))
        conn.execute('DELETE FROM consistency_results WHERE evidence_id IN (SELECT value FROM json_each(?))', (evidence,))
