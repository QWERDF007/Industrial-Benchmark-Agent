import os
import json
import logging
import subprocess
from typing import Optional, List, Dict, Any

from iad_agent.config import AgentConfig
from iad_agent.result import AgentRunResult

logger = logging.getLogger("iad_agent.runtime")


def run(
    goal: str,
    session_id: Optional[str] = None,
    config: Optional[AgentConfig] = None,
) -> AgentRunResult:
    """
    Execute a turn of the DeepSeek Harness Industrial Agent (Tickets A002, A004, S1.1~S1.3).
    Spawns official dsh profile and collects structured execution events.
    """
    cfg = config or AgentConfig()

    dsh_path = cfg.dsh_bin
    if not os.path.exists(dsh_path):
        # Fall back to node_modules/.bin/dsh in workspace
        alt_dsh = os.path.abspath(os.path.join(cfg.cwd, "node_modules", ".bin", "dsh"))
        if os.path.exists(alt_dsh):
            dsh_path = alt_dsh
        else:
            raise RuntimeError(f"DeepSeek Harness executable not found at: {cfg.dsh_bin}")

    cmd = [dsh_path, "--profile", cfg.profile, "--json"]
    if session_id:
        cmd.extend(["--session-id", session_id])
    cmd.append(goal)

    env = dict(os.environ)
    env["PYTHONPATH"] = "python"

    logger.info(f"Spawning DeepSeek Harness Agent with goal: {goal}")
    proc = subprocess.Popen(
        cmd,
        cwd=cfg.cwd,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    detected_session_id = session_id or ""
    final_text = ""
    raw_events: List[Dict[str, Any]] = []
    tool_calls: List[Dict[str, Any]] = []
    error_message: Optional[str] = None
    status = "COMPLETED"

    try:
        stdout, stderr = proc.communicate(timeout=cfg.timeout_seconds)
    except subprocess.TimeoutExpired:
        proc.kill()
        stdout, stderr = proc.communicate()
        status = "ERROR"
        error_message = f"Agent execution timed out after {cfg.timeout_seconds}s"

    exit_code = proc.returncode

    # Parse JSON events from stdout
    for line in stdout.splitlines():
        line = line.strip()
        if not line or not line.startswith("{"):
            continue
        try:
            evt = json.loads(line)
            raw_events.append(evt)

            evt_type = evt.get("type")
            if evt_type == "session":
                detected_session_id = evt.get("sessionId", detected_session_id)
            elif evt_type == "final":
                final_text = evt.get("text", "")
            elif evt_type in ("tool_call", "tool_result", "tool", "message"):
                tool_calls.append(evt)
                # Structured check for REVIEW_REQUIRED in tool results (NV-04, NS-01)
                res_obj = evt.get("result") or evt.get("data") or {}
                if isinstance(res_obj, dict) and res_obj.get("status") == "REVIEW_REQUIRED":
                    status = "REVIEW_REQUIRED"
                elif evt.get("status") == "REVIEW_REQUIRED":
                    status = "REVIEW_REQUIRED"
            elif evt_type == "status":
                reason = evt.get("reason", {})
                if isinstance(reason, dict) and reason.get("kind") == "error":
                    err_info = reason.get("error", {})
                    err_code = err_info.get("code")
                    err_msg = err_info.get("message", "")
                    error_message = f"{err_code}: {err_msg}"
                    if err_code in ("MISSING_CREDENTIAL", "AUTH"):
                        status = "AUTH_REQUIRED"
                    else:
                        status = "ERROR"
        except json.JSONDecodeError:
            continue

    # Strict Session ID requirement; never invent fallback session IDs (NV-01, NS-01)
    if not detected_session_id:
        if exit_code != 0:
            status = "ERROR"
            error_message = error_message or stderr.strip() or f"Process exited with non-zero code {exit_code}"
        else:
            status = "ERROR"
            error_message = "Missing session ID from Harness runtime events."
        detected_session_id = ""

    if exit_code != 0 and status not in ("ERROR", "AUTH_REQUIRED"):
        status = "ERROR"
        if not error_message:
            error_message = stderr.strip() or f"Process exited with non-zero code {exit_code}"

    return AgentRunResult(
        session_id=detected_session_id,
        status=status,
        final_text=final_text,
        tool_calls=tool_calls,
        raw_events=raw_events,
        error_message=error_message,
        exit_code=exit_code,
    )


def resume(
    session_id: str,
    prompt: Optional[str] = None,
    config: Optional[AgentConfig] = None,
) -> AgentRunResult:
    """
    Resume execution of an existing session in DeepSeek Harness (Tickets A002, A005, S1.3).
    Strictly reuses the same session_id across turns.
    """
    resume_prompt = prompt or (
        "Human operator review decisions have been submitted. "
        "Check review_status and continue the previous benchmark goal."
    )
    return run(goal=resume_prompt, session_id=session_id, config=config)
