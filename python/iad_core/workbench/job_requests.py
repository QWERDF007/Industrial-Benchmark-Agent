import json
from collections import OrderedDict
from sqlite3 import Connection
from threading import RLock
from typing import Any

from frozendict import frozendict, deepfreeze


class JobRequests:
    """Immutable job inputs, shared by execution and query readers."""

    _cache: OrderedDict[tuple[str | int, str], frozendict[str, Any]] = OrderedDict()
    _lock = RLock()
    MAX_ENTRIES = 16

    @classmethod
    def read(cls, connection: Connection, run_id: str) -> frozendict[str, Any]:
        path = connection.execute('PRAGMA database_list').fetchone()[2]
        key = (path or id(connection), run_id)
        with cls._lock:
            if key not in cls._cache:
                row = connection.execute('SELECT request_json FROM job_requests WHERE job_id=?', (run_id,)).fetchone()
                if row is None:
                    raise LookupError('Job not found')
                cls._cache[key] = deepfreeze(json.loads(row[0]))
                if len(cls._cache) > cls.MAX_ENTRIES:
                    cls._cache.popitem(last=False)
            cls._cache.move_to_end(key)
            return cls._cache[key]
