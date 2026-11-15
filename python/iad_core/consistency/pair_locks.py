from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from threading import Lock, RLock
from weakref import WeakValueDictionary


class CandidatePairLocks:
    _locks = WeakValueDictionary()
    _guard = Lock()

    @classmethod
    @contextmanager
    def exclusive(cls, db_path: str, run_id: str, pair_key: str) -> Iterator[None]:
        key = (str(Path(db_path).resolve()), run_id, pair_key)
        with cls._guard:
            lock = cls._locks.setdefault(key, RLock())
        with lock:
            yield
