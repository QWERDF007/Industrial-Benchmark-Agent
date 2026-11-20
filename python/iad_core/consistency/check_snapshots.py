from collections import OrderedDict
from threading import RLock

from iad_core.consistency.agent_models import ConsistencyCheckSnapshot


class CheckSnapshots:
    """Bounded read-through cache of immutable, job-owned check configuration."""

    _snapshots = OrderedDict()
    _lock = RLock()
    MAX_ENTRIES = 16

    @classmethod
    def read(cls, connection, run_id: str) -> ConsistencyCheckSnapshot:
        path = connection.execute('PRAGMA database_list').fetchone()[2]
        key = (path or id(connection), run_id)
        with cls._lock:
            if connection.execute("SELECT 1 FROM job_run_requests WHERE job_id=? AND job_type='ANALYSIS_WORKFLOW'", (run_id,)).fetchone() is None:
                cls._snapshots.pop(key, None)
                raise LookupError('主图审核作业不存在')
            if key in cls._snapshots:
                cls._snapshots.move_to_end(key)
                return cls._snapshots[key]
            row = connection.execute("""SELECT json_extract(request_json,'$.consistency_check')
                FROM job_run_requests WHERE job_id=? AND job_type='ANALYSIS_WORKFLOW'""", (run_id,)).fetchone()
            if row is None or row[0] is None:
                raise LookupError('主图审核作业不存在')
            snapshot = ConsistencyCheckSnapshot.model_validate_json(row[0])
            cls._snapshots[key] = snapshot
            if len(cls._snapshots) > cls.MAX_ENTRIES:
                cls._snapshots.popitem(last=False)
            return snapshot
