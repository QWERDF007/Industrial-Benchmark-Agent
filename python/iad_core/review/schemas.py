from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from iad_core.storage.models import ReviewDecisionEnum as ReviewDecisionType, ReviewDecisionRecord


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
