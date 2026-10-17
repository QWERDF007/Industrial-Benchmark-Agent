from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from iad_core.storage.models import Sample
from iad_core.gold.schemas import GoldRecord, BinaryLabel
from iad_core.split.builder import SplitResult
from iad_core.split.leakage import LeakageReport
from iad_core.task.config import ReadinessPolicyConfig


class TrackStatus(str, Enum):
    READY = "READY"
    PARTIAL = "PARTIAL"
    NOT_READY = "NOT_READY"
    NOT_EVALUATED = "NOT_EVALUATED"


class TrackReadinessItem(BaseModel):
    track_name: str
    status: TrackStatus
    reason: str
    metrics: Dict[str, Any] = Field(default_factory=dict)


class BenchmarkReadiness(BaseModel):
    standard_ad: TrackReadinessItem
    open_hard_normal: TrackReadinessItem
    domain_shift: TrackReadinessItem
    small_weak: TrackReadinessItem
    global_logical: TrackReadinessItem


def evaluate_track_readiness(
    gold_records: List[GoldRecord],
    split_result: SplitResult,
    leakage_report: LeakageReport,
    readiness_policy: Optional[ReadinessPolicyConfig] = None,
    metadata_semantics: Optional[Dict[str, str]] = None,
) -> BenchmarkReadiness:
    """
    Evaluate Benchmark Track Readiness across 5 industrial tracks (R212).
    Consumes metadata semantics (Spec #22).
    """
    confirmed = [r for r in gold_records if r.gold_status == "CONFIRMED"]
    gold_map = {r.sample_id: r for r in confirmed}

    train_gold = [gold_map[sid] for sid in split_result.train_ids if sid in gold_map]
    val_gold = [gold_map[sid] for sid in split_result.val_ids if sid in gold_map]
    test_gold = [gold_map[sid] for sid in split_result.test_ids if sid in gold_map]

    total_normal = sum(1 for r in confirmed if r.binary_label == BinaryLabel.NORMAL.value)
    total_fail = sum(1 for r in confirmed if r.binary_label == BinaryLabel.ANOMALY.value)
    total_hard_normal = sum(1 for r in confirmed if r.hard_normal)

    test_normal = sum(1 for r in test_gold if r.binary_label == BinaryLabel.NORMAL.value)
    test_fail = sum(1 for r in test_gold if r.binary_label == BinaryLabel.ANOMALY.value)
    test_hard_normal = sum(1 for r in test_gold if r.hard_normal)

    # 1. Standard AD
    std_policy = readiness_policy.standard_ad if readiness_policy else None
    min_pass = std_policy.min_pass if std_policy and std_policy.min_pass else 50
    min_fail = std_policy.min_fail if std_policy and std_policy.min_fail else 50

    if not leakage_report.is_passed:
        std_status = TrackStatus.NOT_READY
        std_reason = f"Leakage gate failed with {leakage_report.total_violations} violations"
    elif total_normal == 0 or total_fail == 0 or test_normal == 0 or test_fail == 0:
        std_status = TrackStatus.NOT_READY
        std_reason = "Missing required normal or anomaly samples in benchmark splits"
    elif total_normal < min_pass or total_fail < min_fail:
        std_status = TrackStatus.PARTIAL
        std_reason = (
            f"Gold samples confirmed ({total_normal} normal, {total_fail} fail), "
            f"below target policy threshold (min_pass={min_pass}, min_fail={min_fail})"
        )
    else:
        std_status = TrackStatus.READY
        std_reason = f"Policy thresholds satisfied ({total_normal} normal, {total_fail} fail) and leakage gate passed"

    standard_ad = TrackReadinessItem(
        track_name="Standard AD",
        status=std_status,
        reason=std_reason,
        metrics={
            "total_normal": total_normal,
            "total_fail": total_fail,
            "test_normal": test_normal,
            "test_fail": test_fail,
            "min_pass_required": min_pass,
            "min_fail_required": min_fail,
            "leakage_passed": leakage_report.is_passed,
        },
    )

    # 2. Open / Hard Normal
    if test_hard_normal > 0:
        hn_status = TrackStatus.READY
        hn_reason = f"Test split contains {test_hard_normal} verified HARD_NORMAL samples"
    elif total_hard_normal > 0:
        hn_status = TrackStatus.PARTIAL
        hn_reason = f"Gold contains {total_hard_normal} HARD_NORMAL samples, but none in test split"
    else:
        hn_status = TrackStatus.NOT_READY
        hn_reason = "No confirmed HARD_NORMAL samples available"

    open_hard_normal = TrackReadinessItem(
        track_name="Open / Hard Normal",
        status=hn_status,
        reason=hn_reason,
        metrics={
            "total_hard_normal": total_hard_normal,
            "test_hard_normal": test_hard_normal,
        },
    )

    # 3. Domain Shift: Evaluated only when metadata semantics are confirmed
    domains = set()
    for r in confirmed:
        d_id = r.provenance.get("domain_id") if isinstance(r.provenance, dict) else None
        val = d_id or r.batch_id
        if val:
            domains.add(val)

    semantics = metadata_semantics or {}
    batch_semantic = semantics.get("batch_id", "unknown")
    if batch_semantic != "unknown" and len(domains) > 1:
        domain_status = TrackStatus.READY
        domain_reason = f"Confirmed semantic '{batch_semantic}' with {len(domains)} distinct domains present"
    elif len(domains) > 1 and batch_semantic == "unknown":
        domain_status = TrackStatus.PARTIAL
        domain_reason = f"Multiple distinct domains ({len(domains)}) present but metadata semantics unconfirmed"
    else:
        domain_status = TrackStatus.NOT_EVALUATED
        domain_reason = "Insufficient domain diversity or unvalidated domain semantics"

    domain_shift = TrackReadinessItem(
        track_name="Domain Shift",
        status=domain_status,
        reason=domain_reason,
        metrics={"domain_count": len(domains), "domains": sorted(list(domains))},
    )

    # 4. Small / Weak Localization
    test_localization_annos = sum(len(r.annotations) for r in test_gold if r.annotations)
    if test_localization_annos > 0:
        loc_status = TrackStatus.READY
        loc_reason = f"Test set contains {test_localization_annos} usable localization annotations"
    else:
        loc_status = TrackStatus.NOT_READY
        loc_reason = "No valid bbox or mask annotations in test anomaly set"

    small_weak = TrackReadinessItem(
        track_name="Small / Weak",
        status=loc_status,
        reason=loc_reason,
        metrics={"test_localization_annotations": test_localization_annos},
    )

    # 5. Global / Logical
    global_logical = TrackReadinessItem(
        track_name="Global / Logical",
        status=TrackStatus.NOT_READY,
        reason="Logical anomaly constraints not defined for this inspection task",
        metrics={},
    )

    return BenchmarkReadiness(
        standard_ad=standard_ad,
        open_hard_normal=open_hard_normal,
        domain_shift=domain_shift,
        small_weak=small_weak,
        global_logical=global_logical,
    )
