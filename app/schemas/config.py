import os
from typing import Optional, List, Dict, Any
import yaml
from pydantic import BaseModel, Field

from app.schemas.sample import QualityStatus
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
    # Strategy for locating annotation file corresponding to an image:
    # 'sidecar': image_stem + '.json' in same folder
    # 'folder_replace': replace image folder name with label folder name (e.g. ExportImage_ -> ExportLabel_)
    location_mode: str = Field(
        "auto",
        description="How to locate label files: 'auto', 'sidecar', 'folder_replace'",
    )
    folder_replace: Optional[Dict[str, str]] = Field(
        None,
        description="String replacement dict for image folder to label folder, e.g. {'ExportImage_': 'ExportLabel_'}",
    )
    extension: Optional[str] = Field(
        None,
        description="Label file extension, e.g. '.json' or '.txt'",
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


class DatasetConfig(BaseModel):
    dataset: DatasetInfo
    root: str = Field(..., description="Root directory of the dataset")
    task: TaskConfig
    images: ImagesConfig = Field(default_factory=ImagesConfig)
    quality: QualityConfig = Field(default_factory=QualityConfig)
    annotations: AnnotationsConfig = Field(default_factory=AnnotationsConfig)
    metadata: MetadataConfig = Field(default_factory=MetadataConfig)


def load_config(config_path: str) -> DatasetConfig:
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Config file not found: {config_path}")
    with open(config_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return DatasetConfig.model_validate(data)
