from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ToolStatus(str, Enum):
    OK = "OK"
    PARTIAL = "PARTIAL"
    NOT_READY = "NOT_READY"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    ERROR = "ERROR"


class MutationType(str, Enum):
    NONE = "NONE"
    DERIVED_ARTIFACT = "DERIVED_ARTIFACT"
    # Note: AUTHORITATIVE_MUTATION is prohibited for Agent Tools


class ArtifactRef(BaseModel):
    artifact_id: str
    artifact_type: str = Field(..., description="e.g. 'audit_report', 'benchmark_bundle', 'metrics_report', 'evidence'")
    uri: str = Field(..., description="e.g. 'iad://task/kuangjiao/audit.json' or file path")
    path: str = Field(..., description="Absolute local filesystem path")
    summary: Optional[str] = None


class ToolResult(BaseModel):
    """
    Standard MCP / Cordis Domain Tool Result Contract.
    Every tool returned to the agent must adhere to this unified schema.
    """
    status: ToolStatus = Field(..., description="Operational status: OK, PARTIAL, NOT_READY, REVIEW_REQUIRED, ERROR")
    summary: str = Field(..., description="Human-readable executive summary of the action result")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Key metrics and statistics")
    artifacts: List[ArtifactRef] = Field(default_factory=list, description="References to generated artifacts")
    warnings: List[str] = Field(default_factory=list, description="Warnings or non-fatal anomalies")
    next_actions: List[str] = Field(default_factory=list, description="Recommended next actions or tools to call")
    mutation: MutationType = Field(MutationType.NONE, description="State mutation category")
