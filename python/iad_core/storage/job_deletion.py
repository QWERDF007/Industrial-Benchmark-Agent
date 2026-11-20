import json
from collections.abc import Sequence
from dataclasses import dataclass
from sqlite3 import Connection


@dataclass(frozen=True)
class JobDeletionPlan:
    run_ids: tuple[str, ...]
    batch_ids: tuple[str, ...]


class JobDeletion:
    """Delete job-owned records within the caller's transaction."""

    def __init__(self, connection: Connection):
        self.connection = connection

    def plan(self, run_ids: Sequence[str]) -> JobDeletionPlan:
        connection = self.connection
        roots = {row[0] for row in connection.execute('''SELECT job_id FROM job_runs
            WHERE job_id IN (SELECT value FROM json_each(?))''', (json.dumps(list(run_ids)),))}
        if not roots:
            return JobDeletionPlan((), ())
        rows = connection.execute('''WITH RECURSIVE edges(parent_id,child_id) AS (
            SELECT parent_id,child_id FROM job_ownership_edges JOIN job_runs ON job_id=parent_id
            UNION SELECT j.source_id,c.run_id FROM job_index_batches j
                JOIN consistency_runs b ON b.batch_id=j.batch_id OR b.root_batch_id=j.batch_id
                JOIN consistency_children c ON c.batch_id=b.batch_id),
            owned(job_id) AS (SELECT value FROM json_each(?) UNION
                SELECT child_id FROM edges JOIN owned ON parent_id=owned.job_id)
            SELECT j.job_id,e.parent_id FROM owned JOIN job_runs j ON j.job_id=owned.job_id
                LEFT JOIN edges e ON e.child_id=j.job_id''', (json.dumps(sorted(roots)),)).fetchall()
        selected = {row[0] for row in rows}
        edges = [(parent, child) for child, parent in rows if parent is not None]
        while retained := {child for parent, child in edges if child in selected and child not in roots and parent not in selected}:
            selected.difference_update(retained)
        scope = (json.dumps(sorted(selected)),)
        batches = connection.execute('''SELECT b.batch_id FROM consistency_runs b
            WHERE (EXISTS(SELECT 1 FROM consistency_children c WHERE c.batch_id=b.batch_id
                    AND c.run_id IN (SELECT value FROM json_each(?)))
                OR EXISTS(SELECT 1 FROM job_index_batches j WHERE j.source_id IN (SELECT value FROM json_each(?))
                    AND j.batch_id IN (b.batch_id,b.root_batch_id)))
            AND NOT EXISTS(SELECT 1 FROM consistency_children c WHERE c.batch_id=b.batch_id
                AND c.run_id NOT IN (SELECT value FROM json_each(?)))
            AND NOT EXISTS(SELECT 1 FROM job_index_batches j WHERE j.source_id NOT IN (SELECT value FROM json_each(?))
                AND j.batch_id IN (b.batch_id,b.root_batch_id))''', scope * 4).fetchall()
        return JobDeletionPlan(tuple(sorted(selected)), tuple(sorted(row[0] for row in batches)))

    def delete(self, run_ids: Sequence[str]) -> list[str]:
        connection = self.connection
        if not connection.in_transaction:
            connection.execute('BEGIN IMMEDIATE')
        plan = self.plan(run_ids)
        scope = (json.dumps(plan.run_ids),)
        batches = (json.dumps(plan.batch_ids),)
        if connection.execute('''SELECT 1 FROM job_runs
                WHERE job_id IN (SELECT value FROM json_each(?)) AND status IN ('PENDING','RUNNING') LIMIT 1''', scope).fetchone():
            raise ValueError('请先取消作业，等待结束后再删除')
        evidence = [row[0] for row in connection.execute('''SELECT evidence_id FROM job_consistency_evidence
            WHERE job_id IN (SELECT value FROM json_each(?))
            UNION SELECT evidence_id FROM consistency_batch_results
                WHERE batch_id IN (SELECT value FROM json_each(?))''', (*scope, *batches))]
        connection.execute('DELETE FROM consistency_batch_results WHERE batch_id IN (SELECT value FROM json_each(?))', batches)
        connection.execute('DELETE FROM consistency_children WHERE batch_id IN (SELECT value FROM json_each(?))', batches)
        connection.execute('DELETE FROM consistency_runs WHERE batch_id IN (SELECT value FROM json_each(?))', batches)
        connection.execute('DELETE FROM audit_suggestions WHERE audit_run_id IN (SELECT value FROM json_each(?))', scope)
        connection.execute('DELETE FROM direction_explorations WHERE run_id IN (SELECT value FROM json_each(?))', scope)
        connection.execute('DELETE FROM model_calls WHERE run_id IN (SELECT value FROM json_each(?))', scope)
        connection.execute('DELETE FROM job_runs WHERE job_id IN (SELECT value FROM json_each(?))', scope)
        from iad_core.consistency.deletion import ConsistencyDeletion
        ConsistencyDeletion(connection).collect_evidence(evidence)
        return list(plan.run_ids)
