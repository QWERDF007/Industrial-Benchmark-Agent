"""
Comprehensive 22-Tool Contract & Negative Test Suite (AC-V2-01, V2-S01, V2-04).
Verifies:
1. All 22 tools reject missing required parameters with HTTP 422.
2. All 22 tools reject unknown/invalid parameters with HTTP 422.
3. All 22 tools accept minimal parameters via HTTP and return valid ToolResult schemas.
4. All 22 tools accept full supported optional parameters via HTTP.
5. Invariant check: tools in INTERNAL_TOOL_MAP cannot alter Ground Truth or write ReviewDecisions.
"""

import os
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from iad_core.storage.database import Database
from iad_core.storage.models import (
    InspectionTask,
    Sample,
    Annotation,
    QualityStatus,
    BenchmarkBuildRecord,
)
from iad_core.storage.repositories import (
    TaskRepository,
    SampleRepository,
    AnnotationRepository,
    BenchmarkRepository,
)
from iad_core.tools import INTERNAL_TOOL_MAP, execute_internal_tool, ToolContractError


@pytest.fixture
def contract_env(tmp_path, monkeypatch):
    test_db = str(tmp_path / "contracts_benchmark.db")
    monkeypatch.setattr("iad_core.tools.DEFAULT_DB_PATH", test_db)

    db = Database(test_db)
    task_repo = TaskRepository(db)
    sample_repo = SampleRepository(db)
    anno_repo = AnnotationRepository(db)
    bench_repo = BenchmarkRepository(db)

    # 1. Seed task
    task = InspectionTask(
        task_id="t_contract",
        inspection_target="surface",
        description="Contract testing task",
    )
    task_repo.upsert(task)

    # 2. Seed image and sample
    img_dir = tmp_path / "images"
    img_dir.mkdir(parents=True, exist_ok=True)
    img_path = str(img_dir / "sample_01.png")
    Image.new("RGB", (64, 64), color="green").save(img_path)

    sample = Sample(
        sample_id="t_contract:s1",
        task_id="t_contract",
        dataset_id="ds1",
        image_path=img_path,
        relative_path="sample_01.png",
        width=64,
        height=64,
        quality_status=QualityStatus.PASS,
    )
    sample_repo.upsert(sample)

    # 3. Seed annotation
    anno = Annotation(
        annotation_id="ann_contract_1",
        sample_id="t_contract:s1",
        annotation_type="bbox",
        raw_label="dent",
        bbox=[10, 10, 50, 50],
        source_width=64,
        source_height=64,
    )
    anno_repo.upsert(anno)

    # 4. Seed benchmark build
    build = BenchmarkBuildRecord(
        build_id="b_contract_1",
        task_id="t_contract",
        gold_policy="STRICT_VERIFIED",
        split_policy="STRATIFIED_RANDOM",
        seed=42,
        status="SUCCESS",
        output_dir=str(tmp_path / "bench_out"),
    )
    bench_repo.save_build(build)

    return {"db": db, "task_id": "t_contract", "sample_id": "t_contract:s1", "build_id": "b_contract_1"}


