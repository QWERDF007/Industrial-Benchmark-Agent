import hashlib
import json
import threading
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from iad_core.advisory.analysis import NormalPatterns, NormalProfile, NormalSource
from iad_core.dataset.path_safety import validate_sample_image_path
from iad_core.dataset.registry import DatasetRegistry
from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository, ReviewRepository
from iad_core.evidence.images import EvidenceImages, file_sha256
from iad_core.workbench.vision import VlmClient


NORMAL_PROFILE_VERSION = "mllm-normal-v2"
NORMAL_INSTRUCTION = (
    "学习这批同一数据集的良品图像。检测目标：{target}。归纳可复用的正常结构、胶线/纹理、部件相对位置、光照变化、允许差异及后续局部检查注意事项。"
    "参考来源：{sources}。初始无标注约定和人工手选不等于已确认真值；记录共同的可观察模式与局限，不要将偶然反光当成正常结构，不编造尺寸阈值或无法观察的特征。"
)


class NormalProfiles:
    def __init__(self, db: Database, client: Optional[VlmClient] = None):
        self.db, self.client = db, client
        self.lock = threading.Lock()

    def signature(self, dataset_id: str, model_name: str, references: List[str]):
        config = DatasetRegistry(self.db).get(dataset_id)
        sources = []
        with self.db.connection() as conn:
            selected = json.loads(conn.execute("SELECT reference_sample_ids_json FROM datasets WHERE dataset_id=?", (dataset_id,)).fetchone()[0])
        for sid in references:
            sample = SampleRepository(self.db).get(sid)
            path = validate_sample_image_path(sample, self.db.db_path)
            decision = ReviewRepository(self.db).get_decision(sid)
            qualification = ("human_pass" if decision and decision.decision == "PASS" else
                             "human_hard_normal" if decision and decision.decision == "HARD_NORMAL" else
                             "manual_selection" if sid in selected else "raw_pass" if sample.quality_status == "PASS" else "initial_unannotated")
            sources.append(NormalSource(sample_id=sid, sha256=file_sha256(path), qualification=qualification))
        fingerprint = json.dumps([NORMAL_PROFILE_VERSION, NORMAL_INSTRUCTION, NormalPatterns.model_json_schema(),
                                  dataset_id, model_name, config.task.inspection_target, [source.model_dump() for source in sources]], ensure_ascii=False)
        return hashlib.sha256(fingerprint.encode()).hexdigest(), sources

    def current(self, dataset_id: str, model_name: str) -> Optional[NormalProfile]:
        references = DatasetRegistry(self.db).references(dataset_id)
        signature, _ = self.signature(dataset_id, model_name, references)
        with self.db.connection() as conn:
            row = conn.execute("SELECT profile_json FROM normal_profiles WHERE signature=?", (signature,)).fetchone()
        return NormalProfile.model_validate_json(row[0]) if row else None

    def get(self, profile_id: str) -> NormalProfile:
        with self.db.connection() as conn:
            row = conn.execute("SELECT profile_json FROM normal_profiles WHERE profile_id=?", (profile_id,)).fetchone()
        if not row:
            raise LookupError("Normal profile not found")
        return NormalProfile.model_validate_json(row[0])

    def ensure(self, dataset_id: str, model_name: str, references: List[str], cancel: Optional[threading.Event] = None) -> NormalProfile:
        if not references:
            raise ValueError("No normal reference images are available")
        with self.lock:
            signature, sources = self.signature(dataset_id, model_name, references)
            with self.db.connection() as conn:
                row = conn.execute("SELECT profile_json FROM normal_profiles WHERE signature=?", (signature,)).fetchone()
            if row:
                return NormalProfile.model_validate_json(row[0])
            if cancel and cancel.is_set():
                raise InterruptedError("Audit cancelled")
            config = DatasetRegistry(self.db).get(dataset_id)
            patterns = self.client.generate(NormalPatterns, NORMAL_INSTRUCTION.format(target=config.task.inspection_target,
                sources=json.dumps([s.model_dump() for s in sources], ensure_ascii=False)),
                [EvidenceImages(self.db.db_path).capture(SampleRepository(self.db).get(source.sample_id), "normal", "reference", source_sha256=source.sha256) for source in sources], model_name)
            if cancel and cancel.is_set():
                raise InterruptedError("Audit cancelled")
            if self.signature(dataset_id, model_name, references)[0] != signature:
                raise ValueError("Reference images changed during learning")
            profile = NormalProfile(generation_version=NORMAL_PROFILE_VERSION, sources=sources, profile_id="normal_" + uuid.uuid4().hex, dataset_id=dataset_id, model_name=model_name,
                                    reference_sample_ids=references, patterns=patterns, created_at=datetime.now(timezone.utc).isoformat())
            with self.db.connection() as conn:
                conn.execute("INSERT INTO normal_profiles(profile_id,dataset_id,model_name,signature,profile_json) VALUES(?,?,?,?,?) ON CONFLICT(signature) DO NOTHING",
                             (profile.profile_id, dataset_id, model_name, signature, profile.model_dump_json()))
                saved = conn.execute("SELECT profile_json FROM normal_profiles WHERE signature=?", (signature,)).fetchone()
            return NormalProfile.model_validate_json(saved[0])
