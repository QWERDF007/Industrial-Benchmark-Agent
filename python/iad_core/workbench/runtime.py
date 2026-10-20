from typing import Optional

from iad_core.knowledge.service import KnowledgeService
from iad_core.storage.database import Database
from iad_core.workbench.audit import AuditService
from iad_core.workbench.jobs import JobRunner
from iad_core.workbench.vision import VlmClient


class WorkbenchRuntime:
    def __init__(self, db: Database, client: Optional[VlmClient] = None):
        self.client = client or VlmClient()
        self.jobs = JobRunner(db, ("MODEL_AUDIT", "NORMAL_KNOWLEDGE", "DEFECT_KNOWLEDGE"))
        self.audit = AuditService(db, self.client, self.jobs)
        self.knowledge = KnowledgeService(db, self.client, self.jobs)

    def close(self):
        self.jobs.close()
        self.client.close()
