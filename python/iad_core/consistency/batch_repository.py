import json
from sqlite3 import Connection
from contextlib import nullcontext

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.job_models import BatchFailure,BatchPlan,BatchResultReference
from iad_core.storage.database import Database


class BatchRepository:
    def __init__(self, db: Database):self.db=db

    def get(self, batch_id: str, connection: Connection | None = None) -> tuple[BatchPlan,bool]:
        with nullcontext(connection) if connection is not None else self.db.connection() as connection:
            row=connection.execute('SELECT plan_json,cancel_requested FROM consistency_runs WHERE batch_id=?',(batch_id,)).fetchone()
        if row is None:raise ConsistencyError('REFERENCE_NOT_FOUND','Consistency batch does not exist')
        return BatchPlan.model_validate_json(row[0]),bool(row[1])

    def state(self,batch_id: str) -> tuple[bool,BatchFailure | None]:
        with self.db.connection() as connection:
            row=connection.execute('SELECT interrupted,error_json FROM consistency_runs WHERE batch_id=?',(batch_id,)).fetchone()
        if row is None:raise ConsistencyError('REFERENCE_NOT_FOUND','Consistency batch does not exist')
        return bool(row[0]),BatchFailure.model_validate_json(row[1]) if row[1] else None

    def recover(self):
        with self.db.connection() as connection:
            connection.execute('''UPDATE consistency_runs SET interrupted=1 WHERE cancel_requested=0 AND error_json IS NULL
                AND (SELECT COUNT(*) FROM consistency_children c WHERE c.batch_id=consistency_runs.batch_id)<json_array_length(plan_json,'$.steps')''')

    def fail(self,batch_id: str,error: BatchFailure):
        with self.db.connection() as connection:
            connection.execute('UPDATE consistency_runs SET error_json=? WHERE batch_id=?',(error.model_dump_json(),batch_id))

    def request(self, request_id: str, fingerprint: str) -> BatchPlan | None:
        with self.db.connection() as connection:
            row=connection.execute('SELECT batch_id,fingerprint FROM consistency_runs WHERE request_id=?',(request_id,)).fetchone()
        if row is None:return None
        if row['fingerprint']!=fingerprint:raise ConsistencyError('INVALID_SCOPE','request_id already belongs to a different batch request')
        return self.get(row['batch_id'])[0]

    def save(self, plan: BatchPlan) -> BatchPlan:
        with self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            dataset_ids = sorted(set(plan.scopes.subjects.dataset_ids + plan.scopes.corpus.dataset_ids))
            if connection.execute("""SELECT 1 FROM json_each(?) required
                    WHERE NOT EXISTS (SELECT 1 FROM datasets WHERE dataset_id=required.value) LIMIT 1""",
                    (json.dumps(dataset_ids),)).fetchone():
                raise ConsistencyError('REFERENCE_NOT_FOUND', '批次引用的数据集已删除，请重新选择范围')
            connection.execute('''INSERT INTO consistency_runs(batch_id,request_id,fingerprint,root_batch_id,parent_batch_id,plan_json)
                VALUES(?,?,?,?,?,?) ON CONFLICT(request_id) DO NOTHING''',
                (plan.batch_id,plan.request.request_id,plan.fingerprint,plan.root_batch_id,plan.parent_batch_id,plan.model_dump_json()))
            if plan.parent_batch_id:
                connection.execute('''INSERT OR IGNORE INTO consistency_batch_results
                    SELECT ?,sample_a,sample_b,result_id,evidence_id FROM consistency_batch_results WHERE batch_id=?''',
                    (plan.batch_id,plan.parent_batch_id))
        return self.request(plan.request.request_id,plan.fingerprint)

    def children(self, batch_id: str, connection: Connection | None = None) -> dict[int,str]:
        with nullcontext(connection) if connection is not None else self.db.connection() as connection:
            return dict(connection.execute('SELECT step,run_id FROM consistency_children WHERE batch_id=? ORDER BY step',(batch_id,)))

    def lineage(self,root_batch_id: str) -> list[str]:
        with self.db.connection() as connection:
            return [row[0] for row in connection.execute('SELECT batch_id FROM consistency_runs WHERE root_batch_id=?',(root_batch_id,))]

    def recent(self,limit: int = 30) -> list[str]:
        with self.db.connection() as connection:
            return [row[0] for row in connection.execute('SELECT batch_id FROM consistency_runs ORDER BY rowid DESC LIMIT ?',(limit,))]

    def result_count(self,batch_id: str) -> int:
        with self.db.connection() as connection:
            return connection.execute('SELECT COUNT(*) FROM consistency_batch_results WHERE batch_id=?',(batch_id,)).fetchone()[0]

    def has_pair(self,batch_id: str,sample_a: str,sample_b: str) -> bool:
        with self.db.connection() as connection:
            return connection.execute('SELECT 1 FROM consistency_batch_results WHERE batch_id=? AND sample_a=? AND sample_b=?',
                (batch_id,sample_a,sample_b)).fetchone() is not None

    def link(self, batch_id: str, step: int, run_id: str, connection: Connection):
        row=connection.execute('SELECT cancel_requested FROM consistency_runs WHERE batch_id=?',(batch_id,)).fetchone()
        if not row or row[0]:raise InterruptedError('Batch cancelled before child publication')
        connection.execute('INSERT INTO consistency_children VALUES(?,?,?)',(batch_id,step,run_id))

    def cancel(self, batch_id: str):
        with self.db.connection() as connection:
            connection.execute('UPDATE consistency_runs SET cancel_requested=1 WHERE batch_id=?',(batch_id,))

    def results(self, batch_id: str) -> list[BatchResultReference]:
        self.get(batch_id)
        with self.db.connection() as connection:
            rows=connection.execute('SELECT sample_a,sample_b,result_id,evidence_id FROM consistency_batch_results WHERE batch_id=? ORDER BY sample_a,sample_b',(batch_id,)).fetchall()
        return [BatchResultReference(**dict(row)) for row in rows]

    def record_results(self, batch_id: str, results: list[BatchResultReference], connection: Connection):
        connection.executemany('INSERT OR IGNORE INTO consistency_batch_results VALUES(?,?,?,?,?)',
            [(batch_id,item.sample_a,item.sample_b,item.result_id,item.evidence_id) for item in results])
