import os
import logging
from typing import Optional, Dict, Any

from iad_core.consistency.errors import ConsistencyError
from iad_core.duplicate.verify import PairVerifier
from iad_core.contracts import ToolResult, ToolStatus, MutationType, ArtifactRef

logger = logging.getLogger("iad_core.tools.duplicate")


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
    try:
        from iad_core.duplicate.miner import mine_near_duplicates
        res = mine_near_duplicates(
            task_id=task_id,
            similarity_threshold=similarity_threshold,
            output_dir=output_dir,
            db_path=db_path,
            verifier=verifier,
            verify_duplicates=verify_duplicates,
        )
    except (FileNotFoundError,ConsistencyError) as fnf:
        return ToolResult(
            status=ToolStatus.NOT_READY,
            summary=f"Near-duplicate mining cannot run for task '{task_id}': {str(fnf)}",
            warnings=[str(fnf)],
            next_actions=["Use image_index_prepare to prepare the requested retrieval corpus, then retry duplicate_audit."],
            mutation=MutationType.NONE,
        )

    artifacts = []
    if res.candidate_groups_json_path and os.path.exists(res.candidate_groups_json_path):
        artifacts.append(
            ArtifactRef(
                artifact_id=f"candidate_groups_{task_id}",
                artifact_type="candidate_groups_json",
                uri=f"iad://task/{task_id}/duplicates/candidate_groups.json",
                path=os.path.abspath(res.candidate_groups_json_path),
                summary="Visual candidate graph components in JSON",
            )
        )
    if res.verified_groups_json_path and os.path.exists(res.verified_groups_json_path):
        artifacts.append(
            ArtifactRef(
                artifact_id=f"verified_groups_{task_id}",
                artifact_type="verified_groups_json",
                uri=f"iad://task/{task_id}/duplicates/verified_groups.json",
                path=os.path.abspath(res.verified_groups_json_path),
                summary="Exact original-pixel content groups in JSON",
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
    artifacts.append(ArtifactRef(artifact_id=f'near_candidates_{task_id}',artifact_type='near_candidate_pairs_json',
        uri=f'iad://task/{task_id}/duplicates/near_candidates.json',path=os.path.abspath(res.near_pairs_json_path),
        summary='Direct near-candidate relations; not strict equivalence groups'))

    warnings = []
    if res.verification_failed_count:
        warnings.append(f'{res.verification_failed_count} candidate pair sources could not be verified; restore sources or rescan before retrying.')
    if res.corpus_coverage.completed<res.corpus_coverage.total:
        warnings.append('Corpus vectors are incomplete; candidate coverage is partial.')
    if not verify_duplicates:warnings.append('Pair verification was not requested; candidate groups are not exact equivalence groups.')
    if res.verified_cross_origin_group_count > 0:
        warnings.append(
            f"Detected {res.verified_cross_origin_group_count} cross-origin verified duplicate groups! "
            "Leakage gate will strictly prevent these from splitting across Train and Test."
        )

    return ToolResult(
        status=ToolStatus.PARTIAL if res.verification_failed_count or res.corpus_coverage.completed<res.corpus_coverage.total else ToolStatus.OK,
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
            'verification_requested':res.verification_requested,'near_candidate_pair_count':res.near_candidate_pair_count,
            'verification_failed_count':res.verification_failed_count,'corpus_coverage':res.corpus_coverage.model_dump(mode='json'),
        },
        artifacts=artifacts,
        warnings=warnings,
        next_actions=[
            "Call candidate_mine to discover high-value normal candidates.",
            "Use verified components during benchmark_build to ensure atomic split isolation.",
        ],
        mutation=MutationType.DERIVED_ARTIFACT,
    )
