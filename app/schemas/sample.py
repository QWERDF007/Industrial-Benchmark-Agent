from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class QualityStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    UNCERTAIN = "UNCERTAIN"


class DataOrigin(str, Enum):
    PRODUCTION_RAW = "PRODUCTION_RAW"
    LEGACY_TRAIN = "LEGACY_TRAIN"
    LEGACY_TEST = "LEGACY_TEST"
    AUGMENTED = "AUGMENTED"
    MISSED_CASE = "MISSED_CASE"
    UNKNOWN = "UNKNOWN"


class Sample(BaseModel):
    sample_id: str = Field(..., description="Unique sample identifier (e.g. dataset_id:relative_path)")
    task_id: str = Field(..., description="Inspection task ID")
    dataset_id: str = Field("default", description="Dataset identifier")
    image_path: str = Field(..., description="Absolute path to image file")
    relative_path: str = Field(..., description="Path relative to dataset root")
    data_origin: DataOrigin = Field(DataOrigin.UNKNOWN, description="Data origin/split lineage")

    physical_sample_id: Optional[str] = Field(None, description="Physical workpiece / object ID")
    capture_sequence_id: Optional[str] = Field(None, description="Capture timestamp or sequence ID")

    batch_id: Optional[str] = Field(None, description="Manufacturing or dataset batch ID")
    station: Optional[str] = Field(None, description="Inspection station")
    camera: Optional[str] = Field(None, description="Camera identifier")

    width: int = Field(..., ge=1, description="Image width in pixels")
    height: int = Field(..., ge=1, description="Image height in pixels")

    quality_status: QualityStatus = Field(..., description="PASS, FAIL, or UNCERTAIN")
    quality_source: Optional[str] = Field(None, description="Source of quality label (folder, filename, etc.)")

    @field_validator("quality_status", mode="before")
    def validate_quality_status(cls, v):
        if isinstance(v, str):
            v_upper = v.upper()
            if v_upper in ("PASS", "FAIL", "UNCERTAIN"):
                return QualityStatus(v_upper)
            raise ValueError(f"Invalid quality_status '{v}'. Must be PASS, FAIL, or UNCERTAIN.")
        return v

    @field_validator("data_origin", mode="before")
    def validate_data_origin(cls, v):
        if isinstance(v, str):
            v_upper = v.upper()
            try:
                return DataOrigin(v_upper)
            except ValueError:
                return DataOrigin.UNKNOWN
        return v
