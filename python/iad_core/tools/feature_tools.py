import os
import logging
from typing import Optional

from iad_core.feature.builder import build_features
from iad_core.contracts import ToolResult, ToolStatus, MutationType, ArtifactRef
from iad_core.consistency.errors import ConsistencyError

logger = logging.getLogger("iad_core.tools.feature")


def feature_prepare(
    task_id: str,
    batch_size: Optional[int] = None,
    device: Optional[str] = None,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Prepare content-level visual features with the configured image encoder.
    """
    from iad_core.workbench.runtime import workbench
    try:
        res = build_features(
            task_id=task_id,
            batch_size=batch_size,
            device=device,
            db_path=db_path,
            encoder_runtime=workbench(db_path).images,
        )
    except ConsistencyError as error:
        return ToolResult(status=ToolStatus.NOT_READY if error.code in ('PROFILE_NOT_CONFIGURED','INDEX_NOT_READY') else ToolStatus.ERROR,
            summary=str(error),metrics={'error_code':error.code},warnings=[str(error)],
            next_actions=['重扫数据集以发布当前内容索引。' if error.code in ('INDEX_NOT_READY','SOURCE_UNAVAILABLE') else '在模型设置的图像检索分区配置并检查实际图像编码器。'],mutation=MutationType.NONE)

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
        warnings.append(f"{res.failed_count} content groups failed during feature extraction.")

    return ToolResult(
        status=status,
        summary=f"Features prepared for '{task_id}': {res.cache_hit_count} cached, {res.encoded_content_count} computed, coverage: {res.coverage * 100:.1f}%.",
        metrics={
            "total_samples": res.total_samples,
            "total_content": res.total_content,
            "cache_hit_count": res.cache_hit_count,
            "encoded_content_count": res.encoded_content_count,
            "failed_count": res.failed_count,
            "unavailable_samples": res.unavailable_samples,
            "unindexed_count": res.unindexed_count,
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
    corpus_scope: Optional[dict] = None,
    profile_id: Optional[str] = None,
    top_k: int = 50,
    exclude_self: bool = True,
    filter_data_origin: Optional[str] = None,
    filter_quality_status: Optional[str] = None,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Search visually nearest neighbor samples using FAISS index (R304).
    """
    try:
        from iad_core.feature.search import search_by_sample
        matches = search_by_sample(
            sample_id=sample_id,
            corpus_scope=corpus_scope,
            profile_id=profile_id,
            top_k=top_k,
            exclude_self=exclude_self,
            filter_data_origin=filter_data_origin,
            filter_quality_status=filter_quality_status,
            db_path=db_path,
        )
    except ConsistencyError as error:
        return ToolResult(status=ToolStatus.NOT_READY if error.code in ('INDEX_NOT_READY','PROFILE_NOT_CONFIGURED') else ToolStatus.ERROR,
            summary=str(error),metrics={'error_code':error.code},warnings=[str(error)],
            next_actions=['检查检索范围、内容索引与图像编码配置。'],mutation=MutationType.NONE)
    except Exception as e:
        return ToolResult(
            status=ToolStatus.ERROR,
            summary=f"Visual search failed: {str(e)}",
            warnings=[str(e)],
            next_actions=["Prepare the requested corpus with image_index_prepare, then query it with image_retrieve."],
        )

    results=matches.items
    group_count=len({result.group_id for result in results})
    formatted_results = [
        {
            "rank": r.rank,
            "sample_id": r.sample_id,
            "content_group_id": r.group_id,
            "group_rank": r.group_rank,
            "relation": r.relation,
            "error_code": r.error_code,
            "similarity": round(r.score, 4),
            "quality_status": r.quality_status,
            "batch_id": r.batch_id,
            "image_path": r.image_path,
        }
        for r in results
    ]

    return ToolResult(
        status=ToolStatus.OK if matches.coverage.completed==matches.coverage.total and matches.verification.completed==matches.verification.total else ToolStatus.PARTIAL,
        summary=f"Visual search for '{sample_id}' returned {group_count} content groups ({len(results)} members).",
        metrics={
            "query_sample_id": sample_id,
            "results_count": len(results),
            "group_count": group_count,
            "profile_id": matches.profile_id,
            "scope_id": matches.scope_id,
            "corpus_coverage": matches.coverage.model_dump(),
            "verification_coverage": matches.verification.model_dump(),
            "annotation_coverage": matches.annotation.model_dump(),
            "retrieval_completeness": "TOP_K",
            "top_similarity": results[0].score if results else None,
            "results": formatted_results,
        },
        next_actions=[],
        mutation=MutationType.NONE,
    )
