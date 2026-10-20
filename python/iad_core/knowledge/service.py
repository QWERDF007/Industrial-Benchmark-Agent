import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.dataset.path_safety import validate_sample_image_path
from iad_core.dataset.registry import DatasetRegistry
from iad_core.evidence.images import EvidenceImages, file_sha256
from iad_core.knowledge.mining import KnowledgeMiner, SYNTHESIS_INSTRUCTION
from iad_core.knowledge.models import KnowledgeCheck, KnowledgeDraft, KnowledgeEvidence, KnowledgeSnapshot, KnowledgeSource
from iad_core.knowledge.repository import KnowledgeRepository
from iad_core.storage.database import Database
from iad_core.storage.repositories import AnnotationRepository, ReviewRepository, SampleRepository
from iad_core.workbench.jobs import JobContext, JobRunner
from iad_core.workbench.vision import DEFAULT_MODEL, VlmClient

GENERATION_VERSION = "dataset-knowledge-v2"
NORMAL_INSTRUCTION = """联合观察这一数据集的候选良品，发现产品可见的部件、结构关系、位置、纹理、光照与允许变化。
不要根据数据集名称假设产品或预设缺陷检查表。只归纳可观察、可复用且有图像证据的检查判据。
人工选取和无标注只是来源资格，不是确认真值。寻找候选良品中的异常与矛盾，将其定位为suspects，
不要将疑似异常作为对应正常规则的支持。区分跨样本共识、单例、推测与不可观察。
每个检查项指向实际support_evidence_ids和counter_evidence_ids，不编造尺寸、坐标或不存在的图像引用。
对每项写明适用对象/位置、可观察判据、允许变化与限制。没有可靠规律时允许checks为空并说明限制。
来源："""
KNOWLEDGE_JOB_TYPES = ("NORMAL_KNOWLEDGE", "DEFECT_KNOWLEDGE")


class MiningStart(AnalysisModel):
    dataset_id: str
    kind: Literal["normal"]
    model_name: str = DEFAULT_MODEL
    sample_ids: Optional[List[str]] = Field(default=None)


class KnowledgeService:
    def __init__(self, db: Database, client: Optional[VlmClient] = None, jobs: Optional[JobRunner] = None):
        self.db, self.client = db, client or VlmClient()
        self.owns_jobs = jobs is None
        self.jobs = jobs or JobRunner(db, KNOWLEDGE_JOB_TYPES)
        self.registry = DatasetRegistry(db)
        self.repository = KnowledgeRepository(db)

    def start(self, **arguments) -> dict:
        request = MiningStart.model_validate(arguments)
        config = self.registry.resolve(dataset_id=request.dataset_id)
        eligible = self.registry.references(request.dataset_id, limit=None, use_selection=False)
        sample_ids = list(dict.fromkeys(request.sample_ids)) if request.sample_ids is not None else eligible
        if not sample_ids or not set(sample_ids).issubset(eligible):
            raise ValueError("Mining requires eligible normal samples from the selected dataset")
        parent = self.repository.current(request.dataset_id, request.kind)
        return self.jobs.start("NORMAL_KNOWLEDGE", config.task.task_id,
                               {**request.model_dump(), "sample_ids": sample_ids,
                                "parent_version_id": parent.version_id if parent else None}, self.mine, "准备良品知识挖掘")

    def sources(self, dataset_id: str, sample_ids: List[str]) -> List[KnowledgeSource]:
        eligible = set(self.registry.references(dataset_id, limit=None, use_selection=False))
        with self.db.connection() as conn:
            selected = json.loads(conn.execute("SELECT reference_sample_ids_json FROM datasets WHERE dataset_id=?",
                                               (dataset_id,)).fetchone()[0])
        sources = []
        for sample_id in sample_ids:
            sample = SampleRepository(self.db).get(sample_id)
            decision = ReviewRepository(self.db).get_decision(sample_id)
            annotations = AnnotationRepository(self.db).list_by_sample(sample_id)
            qualification = ("human_pass" if decision and decision.decision == "PASS" else
                             "human_hard_normal" if decision and decision.decision == "HARD_NORMAL" else
                             "manual_selection" if sample_id in selected else "raw_pass" if sample.quality_status == "PASS" else
                             "initial_unannotated")
            if sample_id not in eligible:
                raise ValueError("Normal source qualification changed during mining")
            sources.append(KnowledgeSource(sample_id=sample_id,
                sha256=file_sha256(validate_sample_image_path(sample, self.db.db_path)), qualification=qualification,
                annotations_sha256=hashlib.sha256(json.dumps([a.model_dump(mode="json") for a in annotations], sort_keys=True).encode()).hexdigest(),
                review_sha256=hashlib.sha256(decision.model_dump_json().encode() if decision else b"null").hexdigest()))
        return sources

    def mine(self, context: JobContext):
        payload = context.payload
        context.checkpoint()
        context.update(phase="LEARNING_NORMAL")
        sources = self.sources(payload["dataset_id"], payload["sample_ids"])
        signature = hashlib.sha256(json.dumps([GENERATION_VERSION, NORMAL_INSTRUCTION, SYNTHESIS_INSTRUCTION, KnowledgeDraft.model_json_schema(),
            payload["dataset_id"], payload["model_name"], [source.model_dump() for source in sources]], sort_keys=True).encode()).hexdigest()
        current = self.repository.current(payload["dataset_id"], payload["kind"])
        if current and current.signature == signature:
            for source in sources:
                context.record(source.sample_id, knowledge_version_id=current.version_id, phase="KNOWLEDGE_REUSED")
            return
        images = [EvidenceImages(self.db.db_path).capture(SampleRepository(self.db).get(source.sample_id),
                  "normal", "reference", source_sha256=source.sha256) for source in sources]
        miner = KnowledgeMiner(self.client, context)
        draft = miner.learn(NORMAL_INSTRUCTION, sources, images, payload["model_name"]).result
        if self.sources(payload["dataset_id"], payload["sample_ids"]) != sources:
            raise ValueError("Knowledge sources changed during mining")
        snapshot = KnowledgeSnapshot(version_id="knowledge_" + uuid.uuid4().hex, dataset_id=payload["dataset_id"],
            kind=payload["kind"], parent_version_id=payload["parent_version_id"], normal_version_id=None,
            model_name=payload["model_name"], generation_version=GENERATION_VERSION, signature=signature,
            summary=draft.summary, checks=[KnowledgeCheck(check_id="check_" + uuid.uuid4().hex, **check.model_dump()) for check in draft.checks],
            suspects=draft.suspects, limitations=draft.limitations, sources=sources,
            evidence=[KnowledgeEvidence(sample_id=source.sample_id, image=image.evidence) for source, image in zip(sources, images)],
            mining_steps=miner.steps,
            created_at=datetime.now(timezone.utc).isoformat())
        with self.jobs.lock:
            context.checkpoint()
            self.repository.publish(snapshot)
            for source in sources:
                context.record(source.sample_id, knowledge_version_id=snapshot.version_id, phase="KNOWLEDGE_PUBLISHED")

    def status(self, run_id: str) -> dict:
        return self.jobs.status(run_id, KNOWLEDGE_JOB_TYPES)

    def list(self, dataset_id: str) -> list:
        return self.jobs.list(dataset_id, KNOWLEDGE_JOB_TYPES)

    def cancel(self, run_id: str) -> dict:
        return self.jobs.cancel(run_id, KNOWLEDGE_JOB_TYPES)

    def wait(self, run_id: str, timeout: float):
        self.jobs.wait(run_id, timeout)

    def close(self):
        if self.owns_jobs:
            self.jobs.close()
            self.client.close()
