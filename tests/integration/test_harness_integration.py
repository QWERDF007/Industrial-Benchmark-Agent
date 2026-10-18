import os
import pytest
from fastapi.testclient import TestClient

from iad_domain_server.api import app, INTERNAL_TOOL_MAP


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


def test_internal_tool_execution_task_inspect():
    """Real tool execution through POST /internal/tool/task_inspect on real database."""
    client = TestClient(app)
    resp = client.post(
        "/internal/tool/task_inspect",
        json={"task_id": "kuangjiao_inspection_01"},
    )
    assert resp.status_code == 200
    result = resp.json()
    assert result["status"] == "OK"
    assert result["metrics"]["total_samples"] == 5074
    assert result["metrics"]["task_id"] == "kuangjiao_inspection_01"


def test_internal_tool_execution_rejection():
    """Disallowed or non-existent tools are rejected with 404."""
    client = TestClient(app)
    resp = client.post(
        "/internal/tool/review_write",
        json={"decision": "PASS"},
    )
    assert resp.status_code == 404
    assert "not registered" in resp.json()["detail"]
