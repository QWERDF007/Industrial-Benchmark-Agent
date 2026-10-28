from __future__ import annotations

import os
import threading
from typing import TYPE_CHECKING, Optional, get_args

from iad_core.storage.database import Database
from iad_core.workbench.jobs import JobRunner
from iad_core.workbench.job_models import JobKind
from iad_core.workbench.model_settings import ModelExecution, WorkbenchModels
from iad_core.feature.encoder import ImageEncoderRuntime

if TYPE_CHECKING:
    from iad_core.consistency.temporary_images import TemporaryImages
    from iad_core.feature.index import CorpusIndexes
    from iad_core.consistency.jobs import ConsistencyJobs
    from iad_core.consistency.service import ConsistencyService
    from iad_core.knowledge.service import KnowledgeService
    from iad_core.exploration.service import DirectionExploration
    from iad_core.workbench.audit import AuditService
    from iad_core.workbench.vision import VlmClient


class ModelServices:
    def __init__(self, db: Database, client: VlmClient, jobs: JobRunner, runtime: WorkbenchRuntime):
        from iad_core.workbench.audit import AuditService
        from iad_core.knowledge.service import KnowledgeService
        from iad_core.exploration.service import DirectionExploration
        self.client, self.jobs = client, jobs
        self.audit = AuditService(db, self.client, runtime=runtime)
        self.knowledge = KnowledgeService(db, self.client, self.jobs)
        self.exploration = DirectionExploration(db, self.client, self.jobs)


class WorkbenchRuntime:
    def __init__(self, db: Database, client: Optional[VlmClient] = None):
        self.db = db
        self.jobs = JobRunner(db, get_args(JobKind))
        self.images = ImageEncoderRuntime()
        self._client = client
        self._model_services: Optional[ModelServices] = None
        self._model_lock = threading.RLock()
        self._indexes: Optional[CorpusIndexes] = None
        self._temporary_images: Optional[TemporaryImages] = None
        self._consistency: Optional[ConsistencyJobs] = None
        self._consistency_service: Optional[ConsistencyService] = None

    @property
    def consistency_service(self) -> ConsistencyService:
        with self._model_lock:
            if self._consistency_service is None:
                from iad_core.consistency.service import ConsistencyService
                self._consistency_service = ConsistencyService(self.db, runtime=self)
            return self._consistency_service

    @property
    def consistency(self) -> ConsistencyJobs:
        with self._model_lock:
            if self._consistency is None:
                from iad_core.consistency.jobs import ConsistencyJobs
                self._consistency=ConsistencyJobs(self)
            return self._consistency

    @property
    def temporary_images(self) -> TemporaryImages:
        with self._model_lock:
            if self._temporary_images is None:
                from iad_core.consistency.temporary_images import TemporaryImages
                self._temporary_images = TemporaryImages()
            return self._temporary_images

    @property
    def indexes(self) -> CorpusIndexes:
        with self._model_lock:
            if self._indexes is None:
                from iad_core.feature.index import CorpusIndexes
                self._indexes=CorpusIndexes(self.db)
            return self._indexes

    @property
    def models(self) -> ModelServices:
        with self._model_lock:
            if self._model_services is None:
                from iad_core.workbench.vision import VlmClient
                self._client = self._client or VlmClient()
                self._model_services = ModelServices(self.db, self._client, self.jobs, self)
            return self._model_services

    @property
    def client(self) -> VlmClient:
        return self.models.client

    @property
    def audit(self) -> AuditService:
        return self.models.audit

    @property
    def knowledge(self) -> KnowledgeService:
        return self.models.knowledge

    @property
    def exploration(self) -> DirectionExploration:
        return self.models.exploration

    def invoke_model(self, execution: Optional[dict], action, frozen_run_id: Optional[str] = None):
        if execution is None:
            if WorkbenchModels(self.db).read().selection is not None:
                raise ValueError('请通过工作台宿主解析已选择的提供商及模型后启动作业')
            return action(self.models)
        from iad_core.workbench.vision import VlmClient
        execution = ModelExecution.model_validate(execution)
        client = VlmClient(profile=execution.profile,
            api_key=execution.api_key.get_secret_value() if execution.api_key else None)
        try:
            if frozen_run_id:
                original = self.jobs.status(frozen_run_id)['request']['model_profile']
                if original != client.profile.model_dump():
                    raise ValueError('重试必须使用原作业冻结的提供商、模型及配置')
            result = action(ModelServices(self.db, client, self.jobs, self))
            self.jobs.after_finished(result['run_id'], client.close)
            return result
        except BaseException:
            client.close()
            raise

    def close(self):
        self.jobs.close()
        if self._consistency_service is not None:self._consistency_service.close()
        if self._indexes is not None:
            self._indexes.close()
        if self._temporary_images is not None:
            self._temporary_images.close()
        self.images.close()
        if self._client is not None:
            self._client.close()


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
