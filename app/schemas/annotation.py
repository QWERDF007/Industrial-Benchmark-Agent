from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


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


class Annotation(BaseModel):
    annotation_id: str = Field(..., description="Unique annotation identifier")
    sample_id: str = Field(..., description="Sample ID this annotation belongs to")
    annotation_type: AnnotationType = Field(..., description="bbox, polygon, mask, or image")

    raw_label: str = Field(..., description="Original raw label from annotation source")
    phenomenon: Optional[str] = Field(None, description="Normalized phenomenon label")

    bbox: Optional[List[float]] = Field(None, description="[xmin, ymin, xmax, ymax] in pixels")
    polygon: Optional[List[List[float]]] = Field(None, description="List of [x, y] vertices")
    mask_path: Optional[str] = Field(None, description="Path to binary segmentation mask file")

    source: AnnotationSource = Field(AnnotationSource.IMPORTED, description="Annotation source")
