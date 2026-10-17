from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class ReviewDecisionType(str, Enum):
    PASS = "PASS"
    HARD_NORMAL = "HARD_NORMAL"
    FAIL = "FAIL"
    UNCERTAIN = "UNCERTAIN"
    SKIP = "SKIP"


class ReasonCode(str, Enum):
    NORMAL_NOMINAL = "normal_nominal"
    NORMAL_COLOR_SHIFT = "normal_color_shift"
    NORMAL_POSITION_SHIFT = "normal_position_shift"
    NORMAL_CONTAMINATION = "normal_contamination"
    NORMAL_TEXTURE_VARIATION = "normal_texture_variation"
    NORMAL_ILLUMINATION = "normal_illumination"
    NORMAL_OTHER = "normal_other"
    DEFECT_CONFIRMED = "defect_confirmed"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"
    DATA_ISSUE = "data_issue"


class ReviewDecisionRecord(BaseModel):
    id: Optional[int] = None
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
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class ReviewDecisionCreate(BaseModel):
    sample_id: str
    decision: ReviewDecisionType
    reviewer: str = "default"
    reason_code: Optional[ReasonCode] = None
    comment: Optional[str] = None
    review_session_id: Optional[str] = None
    started_at: Optional[str] = None
    submitted_at: Optional[str] = None
    review_duration_ms: int = 0


class QueueStats(BaseModel):
    task_id: str
    total_candidates: int
    reviewed_count: int
    pending_count: int
    skipped_count: int
    decisions: Dict[str, int]
    candidate_yield: float
    avg_duration_ms: float
