from enum import Enum
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator
from uuid import NAMESPACE_URL, uuid4, uuid5


def sample_uuid(sample_id: str) -> str:
    return str(uuid5(NAMESPACE_URL, "iad:sample:" + sample_id))


class QualityStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    UNCERTAIN = "UNCERTAIN"


class DataOrigin(str, Enum):
    LEGACY_TRAIN = "LEGACY_TRAIN"
    LEGACY_TEST = "LEGACY_TEST"
    AUGMENTED = "AUGMENTED"
    MISSED_CASE = "MISSED_CASE"
    PRODUCTION = "PRODUCTION"
    UNKNOWN = "UNKNOWN"


class AnnotationType(str, Enum):
    BBOX = "bbox"
    POLYGON = "polygon"
    MASK = "mask"
    IMAGE = "image"


class AnnotationSource(str, Enum):
    MANUAL = "manual"
    EXISTING_DETECTOR = "existing_detector"
    PRODUCTION_SYSTEM = "production_system"
    IMPORTED = "imported"
    UNKNOWN = "unknown"


class GeometryStatus(str, Enum):
    VALID = "VALID"
    CLIPPED = "CLIPPED"
    SCALED = "SCALED"
    INVALID = "INVALID"


class ReviewDecisionEnum(str, Enum):
    PASS = "PASS"
    HARD_NORMAL = "HARD_NORMAL"
    FAIL = "FAIL"
    UNCERTAIN = "UNCERTAIN"
    SKIP = "SKIP"


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


# 1. InspectionTask
class InspectionTask(BaseModel):
    task_id: str
    product: Optional[str] = None
    station: Optional[str] = None
    camera: Optional[str] = None
    inspection_target: str
    description: Optional[str] = None


# 2. Sample
class Sample(BaseModel):
    sample_id: str
    task_id: str
    dataset_id: str = "default"
    image_path: str
    relative_path: str
    quality_status: QualityStatus
    quality_source: Optional[str] = None
    data_origin: DataOrigin = DataOrigin.UNKNOWN
    batch_id: Optional[str] = None
    physical_sample_id: Optional[str] = None
    capture_sequence_id: Optional[str] = None
    station: Optional[str] = None
    camera: Optional[str] = None
    width: int
    height: int

    @computed_field
    @property
    def sample_uuid(self) -> str:
        return sample_uuid(self.sample_id)

    @field_validator("quality_status", mode="before")
    @classmethod
    def validate_quality_status(cls, v):
        if isinstance(v, str):
            v_upper = v.upper()
            if v_upper in QualityStatus.__members__:
                return QualityStatus(v_upper)
        return v



# 3. Annotation
class Annotation(BaseModel):
    annotation_id: str
    sample_id: str
    annotation_type: AnnotationType
    raw_label: str
    phenomenon: Optional[str] = None
    bbox: Optional[List[float]] = None
    polygon: Optional[List[List[float]]] = None
    mask_path: Optional[str] = None
    mask_sha256: Optional[str] = Field(default=None, pattern="^[a-f0-9]{64}$")
    geometry_status: GeometryStatus = GeometryStatus.VALID
    source: AnnotationSource = AnnotationSource.IMPORTED
    source_width: Optional[int] = None
    source_height: Optional[int] = None


class Severity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"


class IssueType(str, Enum):
    INVALID_IMAGE = "invalid_image"
    MISSING_IMAGE = "missing_image"
    INVALID_BBOX = "invalid_bbox"
    MISSING_MASK = "missing_mask"
    INVALID_MASK = "invalid_mask"
    UNKNOWN_QUALITY = "unknown_quality"
    UNKNOWN_LABEL = "unknown_label"
    METADATA_MISSING = "metadata_missing"
    ANNOTATION_PARSE_ERROR = "annotation_parse_error"
    DUPLICATED_RECORD = "duplicated_record"
    OTHER = "other"


# 4. ImportIssue
class ImportIssue(BaseModel):
    task_id: Optional[str] = None
    dataset_id: Optional[str] = None
    sample_id: Optional[str] = None
    issue_type: Union[IssueType, str]
    severity: Union[Severity, str] = Severity.WARNING
    message: str



# 5. FeatureRecord
class FeatureRecord(BaseModel):
    model_config = {"protected_namespaces": ()}
    sample_id: str
    model_id: str
    preprocess_key: str
    dim: int
    dtype: str
    embedding_blob: Optional[bytes] = None
    source_file_size: Optional[int] = None
    source_mtime_ns: Optional[int] = None


# 6. ReviewSession
class ReviewSession(BaseModel):
    session_id: str
    task_id: str
    reviewer: str
    started_at: Optional[str] = None
    submitted_at: Optional[str] = None
    total_reviewed: int = 0
    dataset_id: Optional[str] = None


# 7. ReviewDecisionRecord
class ReviewDecisionRecord(BaseModel):
    model_config = ConfigDict(json_schema_serialization_defaults_required=True)
    decision_id: str = Field(default_factory=lambda: str(uuid4()))
    sample_id: str
    decision: str
    reviewer: str = "default"
    reason_code: Optional[str] = None
    comment: Optional[str] = None
    evidence_version: str = "v2"
    review_session_id: Optional[str] = None
    started_at: Optional[str] = None
    submitted_at: Optional[str] = None
    review_duration_ms: int = 0


class ReviewHistoryRecord(ReviewDecisionRecord):
    relative_path: str


# 8. GoldRecord
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
    annotations: List[Dict[str, Any]] = Field(default_factory=list)
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


# 9. BenchmarkBuildRecord
class BenchmarkBuildRecord(BaseModel):
    build_id: str
    task_id: str
    gold_policy: str
    split_policy: str
    seed: int
    status: str
    output_dir: str


# 10. SplitAssignmentRecord
class SplitAssignmentRecord(BaseModel):
    build_id: str
    sample_id: str
    split_group_id: str
    split_name: str


# 11. EvaluationRunRecord
class EvaluationRunRecord(BaseModel):
    model_config = {"protected_namespaces": ()}
    run_id: str
    task_id: str
    build_id: str
    model_id: str
    threshold_strategy: str
    metrics: Dict[str, Any] = Field(default_factory=dict)
    status: str
    output_dir: str



# 12. JobRunRecord
class JobRunRecord(BaseModel):
    job_id: str
    task_id: str
    job_type: str
    status: str
    progress: float = 0.0
    message: Optional[str] = None
    artifact_dir: Optional[str] = None
    started_at: Optional[str] = None
    finished_at: Optional[str] = None


# 13. AgentRunRecord
class AgentRunRecord(BaseModel):
    run_id: str
    task_id: str
    session_id: str
    goal: str
    status: str
    final_artifact: Optional[str] = None
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
