import os
import json
import pytest

from iad_domain_server.mcp import handle_mcp_request, TOOL_DEFINITIONS, TOOL_HANDLER_MAP
from iad_domain_server.contracts import ToolStatus
from iad_agent.config import AgentConfig
from iad_agent.result import AgentRunResult
from iad_agent.runtime import run, resume


def test_mcp_initialize_and_tool_discovery():
    """NS-02 / NV-02 / NV-18: Real MCP initialize & tool discovery integration."""
    init_req = {
        "jsonrpc": "2.0",
        "id": "1",
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "test-client", "version": "1.0.0"},
        },
    }
    init_resp = handle_mcp_request(init_req)
    assert init_resp["jsonrpc"] == "2.0"
    assert init_resp["id"] == "1"
    assert "capabilities" in init_resp["result"]

    list_req = {
        "jsonrpc": "2.0",
        "id": "2",
        "method": "tools/list",
        "params": {},
    }
    list_resp = handle_mcp_request(list_req)
    tools = list_resp["result"]["tools"]
    assert len(tools) == 15, "Must discover exactly 15 MCP domain tools"
    tool_names = {t["name"] for t in tools}
    assert "task_inspect" in tool_names
    assert "benchmark_build" in tool_names
    assert "baseline_run" in tool_names
    assert "evaluation_compare" in tool_names
    assert "review_write" not in tool_names


def test_mcp_tool_execution_task_inspect():
    """NS-02 / NV-18: Real tool execution through MCP dispatcher on real database."""
    call_req = {
        "jsonrpc": "2.0",
        "id": "3",
        "method": "tools/call",
        "params": {
            "name": "task_inspect",
            "arguments": {"task_id": "kuangjiao_inspection_01"},
        },
    }
    resp = handle_mcp_request(call_req)
    assert resp["jsonrpc"] == "2.0"
    assert resp["id"] == "3"
    result = resp["result"]
    assert result["status"] == "OK"
    assert result["metrics"]["total_samples"] == 5074
    assert result["metrics"]["task_id"] == "kuangjiao_inspection_01"


def test_mcp_tool_execution_rejection():
    """NS-03 / NV-03 / NV-18: Non-existent or disallowed tool calls are rejected."""
    bad_req = {
        "jsonrpc": "2.0",
        "id": "4",
        "method": "tools/call",
        "params": {
            "name": "review_write",
            "arguments": {"decision": "PASS"},
        },
    }
    resp = handle_mcp_request(bad_req)
    assert "error" in resp
    assert resp["error"]["code"] == -32601
    assert "Tool not found" in resp["error"]["message"]
