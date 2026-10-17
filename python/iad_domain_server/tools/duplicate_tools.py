import os
import logging
from typing import Optional, Dict, Any

from iad_core.duplicate.miner import mine_near_duplicates
from iad_core.duplicate.verify import PairVerifier
from iad_domain_server.contracts import ToolResult, ToolStatus, MutationType, ArtifactRef

logger = logging.getLogger("iad_domain_server.tools.duplicate")


def duplicate_audit(
    task_id: str,
    similarity_threshold: float = 0.98,
    verify_duplicates: bool = True,
    output_dir: Optional[str] = None,
    db_path: str = "data/benchmark.db",
) -> ToolResult:
    """
    Audit and cluster near-duplicate image pairs and connected components (R305).
    Uses FAISS candidate search followed by Pixel PairVerifier V2.
    """
    verifier = PairVerifier() if verify_duplicates else None
    res = mine_near_duplicates(
        task_id=task_id,
        similarity_threshold=similarity_threshold,
        output_dir=output_dir,
        db_path=db_path,
        verifier=verifier,
    )

    artifacts = []
    if res.candidate_groups_json_path and os.path.exists(res.candidate_groups_json_path):
        artifacts.append(
            ArtifactRef(
                artifact_id=f"candidate_groups_{task_id}",
                artifact_type="candidate_groups_json",
                uri=f"iad://task/{task_id}/duplicates/candidate_groups.json",
                path=os.path.abspath(res.candidate_groups_json_path),
                summary="DINO candidate duplicate groups in JSON",
            )
        )
    if res.verified_groups_json_path and os.path.exists(res.verified_groups_json_path):
        artifacts.append(
            ArtifactRef(
                artifact_id=f"verified_groups_{task_id}",
                artifact_type="verified_groups_json",
                uri=f"iad://task/{task_id}/duplicates/verified_groups.json",
                path=os.path.abspath(res.verified_groups_json_path),
                summary="Pixel-verified duplicate groups and connected components in JSON",
            )
        )
    if res.report_md_path and os.path.exists(res.report_md_path):
        artifacts.append(
            ArtifactRef(
                artifact_id=f"duplicate_report_md_{task_id}",
                artifact_type="duplicate_report_markdown",
                uri=f"iad://task/{task_id}/duplicates/report.md",
                path=os.path.abspath(res.report_md_path),
                summary="Duplicate audit executive report in Markdown",
            )
        )

    warnings = []
    if res.verified_cross_origin_group_count > 0:
        warnings.append(
            f"Detected {res.verified_cross_origin_group_count} cross-origin verified duplicate groups! "
            "Leakage gate will strictly prevent these from splitting across Train and Test."
        )

    return ToolResult(
        status=ToolStatus.OK,
        summary=(
            f"Duplicate audit for '{task_id}': {res.candidate_group_count} candidate groups, "
            f"{res.verified_group_count} pixel-verified groups ({res.verified_sample_count} samples)."
        ),
        metrics={
            "total_samples": res.total_samples,
            "candidate_group_count": res.candidate_group_count,
            "candidate_sample_count": res.candidate_sample_count,
            "verified_group_count": res.verified_group_count,
            "verified_sample_count": res.verified_sample_count,
            "verified_cross_origin_groups": res.verified_cross_origin_group_count,
            "elapsed_seconds": res.elapsed_seconds,
        },
        artifacts=artifacts,
        warnings=warnings,
        next_actions=[
            "Call candidate_mine to discover high-value normal candidates.",
            "Use verified components during benchmark_build to ensure atomic split isolation.",
        ],
        mutation=MutationType.DERIVED_ARTIFACT,
    )
