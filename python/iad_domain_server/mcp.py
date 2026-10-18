import sys
import json
import logging
from typing import Dict, Any, List, Optional, Callable

from iad_domain_server.contracts import ToolResult, ToolStatus, MutationType
import iad_domain_server.tools as domain_tools

logger = logging.getLogger("iad_domain_server.mcp")

TOOL_DEFINITIONS = [
    {
        "name": "task_inspect",
        "description": "Inspect task status: sample count, raw quality breakdown, annotations, features, reviews, builds, and evaluations.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Inspection task ID (e.g. 'kuangjiao_inspection_01')"},
            },
            "required": ["task_id"],
        },
    },
    {
        "name": "dataset_audit",
        "description": "Audit dataset integrity, geometry validity, issues, and 5-track benchmark readiness.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Inspection task ID"},
                "config_path": {"type": "string", "description": "Optional path to task config yaml"},
            },
            "required": ["task_id"],
        },
    },
    {
        "name": "feature_prepare",
        "description": "Extract, validate and cache DINOv2 visual features into SQLite & FAISS.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Inspection task ID"},
                "model_id": {"type": "string", "default": "dinov2_vitb14_reg"},
                "preprocess_key": {"type": "string", "default": "dinov2_224_norm"},
                "batch_size": {"type": "integer", "default": 64},
            },
            "required": ["task_id"],
        },
    },
    {
        "name": "visual_search",
        "description": "Search visually nearest neighbor samples using FAISS index and progressive over-fetch.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "sample_id": {"type": "string", "description": "Query sample ID"},
                "task_id": {"type": "string", "description": "Inspection task ID"},
                "top_k": {"type": "integer", "default": 10},
                "exclude_self": {"type": "boolean", "default": True},
            },
            "required": ["sample_id", "task_id"],
        },
    },
    {
        "name": "duplicate_audit",
        "description": "Audit and cluster near-duplicate image pairs and connected components using Pixel PairVerifier V2.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Inspection task ID"},
                "similarity_threshold": {"type": "number", "default": 0.98},
                "verify_duplicates": {"type": "boolean", "default": True},
            },
            "required": ["task_id"],
        },
    },
    {
        "name": "candidate_mine",
        "description": "Mine hard normal candidates from uncertain pool using multi-signal distance, density, and domain novelty.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Inspection task ID"},
                "top_k": {"type": "integer", "default": 500},
                "config_path": {"type": "string", "description": "Optional path to task config yaml"},
            },
            "required": ["task_id"],
        },
    },
    {
        "name": "evidence_get",
        "description": "Fetch comprehensive Evidence Package for a candidate sample (normal refs, history neighbors, duplicate group, annotations).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "sample_id": {"type": "string", "description": "Candidate sample ID"},
                "task_id": {"type": "string", "description": "Inspection task ID"},
            },
            "required": ["sample_id", "task_id"],
        },
    },
    {
        "name": "review_status",
        "description": "Read-only inspection of Human Review status and progress. (Agent has NO review write access).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Inspection task ID"},
            },
            "required": ["task_id"],
        },
    },
    {
        "name": "benchmark_preview",
        "description": "Preview Gold adjudication and atomic group split without persisting to SQLite.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Inspection task ID"},
                "config_path": {"type": "string", "description": "Optional path to task config yaml"},
                "seed": {"type": "integer", "default": 42},
            },
            "required": ["task_id"],
        },
    },
    {
        "name": "benchmark_build",
        "description": "Formally build benchmark assets, enforce leakage gate, and persist to SQLite.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Inspection task ID"},
                "build_id": {"type": "string", "description": "Optional explicit build ID"},
                "config_path": {"type": "string", "description": "Optional path to task config yaml"},
                "seed": {"type": "integer", "description": "Random seed for split"},
            },
            "required": ["task_id"],
        },
    },
    {
        "name": "benchmark_status",
        "description": "Inspect an existing benchmark build: train/val/test split counts and track readiness.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "build_id": {"type": "string", "description": "Benchmark build ID"},
            },
            "required": ["build_id"],
        },
    },
    {
        "name": "leakage_check",
        "description": "Check the 5-point blocking Leakage Gate report for a benchmark build.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "build_id": {"type": "string", "description": "Benchmark build ID"},
            },
            "required": ["build_id"],
        },
    },
    {
        "name": "evaluation_plan",
        "description": "Plan baseline model evaluations on a specific benchmark build.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Inspection task ID"},
                "build_id": {"type": "string", "description": "Benchmark build ID"},
                "model_ids": {"type": "array", "items": {"type": "string"}, "description": "Baseline models to evaluate"},
            },
            "required": ["task_id", "build_id"],
        },
    },
    {
        "name": "baseline_run",
        "description": "Execute baseline model evaluation on a benchmark build. Val threshold fit strictly enforced.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Inspection task ID"},
                "build_id": {"type": "string", "description": "Benchmark build ID"},
                "model_id": {"type": "string", "default": "dinomaly2"},
                "threshold_strategy": {"type": "string", "default": "f1_max"},
                "target_fpr": {"type": "number", "default": 0.01},
            },
            "required": ["task_id", "build_id"],
        },
    },
    {
        "name": "evaluation_compare",
        "description": "Compare multiple baseline evaluation runs on a benchmark build (Overall metrics, Hard Normal, Domain Shift).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Inspection task ID"},
                "build_id": {"type": "string", "description": "Benchmark build ID"},
                "run_ids": {"type": "array", "items": {"type": "string"}, "description": "Optional list of run IDs to compare"},
            },
            "required": ["task_id", "build_id"],
        },
    },
]

