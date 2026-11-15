from typing import TYPE_CHECKING

from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.job_models import ConsistencyBatch
from iad_core.workbench.job_models import ChildJobError

if TYPE_CHECKING:
    from iad_core.workbench.runtime import WorkbenchRuntime


class ConsistencyAgentPreparation:
    def __init__(self, runtime: 'WorkbenchRuntime'):
        self.runtime, self.db = runtime, runtime.db
        self.checks = ConsistencyAgentJobs(runtime)

    def prepare(self, run_id: str) -> ConsistencyBatch:
        context = self.runtime.jobs.context(run_id)
        context.checkpoint()
        if context.payload.get('phase') != 'PREPARING_SHARED_INDEX':
            context.update(phase='PREPARING_SHARED_INDEX')
            with self.db.connection() as connection:
                connection.execute("UPDATE consistency_anchor_runs SET phase='PREPARING_SHARED_INDEX' WHERE job_id=? AND result_json IS NULL", (run_id,))
        batch_id = context.payload.get('index_batch_id')
        with self.db.connection() as connection:
            attempt = connection.execute('SELECT MAX(attempt) FROM consistency_anchor_runs WHERE job_id=?', (run_id,)).fetchone()[0]
        if batch_id is None:
            snapshot = self.checks.snapshot(run_id)
            if snapshot.retrieval.mode != 'exact' and snapshot.image_encoder is None:
                raise ConsistencyError('PROFILE_NOT_CONFIGURED', '作业未配置整图编码器')
            started = self.runtime.consistency.prepare_frozen(snapshot.scopes, snapshot.image_encoder,
                request_id=run_id + '_image_index_' + str(attempt))
            if started.kind != 'started':
                raise ConsistencyError('INDEX_NOT_READY', '冻结检查范围没有可准备的图像')
            batch_id = started.batch_id
            context.update(index_batch_id=batch_id, index_batch_attempt=attempt)
        batch = self.runtime.consistency.status(batch_id)
        if batch.status in ('CANCELLED', 'INTERRUPTED', 'FAILED', 'PARTIAL') and context.payload['index_batch_attempt'] < attempt:
            retried = self.runtime.consistency.retry(batch_id, request_id=run_id + '_image_index_' + str(attempt))
            if retried.kind != 'started':
                raise ConsistencyError('INDEX_NOT_READY', '冻结检查范围仍有未完成的图像索引')
            batch_id = retried.batch_id
            context.update(index_batch_id=batch_id, index_batch_attempt=attempt)
            batch = self.runtime.consistency.status(batch_id)
        for child in batch.children:
            if child.run_id not in context.payload.get('batch_runs', []):
                self.runtime.jobs.attach(context, child.run_id)
        context.checkpoint()
        if batch.status in ('PENDING', 'RUNNING'):
            if context.payload.get('prepared_sources') != batch.completed:
                context.update(prepared_sources=batch.completed)
            return batch
        if batch.status != 'COMPLETED':
            failure = ConsistencyError(batch.error.code if batch.error else 'INDEX_NOT_READY',
                batch.error.message if batch.error else '共享图像索引未完整准备')
            for child in batch.children:
                if child.status != 'COMPLETED':
                    failure = ChildJobError(child.model_dump())
                    break
            self.checks.fail_preparation(run_id, failure)
            raise failure
        context.update(active_batch_run_id=None, phase='SHARED_INDEX_READY', prepared_sources=batch.completed)
        with self.db.connection() as connection:
            connection.execute("UPDATE consistency_anchor_runs SET phase='SHARED_INDEX_READY' WHERE job_id=? AND phase='PREPARING_SHARED_INDEX'", (run_id,))
        return batch
