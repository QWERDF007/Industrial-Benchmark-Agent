import os
import re
from typing import Optional, List, Dict, Any
import yaml
from pydantic import BaseModel, Field

from app.schemas.sample import QualityStatus, DataOrigin
from app.schemas.annotation import AnnotationSource


class DatasetInfo(BaseModel):
    id: str = Field(..., description="Dataset identifier")
    description: Optional[str] = Field(None, description="Dataset description")


class TaskConfig(BaseModel):
    task_id: str = Field(..., description="Task identifier")
    product: Optional[str] = Field(None, description="Product category")
    station: Optional[str] = Field(None, description="Station identifier")
    camera: Optional[str] = Field(None, description="Camera identifier")
    inspection_target: str = Field(..., description="Defect/target name")
    description: Optional[str] = Field(None, description="Task description")


class ImagesConfig(BaseModel):
    glob: List[str] = Field(
        default_factory=lambda: ["**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.bmp"],
        description="Glob patterns to locate images",
    )
    exclude: List[str] = Field(
        default_factory=list,
        description="Glob patterns to exclude",
    )


class QualityConfig(BaseModel):
    source: str = Field(
        "folder",
        description="Quality source strategy: 'folder', 'filename_regex', 'fixed', or 'default'",
    )
    match_mode: str = Field(
        "exact",
        description="Folder quality match mode: 'exact', 'token', 'contains', 'regex'",
    )
    default: QualityStatus = Field(
        QualityStatus.UNCERTAIN,
        description="Default quality status when not resolvable",
    )
    mapping: Dict[str, str] = Field(
        default_factory=dict,
        description="Mapping from folder name / key to PASS/FAIL/UNCERTAIN",
    )
    pattern: Optional[str] = Field(
        None,
        description="Regex pattern if source is 'filename_regex'",
    )


class OriginConfig(BaseModel):
    source: str = Field(
        "folder",
        description="Origin source strategy: 'folder', 'fixed', 'regex'",
    )
    mapping: Dict[str, str] = Field(
        default_factory=dict,
        description="Mapping from folder name / pattern to DataOrigin enum string",
    )
    default: str = Field(
        "UNKNOWN",
        description="Default DataOrigin if not matched",
    )


class BBoxPolicyConfig(BaseModel):
    out_of_bounds: str = Field(
        "reject",
        description="Policy for out-of-bounds bbox coordinates: 'reject', 'clip'",
    )
    source_size_mismatch: str = Field(
        "reject",
        description="Policy when label file image size mismatches decoded image size: 'reject', 'scale'",
    )


class AnnotationsConfig(BaseModel):
    format: str = Field(
        "none",
        description="Annotation format: 'none', 'labelme', 'yolo', 'folder'",
    )
    labels: Dict[str, str] = Field(
        default_factory=dict,
        description="Mapping from raw_label to standardized phenomenon",
    )
    source: AnnotationSource = Field(
        AnnotationSource.IMPORTED,
        description="Annotation source",
    )
    location_mode: str = Field(
        "auto",
        description="How to locate label files: 'auto', 'sidecar', 'folder_replace'",
    )
    folder_replace: Optional[Dict[str, str]] = Field(
        None,
        description="String replacement dict for image folder to label folder",
    )
    extension: Optional[str] = Field(
        None,
        description="Label file extension, e.g. '.json' or '.txt'",
    )
    bbox_policy: BBoxPolicyConfig = Field(
        default_factory=BBoxPolicyConfig,
        description="Policy for handling bbox bounding errors",
    )


class MetadataRule(BaseModel):
    source: str = Field(
        "none",
        description="Extraction source: 'fixed', 'regex', 'filename_regex', 'folder_regex', or 'none'",
    )
    pattern: Optional[str] = Field(None, description="Regex pattern")
    value: Optional[str] = Field(None, description="Fixed value")
    group: Optional[str] = Field(None, description="Named regex group to extract")


class MetadataConfig(BaseModel):
    batch_id: Optional[MetadataRule] = None
    physical_sample_id: Optional[MetadataRule] = None
    capture_sequence_id: Optional[MetadataRule] = None
    station: Optional[MetadataRule] = None
    camera: Optional[MetadataRule] = None


class StandardADReadinessPolicy(BaseModel):
    min_pass: Optional[int] = Field(None, description="Minimum PASS count required for READY")
    min_fail: Optional[int] = Field(None, description="Minimum FAIL count required for READY")
    max_uncertain_ratio: Optional[float] = Field(None, description="Maximum uncertain sample ratio")


class ReadinessPolicyConfig(BaseModel):
    standard_ad: Optional[StandardADReadinessPolicy] = None


class CandidateMiningWeightsConfig(BaseModel):
    normal_distance: float = 0.35
    density_outlier: float = 0.25
    domain_novelty: float = 0.20
    annotation_signal: float = 0.20


class CandidateMiningConfig(BaseModel):
    policy_name: str = "default"
    weights: CandidateMiningWeightsConfig = Field(default_factory=CandidateMiningWeightsConfig)
    diversity_threshold: float = 0.92


class ReferenceNormalPolicyConfig(BaseModel):
    include_raw_pass: bool = True
    include_review_pass: bool = True
    include_hard_normal: bool = False


class GoldPolicyConfig(BaseModel):
    policy_name: str = "default_gold_v1"
    trusted_reviewers: List[str] = Field(default_factory=lambda: ["reviewer_1", "expert_reviewer_1", "default"])
    source_priority: List[str] = Field(default_factory=lambda: ["HUMAN_REVIEW", "PRODUCTION_QA", "EXISTING_QUALITY"])
    conflict_policy: str = "MARK_CONFLICT"
    include_decisions: List[str] = Field(default_factory=lambda: ["PASS", "HARD_NORMAL", "FAIL"])


class SplitRatiosConfig(BaseModel):
    train: float = 0.6
    val: float = 0.2
    test: float = 0.2


class SplitPolicyConfig(BaseModel):
    policy_name: str = "group_stratified_v1"
    seed: int = 42
    ratios: SplitRatiosConfig = Field(default_factory=SplitRatiosConfig)
    group_keys: List[str] = Field(default_factory=lambda: ["physical_sample_id", "capture_sequence_id", "verified_duplicate"])
    exclude_origins_from_test: List[str] = Field(default_factory=lambda: ["AUGMENTED"])


class DatasetConfig(BaseModel):
    dataset: DatasetInfo
    root: str = Field(..., description="Root directory of the dataset")
    task: TaskConfig
    images: ImagesConfig = Field(default_factory=ImagesConfig)
    quality: QualityConfig = Field(default_factory=QualityConfig)
    origin: OriginConfig = Field(default_factory=OriginConfig)
    annotations: AnnotationsConfig = Field(default_factory=AnnotationsConfig)
    metadata: MetadataConfig = Field(default_factory=MetadataConfig)
    readiness_policy: Optional[ReadinessPolicyConfig] = None
    metadata_semantics: Dict[str, str] = Field(default_factory=dict)
    candidate_mining: CandidateMiningConfig = Field(default_factory=CandidateMiningConfig)
    reference_normal: ReferenceNormalPolicyConfig = Field(default_factory=ReferenceNormalPolicyConfig)
    gold: GoldPolicyConfig = Field(default_factory=GoldPolicyConfig)
    split: SplitPolicyConfig = Field(default_factory=SplitPolicyConfig)


def load_config(config_path: str) -> DatasetConfig:
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Config file not found: {config_path}")
    with open(config_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return DatasetConfig.model_validate(data)
