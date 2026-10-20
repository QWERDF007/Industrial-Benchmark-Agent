from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class GoldQuality(str, Enum):
    PASS = "PASS"
    HARD_NORMAL = "HARD_NORMAL"
    FAIL = "FAIL"
    CONFLICT = "CONFLICT"
    EXCLUDED = "EXCLUDED"


class BinaryLabel(str, Enum):
    NORMAL = "NORMAL"
    ANOMALY = "ANOMALY"


class GoldStatus(str, Enum):
    CONFIRMED = "CONFIRMED"
    CONFLICT = "CONFLICT"
    EXCLUDED = "EXCLUDED"


class GoldSource(str, Enum):
    HUMAN_REVIEW = "HUMAN_REVIEW"
    PRODUCTION_QA = "PRODUCTION_QA"
    EXISTING_QUALITY = "EXISTING_QUALITY"
    UNCERTAIN = "UNCERTAIN"


class GoldAnnotation(BaseModel):
    annotation_id: str
    raw_label: str
    phenomenon: Optional[str] = None
    bbox: Optional[List[float]] = None
    polygon: Optional[List[List[float]]] = None
    mask_path: Optional[str] = None
    mask_sha256: Optional[str] = None
    geometry_status: str = "VALID"
    source: str = "imported"


class GoldRecord(BaseModel):
    sample_id: str
    task_id: str
    policy_name: str
    gold_quality: str
    binary_label: Optional[str] = None
    hard_normal: bool = False
    gold_source: str
    gold_source_ref: Optional[str] = None
    gold_status: str
    provenance: Dict[str, Any] = Field(default_factory=dict)
    phenomena: List[str] = Field(default_factory=list)
    annotations: List[GoldAnnotation] = Field(default_factory=list)
    physical_sample_id: Optional[str] = None
    capture_sequence_id: Optional[str] = None
    batch_id: Optional[str] = None
    data_origin: str = "UNKNOWN"
    image_path: str
    relative_path: str


class GoldConflictRecord(BaseModel):
    sample_id: str
    task_id: str
    policy_name: str
    conflicting_sources: Dict[str, Any]
    reason: str


class GoldBuildResult(BaseModel):
    task_id: str
    policy_name: str
    total_samples: int
    gold_confirmed_count: int
    normal_count: int
    hard_normal_count: int
    fail_count: int
    conflict_count: int
    excluded_count: int
    gold_jsonl_path: Optional[str] = None
    conflicts_json_path: Optional[str] = None
    elapsed_seconds: float
    records: List[GoldRecord] = Field(default_factory=list)
    conflicts: List[GoldConflictRecord] = Field(default_factory=list)

