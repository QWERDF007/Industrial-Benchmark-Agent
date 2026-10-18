import json
import pytest
from unittest.mock import patch, MagicMock

from iad_agent.config import AgentConfig
from iad_agent.result import AgentRunResult
from iad_agent.runtime import run, resume
from iad_domain_server.mcp import TOOL_HANDLER_MAP


def test_agent_config_defaults():
    cfg = AgentConfig()
    assert cfg.profile == "industrial-benchmark"
    assert cfg.timeout_seconds == 300
    assert cfg.dsh_bin.endswith("dsh")


def test_agent_run_result_parsing():
    res = AgentRunResult(
        session_id="test-session-123",
        status="SUCCESS",
        final_text="Benchmark complete",
        raw_events=[{"type": "status", "data": "ok"}],
        error_message=None,
        exit_code=0,
    )
    assert res.session_id == "test-session-123"
    assert res.status == "SUCCESS"
    assert res.final_text == "Benchmark complete"
    assert res.exit_code == 0


def test_agent_runtime_run_invocation():
    """Verify runtime.run correctly launches dsh with proper arguments and parses events."""
    mock_events = [
        json.dumps({"type": "session", "sessionId": "sess-abc-456"}),
        json.dumps({"type": "message", "role": "agent", "content": "Running task_inspect"}),
        json.dumps({"type": "final", "text": "Task inspect finished."}),
    ]
    stdout_content = "\n".join(mock_events) + "\n"

    mock_proc = MagicMock()
    mock_proc.communicate.return_value = (stdout_content, "")
    mock_proc.returncode = 0

    with patch("subprocess.Popen", return_value=mock_proc) as mock_popen, \
         patch("os.path.exists", return_value=True):
        result = run(goal="Inspect the kuangjiao dataset", config=AgentConfig(cwd="/tmp/fake"))

        assert mock_popen.called
        call_args = mock_popen.call_args[0][0]
        assert "--profile" in call_args
        assert "industrial-benchmark" in call_args
        assert "--json" in call_args
        assert "Inspect the kuangjiao dataset" in call_args

        assert result.session_id == "sess-abc-456"
        assert result.status == "COMPLETED"
        assert result.final_text == "Task inspect finished."
        assert len(result.raw_events) == 3


def test_agent_runtime_resume_session_continuity():
    """Verify runtime.resume reuses identical session_id across turns."""
    mock_events = [
        json.dumps({"type": "session", "sessionId": "sess-resume-789"}),
        json.dumps({"type": "final", "text": "Resumed successfully after human review"}),
    ]
    stdout_content = "\n".join(mock_events) + "\n"

    mock_proc = MagicMock()
    mock_proc.communicate.return_value = (stdout_content, "")
    mock_proc.returncode = 0

    with patch("subprocess.Popen", return_value=mock_proc) as mock_popen, \
         patch("os.path.exists", return_value=True):
        result = resume(session_id="sess-resume-789", prompt="Review completed, proceed.")

        call_args = mock_popen.call_args[0][0]
        assert "--session-id" in call_args
        sess_idx = call_args.index("--session-id")
        assert call_args[sess_idx + 1] == "sess-resume-789"
        assert "Review completed, proceed." in call_args
        assert result.session_id == "sess-resume-789"
        assert result.status == "COMPLETED"


def test_agent_runtime_review_required_detection():
    """Verify runtime detects REVIEW_REQUIRED status from structured tool events (NS-01, NV-04)."""
    mock_events = [
        json.dumps({"type": "session", "sessionId": "sess-gate-001"}),
        json.dumps({
            "type": "tool_result",
            "tool": "mcp__iad__benchmark_build",
            "result": {"status": "REVIEW_REQUIRED", "summary": "Hard normal review required"}
        }),
    ]
    stdout_content = "\n".join(mock_events) + "\n"

    mock_proc = MagicMock()
    mock_proc.communicate.return_value = (stdout_content, "")
    mock_proc.returncode = 0

    with patch("subprocess.Popen", return_value=mock_proc), \
         patch("os.path.exists", return_value=True):
        result = run(goal="Build benchmark", config=AgentConfig(cwd="/tmp/fake"))
        assert result.status == "REVIEW_REQUIRED"
        assert len(result.tool_calls) == 1


def test_agent_runtime_missing_session_id_fails():
    """Verify missing session ID fails-fast without creating fake fallback session (NS-01, NV-01)."""
    mock_proc = MagicMock()
    mock_proc.communicate.return_value=("No session events here", "")
    mock_proc.returncode = 0

    with patch("subprocess.Popen", return_value=mock_proc), \
         patch("os.path.exists", return_value=True):
        result = run(goal="Do something", config=AgentConfig(cwd="/tmp/fake"))
        assert result.status == "ERROR"
        assert "Missing session ID" in (result.error_message or "")
        assert not result.session_id.startswith("session-fallback")


def test_allowed_tool_surface_consistency():
    """Verify the 15 MCP domain tools match between Python server and Harness bundle definition."""
    domain_tools = set(TOOL_HANDLER_MAP.keys())
    assert len(domain_tools) == 15

    expected_tools = {
        "task_inspect",
        "dataset_audit",
        "feature_prepare",
        "visual_search",
        "duplicate_audit",
        "candidate_mine",
        "evidence_get",
        "review_status",
        "benchmark_preview",
        "benchmark_build",
        "benchmark_status",
        "leakage_check",
        "evaluation_plan",
        "baseline_run",
        "evaluation_compare",
    }
    assert domain_tools == expected_tools
