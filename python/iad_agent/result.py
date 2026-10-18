from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class AgentRunResult(BaseModel):
    """
    Structured outcome of a DeepSeek Harness Agent turn (Tickets A002, A004, NV-01).
    """
    session_id: str = Field(..., description="Unique persistent Harness session ID")
    status: str = Field("COMPLETED", description="COMPLETED, REVIEW_REQUIRED, NOT_READY, AUTH_REQUIRED, ERROR")
    final_text: str = Field("", description="Agent's final response text")
    tool_calls: List[Dict[str, Any]] = Field(default_factory=list, description="Tool calls executed during the turn")
    raw_events: List[Dict[str, Any]] = Field(default_factory=list, description="Streaming execution events from Harness")
    error_message: Optional[str] = Field(None, description="Error message if run failed")
    exit_code: int = Field(0, description="Process return code")

    @property
    def error(self) -> Optional[str]:
        return self.error_message
