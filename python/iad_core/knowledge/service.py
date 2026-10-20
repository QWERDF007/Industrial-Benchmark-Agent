import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel
from iad_core.dataset.registry import DatasetRegistry
from iad_core.evidence.images import EvidenceImages, OVERVIEW_MAX_SIDE
from iad_core.knowledge.mining import KnowledgeInput, KnowledgeMiner, SYNTHESIS_INSTRUCTION
from iad_core.knowledge.models import (KnowledgeDraft, KnowledgeEvidence, KnowledgeSnapshot,
                                      KnowledgeKind, KnowledgeVerification)
from iad_core.knowledge.defect import DefectVerification, DEFECT_INSTRUCTION, DEFECT_VERIFICATION_INSTRUCTION
from iad_core.knowledge.evolution import EVOLUTION_INSTRUCTION, KnowledgeEvolution
from iad_core.knowledge.repository import KnowledgeRepository
from iad_core.knowledge.sources import KnowledgeSources
from iad_core.knowledge.verification import NormalVerification, VERIFICATION_INSTRUCTION
from iad_core.storage.database import Database
from iad_core.storage.repositories import AnnotationRepository, SampleRepository
from iad_core.workbench.jobs import JobContext, JobRunner
from iad_core.workbench.vision import DEFAULT_MODEL, VlmClient

GENERATION_VERSION = "dataset-knowledge-v7"
NORMAL_INSTRUCTION = """联合观察这一数据集的候选良品，发现产品可见的部件、结构关系、位置、纹理、光照与允许变化。
不要根据数据集名称假设产品或预设缺陷检查表。只归纳可观察、可复用且有图像证据的检查判据。
人工选取和无标注只是来源资格，不是确认真值。寻找候选良品中的异常与矛盾，将其定位为suspects，
不要将疑似异常作为对应正常规则的支持。区分跨样本共识、单例、推测与不可观察。
每个检查项指向实际support_evidence_ids和counter_evidence_ids，不编造尺寸、坐标或不存在的图像引用。
normal是来源全图，roi是该来源的原分辨率细节。结合其原图尺寸、crop_bbox和光照联合判断，勿将分块视作独立样本。
annotation_mask是纯二值定位图：白色只表示标注覆盖、黑色表示其外部/空洞，完全不含产品外观或颜色。
须与相同crop_bbox的raw原图配对联合观察；只在raw图像中判断产品特征，不能根据标注染色/形状推断缺陷或正常变化。
对每项写明适用对象/位置、可观察判据、允许变化与限制。没有可靠规律时允许checks为空并说明限制。
来源："""
KNOWLEDGE_JOB_TYPES = ("NORMAL_KNOWLEDGE", "DEFECT_KNOWLEDGE")


class MiningStart(AnalysisModel):
    dataset_id: str
    kind: KnowledgeKind
    normal_version_id: Optional[str] = None
    model_name: str = DEFAULT_MODEL
    sample_ids: Optional[List[str]] = Field(default=None)

    @model_validator(mode='after')
    def require_normal_version(self):
        if (self.kind == 'defect') != bool(self.normal_version_id):
            raise ValueError('Defect mining requires normal_version_id; normal mining cannot reference it')
        return self


