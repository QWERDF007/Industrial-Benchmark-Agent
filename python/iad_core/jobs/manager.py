import uuid
import logging
import threading
from datetime import datetime
from typing import Optional, List, Dict, Any, Callable

from iad_core.storage.database import Database
from iad_core.storage.models import JobRunRecord
from iad_core.storage.repositories import JobRepository

logger = logging.getLogger("iad_core.jobs.manager")


class JobManager:
    """
    Local lightweight background job manager for Industrial Benchmark Agent.
    Tracks long-running operations (Feature Build, Baseline Run) in SQLite job_runs table.
    """

    def __init__(self, db: Optional[Database] = None, db_path: str = "data/benchmark.db"):
        self.db = db or Database(db_path)
        self.repo = JobRepository(self.db)

    def create_job(
        self,
        task_id: str,
        job_type: str,
        artifact_dir: Optional[str] = None,
        job_id: Optional[str] = None,
    ) -> JobRunRecord:
        j_id = job_id or f"job_{job_type}_{uuid.uuid4().hex[:8]}"
        job = JobRunRecord(
            job_id=j_id,
            task_id=task_id,
            job_type=job_type,
            status="PENDING",
            progress=0.0,
            message="Job queued",
            artifact_dir=artifact_dir,
            started_at=None,
            finished_at=None,
        )
        self.repo.upsert(job)
        return job

    def start_job(self, job_id: str, message: Optional[str] = None) -> Optional[JobRunRecord]:
        job = self.repo.get(job_id)
        if not job:
            return None
        job.status = "RUNNING"
        job.started_at = datetime.utcnow().isoformat() + "Z"
        if message:
            job.message = message
        self.repo.upsert(job)
        return job

    def update_progress(
        self,
        job_id: str,
        progress: float,
        message: Optional[str] = None,
    ) -> Optional[JobRunRecord]:
        job = self.repo.get(job_id)
        if not job:
            return None
        job.progress = max(0.0, min(1.0, progress))
        if message:
            job.message = message
        self.repo.upsert(job)
        return job

    def complete_job(
        self,
        job_id: str,
        message: Optional[str] = None,
        artifact_dir: Optional[str] = None,
    ) -> Optional[JobRunRecord]:
        job = self.repo.get(job_id)
        if not job:
            return None
        job.status = "COMPLETED"
        job.progress = 1.0
        job.finished_at = datetime.utcnow().isoformat() + "Z"
        if message:
            job.message = message
        if artifact_dir:
            job.artifact_dir = artifact_dir
        self.repo.upsert(job)
        return job

    def fail_job(self, job_id: str, error_message: str) -> Optional[JobRunRecord]:
        job = self.repo.get(job_id)
        if not job:
            return None
        job.status = "FAILED"
        job.finished_at = datetime.utcnow().isoformat() + "Z"
        job.message = error_message
        self.repo.upsert(job)
        return job

    def get_job(self, job_id: str) -> Optional[JobRunRecord]:
        return self.repo.get(job_id)

    def list_jobs(self, task_id: str) -> List[JobRunRecord]:
        return self.repo.list_by_task(task_id)

    def run_in_background(
        self,
        job_id: str,
        target_fn: Callable[..., Any],
        *args,
        **kwargs,
    ) -> threading.Thread:
        """Execute a task function in a daemon thread, updating the job status automatically."""
        def worker():
            try:
                self.start_job(job_id)
                res = target_fn(*args, **kwargs)
                out_dir = None
                if hasattr(res, "output_dir"):
                    out_dir = res.output_dir
                elif hasattr(res, "report_md_path"):
                    out_dir = os.path.dirname(res.report_md_path)
                self.complete_job(job_id, message="Execution succeeded", artifact_dir=out_dir)
            except Exception as e:
                logger.error(f"Background job {job_id} failed: {e}", exc_info=True)
                self.fail_job(job_id, str(e))

        t = threading.Thread(target=worker, daemon=True)
        t.start()
        return t
