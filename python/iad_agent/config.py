import os
from typing import Optional
from pydantic import BaseModel, Field


class AgentConfig(BaseModel):
    """
    Configuration for DeepSeek Harness Agent Runtime (Tickets A002, A003).
    """
    profile: str = Field("industrial-benchmark", description="DSH profile name")
    dsh_bin: str = Field(
        os.path.join(os.getcwd(), "node_modules", ".bin", "dsh"),
        description="Path to dsh launcher binary"
    )
    domain_server_url: str = Field("http://127.0.0.1:8000", description="Domain server URL")
    cwd: str = Field(os.getcwd(), description="Working directory")
    timeout_seconds: int = Field(300, description="Execution timeout in seconds")
