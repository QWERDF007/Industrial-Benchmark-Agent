from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class Severity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"


class IssueType(str, Enum):
    INVALID_IMAGE = "invalid_image"
    MISSING_IMAGE = "missing_image"
    INVALID_BBOX = "invalid_bbox"
    MISSING_MASK = "missing_mask"
    UNKNOWN_QUALITY = "unknown_quality"
    UNKNOWN_LABEL = "unknown_label"
    METADATA_MISSING = "metadata_missing"
    ANNOTATION_PARSE_ERROR = "annotation_parse_error"
    DUPLICATED_RECORD = "duplicated_record"
    OTHER = "other"


class ImportIssue(BaseModel):
    issue_id: Optional[str] = Field(None, description="Issue identifier")
    task_id: Optional[str] = Field(None, description="Inspection task ID")
    sample_id: Optional[str] = Field(None, description="Sample ID related to the issue")
    issue_type: IssueType = Field(..., description="Type of issue encountered")
    severity: Severity = Field(Severity.WARNING, description="Issue severity")
    message: str = Field(..., description="Detailed description of issue")
