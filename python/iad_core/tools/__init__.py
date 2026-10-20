import inspect
from typing import Dict, Any, Callable, Optional

from iad_core.tools.task_tools import task_inspect
from iad_core.tools.dataset_tools import dataset_audit
from iad_core.tools.audit_tools import (
    audit_issue_query,
    audit_recheck,
    audit_suggestion_save,
)
from iad_core.tools.image_tools import (
    sample_view,
    region_view,
    samples_compare,
)
from iad_core.tools.feature_tools import feature_prepare, visual_search
from iad_core.tools.duplicate_tools import duplicate_audit
from iad_core.tools.candidate_tools import (
    candidate_mine,
    candidate_merge,
    evidence_get,
)
from iad_core.tools.review_tools import review_status
from iad_core.tools.benchmark_tools import (
    benchmark_preview,
    benchmark_build,
    benchmark_status,
    leakage_check,
)
from iad_core.tools.evaluation_tools import (
    evaluation_plan,
    baseline_run,
    evaluation_compare,
)

INTERNAL_TOOL_MAP: Dict[str, Callable] = {
    # Audit & Images
    "dataset_audit": dataset_audit,
    "audit_issue_query": audit_issue_query,
    "audit_recheck": audit_recheck,
    "audit_suggestion_save": audit_suggestion_save,
    "sample_view": sample_view,
    "region_view": region_view,
    "samples_compare": samples_compare,
    # Vision & Feature
    "task_inspect": task_inspect,
    "feature_prepare": feature_prepare,
    "visual_search": visual_search,
    "duplicate_audit": duplicate_audit,
    "candidate_mine": candidate_mine,
    "candidate_merge": candidate_merge,
    "evidence_get": evidence_get,
    # Benchmark
    "review_status": review_status,
    "benchmark_preview": benchmark_preview,
    "benchmark_build": benchmark_build,
    "benchmark_status": benchmark_status,
    "leakage_check": leakage_check,
    # Evaluation
    "evaluation_plan": evaluation_plan,
    "baseline_run": baseline_run,
    "evaluation_compare": evaluation_compare,
}


class ToolContractError(Exception):
    def __init__(self, message: str, status_code: int = 422):
        super().__init__(message)
        self.status_code = status_code


DEFAULT_DB_PATH = "data/benchmark.db"


def execute_internal_tool(tool_name: str, arguments: Dict[str, Any] = None, db_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Executes a domain tool strictly by validating arguments against the tool signature (V2-S01, DS-S04).
    Returns dict adhering to ToolResult contract.
    """
    if arguments is None:
        arguments = {}

    handler = INTERNAL_TOOL_MAP.get(tool_name)
    if not handler:
        raise ToolContractError(f"Tool '{tool_name}' is not registered or not permitted.", status_code=404)

    sig = inspect.signature(handler)
    call_args = dict(arguments)

    allowed_params = set(sig.parameters.keys())
    if "db_path" in allowed_params and "db_path" not in call_args:
        call_args["db_path"] = db_path or DEFAULT_DB_PATH

    # 1. Reject unknown arguments
    unknown_args = set(call_args.keys()) - allowed_params
    if unknown_args:
        raise ToolContractError(
            f"Unknown argument(s) for tool '{tool_name}': {sorted(list(unknown_args))}. "
            f"Allowed arguments: {sorted(list(allowed_params))}",
            status_code=422,
        )

    # 2. Check missing required arguments
    missing_required = []
    for param_name, param in sig.parameters.items():
        if param.default is inspect.Parameter.empty and param_name not in call_args:
            missing_required.append(param_name)
    if missing_required:
        raise ToolContractError(
            f"Missing required argument(s) for tool '{tool_name}': {sorted(missing_required)}",
            status_code=422,
        )

    # 3. Argument type validation
    for param_name, val in call_args.items():
        param = sig.parameters.get(param_name)
        if param and param.annotation != inspect.Parameter.empty and val is not None:
            expected_type = param.annotation
            origin = getattr(expected_type, "__origin__", None)
            if origin is None:
                if isinstance(expected_type, type) and not isinstance(val, expected_type):
                    try:
                        call_args[param_name] = expected_type(val)
                    except (ValueError, TypeError):
                        raise ToolContractError(
                            f"Invalid type for argument '{param_name}' in tool '{tool_name}'. "
                            f"Expected {expected_type.__name__}, got {type(val).__name__}.",
                            status_code=422,
                        )

    # 4. Invoke tool handler
    res = handler(**call_args)
    if hasattr(res, "model_dump"):
        return res.model_dump()
    elif isinstance(res, dict):
        return res
    return {"result": res}


__all__ = [
    "INTERNAL_TOOL_MAP",
    "execute_internal_tool",
    "ToolContractError",
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
]
