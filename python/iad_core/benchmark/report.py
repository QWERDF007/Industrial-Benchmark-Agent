import os
from typing import List, Dict, Any
from iad_core.gold.schemas import GoldRecord, GoldConflictRecord, BinaryLabel, GoldStatus
from iad_core.split.builder import SplitResult
from iad_core.split.leakage import LeakageReport
from iad_core.benchmark.readiness import BenchmarkReadiness


def generate_benchmark_report(
    build_id: str,
    task_id: str,
    gold_records: List[GoldRecord],
    conflict_records: List[GoldConflictRecord],
    split_result: SplitResult,
    leakage_report: LeakageReport,
    readiness: BenchmarkReadiness,
    output_path: str,
) -> str:
    """
    Generate comprehensive markdown benchmark report.
    """
    confirmed = [r for r in gold_records if r.gold_status == GoldStatus.CONFIRMED.value]
    excluded = [r for r in gold_records if r.gold_status == GoldStatus.EXCLUDED.value]
    gold_map = {r.sample_id: r for r in confirmed}

    total_samples = len(gold_records)
    total_confirmed = len(confirmed)
    total_normal = sum(1 for r in confirmed if r.binary_label == BinaryLabel.NORMAL.value and not r.hard_normal)
    total_hard_normal = sum(1 for r in confirmed if r.hard_normal)
    total_fail = sum(1 for r in confirmed if r.binary_label == BinaryLabel.ANOMALY.value)
    total_conflicts = len(conflict_records)
    total_excluded = len(excluded)

    origin_counts: Dict[str, int] = {}
    for r in confirmed:
        origin_counts[r.data_origin] = origin_counts.get(r.data_origin, 0) + 1

    def split_stats(s_ids: List[str]):
        records = [gold_map[sid] for sid in s_ids if sid in gold_map]
        norm = sum(1 for r in records if r.binary_label == BinaryLabel.NORMAL.value and not r.hard_normal)
        hn = sum(1 for r in records if r.hard_normal)
        fail = sum(1 for r in records if r.binary_label == BinaryLabel.ANOMALY.value)
        annos = sum(len(r.annotations) for r in records)
        return len(records), norm, hn, fail, annos

    train_tot, train_norm, train_hn, train_fail, train_annos = split_stats(split_result.train_ids)
    val_tot, val_norm, val_hn, val_fail, val_annos = split_stats(split_result.val_ids)
    test_tot, test_norm, test_hn, test_fail, test_annos = split_stats(split_result.test_ids)

    md_lines = [
        f"# Benchmark Build Report: `{build_id}`",
        "",
        f"- **Task ID**: `{task_id}`",
        f"- **Build ID**: `{build_id}`",
        f"- **Leakage Gate**: {'✅ PASSED' if leakage_report.is_passed else '❌ FAILED'}",
        f"- **Standard AD Readiness**: `{readiness.standard_ad.status.value}`",
        "",
        "## 1. Gold Ground Truth Summary",
        "",
        "| Metric | Count | Ratio (%) |",
        "|---|:---:|:---:|",
        f"| Total Raw Samples | {total_samples} | 100.0% |",
        f"| Confirmed Gold Samples | {total_confirmed} | {total_confirmed / max(total_samples, 1) * 100:.1f}% |",
        f"| ├── PASS (Normal) | {total_normal} | {total_normal / max(total_confirmed, 1) * 100:.1f}% |",
        f"| ├── HARD_NORMAL | {total_hard_normal} | {total_hard_normal / max(total_confirmed, 1) * 100:.1f}% |",
        f"| └── FAIL (Anomaly) | {total_fail} | {total_fail / max(total_confirmed, 1) * 100:.1f}% |",
        f"| Conflict Samples | {total_conflicts} | {total_conflicts / max(total_samples, 1) * 100:.1f}% |",
        f"| Excluded Samples (Uncertain) | {total_excluded} | {total_excluded / max(total_samples, 1) * 100:.1f}% |",
        "",
        "### Data Origin Distribution (Confirmed Gold)",
        "",
        "| Data Origin | Count |",
        "|---|:---:|",
    ]

    for origin, cnt in sorted(origin_counts.items(), key=lambda x: -x[1]):
        md_lines.append(f"| `{origin}` | {cnt} |")

    md_lines.extend([
        "",
        "## 2. Benchmark Split Distribution",
        "",
        "| Split | Samples | Normal | Hard Normal | Anomaly | Annotations |",
        "|---|:---:|:---:|:---:|:---:|:---:|",
        f"| **Train** | {train_tot} | {train_norm} | {train_hn} | {train_fail} | {train_annos} |",
        f"| **Val** | {val_tot} | {val_norm} | {val_hn} | {val_fail} | {val_annos} |",
        f"| **Test** | {test_tot} | {test_norm} | {test_hn} | {test_fail} | {test_annos} |",
        f"| **Total** | {total_confirmed} | {total_normal} | {total_hard_normal} | {total_fail} | {train_annos + val_annos + test_annos} |",
        "",
        "## 3. Leakage Gate Verification",
        "",
        f"- **Status**: {'✅ PASSED (0 cross-split leakage)' if leakage_report.is_passed else '❌ FAILED'}",
        f"- **Physical Sample Leakage**: {len(leakage_report.physical_leakages)} violations",
        f"- **Capture Sequence Leakage**: {len(leakage_report.capture_leakages)} violations",
        f"- **Direct Verified Pair Leakage**: {len(leakage_report.duplicate_leakages)} violations",
        f"- **Verified Component Leakage**: {len(leakage_report.component_leakages)} violations",
        f"- **Augmented Origin Policy**: {len(leakage_report.augmented_leakages)} violations",
        "",
        "## 4. Benchmark Track Readiness",
        "",
        "| Track | Status | Basis / Reason |",
        "|---|:---:|---|",
        f"| **Standard AD** | `{readiness.standard_ad.status.value}` | {readiness.standard_ad.reason} |",
        f"| **Open / Hard Normal** | `{readiness.open_hard_normal.status.value}` | {readiness.open_hard_normal.reason} |",
        f"| **Domain Shift** | `{readiness.domain_shift.status.value}` | {readiness.domain_shift.reason} |",
        f"| **Small / Weak** | `{readiness.small_weak.status.value}` | {readiness.small_weak.reason} |",
        f"| **Global / Logical** | `{readiness.global_logical.status.value}` | {readiness.global_logical.reason} |",
    ])

    content = "\n".join(md_lines) + "\n"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)

    return content
