import os
import threading
from typing import Optional, get_args

from iad_core.knowledge.service import KnowledgeService
from iad_core.exploration.service import DirectionExploration
from iad_core.storage.database import Database
from iad_core.workbench.audit import AuditService
from iad_core.workbench.jobs import JobRunner
from iad_core.workbench.job_models import JobKind
from iad_core.workbench.vision import VlmClient
from iad_core.workbench.model_settings import ModelExecution, WorkbenchModels


class ModelServices:
    def __init__(self, db: Database, client: VlmClient, jobs: JobRunner):
        self.client, self.jobs = client, jobs
        self.audit = AuditService(db, self.client, self.jobs)
        self.knowledge = KnowledgeService(db, self.client, self.jobs)
        self.exploration = DirectionExploration(db, self.client, self.jobs)


class WorkbenchRuntime(ModelServices):
    def __init__(self, db: Database, client: Optional[VlmClient] = None):
        self.db = db
        super().__init__(db, client or VlmClient(), JobRunner(db, get_args(JobKind)))

    def invoke_model(self, execution: Optional[dict], action, frozen_run_id: Optional[str] = None):
        if execution is None:
            if WorkbenchModels(self.db).read().selection is not None:
                raise ValueError('请通过工作台宿主解析已选择的提供商及模型后启动作业')
            return action(self)
        execution = ModelExecution.model_validate(execution)
        client = VlmClient(profile=execution.profile,
            api_key=execution.api_key.get_secret_value() if execution.api_key else None)
        try:
            if frozen_run_id:
                original = self.jobs.status(frozen_run_id)['request']['model_profile']
                if original != client.profile.model_dump():
                    raise ValueError('重试必须使用原作业冻结的提供商、模型及配置')
            result = action(ModelServices(self.db, client, self.jobs))
            self.jobs.after_finished(result['run_id'], client.close)
            return result
        except BaseException:
            client.close()
            raise

    def close(self):
        self.jobs.close()
        self.client.close()


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
