from __future__ import annotations

import os
import threading
from typing import TYPE_CHECKING, Optional, get_args

from iad_core.storage.database import Database
from iad_core.workbench.jobs import JobRunner
from iad_core.workbench.job_models import JobKind
from iad_core.feature.encoder import ImageEncoderRuntime

if TYPE_CHECKING:
    from iad_core.consistency.temporary_images import TemporaryImages
    from iad_core.feature.index import CorpusIndexes
    from iad_core.consistency.jobs import ConsistencyJobs
    from iad_core.consistency.service import ConsistencyService


class WorkbenchRuntime:
    def __init__(self, db: Database):
        self.db = db
        self.jobs = JobRunner(db, get_args(JobKind))
        from iad_core.analysis.publications import AnalysisPublications
        AnalysisPublications(db).recover()
        self.images = ImageEncoderRuntime()
        self._resource_lock = threading.RLock()
        self._indexes: Optional[CorpusIndexes] = None
        self._temporary_images: Optional[TemporaryImages] = None
        self._consistency: Optional[ConsistencyJobs] = None
        self._consistency_service: Optional[ConsistencyService] = None

    @property
    def consistency_service(self) -> ConsistencyService:
        with self._resource_lock:
            if self._consistency_service is None:
                from iad_core.consistency.service import ConsistencyService
                self._consistency_service = ConsistencyService(self.db, runtime=self)
            return self._consistency_service

    @property
    def consistency(self) -> ConsistencyJobs:
        with self._resource_lock:
            if self._consistency is None:
                from iad_core.consistency.jobs import ConsistencyJobs
                self._consistency=ConsistencyJobs(self)
            return self._consistency

    @property
    def temporary_images(self) -> TemporaryImages:
        with self._resource_lock:
            if self._temporary_images is None:
                from iad_core.consistency.temporary_images import TemporaryImages
                self._temporary_images = TemporaryImages()
            return self._temporary_images

    @property
    def indexes(self) -> CorpusIndexes:
        with self._resource_lock:
            if self._indexes is None:
                from iad_core.feature.index import CorpusIndexes
                self._indexes=CorpusIndexes(self.db)
            return self._indexes

    def close(self):
        self.jobs.close()
        if self._consistency_service is not None:self._consistency_service.close()
        if self._indexes is not None:
            self._indexes.close()
        if self._temporary_images is not None:
            self._temporary_images.close()
        self.images.close()


_workbenches: dict[str, WorkbenchRuntime] = {}
_service_lock = threading.Lock()


def workbench(db_path: str) -> WorkbenchRuntime:
    key = os.path.abspath(db_path)
    with _service_lock:
        if key not in _workbenches:
            _workbenches[key] = WorkbenchRuntime(Database(key))
        return _workbenches[key]


def close_workbenches():
    with _service_lock:
        for runtime in _workbenches.values():
            runtime.close()
        _workbenches.clear()
