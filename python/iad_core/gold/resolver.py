import logging
from typing import Optional, List, Dict, Any, Tuple

from iad_core.storage.models import Sample
from iad_core.storage.models import ReviewDecisionRecord
from iad_core.task.config import GoldPolicyConfig
from iad_core.gold.schemas import (
    GoldRecord,
    GoldConflictRecord,
    GoldQuality,
    BinaryLabel,
    GoldStatus,
    GoldSource,
)
from iad_core.gold.provider import (
    GoldSourceProvider,
    GoldEvidence,
    HumanReviewSource,
    ProductionQASource,
    ExistingQualitySource,
)

logger = logging.getLogger("iad_core.gold.resolver")

PROVIDERS: Dict[str, GoldSourceProvider] = {
    "HUMAN_REVIEW": HumanReviewSource(),
    "PRODUCTION_QA": ProductionQASource(),
    "EXISTING_QUALITY": ExistingQualitySource(),
}


def resolve_gold_for_sample(
    sample: Sample,
    review_decisions: List[ReviewDecisionRecord],
    policy: GoldPolicyConfig,
) -> Tuple[GoldRecord, Optional[GoldConflictRecord]]:
    """
    Resolve ground truth (Gold) for a single sample according to GoldPolicyConfig (D001~D006).
    Enforces strict source_priority ordering and conflict_policy.
    Never mutates the original sample.
    """
    task_id = sample.task_id
    sample_id = sample.sample_id
    policy_name = policy.policy_name

    # Validate conflict_policy (D006)
    if policy.conflict_policy != "MARK_CONFLICT":
        raise ValueError(
            f"Unsupported conflict_policy: '{policy.conflict_policy}'. Expected 'MARK_CONFLICT'."
        )

    # Resolve according to source_priority (D005)
    for source_name in policy.source_priority:
        provider = PROVIDERS.get(source_name)
        if provider is None:
            raise ValueError(f"Unknown source in source_priority: '{source_name}'")

        evidence = provider.get_evidence(sample, review_decisions, policy)
        if evidence is not None:
            if evidence.quality == "CONFLICT":
                conflict_info = evidence.provenance.get("conflicting_sources", {})
                conflict_record = GoldConflictRecord(
                    sample_id=sample_id,
                    task_id=task_id,
                    policy_name=policy_name,
                    conflicting_sources=conflict_info,
                    reason=evidence.provenance.get("reason", "Conflict in ground truth source"),
                )
                provenance = {
                    "policy_name": policy_name,
                    "source_type": evidence.source_type,
                    "conflict": True,
                    "conflicting_sources": conflict_info,
                }
                rec = GoldRecord(
                    sample_id=sample_id,
                    task_id=task_id,
                    policy_name=policy_name,
                    gold_quality=GoldQuality.CONFLICT.value,
                    binary_label=None,
                    hard_normal=False,
                    gold_source=evidence.source_type,
                    gold_source_ref=evidence.source_ref,
                    gold_status=GoldStatus.CONFLICT.value,
                    provenance=provenance,
                    physical_sample_id=sample.physical_sample_id,
                    capture_sequence_id=sample.capture_sequence_id,
                    batch_id=sample.batch_id,
                    data_origin=(
                        sample.data_origin.value
                        if hasattr(sample.data_origin, "value")
                        else str(sample.data_origin)
                    ),
                    image_path=sample.image_path,
                    relative_path=sample.relative_path,
                )
                return rec, conflict_record

            # Confirmed evidence
            is_hard_normal = (evidence.quality == "HARD_NORMAL")
            binary_label = (
                BinaryLabel.NORMAL.value
                if evidence.quality in ("PASS", "HARD_NORMAL")
                else BinaryLabel.ANOMALY.value
            )
            provenance = {
                "policy_name": policy_name,
                "source_type": evidence.source_type,
                "confidence": evidence.confidence,
                **evidence.provenance,
            }
            rec = GoldRecord(
                sample_id=sample_id,
                task_id=task_id,
                policy_name=policy_name,
                gold_quality=evidence.quality,
                binary_label=binary_label,
                hard_normal=is_hard_normal,
                gold_source=evidence.source_type,
                gold_source_ref=evidence.source_ref,
                gold_status=GoldStatus.CONFIRMED.value,
                provenance=provenance,
                physical_sample_id=sample.physical_sample_id,
                capture_sequence_id=sample.capture_sequence_id,
                batch_id=sample.batch_id,
                data_origin=(
                    sample.data_origin.value
                    if hasattr(sample.data_origin, "value")
                    else str(sample.data_origin)
                ),
                image_path=sample.image_path,
                relative_path=sample.relative_path,
            )
            return rec, None

    # No source provided evidence -> EXCLUDED
    raw_status = (
        sample.quality_status.value
        if hasattr(sample.quality_status, "value")
        else str(sample.quality_status)
    )
    provenance = {
        "policy_name": policy_name,
        "source_type": GoldSource.UNCERTAIN.value,
        "raw_quality_status": raw_status,
        "excluded_reason": "No evidence from prioritized sources satisfied policy",
    }
    rec = GoldRecord(
        sample_id=sample_id,
        task_id=task_id,
        policy_name=policy_name,
        gold_quality=GoldQuality.EXCLUDED.value,
        binary_label=None,
        hard_normal=False,
        gold_source=GoldSource.UNCERTAIN.value,
        gold_source_ref=None,
        gold_status=GoldStatus.EXCLUDED.value,
        provenance=provenance,
        physical_sample_id=sample.physical_sample_id,
        capture_sequence_id=sample.capture_sequence_id,
        batch_id=sample.batch_id,
        data_origin=(
            sample.data_origin.value
            if hasattr(sample.data_origin, "value")
            else str(sample.data_origin)
        ),
        image_path=sample.image_path,
        relative_path=sample.relative_path,
    )
    return rec, None