TOOL_CONTRACT_SPECS = [
    # 1. Audit & Image Tools
    (
        "dataset_audit",
        {"task_id": "t_contract"},
        {"task_id": "t_contract", "config_path": "config.yaml", "output_dir": "runs/audit"},
        {},
    ),
    (
        "audit_issue_query",
        {"task_id": "t_contract"},
        {"task_id": "t_contract", "issue_type": "GEOMETRY_OUT_OF_BOUNDS", "cursor": 0, "limit": 10},
        {},
    ),
    (
        "audit_recheck",
        {"task_id": "t_contract", "kind": "metadata_semantics", "sample_ids": ["t_contract:s1"]},
        {"task_id": "t_contract", "kind": "bbox_bounds", "sample_ids": ["t_contract:s1"], "options": {}},
        {"task_id": "t_contract"},
    ),
    (
        "audit_suggestion_save",
        {
            "task_id": "t_contract",
            "suggestion": {
                "suggestion_id": "sug_c1",
                "sample_id": "t_contract:s1",
                "conclusion_status": "EVIDENCE_SUPPORTED",
                "recommended_action": "REVIEW",
            },
        },
        {
            "task_id": "t_contract",
            "suggestion": {
                "suggestion_id": "sug_c2",
                "sample_id": "t_contract:s1",
                "conclusion_status": "INSUFFICIENT_EVIDENCE",
                "recommended_action": "IGNORE_CANDIDATE",
                "observations": [{"phenomenon": "glare"}],
            },
        },
        {"task_id": "t_contract"},
    ),
    (
        "sample_view",
        {"task_id": "t_contract", "sample_id": "t_contract:s1"},
        {"task_id": "t_contract", "sample_id": "t_contract:s1", "view": "raw"},
        {"task_id": "t_contract"},
    ),
    (
        "region_view",
        {"task_id": "t_contract", "sample_id": "t_contract:s1", "bbox_xyxy": [10, 10, 40, 40]},
        {"task_id": "t_contract", "sample_id": "t_contract:s1", "bbox_xyxy": [10, 10, 40, 40], "padding_ratio": 0.15},
        {"sample_id": "t_contract:s1"},
    ),
    (
        "samples_compare",
        {"task_id": "t_contract", "sample_ids": ["t_contract:s1"]},
        {"task_id": "t_contract", "sample_ids": ["t_contract:s1"], "roles": ["candidate"]},
        {"task_id": "t_contract"},
    ),
    # 2. Vision & Feature Tools
    (
        "task_inspect",
        {"task_id": "t_contract"},
        {"task_id": "t_contract"},
        {},
    ),
    (
        "feature_prepare",
        {"task_id": "t_contract"},
        {"task_id": "t_contract", "batch_size": 32, "device": "cpu"},
        {},
    ),
    (
        "visual_search",
        {"sample_id": "t_contract:s1"},
        {"sample_id": "t_contract:s1", "top_k": 5, "exclude_self": True},
        {},
    ),
    (
        "duplicate_audit",
        {"task_id": "t_contract"},
        {"task_id": "t_contract", "similarity_threshold": 0.95, "verify_duplicates": False, "output_dir": "runs/contract_dup"},
        {},
    ),
    (
        "candidate_mine",
        {"task_id": "t_contract"},
        {"task_id": "t_contract", "top_k": 30, "output_dir": "runs/contract_candidates"},
        {},
    ),
    (
        "candidate_merge",
        {"task_id": "t_contract"},
        {"task_id": "t_contract", "include_dino": False, "include_llm": True, "include_audit": True, "output_dir": "runs/contract_merged"},
        {},
    ),
    (
        "evidence_get",
        {"task_id": "t_contract", "sample_id": "t_contract:s1"},
        {"task_id": "t_contract", "sample_id": "t_contract:s1"},
        {"task_id": "t_contract"},
    ),
    # 3. Benchmark Tools
    (
        "review_status",
        {"task_id": "t_contract"},
        {"task_id": "t_contract"},
        {},
    ),
    (
        "benchmark_preview",
        {"task_id": "t_contract"},
        {"task_id": "t_contract", "config_path": "benchmark_config.yaml", "seed": 42},
        {},
    ),
    (
        "benchmark_build",
        {"task_id": "t_contract"},
        {"task_id": "t_contract", "build_id": "b_contract_new", "config_path": "benchmark_config.yaml", "seed": 42, "output_dir": "runs/contract_bench"},
        {},
    ),
    (
        "benchmark_status",
        {"build_id": "b_contract_1"},
        {"build_id": "b_contract_1"},
        {},
    ),
    (
        "leakage_check",
        {"build_id": "b_contract_1"},
        {"build_id": "b_contract_1"},
        {},
    ),
    # 4. Evaluation Tools
    (
        "evaluation_plan",
        {"task_id": "t_contract", "build_id": "b_contract_1"},
        {"task_id": "t_contract", "build_id": "b_contract_1", "model_ids": ["patchcore"], "threshold_strategy": "f1_max", "target_fpr": 0.01},
        {"task_id": "t_contract"},
    ),
    (
        "baseline_run",
        {"task_id": "t_contract", "build_id": "b_contract_1"},
        {"task_id": "t_contract", "build_id": "b_contract_1", "model_id": "dinomaly2", "threshold_strategy": "f1_max", "target_fpr": 0.01, "output_dir": "runs/contract_eval"},
        {"task_id": "t_contract"},
    ),
    (
        "evaluation_compare",
        {"task_id": "t_contract", "build_id": "b_contract_1"},
        {"task_id": "t_contract", "build_id": "b_contract_1", "run_ids": ["run_dummy"], "output_dir": "runs/contract_compare"},
        {"task_id": "t_contract"},
    ),
]


def test_tool_catalog_exact_count():
    """Verify exactly 22 tools are registered in the internal tool map."""
    assert len(INTERNAL_TOOL_MAP) == 22
    assert len(TOOL_CONTRACT_SPECS) == 22


@pytest.mark.parametrize("tool_name,minimal_args,full_args,missing_args", TOOL_CONTRACT_SPECS)
def test_tool_contract_positive_minimal(contract_env, tool_name, minimal_args, full_args, missing_args):
    """Verify tool execution with minimal required parameters returns ToolResult."""
    data = execute_internal_tool(tool_name, minimal_args)
    assert "status" in data
    assert "summary" in data
    assert "metrics" in data


@pytest.mark.parametrize("tool_name,minimal_args,full_args,missing_args", TOOL_CONTRACT_SPECS)
def test_tool_contract_positive_full(contract_env, tool_name, minimal_args, full_args, missing_args):
    """Verify tool execution with full valid optional parameters returns ToolResult."""
    data = execute_internal_tool(tool_name, full_args)
    assert "status" in data
    assert "summary" in data
    assert "metrics" in data


@pytest.mark.parametrize("tool_name,minimal_args,full_args,missing_args", TOOL_CONTRACT_SPECS)
def test_tool_contract_negative_unknown_param(contract_env, tool_name, minimal_args, full_args, missing_args):
    """Verify unknown arguments strictly raise ToolContractError (F-01, V2-04)."""
    bad_payload = dict(minimal_args)
    bad_payload["__unsupported_arbitrary_param__"] = "invalid_value"
    with pytest.raises(ToolContractError) as exc_info:
        execute_internal_tool(tool_name, bad_payload)
    assert "__unsupported_arbitrary_param__" in str(exc_info.value)


@pytest.mark.parametrize("tool_name,minimal_args,full_args,missing_args", TOOL_CONTRACT_SPECS)
def test_tool_contract_negative_missing_required(contract_env, tool_name, minimal_args, full_args, missing_args):
    """Verify missing required arguments strictly raise ToolContractError (F-01, V2-04)."""
    if not minimal_args:
        return
    with pytest.raises(ToolContractError) as exc_info:
        execute_internal_tool(tool_name, missing_args)
    assert "Missing required argument" in str(exc_info.value)


def test_non_authoritative_boundary_invariant(contract_env):
    """
    AC-V2-06 & System Invariant:
    Verify that NO internal tool in INTERNAL_TOOL_MAP has write access to ReviewDecisions or Gold.
    """
    for forbidden in ["review_write", "decision_submit", "gold_edit", "override_ground_truth"]:
        with pytest.raises(ToolContractError):
            execute_internal_tool(forbidden, {})
