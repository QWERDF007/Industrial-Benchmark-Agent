import pytest
from fastapi import HTTPException

from iad_domain_server.api import INTERNAL_TOOL_MAP, execute_internal_tool
from iad_domain_server.contracts import MutationType, ToolStatus


def test_internal_tools_list():
    """Verify all 22 industrial domain tools are registered (S02, S03, RP-04, RP-05)."""
    expected_tools = {
        "task_inspect",
        "dataset_audit",
        "audit_issue_query",
        "audit_recheck",
        "audit_suggestion_save",
        "sample_view",
        "region_view",
        "samples_compare",
        "feature_prepare",
        "visual_search",
        "duplicate_audit",
        "candidate_mine",
        "candidate_merge",
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
    assert len(INTERNAL_TOOL_MAP) == 22
    assert set(INTERNAL_TOOL_MAP.keys()) == expected_tools


def test_strict_no_review_mutation_tools():
    """
    CRITICAL SPECIFICATION INVARIANT (S00, S10):
    Agent tools must NEVER author or mutate Human Review decisions!
    Review decisions can ONLY be created by human reviewers via Human Review UI RPC.
    """
    forbidden_terms = ["write", "submit", "approve", "reject", "override", "decision"]
    for name in INTERNAL_TOOL_MAP.keys():
        if name.startswith("review_"):
            assert name == "review_status", f"Forbidden review tool exposed to agent: {name}"

        for term in forbidden_terms:
            if "review" in name.split("_"):
                assert term not in name.lower()


def test_unknown_internal_tool_call():
    """Verify calling an unknown tool raises 404."""
    with pytest.raises(HTTPException) as exc_info:
        execute_internal_tool("non_existent_tool", {})
    assert exc_info.value.status_code == 404
    assert "not registered" in exc_info.value.detail


def test_task_inspect_call():
    """Verify calling task_inspect via internal tool dispatcher."""
    result = execute_internal_tool("task_inspect", {"task_id": "non_existent_task_999"})
    assert result["status"] in (ToolStatus.NOT_READY.value, ToolStatus.ERROR.value)
    assert result["mutation"] == MutationType.NONE.value


def test_evaluation_plan_call():
    """Verify evaluation_plan tool returns dry-run plan without side-effects."""
    result = execute_internal_tool("evaluation_plan", {
        "task_id": "kuangjiao_inspection_01",
        "build_id": "kuangjiao_inspection_01_20261017_003",
        "model_ids": ["mock", "patchcore"],
    })
    assert result["status"] in (ToolStatus.OK.value, ToolStatus.NOT_READY.value)
    assert result["mutation"] == MutationType.NONE.value


def test_missing_required_parameter_raises_422():
    """Verify missing required parameter raises HTTP 422 (F-01, V2-04)."""
    with pytest.raises(HTTPException) as exc_info:
        execute_internal_tool("evaluation_plan", {
            "task_id": "kuangjiao_inspection_01",
        })
    assert exc_info.value.status_code == 422
    assert "Missing required argument" in exc_info.value.detail
    assert "build_id" in exc_info.value.detail


def test_unknown_parameter_raises_422():
    """Verify unknown parameter raises HTTP 422 (F-01, V2-04)."""
    with pytest.raises(HTTPException) as exc_info:
        execute_internal_tool("task_inspect", {
            "task_id": "kuangjiao_inspection_01",
            "unknown_extra_arg": 123,
        })
    assert exc_info.value.status_code == 422
    assert "Unknown argument" in exc_info.value.detail
