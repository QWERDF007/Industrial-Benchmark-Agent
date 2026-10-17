import logging
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime

from iad_core.storage.models import Sample, QualityStatus
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

logger = logging.getLogger("iad_core.gold.resolver")


def resolve_gold_for_sample(
    sample: Sample,
    review_decisions: List[ReviewDecisionRecord],
    policy: GoldPolicyConfig,
) -> Tuple[GoldRecord, Optional[GoldConflictRecord]]:
    """
    Resolve ground truth (Gold) for a single sample according to GoldPolicyConfig.
    Enforces strict hierarchy:
    1. Trusted Human Review overrides lower-priority sources.
    2. Conflicting trusted reviews produce CONFLICT.
    3. Confirmed Existing Quality (PASS/FAIL) if trusted quality source.
    4. UNCERTAIN samples or untrusted sources without review are marked EXCLUDED.
    Never mutates the original sample.
    """
    task_id = sample.task_id
    sample_id = sample.sample_id
    policy_name = policy.policy_name

    # 1. Filter trusted human review decisions
    trusted_reviews = [
        r for r in review_decisions
        if r.reviewer in policy.trusted_reviewers and r.decision in policy.include_decisions
    ]

    # Check for conflicts among trusted reviewers
    if len(trusted_reviews) > 1:
        unique_decisions = {r.decision for r in trusted_reviews}
        if len(unique_decisions) > 1:
            conflict_info = {r.reviewer: r.decision for r in trusted_reviews}
            conflict_record = GoldConflictRecord(
                sample_id=sample_id,
                task_id=task_id,
                policy_name=policy_name,
                conflicting_sources={"human_reviews": conflict_info},
                reason=f"Multiple trusted reviewers disagree: {conflict_info}",
            )
            provenance = {
                "policy_name": policy_name,
                "source_type": GoldSource.HUMAN_REVIEW.value,
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
                gold_source=GoldSource.HUMAN_REVIEW.value,
                gold_source_ref="multiple_reviewers",
                gold_status=GoldStatus.CONFLICT.value,
                provenance=provenance,
                physical_sample_id=sample.physical_sample_id,
                capture_sequence_id=sample.capture_sequence_id,
                batch_id=sample.batch_id,
                data_origin=sample.data_origin.value if hasattr(sample.data_origin, "value") else str(sample.data_origin),
                image_path=sample.image_path,
                relative_path=sample.relative_path,
            )
            return rec, conflict_record

    # 2. Trusted review decision resolved
    if len(trusted_reviews) == 1:
        rev = trusted_reviews[0]
        decision = rev.decision
        is_hard_normal = (decision == "HARD_NORMAL")
        binary_label = (
            BinaryLabel.NORMAL.value
            if decision in ("PASS", "HARD_NORMAL")
            else BinaryLabel.ANOMALY.value
        )
        provenance = {
            "policy_name": policy_name,
            "source_type": GoldSource.HUMAN_REVIEW.value,
            "reviewer": rev.reviewer,
            "reason_code": rev.reason_code,
            "comment": rev.comment,
            "review_session_id": rev.review_session_id,
            "started_at": rev.started_at,
            "submitted_at": rev.submitted_at,
            "review_duration_ms": rev.review_duration_ms,
            "raw_quality_status": sample.quality_status.value if hasattr(sample.quality_status, "value") else str(sample.quality_status),
        }
        rec = GoldRecord(
            sample_id=sample_id,
            task_id=task_id,
            policy_name=policy_name,
            gold_quality=decision,
            binary_label=binary_label,
            hard_normal=is_hard_normal,
            gold_source=GoldSource.HUMAN_REVIEW.value,
            gold_source_ref=rev.reviewer,
            gold_status=GoldStatus.CONFIRMED.value,
            provenance=provenance,
            physical_sample_id=sample.physical_sample_id,
            capture_sequence_id=sample.capture_sequence_id,
            batch_id=sample.batch_id,
            data_origin=sample.data_origin.value if hasattr(sample.data_origin, "value") else str(sample.data_origin),
            image_path=sample.image_path,
            relative_path=sample.relative_path,
        )
        return rec, None

    # 3. Existing Quality Label fallback (if trusted)
    raw_status = sample.quality_status.value if hasattr(sample.quality_status, "value") else str(sample.quality_status)
    q_source = sample.quality_source or "imported"
    is_trusted_quality = (
        not policy.trusted_quality_sources
        or q_source in policy.trusted_quality_sources
    )

    if is_trusted_quality and raw_status in ("PASS", "FAIL"):
        binary_label = (
            BinaryLabel.NORMAL.value
            if raw_status == "PASS"
            else BinaryLabel.ANOMALY.value
        )
        provenance = {
            "policy_name": policy_name,
            "source_type": GoldSource.EXISTING_QUALITY.value,
            "quality_source": q_source,
            "raw_quality_status": raw_status,
        }
        rec = GoldRecord(
            sample_id=sample_id,
            task_id=task_id,
            policy_name=policy_name,
            gold_quality=raw_status,
            binary_label=binary_label,
            hard_normal=False,
            gold_source=GoldSource.EXISTING_QUALITY.value,
            gold_source_ref=q_source,
            gold_status=GoldStatus.CONFIRMED.value,
            provenance=provenance,
            physical_sample_id=sample.physical_sample_id,
            capture_sequence_id=sample.capture_sequence_id,
            batch_id=sample.batch_id,
            data_origin=sample.data_origin.value if hasattr(sample.data_origin, "value") else str(sample.data_origin),
            image_path=sample.image_path,
            relative_path=sample.relative_path,
        )
        return rec, None

    # 4. Otherwise UNCERTAIN or untrusted source -> EXCLUDED
    provenance = {
        "policy_name": policy_name,
        "source_type": GoldSource.UNCERTAIN.value,
        "raw_quality_status": raw_status,
        "excluded_reason": "Uncertain quality or untrusted source without trusted human review",
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
        data_origin=sample.data_origin.value if hasattr(sample.data_origin, "value") else str(sample.data_origin),
        image_path=sample.image_path,
        relative_path=sample.relative_path,
    )
    return rec, None
