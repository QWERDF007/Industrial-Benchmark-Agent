import os
import logging
from typing import Optional, List, Dict, Any

from iad_core.feature.builder import build_features, get_feature_stats
from iad_core.feature.search import search_by_sample
from iad_domain_server.contracts import ToolResult, ToolStatus, MutationType, ArtifactRef

logger = logging.getLogger("iad_domain_server.tools.feature")


def feature_prepare(
    task_id: str,
    model_id: str = "dinov2_vitb14_reg",
    preprocess_key: str = "dinov2_224_norm",
    batch_size: int = 64,
    device: str = "cuda:0",
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Extract, validate and cache DINOv2 visual features into SQLite & FAISS (R304).
    """
    res = build_features(
        task_id=task_id,
        model_id=model_id,
        preprocess_key=preprocess_key,
        batch_size=batch_size,
        device=device,
        db_path=db_path,
    )

    artifacts = []
    if res.report_json_path and os.path.exists(res.report_json_path):
        artifacts.append(
            ArtifactRef(
                artifact_id=f"feature_report_json_{task_id}",
                artifact_type="feature_report_json",
                uri=f"iad://task/{task_id}/features/report.json",
                path=os.path.abspath(res.report_json_path),
                summary="Feature extraction statistics and throughput in JSON",
            )
        )
    if res.report_md_path and os.path.exists(res.report_md_path):
        artifacts.append(
            ArtifactRef(
                artifact_id=f"feature_report_md_{task_id}",
                artifact_type="feature_report_markdown",
                uri=f"iad://task/{task_id}/features/report.md",
                path=os.path.abspath(res.report_md_path),
                summary="Feature extraction executive report in Markdown",
            )
        )

    status = ToolStatus.OK if res.coverage >= 0.99 else ToolStatus.PARTIAL
    warnings = []
    if res.failed_count > 0:
        warnings.append(f"{res.failed_count} samples failed during feature extraction.")

    return ToolResult(
        status=status,
        summary=f"Features prepared for '{task_id}': {res.cached_count} cached, {res.computed_count} computed, coverage: {res.coverage * 100:.1f}%.",
        metrics={
            "total_samples": res.total_samples,
            "cached_count": res.cached_count,
            "computed_count": res.computed_count,
            "failed_count": res.failed_count,
            "coverage": res.coverage,
            "dim": res.dim,
            "storage_bytes": res.storage_bytes,
            "elapsed_seconds": res.elapsed_seconds,
            "throughput_fps": res.throughput,
        },
        artifacts=artifacts,
        warnings=warnings,
        next_actions=[
            "Call duplicate_audit to detect near-duplicate pairs.",
            "Call candidate_mine to search for hard normal candidates.",
        ],
        mutation=MutationType.DERIVED_ARTIFACT,
    )


def visual_search(
    sample_id: str,
    task_id: str,
    top_k: int = 10,
    exclude_self: bool = True,
    filter_data_origin: Optional[str] = None,
    filter_quality_status: Optional[str] = None,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Search visually nearest neighbor samples using FAISS index (R304).
    """
    try:
        results = search_by_sample(
            sample_id=sample_id,
            task_id=task_id,
            top_k=top_k,
            exclude_self=exclude_self,
            filter_data_origin=filter_data_origin,
            filter_quality_status=filter_quality_status,
            db_path=db_path,
        )
    except Exception as e:
        return ToolResult(
            status=ToolStatus.ERROR,
            summary=f"Visual search failed: {str(e)}",
            warnings=[str(e)],
            next_actions=["Ensure features and FAISS index are built via feature_prepare."],
        )

    formatted_results = [
        {
            "rank": r.rank,
            "sample_id": r.sample_id,
            "similarity": round(r.score, 4),
            "quality_status": r.quality_status,
            "batch_id": r.batch_id,
            "image_path": r.image_path,
        }
        for r in results
    ]

    return ToolResult(
        status=ToolStatus.OK,
        summary=f"Visual search for '{sample_id}' returned {len(results)} nearest neighbors.",
        metrics={
            "query_sample_id": sample_id,
            "results_count": len(results),
            "top_similarity": results[0].score if results else 0.0,
            "results": formatted_results,
        },
        next_actions=[],
        mutation=MutationType.NONE,
    )
