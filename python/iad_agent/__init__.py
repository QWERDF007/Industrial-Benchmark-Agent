"""
Industrial Benchmark Agent Runtime Package (Tickets A002, A003, Specs S1).
Encapsulates DeepSeek Harness SDK/Process execution, exposing run() and resume().
"""
from iad_agent.config import AgentConfig
from iad_agent.result import AgentRunResult
from iad_agent.runtime import run, resume

__all__ = [
    "run",
    "resume",
    "AgentConfig",
    "AgentRunResult",
]
