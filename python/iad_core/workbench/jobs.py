import json
import threading
import uuid
from contextlib import nullcontext
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from sqlite3 import Connection
from typing import Callable, Optional, Sequence

from filelock import FileLock, Timeout
from iad_core.storage.database import Database
from iad_core.workbench.calls import ModelCalls
from iad_core.workbench.job_models import JobKind, JobRetryOptions, JobSample, JobSnapshot, RetrySample


@dataclass
class JobContext:
    runner: "JobRunner"
    run_id: str
    payload: dict
    cancel: threading.Event

    def checkpoint(self):
        if self.cancel.is_set():
            raise InterruptedError("作业已请求停止")

    def update(self, **values):
        self.runner.update(self.run_id, **values)
        self.payload.update(values)

    def record(self, sample_id: str | Sequence[str], error: Optional[Exception] = None,
               persist: Optional[Callable[[Connection], None]] = None, **values):
        sample_ids = [sample_id] if isinstance(sample_id, str) else list(sample_id)
        with self.runner.lock, self.runner.db.connection() as conn:
            conn.execute('BEGIN IMMEDIATE')
            self.checkpoint()
            row = conn.execute("SELECT payload_json FROM job_runs WHERE job_id=? AND status='RUNNING'", (self.run_id,)).fetchone()
            if not row:
                raise InterruptedError('作业已停止')
            payload = json.loads(row[0])
            if not sample_ids or len(set(sample_ids)) != len(sample_ids) or not set(sample_ids).issubset(payload['request']['sample_ids']):
                raise ValueError('Invalid sample completion scope')
            if set(sample_ids).intersection(payload["completed_sample_ids"] + payload["failed_sample_ids"]):
                raise ValueError("Sample already processed in this job")
            if persist:
                persist(conn)
            if error is None:
                payload["completed_sample_ids"].extend(sample_ids)
            else:
                payload["failed_sample_ids"].extend(sample_ids)
                payload["errors"].extend({"sample_id": sid, "message": str(error)} for sid in sample_ids)
            values = self.runner.update(self.run_id, connection=conn, **values,
                completed=len(payload["completed_sample_ids"]), failed=len(payload["failed_sample_ids"]),
                completed_sample_ids=payload["completed_sample_ids"],
                failed_sample_ids=payload["failed_sample_ids"], errors=payload["errors"])
        self.payload.update(values)