class KnowledgeService:
    def __init__(self, db: Database, client: Optional[VlmClient] = None, jobs: Optional[JobRunner] = None):
        self.db, self.client = db, client or VlmClient()
        self.owns_jobs = jobs is None
        self.jobs = jobs or JobRunner(db, KNOWLEDGE_JOB_TYPES)
        self.registry = DatasetRegistry(db)
        self.repository = KnowledgeRepository(db)
        self.sources = KnowledgeSources(db)

    def start(self, **arguments) -> dict:
        request = MiningStart.model_validate(arguments)
        config = self.registry.resolve(dataset_id=request.dataset_id)
        normal = self.repository.get(request.normal_version_id) if request.normal_version_id else None
        if normal and (normal.dataset_id != request.dataset_id or normal.kind != 'normal'
                       or not any(check.status == 'supported' for check in normal.checks)):
            raise ValueError('A usable normal knowledge version from the same dataset is required')
        eligible = list(self.sources.eligible(request.dataset_id, request.kind, normal))
        requested = list(dict.fromkeys(request.sample_ids)) if request.sample_ids is not None else eligible
        if not requested or not set(requested).issubset(eligible):
            raise ValueError("Mining requires eligible knowledge sources from the selected dataset")
        parent = self.repository.current(request.dataset_id, request.kind)
        previous = {source.sample_id for source in parent.sources} if parent else set()
        scope = previous | set(requested)
        sample_ids = [sample_id for sample_id in eligible if sample_id in scope]
        return self.jobs.start("NORMAL_KNOWLEDGE" if request.kind == "normal" else "DEFECT_KNOWLEDGE", config.task.task_id,
                               {**request.model_dump(), "sample_ids": sample_ids,
                                "requested_sample_ids": requested,
                                "removed_source_ids": sorted(previous - set(eligible)),
                                "parent_version_id": parent.version_id if parent else None}, self.mine, "准备良品知识挖掘" if request.kind == "normal" else "准备不良知识挖掘")

    def mine(self, context: JobContext):
        payload = context.payload
        context.checkpoint()
        parent = self.repository.get(payload['parent_version_id']) if payload['parent_version_id'] else None
        evolution = KnowledgeEvolution(parent)
        normal = self.repository.get(payload['normal_version_id']) if payload.get('normal_version_id') else None
        defect = DefectVerification(self.db, self.client, context)
        references = defect.references(normal) if normal else []
        context.update(phase='PREPARING_KNOWLEDGE')
        sources = self.sources.collect(payload['dataset_id'], payload['sample_ids'], payload['kind'], normal)
        signature = hashlib.sha256(json.dumps([GENERATION_VERSION, NORMAL_INSTRUCTION, SYNTHESIS_INSTRUCTION, VERIFICATION_INSTRUCTION,
            DEFECT_INSTRUCTION, DEFECT_VERIFICATION_INSTRUCTION, EVOLUTION_INSTRUCTION,
            payload.get("normal_version_id"), payload["kind"],
            KnowledgeDraft.model_json_schema(), KnowledgeVerification.model_json_schema(), KnowledgeSnapshot.model_json_schema(),
            payload["dataset_id"], payload["model_name"], [source.model_dump() for source in sources]], sort_keys=True).encode()).hexdigest()
        current = self.repository.current(payload["dataset_id"], payload["kind"])
        if (current.version_id if current else None) != payload['parent_version_id']:
            raise ValueError('Knowledge head changed during mining; restart with the current version')
        if current and current.signature == signature:
            for source in sources:
                context.record(source.sample_id, knowledge_version_id=current.version_id, phase="KNOWLEDGE_REUSED")
            return
        evidence_images = EvidenceImages(self.db.db_path)
        inputs = []
        for source in sources:
            context.checkpoint()
            sample = SampleRepository(self.db).get(source.sample_id)
            images = [evidence_images.capture(sample, "overview" if normal else "normal", "global" if normal else "reference", source_sha256=source.sha256)]
            annotations = AnnotationRepository(self.db).list_by_sample(source.sample_id)
            if max(sample.width, sample.height) > OVERVIEW_MAX_SIDE or annotations:
                for region in evidence_images.plan(sample, annotations, []):
                    images.append(evidence_images.capture(sample, "roi", region.source, region.crop_bbox, source.sha256))
                    linked = [annotation for annotation in annotations
                              if annotation.annotation_id in {origin.annotation_id for origin in region.origins}]
                    if linked:
                        images.append(evidence_images.capture(sample, "roi", region.source, region.crop_bbox,
                            source.sha256, annotations=linked, annotation_mode="annotation_mask"))
            inputs.append(KnowledgeInput(source, images))
        miner = KnowledgeMiner(self.client, context)
        if normal:
            verification = defect.review(normal, inputs, references, payload['model_name'])
            context.update(phase='LEARNING_DEFECT')
            instruction = DEFECT_INSTRUCTION + json.dumps({'normal_version_id': normal.version_id,
                'normal_checks': [check.model_dump() for check in normal.checks],
                'findings': [finding.model_dump() for finding in verification.findings]}, ensure_ascii=False) + '\n来源：'
            draft = miner.learn(instruction, inputs + references, payload['model_name'], evolution.instruction).result
            draft = draft.model_copy(deep=True)
            defect.qualify(draft, verification)
        else:
            context.update(phase='LEARNING_NORMAL')
            draft = miner.learn(NORMAL_INSTRUCTION, inputs, payload['model_name'], evolution.instruction).result
            proposals = {(item.evidence_id, tuple(item.bbox_1000)): item for step in miner.steps for item in step.result.suspects}
            draft = draft.model_copy(deep=True, update={'suspects': list(proposals.values())})
            verification = NormalVerification(self.db, self.client, context).review(draft, inputs, payload['model_name'], parent)
        if self.sources.collect(payload['dataset_id'], payload['sample_ids'], payload['kind'], normal) != sources:
            raise ValueError('Knowledge sources changed during mining')
        checks = evolution.checks(draft)
        for finding in verification.findings:
            if normal:
                for check in checks:
                    if set(check.support_evidence_ids) & {region.image.evidence_id for region in finding.regions}:
                        check.finding_ids.append(finding.finding_id)
                        check.normal_check_ids = list(dict.fromkeys([*check.normal_check_ids, *finding.affected_check_ids]))
            else:
                finding.affected_check_ids = [check.check_id for check in checks if check.title in finding.judgment.affected_check_titles]
        evidence = {image.evidence.evidence_id: KnowledgeEvidence(sample_id=item.source.sample_id, image=image.evidence)
                    for item in inputs + references for image in item.images}
        evidence.update({item.image.evidence_id: item for item in verification.evidence})
        snapshot = KnowledgeSnapshot(version_id="knowledge_" + uuid.uuid4().hex, dataset_id=payload["dataset_id"],
            kind=payload["kind"], parent_version_id=payload["parent_version_id"], normal_version_id=payload.get("normal_version_id"),
            model_name=payload["model_name"], generation_version=GENERATION_VERSION, signature=signature,
            summary=draft.summary, checks=checks, revisions=draft.revisions,
            removed_source_ids=payload['removed_source_ids'],
            suspects=draft.suspects, limitations=draft.limitations, sources=sources,
            evidence=list(evidence.values()),
            mining_steps=miner.steps, findings=verification.findings, verification_steps=verification.steps,
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
