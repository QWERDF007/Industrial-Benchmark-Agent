import inspect
from importlib import import_module
from typing import Dict, Any, Optional

INTERNAL_TOOL_MAP: dict[str, str] = {
    "task_inspect": "task_tools",
    "dataset_audit": "dataset_tools",
    "audit_issue_query": "audit_tools",
    "audit_recheck": "audit_tools",
    "audit_suggestion_save": "audit_tools",
    "sample_view": "image_tools",
    "region_view": "image_tools",
    "samples_compare": "image_tools",
    "feature_prepare": "feature_tools",
    "visual_search": "feature_tools",
    "duplicate_audit": "duplicate_tools",
    "candidate_mine": "candidate_tools",
    "candidate_merge": "candidate_tools",
    "evidence_get": "candidate_tools",
    "review_status": "review_tools",
    "benchmark_preview": "benchmark_tools",
    "benchmark_build": "benchmark_tools",
    "benchmark_status": "benchmark_tools",
    "leakage_check": "benchmark_tools",
    "evaluation_plan": "evaluation_tools",
    "baseline_run": "evaluation_tools",
    "evaluation_compare": "evaluation_tools",
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

    module_name = INTERNAL_TOOL_MAP.get(tool_name)
    if not module_name:
        raise ToolContractError(f"Tool '{tool_name}' is not registered or not permitted.", status_code=404)

    handler = getattr(import_module("iad_core.tools." + module_name), tool_name)
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


__all__ = ["INTERNAL_TOOL_MAP", "execute_internal_tool", "ToolContractError"]