TOOL_HANDLER_MAP: Dict[str, Callable] = {
    "task_inspect": domain_tools.task_inspect,
    "dataset_audit": domain_tools.dataset_audit,
    "feature_prepare": domain_tools.feature_prepare,
    "visual_search": domain_tools.visual_search,
    "duplicate_audit": domain_tools.duplicate_audit,
    "candidate_mine": domain_tools.candidate_mine,
    "evidence_get": domain_tools.evidence_get,
    "review_status": domain_tools.review_status,
    "benchmark_preview": domain_tools.benchmark_preview,
    "benchmark_build": domain_tools.benchmark_build,
    "benchmark_status": domain_tools.benchmark_status,
    "leakage_check": domain_tools.leakage_check,
    "evaluation_plan": domain_tools.evaluation_plan,
    "baseline_run": domain_tools.baseline_run,
    "evaluation_compare": domain_tools.evaluation_compare,
}


def handle_mcp_request(request: Dict[str, Any]) -> Dict[str, Any]:
    """
    Standard MCP JSON-RPC 2.0 Request Dispatcher.
    """
    req_id = request.get("id")
    method = request.get("method")
    params = request.get("params", {})

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {"listChanged": False},
                    "resources": {"subscribe": False, "listChanged": False},
                },
                "serverInfo": {
                    "name": "iad-domain-server",
                    "version": "1.0.0",
                },
            },
        }

    elif method == "notifications/initialized":
        return {"jsonrpc": "2.0", "id": req_id, "result": None}

    elif method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {"tools": TOOL_DEFINITIONS},
        }

    elif method == "tools/call":
        tool_name = params.get("name")
        arguments = params.get("arguments", {})

        handler = TOOL_HANDLER_MAP.get(tool_name)
        if not handler:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {
                    "code": -32601,
                    "message": f"Method not found: Tool not found: '{tool_name}' is not registered.",
                },
            }

        try:
            res: ToolResult = handler(**arguments)
            res_dict = res.model_dump()
            result_payload = {
                "content": [
                    {
                        "type": "text",
                        "text": res.model_dump_json(indent=2),
                    }
                ],
                "structuredContent": res_dict,
                "isError": res.status == ToolStatus.ERROR,
            }
            result_payload.update(res_dict)
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": result_payload,
            }
        except Exception as e:
            logger.error(f"Error executing tool '{tool_name}': {e}", exc_info=True)
            err_res = ToolResult(
                status=ToolStatus.ERROR,
                summary=f"Tool '{tool_name}' failed with unexpected exception: {str(e)}",
                warnings=[str(e)],
            )
            err_dict = err_res.model_dump()
            err_payload = {
                "content": [
                    {
                        "type": "text",
                        "text": err_res.model_dump_json(indent=2),
                    }
                ],
                "structuredContent": err_dict,
                "isError": True,
            }
            err_payload.update(err_dict)
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": err_payload,
            }

    elif method == "resources/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "resources": [
                    {
                        "uri": "iad://reports/latest",
                        "name": "Latest Benchmark & Evaluation Reports",
                        "mimeType": "application/json",
                    }
                ]
            },
        }

    else:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {
                "code": -32601,
                "message": f"Unsupported MCP method: '{method}'",
            },
        }


def run_stdio_server():
    """Stdio transport entrypoint for MCP clients."""
    logging.basicConfig(level=logging.INFO, stream=sys.stderr)
    logger.info("Starting Industrial Domain MCP Server over stdio...")
    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            req = json.loads(line)
            resp = handle_mcp_request(req)
            if resp:
                sys.stdout.write(json.dumps(resp) + "\n")
                sys.stdout.flush()
        except Exception as e:
            logger.error(f"Stdio MCP parse error: {e}")


if __name__ == "__main__":
    run_stdio_server()
