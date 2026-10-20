from iad_core.advisory.analysis import AuditAnalysis
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ConclusionStatus(str, Enum):
    EVIDENCE_SUPPORTED = "EVIDENCE_SUPPORTED"
    EVIDENCE_CONTRADICTED = "EVIDENCE_CONTRADICTED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"


class RecommendedAction(str, Enum):
    REVIEW = "REVIEW"
    RECHECK = "RECHECK"
    IGNORE_CANDIDATE = "IGNORE_CANDIDATE"
    INVESTIGATE_METADATA = "INVESTIGATE_METADATA"


class ObservationItem(BaseModel):
    phenomenon: str
    region_xyxy: Optional[List[int]] = None
    description: Optional[str] = None
    view_id: Optional[str] = None


class HypothesisItem(BaseModel):
    label: str
    supporting_refs: List[str] = Field(default_factory=list)
    contradicting_refs: List[str] = Field(default_factory=list)


class EvidenceRefItem(BaseModel):
    kind: str
    sample_id: Optional[str] = None
    tool_name: Optional[str] = None
    artifact_id: Optional[str] = None
    view_id: Optional[str] = None
    description: Optional[str] = None


class AuditSuggestion(BaseModel):
    """
    Non-authoritative multimodal audit suggestion (S08, Ticket RP-14).
    Observations, hypotheses, and recommendations produced by VLM/Agent.
    Never mutates ground truth, QualityStatus, or GoldRecords.
    """
    model_config = {"protected_namespaces": ()}

    suggestion_id: str
    task_id: str
    sample_id: Optional[str] = None
    session_id: Optional[str] = None
    model_route: Optional[str] = None
    confidence: Optional[float] = Field(None, ge=0, le=1)
    reference_sample_ids: List[str] = Field(default_factory=list)
    audit_run_id: Optional[str] = None
    analysis: Optional[AuditAnalysis] = None
    observations: List[ObservationItem] = Field(default_factory=list)
    hypotheses: List[HypothesisItem] = Field(default_factory=list)
    conclusion_status: ConclusionStatus = ConclusionStatus.INSUFFICIENT_EVIDENCE
    recommended_action: RecommendedAction = RecommendedAction.REVIEW
    evidence_refs: List[EvidenceRefItem] = Field(default_factory=list)
    input_modalities_used: List[str] = Field(default_factory=list)
    created_at: Optional[str] = None
