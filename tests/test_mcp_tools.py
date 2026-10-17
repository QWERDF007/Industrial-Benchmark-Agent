import json
import pytest

from iad_domain_server.mcp import handle_mcp_request, TOOL_DEFINITIONS, TOOL_HANDLER_MAP
from iad_domain_server.contracts import ToolResult, ToolStatus, MutationType


def test_mcp_initialize():
    """Verify standard MCP protocol initialization."""
    req = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {},
    }
    resp = handle_mcp_request(req)
    assert resp["jsonrpc"] == "2.0"
    assert resp["id"] == 1
    assert "result" in resp
    assert resp["result"]["serverInfo"]["name"] == "iad-domain-server"


def test_mcp_tools_list():
    """Verify all 15 industrial domain tools are registered with schemas."""
    req = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/list",
        "params": {},
    }
    resp = handle_mcp_request(req)
    tools = resp["result"]["tools"]
    tool_names = [t["name"] for t in tools]

    expected_tools = [
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
    ]

    assert len(tools) == 15
    for expected in expected_tools:
        assert expected in tool_names
        assert expected in TOOL_HANDLER_MAP


def test_mcp_strict_no_review_mutation_tools():
    """
    CRITICAL SPECIFICATION INVARIANT:
    Agent tools must NEVER author or mutate Human Review decisions!
    Review decisions can ONLY be created by human reviewers via Human Review UI RPC.
    """
    forbidden_terms = ["decision", "submit", "approve", "reject", "override"]
    tool_names = [t["name"] for t in TOOL_DEFINITIONS]

    for name in tool_names:
        if name.startswith("review_"):
            # Only review_status is allowed
            assert name == "review_status", f"Forbidden review tool exposed to agent: {name}"

        for term in forbidden_terms:
            if "review" in name.split("_"):
                assert term not in name.lower()


def test_mcp_unknown_tool_call():
    """Verify calling an unknown tool returns error result."""
    req = {
        "jsonrpc": "2.0",
        "id": 3,
        "method": "tools/call",
        "params": {
            "name": "non_existent_tool",
            "arguments": {},
        },
    }
    resp = handle_mcp_request(req)
    assert resp["jsonrpc"] == "2.0"
    assert "error" in resp
    assert resp["error"]["code"] == -32601
    assert "not registered" in resp["error"]["message"]


def test_mcp_task_inspect_call():
    """Verify calling task_inspect tool via MCP tools/call."""
    req = {
        "jsonrpc": "2.0",
        "id": 4,
        "method": "tools/call",
        "params": {
            "name": "task_inspect",
            "arguments": {
                "task_id": "non_existent_task_999",
            },
        },
    }
    resp = handle_mcp_request(req)
    assert resp["jsonrpc"] == "2.0"
    assert resp["id"] == 4
    structured = resp["result"]["structuredContent"]
    assert "status" in structured
    assert "mutation" in structured
    assert structured["mutation"] == MutationType.NONE.value


def test_mcp_evaluation_plan_call():
    """Verify evaluation_plan tool returns dry-run plan without side-effects."""
    req = {
        "jsonrpc": "2.0",
        "id": 5,
        "method": "tools/call",
        "params": {
            "name": "evaluation_plan",
            "arguments": {
                "task_id": "kuangjiao_inspection_01",
                "build_id": "non_existent_build",
                "model_ids": ["mock", "patchcore"],
            },
        },
    }
    resp = handle_mcp_request(req)
    assert resp["jsonrpc"] == "2.0"
    structured = resp["result"]["structuredContent"]
    assert structured["status"] in ("SUCCESS", "NOT_READY")
    assert structured["mutation"] == MutationType.NONE.value
