import json
import threading
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Callable, Literal, Optional, Sequence

from iad_core.storage.database import Database
from iad_core.workbench.calls import ModelCalls

JobKind = Literal["MODEL_AUDIT", "NORMAL_KNOWLEDGE", "DEFECT_KNOWLEDGE"]


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

    def record(self, sample_id: str, error: Optional[Exception] = None, **values):
        with self.runner.lock:
            self.checkpoint()
            if sample_id in self.payload["completed_sample_ids"] or sample_id in self.payload["failed_sample_ids"]:
                raise ValueError("Sample already processed in this job")
            if error is None:
                self.payload["completed_sample_ids"].append(sample_id)
            else:
                self.payload["failed_sample_ids"].append(sample_id)
                self.payload["errors"].append({"sample_id": sample_id, "message": str(error)})
            self.update(**values, completed=len(self.payload["completed_sample_ids"]),
                        failed=len(self.payload["failed_sample_ids"]),
                        completed_sample_ids=self.payload["completed_sample_ids"],
                        failed_sample_ids=self.payload["failed_sample_ids"], errors=self.payload["errors"])


class JobRunner:
    def __init__(self, db: Database, job_types: Sequence[JobKind]):
        self.db, self.job_types = db, tuple(job_types)
        self.lock = threading.RLock()
        self.threads: dict[str, threading.Thread] = {}
        self.cancelled: dict[str, threading.Event] = {}
        placeholders = ",".join("?" for _ in self.job_types)
        with db.connection() as conn:
            conn.execute(f"""UPDATE job_runs SET status='INTERRUPTED',message='Worker stopped before completion',finished_at=?
                WHERE job_type IN ({placeholders}) AND status IN ('PENDING','RUNNING')""",
                         (datetime.now(timezone.utc).isoformat(), *self.job_types))

    def start(self, job_type: JobKind, task_id: str, payload: dict, execute: Callable[[JobContext], None], message: str) -> dict:
        if job_type not in self.job_types or not payload["sample_ids"]:
            raise ValueError("Invalid job type or empty sample scope")
        run_id = ("audit_" if job_type == "MODEL_AUDIT" else "knowledge_") + uuid.uuid4().hex
        payload = {**payload, "completed": 0, "failed": 0, "errors": [], "completed_sample_ids": [],
                   "failed_sample_ids": [], "total_samples": len(payload["sample_ids"])}
        with self.lock, self.db.connection() as conn:
            conn.execute("BEGIN IMMEDIATE")
            if conn.execute("""SELECT 1 FROM job_runs WHERE job_type=? AND status IN ('PENDING','RUNNING')
                AND json_extract(payload_json,'$.dataset_id')=?""", (job_type, payload["dataset_id"])).fetchone():
                raise ValueError("This dataset already has an active job of this type")
            conn.execute("""INSERT INTO job_runs(job_id,task_id,job_type,status,progress,message,payload_json,started_at)
                VALUES(?,?,?,'RUNNING',0,?,?,?)""", (run_id, task_id, job_type, message,
                json.dumps(payload, ensure_ascii=False), datetime.now(timezone.utc).isoformat()))
            cancel = self.cancelled[run_id] = threading.Event()
            context = JobContext(self, run_id, payload, cancel)
            thread = self.threads[run_id] = threading.Thread(target=self.run, args=(context, execute), daemon=True)
        thread.start()
        return self.status(run_id)

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
                payload = context.payload
                status = ("CANCELLED" if context.cancel.is_set() else "FAILED" if not payload["completed"]
                          else "PARTIAL" if payload["failed"] or payload["completed"] < payload["total_samples"] else "COMPLETED")
                conn.execute("UPDATE job_runs SET status=?,payload_json=?,finished_at=? WHERE job_id=?",
                             (status, json.dumps(payload, ensure_ascii=False), datetime.now(timezone.utc).isoformat(), context.run_id))
                self.threads.pop(context.run_id, None)
                self.cancelled.pop(context.run_id, None)

    def update(self, run_id: str, **values):
        with self.lock, self.db.connection() as conn:
            row = conn.execute("SELECT payload_json FROM job_runs WHERE job_id=? AND status='RUNNING'", (run_id,)).fetchone()
            if row is None:
                return
            payload = {**json.loads(row[0]), **values}
            completed, failed, total = payload["completed"], payload["failed"], payload["total_samples"]
            message = values.get("phase") or f"完成 {completed}，失败 {failed} / {total}"
            conn.execute("UPDATE job_runs SET payload_json=?,progress=?,message=? WHERE job_id=?",
                         (json.dumps(payload, ensure_ascii=False), (completed + failed) / total, message, run_id))

    def status(self, run_id: str, job_types: Optional[Sequence[JobKind]] = None) -> dict:
        with self.db.connection() as conn:
            row = conn.execute("SELECT * FROM job_runs WHERE job_id=?", (run_id,)).fetchone()
        if not row or row["job_type"] not in (job_types or self.job_types):
            raise LookupError("Job not found")
        payload = json.loads(row["payload_json"])
        return {**payload, "run_id": run_id, "task_id": row["task_id"], "job_type": row["job_type"],
                "status": row["status"], "message": row["message"], "started_at": row["started_at"],
                "finished_at": row["finished_at"], "progress": row["progress"],
                "unprocessed": payload["total_samples"] - payload["completed"] - payload["failed"],
                "model_calls": [call.model_dump() for call in ModelCalls(self.db).list(run_id)]}

    def list(self, dataset_id: str, job_types: Sequence[JobKind]) -> list:
        placeholders = ",".join("?" for _ in job_types)
        with self.db.connection() as conn:
            ids = [row[0] for row in conn.execute(f"""SELECT job_id FROM job_runs WHERE job_type IN ({placeholders})
                AND json_extract(payload_json,'$.dataset_id')=? ORDER BY id DESC LIMIT 30""", (*job_types, dataset_id))]
        return [self.status(run_id, job_types) for run_id in ids]

    def cancel(self, run_id: str, job_types: Sequence[JobKind]) -> dict:
        with self.lock:
            status = self.status(run_id, job_types)
            if status["status"] in ("RUNNING", "PENDING"):
                self.cancelled[run_id].set()
                with self.db.connection() as conn:
                    conn.execute("UPDATE job_runs SET message='正在停止，当前请求返回后结束' WHERE job_id=?", (run_id,))
        return self.status(run_id, job_types)

    def wait(self, run_id: str, timeout: float):
        with self.lock:
            thread = self.threads.get(run_id)
        if thread:
            thread.join(timeout)

    def close(self):
        with self.lock:
            threads = list(self.threads.values())
            for event in self.cancelled.values():
                event.set()
        for thread in threads:
            thread.join(timeout=1)
