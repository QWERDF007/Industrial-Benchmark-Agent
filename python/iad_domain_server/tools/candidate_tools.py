import os
import logging
from typing import Optional, Dict, Any

from iad_core.candidate.miner import mine_candidates
from iad_core.evidence.builder import EvidenceBuilder
from iad_domain_server.contracts import ToolResult, ToolStatus, MutationType, ArtifactRef

logger = logging.getLogger("iad_domain_server.tools.candidate")


def candidate_mine(
    task_id: str,
    top_k: int = 500,
    config_path: Optional[str] = None,
    output_dir: Optional[str] = None,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Mine hard normal candidates from uncertain pool using multi-signal analysis (R305).
    Reuses 100% of cached features without running extra GPU inference.
    """
    res = mine_candidates(
        task_id=task_id,
        top_k=top_k,
        config_path=config_path,
        output_dir=output_dir,
        db_path=db_path,
    )

    artifacts = []
    if res.candidates_json_path and os.path.exists(res.candidates_json_path):
        artifacts.append(
            ArtifactRef(
                artifact_id=f"candidates_json_{task_id}",
                artifact_type="candidates_json",
                uri=f"iad://task/{task_id}/candidates/candidates.json",
                path=os.path.abspath(res.candidates_json_path),
                summary="Mined hard normal candidates with signal scores in JSON",
            )
        )
    if res.report_md_path and os.path.exists(res.report_md_path):
        artifacts.append(
            ArtifactRef(
                artifact_id=f"candidates_md_{task_id}",
                artifact_type="candidates_markdown",
                uri=f"iad://task/{task_id}/candidates/report.md",
                path=os.path.abspath(res.report_md_path),
                summary="Candidate mining audit report in Markdown",
            )
        )

    # Note: Returning REVIEW_REQUIRED pauses agent so human review can take place (Specs Section 27, Ticket R407)
    selected_count = getattr(res, "selected_count", getattr(res, "selected_candidate_count", 0))
    pool_size = getattr(res, "pool_size", getattr(res, "total_pool_size", 0))
    ref_count = getattr(res, "reference_count", getattr(res, "reference_normal_count", 0))
    elapsed = getattr(res, "elapsed_seconds", 0.0)

    status = ToolStatus.REVIEW_REQUIRED if selected_count > 0 else ToolStatus.OK

    return ToolResult(
        status=status,
        summary=(
            f"Mined {selected_count} diverse candidates (from {pool_size} pool samples) "
            f"for task '{task_id}'. Human review is required before building benchmark gold."
        ),
        metrics={
            "total_pool_size": pool_size,
            "selected_candidates_count": selected_count,
            "reference_normal_count": ref_count,
            "mining_policy": res.policy_name,
            "elapsed_seconds": elapsed,
        },
        artifacts=artifacts,
        warnings=["Human review required on mined candidates to confirm hard normals."],
        next_actions=[
            "Open Harness Web Review Queue panel to review candidate samples.",
            "Once human reviews are submitted, call benchmark_build.",
        ],
        mutation=MutationType.DERIVED_ARTIFACT,
    )


def evidence_get(
    sample_id: str,
    task_id: str,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Fetch comprehensive Evidence Package for a candidate sample (R305).
    Includes normal references, nearest neighbors, duplicate components, and geometry annotations.
    """
    try:
        builder = EvidenceBuilder(task_id=task_id, db_path=db_path)
        pkg = builder.build(sample_id)
    except Exception as e:
        return ToolResult(
            status=ToolStatus.ERROR,
            summary=f"Failed to generate evidence for '{sample_id}': {str(e)}",
            warnings=[str(e)],
            next_actions=[],
        )

    if not pkg:
        return ToolResult(
            status=ToolStatus.NOT_READY,
            summary=f"No evidence found for sample '{sample_id}'.",
            next_actions=[],
        )

    return ToolResult(
        status=ToolStatus.OK,
        summary=f"Evidence package assembled for sample '{sample_id}'.",
        metrics={
            "sample_id": sample_id,
            "composite_score": pkg.composite_score,
            "normal_distance": pkg.signals.normal_distance if pkg.signals else None,
            "density_outlier_score": pkg.signals.density_outlier_score if pkg.signals else None,
            "domain_novelty_score": pkg.signals.domain_novelty_score if pkg.signals else None,
            "normal_references_count": len(pkg.normal_references),
            "historical_neighbors_count": len(pkg.similar_history),
            "has_duplicate_group": pkg.duplicate_group is not None,
            "annotations_count": len(pkg.annotations),
        },
        artifacts=[],
        next_actions=[],
        mutation=MutationType.NONE,
    )


def candidate_merge(
    task_id: str,
    output_dir: Optional[str] = None,
    include_dino: bool = True,
    include_llm: bool = True,
    include_audit: bool = True,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Merge candidate samples from DINO, multimodal LLM suggestions, and data audit issues (S09, Ticket RP-17).
    Strictly preserves provenance, deduplicates by sample_id, and produces unified candidate queues.
    """
    try:
        from iad_core.candidate.merger import merge_candidates
        res = merge_candidates(
            task_id=task_id,
            db_path=db_path,
            output_dir=output_dir,
            include_dino=include_dino,
            include_llm=include_llm,
            include_audit=include_audit,
        )
    except Exception as e:
        logger.error(f"Candidate merge failed: {e}", exc_info=True)
        return ToolResult(
            status=ToolStatus.ERROR,
            summary=f"Candidate merge failed: {str(e)}",
            warnings=[str(e)],
            mutation=MutationType.NONE,
        )

    artifacts = []
    if os.path.exists(res["json_path"]):
        artifacts.append(
            ArtifactRef(
                artifact_id=f"merged_candidates_json_{task_id}",
                artifact_type="merged_candidates_json",
                uri=f"iad://task/{task_id}/candidates/merged.json",
                path=os.path.abspath(res["json_path"]),
                summary="Multi-source merged candidate list in JSON format",
            )
        )
    if os.path.exists(res["md_path"]):
        artifacts.append(
            ArtifactRef(
                artifact_id=f"merged_candidates_md_{task_id}",
                artifact_type="merged_candidates_markdown",
                uri=f"iad://task/{task_id}/candidates/merged.md",
                path=os.path.abspath(res["md_path"]),
                summary="Multi-source candidate merge audit report in Markdown",
            )
        )

    status = ToolStatus.REVIEW_REQUIRED if res["total_unique_candidates"] > 0 else ToolStatus.OK
    return ToolResult(
        status=status,
        summary=(
            f"Merged {res['total_unique_candidates']} candidates for task '{task_id}' "
            f"(DINO-only: {res['breakdown']['dino_only']}, LLM-only: {res['breakdown']['llm_only']}, "
            f"Both: {res['breakdown']['both_dino_llm']}, Audit-only: {res['breakdown']['audit_only']})."
        ),
        metrics={
            "task_id": task_id,
            "total_unique_candidates": res["total_unique_candidates"],
            "breakdown": res["breakdown"],
            "top_candidates": res["candidates"][:20],
        },
        artifacts=artifacts,
        warnings=["Human review required on multi-source candidate queue."],
        next_actions=["Review merged candidate queue in Web Review panel."],
        mutation=MutationType.DERIVED_ARTIFACT,
    )

