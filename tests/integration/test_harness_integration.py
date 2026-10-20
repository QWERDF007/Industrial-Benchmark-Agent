import os
import pytest

from iad_core.tools import INTERNAL_TOOL_MAP
from iad_core.entry import dispatch_request


def test_internal_tool_discovery():
    """Verify exactly 22 domain tools are mapped and no review_write exists (S02, S03, RP-04)."""
    assert len(INTERNAL_TOOL_MAP) == 22
    assert "task_inspect" in INTERNAL_TOOL_MAP
    assert "benchmark_build" in INTERNAL_TOOL_MAP
    assert "baseline_run" in INTERNAL_TOOL_MAP
    assert "evaluation_compare" in INTERNAL_TOOL_MAP
    assert "candidate_merge" in INTERNAL_TOOL_MAP
    assert "sample_view" in INTERNAL_TOOL_MAP
    assert "audit_issue_query" in INTERNAL_TOOL_MAP
    assert "review_write" not in INTERNAL_TOOL_MAP
    assert "review_submit" not in INTERNAL_TOOL_MAP


def test_internal_tool_execution_task_inspect(monkeypatch):
    """Real tool execution through CLI dispatch on real database."""
    emitted = []
    monkeypatch.setattr("iad_core.entry.emit", lambda p: emitted.append(p))

    dispatch_request({
        "request_id": "req_harness_1",
        "operation": "tool_call",
        "arguments": {
            "tool_name": "task_inspect",
            "arguments": {"task_id": "kuangjiao_inspection_01"},
        },
    })

    assert len(emitted) == 1
    result = emitted[0]
    assert result["event"] == "result"
    assert result["status"] == "OK"
    assert result["metrics"]["total_samples"] == 5074
    assert result["metrics"]["task_id"] == "kuangjiao_inspection_01"


def test_internal_tool_execution_rejection(monkeypatch):
    """Disallowed or non-existent tools are rejected with CONTRACT_ERROR or NOT_FOUND."""
    emitted = []
    monkeypatch.setattr("iad_core.entry.emit", lambda p: emitted.append(p))

    dispatch_request({
        "request_id": "req_harness_bad",
        "operation": "tool_call",
        "arguments": {
            "tool_name": "review_write",
            "arguments": {"decision": "PASS"},
        },
    })

    assert len(emitted) == 1
    result = emitted[0]
    assert result["event"] == "error"
    assert result["error"]["code"] == "CONTRACT_ERROR"
    assert "not registered" in result["error"]["message"]