class JobRunner:
    def __init__(self, db: Database, job_types: Sequence[JobKind]):
        self.db, self.job_types = db, tuple(job_types)
        self.lock = threading.RLock()
        self.threads: dict[str, threading.Thread] = {}
        self.cancelled: dict[str, threading.Event] = {}
        self.closing = False
        self.worker_locks = [FileLock(str(Path(db.db_path).resolve()) + f'.{kind.lower()}.worker.lock', thread_local=False)
                             for kind in sorted(self.job_types)]
        try:
            for worker_lock in self.worker_locks:
                worker_lock.acquire(timeout=0)
        except Timeout as error:
            for worker_lock in self.worker_locks:
                worker_lock.release()
            raise ValueError('该数据库已有活动工作进程，不能重复接管作业') from error
        placeholders = ",".join("?" for _ in self.job_types)
        with db.connection() as conn:
            rows = conn.execute(f"""SELECT job_id,payload_json FROM job_runs
                WHERE job_type IN ({placeholders}) AND status IN ('PENDING','RUNNING')""", self.job_types).fetchall()
            for row in rows:
                payload = json.loads(row['payload_json'])
                finished = payload.get('completed', 0) + payload.get('failed', 0) == payload.get('total_samples', -1)
                status = self.terminal_status(payload, interrupted=not finished)
                conn.execute('UPDATE job_runs SET status=?,message=?,finished_at=? WHERE job_id=?',
                    (status, 'Worker stopped before completion' if not finished else status,
                     datetime.now(timezone.utc).isoformat(), row['job_id']))
                ModelCalls(db).interrupt(row['job_id'], conn)

    @staticmethod
    def terminal_status(payload: dict, cancelled: bool = False, interrupted: bool = False) -> str:
        return ('INTERRUPTED' if interrupted else 'CANCELLED' if cancelled else 'FAILED' if not payload['completed']
                else 'PARTIAL' if payload['failed'] or payload['completed'] < payload['total_samples'] else 'COMPLETED')

    def start(self, job_type: JobKind, task_id: str, request: dict, execute: Callable[[JobContext], None], message: str,
              parent_run_id: Optional[str] = None, root_run_id: Optional[str] = None) -> dict:
        if job_type not in self.job_types or not request["sample_ids"]:
            raise ValueError("Invalid job type or empty sample scope")
        run_id = ("audit_" if job_type == "MODEL_AUDIT" else "knowledge_") + uuid.uuid4().hex
        payload = {"request": request, "root_run_id": root_run_id or run_id, "parent_run_id": parent_run_id,
                   "completed": 0, "failed": 0, "errors": [], "completed_sample_ids": [],
                   "failed_sample_ids": [], "total_samples": len(request["sample_ids"]), "cancel_requested": False}
        with self.lock, self.db.connection() as conn:
            if self.closing:
                raise ValueError('Worker is closing')
            conn.execute("BEGIN IMMEDIATE")
            if not conn.execute("SELECT 1 FROM datasets WHERE dataset_id=? AND task_id=?", (request["dataset_id"],task_id)).fetchone():
                raise LookupError("数据集不存在或已删除")
            if payload.get("parent_run_id"):
                relatives = conn.execute("""SELECT job_id,status,payload_json FROM job_runs
                    WHERE json_extract(payload_json,'$.root_run_id')=?""", (payload["root_run_id"],)).fetchall()
                selected = set(request["sample_ids"])
                for row in relatives:
                    previous = json.loads(row["payload_json"])
                    if previous.get("parent_run_id") == parent_run_id and set(previous['request']["sample_ids"]) == selected:
                        return self.status(row["job_id"])
                    occupied = previous['request']["sample_ids"] if row["status"] in ("PENDING", "RUNNING") else previous["completed_sample_ids"]
                    if selected.intersection(occupied):
                        raise ValueError("所选样本已在关联作业完成或正在执行，请刷新作业状态")
            if conn.execute("""SELECT 1 FROM job_runs WHERE job_type=? AND status IN ('PENDING','RUNNING')
                AND COALESCE(json_extract(payload_json,'$.request.dataset_id'),json_extract(payload_json,'$.dataset_id'))=?""", (job_type, request["dataset_id"])).fetchone():
                raise ValueError("This dataset already has an active job of this type")
            conn.execute("""INSERT INTO job_runs(job_id,task_id,job_type,status,progress,message,payload_json,started_at)
                VALUES(?,?,?,'RUNNING',0,?,?,?)""", (run_id, task_id, job_type, message,
                json.dumps(payload, ensure_ascii=False), datetime.now(timezone.utc).isoformat()))
            cancel = self.cancelled[run_id] = threading.Event()
            context = JobContext(self, run_id, {**request, **payload}, cancel)
            thread = self.threads[run_id] = threading.Thread(target=self.run, args=(context, execute), daemon=True)
        thread.start()
        return self.status(run_id)

    def _retry_scope(self, run_id: str, job_types: Sequence[JobKind]) -> tuple[dict, dict, list[str]]:
        parent = self.status(run_id, job_types)
        if parent["status"] in ("PENDING", "RUNNING"):
            raise ValueError("当前作业仍在执行，请等待结束后重试")
        root = self.status(parent.get("root_run_id", run_id), job_types)
        if "request" not in root:
            raise ValueError("历史作业缺少冻结输入，请重新启动作业")
        with self.db.connection() as conn:
            relatives = conn.execute("""SELECT payload_json FROM job_runs
                WHERE json_extract(payload_json,'$.root_run_id')=?""", (root["run_id"],)).fetchall()
        completed = {sid for row in relatives for sid in json.loads(row[0])["completed_sample_ids"]}
        remaining = [sid for sid in parent["sample_ids"] if sid not in completed]
        return parent, root, remaining

    def retry_options(self, run_id: str, job_types: Sequence[JobKind]) -> dict:
        parent, root, remaining = self._retry_scope(run_id, job_types)
        samples = self._samples(parent['dataset_id'], remaining)
        with self.db.connection() as conn:
            active = conn.execute("""SELECT job_id FROM job_runs WHERE job_type=?
                AND status IN ('PENDING','RUNNING')
                AND json_extract(payload_json,'$.request.dataset_id')=?""",
                (parent['job_type'], parent['dataset_id'])).fetchone()
        return JobRetryOptions(run_id=run_id, root_run_id=root['run_id'],
            selection_mode='subset' if parent['job_type'] == 'MODEL_AUDIT' else 'all_sources',
            active_run_id=active[0] if active else None,
            samples=[RetrySample(**samples[sid].model_dump(exclude_computed_fields=True),
                state='failed' if sid in parent['failed_sample_ids'] else 'unprocessed') for sid in remaining]).model_dump()

    def retry(self, run_id: str, job_types: Sequence[JobKind], execute: Callable[[JobContext], None],
              sample_ids: Optional[list[str]] = None, validate: Optional[Callable[[dict], None]] = None) -> dict:
        parent, root, remaining = self._retry_scope(run_id, job_types)
        selected = list(dict.fromkeys(sample_ids)) if sample_ids is not None else remaining
        if not selected:
            raise ValueError("没有需要重试的失败或未处理样本")
        if not set(selected).issubset(remaining):
            raise ValueError("只能重试原作业中尚未完成的样本")
        if validate:
            validate(root["request"])
        payload = {**parent["request"], "sample_ids": selected}
        payload['input_sources'] = [source for source in payload['input_sources'] if source['sample_id'] in selected]
        return self.start(parent["job_type"], parent["task_id"], payload, execute, "准备重试失败或未处理样本",
                          parent_run_id=run_id, root_run_id=root['run_id'])

    def run(self, context: JobContext, execute: Callable[[JobContext], None]):
        try:
            with ModelCalls(self.db).bind(context.run_id):
                execute(context)
        except InterruptedError:
            context.cancel.set()
        except Exception as error:
            for sample_id in context.payload["sample_ids"]:
                if context.cancel.is_set():
                    break
                if sample_id not in context.payload["completed_sample_ids"] + context.payload["failed_sample_ids"]:
                    context.record(sample_id, error)
        finally:
            with self.lock, self.db.connection() as conn:
                payload = json.loads(conn.execute('SELECT payload_json FROM job_runs WHERE job_id=?', (context.run_id,)).fetchone()[0])
                status = self.terminal_status(payload, cancelled=context.cancel.is_set())
                conn.execute("UPDATE job_runs SET status=?,payload_json=?,finished_at=? WHERE job_id=?",
                             (status, json.dumps(payload, ensure_ascii=False), datetime.now(timezone.utc).isoformat(), context.run_id))
                self.threads.pop(context.run_id, None)
                self.cancelled.pop(context.run_id, None)
                if self.closing and not self.threads:
                    for worker_lock in self.worker_locks:
                        worker_lock.release()

    def update(self, run_id: str, connection: Optional[Connection] = None, **values):
        with self.lock, (nullcontext(connection) if connection else self.db.connection()) as conn:
            row = conn.execute("SELECT payload_json FROM job_runs WHERE job_id=? AND status='RUNNING'", (run_id,)).fetchone()
            if row is None:
                raise InterruptedError('作业已停止')
            payload = {**json.loads(row[0]), **values}
            completed, failed, total = payload["completed"], payload["failed"], payload["total_samples"]
            message = values.get("phase") or f"完成 {completed}，失败 {failed} / {total}"
            conn.execute("UPDATE job_runs SET payload_json=?,progress=?,message=? WHERE job_id=?",
                         (json.dumps(payload, ensure_ascii=False), (completed + failed) / total, message, run_id))
        return {**payload.get('request', {}), **payload}

    def _samples(self, dataset_id: str, sample_ids: Sequence[str]) -> dict[str, JobSample]:
        with self.db.connection() as conn:
            rows = conn.execute("""SELECT sample_id,relative_path FROM samples WHERE dataset_id=?
                AND sample_id IN (SELECT value FROM json_each(?))""", (dataset_id, json.dumps(list(sample_ids)))).fetchall()
        paths = {row['sample_id']: row['relative_path'] for row in rows}
        return {sid: JobSample(sample_id=sid, relative_path=paths.get(sid)) for sid in sample_ids}

    def status(self, run_id: str, job_types: Optional[Sequence[JobKind]] = None) -> dict:
        with self.db.connection() as conn:
            row = conn.execute("SELECT * FROM job_runs WHERE job_id=?", (run_id,)).fetchone()
        if not row or row["job_type"] not in (job_types or self.job_types):
            raise LookupError("Job not found")
        payload = json.loads(row["payload_json"])
        values = {**payload.get('request', {}), **payload, "run_id": run_id, "task_id": row["task_id"], "job_type": row["job_type"],
                "status": row["status"], "message": row["message"], "started_at": row["started_at"],
                "finished_at": row["finished_at"], "progress": row["progress"],
                "cancel_requested": payload.get("cancel_requested", False),
                "unprocessed": payload["total_samples"] - payload["completed"] - payload["failed"],
                "model_calls": [call.model_dump() for call in ModelCalls(self.db).list(run_id)]}
        current = payload.get('current_sample_id')
        samples = self._samples(values['dataset_id'], [error['sample_id'] for error in payload['errors']] + ([current] if current else []))
        values['current_sample'] = samples[current] if current else None
        values['errors'] = [{**error, 'relative_path': samples[error['sample_id']].relative_path} for error in payload['errors']]
        return JobSnapshot.model_validate(values).model_dump()

    def list(self, dataset_id: str, job_types: Sequence[JobKind]) -> list:
        placeholders = ",".join("?" for _ in job_types)
        with self.db.connection() as conn:
            ids = [row[0] for row in conn.execute(f"""SELECT job_id FROM job_runs WHERE job_type IN ({placeholders})
                AND COALESCE(json_extract(payload_json,'$.request.dataset_id'),json_extract(payload_json,'$.dataset_id'))=? ORDER BY id DESC LIMIT 30""", (*job_types, dataset_id))]
        return [self.status(run_id, job_types) for run_id in ids]

    def cancel(self, run_id: str, job_types: Sequence[JobKind]) -> dict:
        with self.lock:
            status = self.status(run_id, job_types)
            if status["status"] in ("RUNNING", "PENDING"):
                with self.db.connection() as conn:
                    conn.execute("""UPDATE job_runs SET message='正在停止，当前请求返回后结束',
                        payload_json=json_set(payload_json,'$.cancel_requested',json('true')) WHERE job_id=?""", (run_id,))
                self.cancelled[run_id].set()
        return self.status(run_id, job_types)

    def wait(self, run_id: str, timeout: float):
        with self.lock:
            thread = self.threads.get(run_id)
        if thread:
            thread.join(timeout)

    def close(self):
        with self.lock:
            self.closing = True
            threads = list(self.threads.values())
            for run_id in list(self.cancelled):
                self.cancel(run_id, self.job_types)
        for thread in threads:
            thread.join(timeout=1)
        with self.lock:
            if not self.threads:
                for worker_lock in self.worker_locks:
                    worker_lock.release()
