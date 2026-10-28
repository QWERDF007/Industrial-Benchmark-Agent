import os
import json
from typing import List, Dict, Any, Optional, Tuple, Set
from pydantic import BaseModel, Field

from iad_core.storage.models import Sample, DataOrigin
from iad_core.duplicate.relations import StrictContentGroup
from iad_core.split.group import build_split_groups


class LeakageReport(BaseModel):
    is_passed: bool
    total_violations: int
    physical_leakages: List[Dict[str, Any]] = Field(default_factory=list)
    capture_leakages: List[Dict[str, Any]] = Field(default_factory=list)
    duplicate_leakages: List[Dict[str, Any]] = Field(default_factory=list)
    component_leakages: List[Dict[str, Any]] = Field(default_factory=list)
    augmented_leakages: List[Dict[str, Any]] = Field(default_factory=list)
    strict_content_leakages: List[Dict[str, Any]] = Field(default_factory=list)


def check_leakage(
    samples: List[Sample],
    assignments: Dict[str, str],
    verified_pairs: Optional[List[Tuple[str, str]]] = None,
    verified_components: Optional[List[List[str]]] = None,
    physical_sample_scope: str = "batch",
    strict_content_groups: Optional[List[StrictContentGroup]] = None,
) -> LeakageReport:
    """
    Blocking Leakage Gate (R212).
    Verifies that no information leaks across train / val / test splits:
    1. Physical sample leakage (same physical_sample_id across multiple splits within scope)
    2. Capture sequence leakage (same capture_sequence_id across multiple splits)
    3. Direct verified pair leakage (pair members across multiple splits)
    4. Verified component leakage (component members across multiple splits)
    5. Augmented sample leakage (AUGMENTED samples in test split)
    """
    physical_leakages = []
    capture_leakages = []
    duplicate_leakages = []
    component_leakages = []
    augmented_leakages = []
    strict_leakages = []
    for group in strict_content_groups or []:
        splits = {assignments[identity] for identity in group.sample_ids if identity in assignments}
        if len(splits) > 1:
            strict_leakages.append({'relation': 'STRICT_CONTENT', 'content_group_id': group.group_id,
                'sample_ids': [identity for identity in group.sample_ids if identity in assignments], 'splits': sorted(splits)})

    # 1. Physical Sample Leakage Check
    phys_to_splits: Dict[str, Dict[str, List[str]]] = {}
    for s in samples:
        if s.physical_sample_id and s.sample_id in assignments:
            split_name = assignments[s.sample_id]
            if physical_sample_scope == "batch" and s.batch_id:
                p_key = f"{s.batch_id}_{s.physical_sample_id}"
            else:
                p_key = s.physical_sample_id
            phys_to_splits.setdefault(p_key, {}).setdefault(split_name, []).append(s.sample_id)

    for p_id, split_dict in phys_to_splits.items():
        if len(split_dict) > 1:
            physical_leakages.append({
                "physical_sample_id": p_id,
                "splits": sorted(list(split_dict.keys())),
                "sample_counts": {sp: len(s_ids) for sp, s_ids in split_dict.items()},
            })

    # 2. Capture Sequence Leakage Check
    seq_to_splits: Dict[str, Dict[str, List[str]]] = {}
    for s in samples:
        if s.capture_sequence_id and s.sample_id in assignments:
            split_name = assignments[s.sample_id]
            seq_to_splits.setdefault(s.capture_sequence_id, {}).setdefault(split_name, []).append(s.sample_id)

    for s_id, split_dict in seq_to_splits.items():
        if len(split_dict) > 1:
            capture_leakages.append({
                "capture_sequence_id": s_id,
                "splits": sorted(list(split_dict.keys())),
                "sample_counts": {sp: len(s_ids) for sp, s_ids in split_dict.items()},
            })

    # 3. Direct Verified Pair Leakage Check
    if verified_pairs:
        for a, b in verified_pairs:
            if a in assignments and b in assignments:
                split_a = assignments[a]
                split_b = assignments[b]
                if split_a != split_b:
                    duplicate_leakages.append({
                        "sample_id_a": a,
                        "sample_id_b": b,
                        "split_a": split_a,
                        "split_b": split_b,
                        "relation": "NEAR_LEAKAGE",
                    })

    # Components include constraint members that are not exported themselves.
    components, _ = build_split_groups(samples, verified_pairs=verified_pairs,
        verified_groups=[*(verified_components or []), *[group.sample_ids for group in strict_content_groups or []]])
    for component in components:
        by_split: Dict[str, List[str]] = {}
        for identity in component.sample_ids:
            if identity in assignments:
                by_split.setdefault(assignments[identity], []).append(identity)
        if len(by_split) > 1:
            component_leakages.append({'relation': 'LEAKAGE_COMPONENT', 'group_id': component.group_id,
                'splits': sorted(by_split), 'sample_counts': {split: len(members) for split, members in by_split.items()}})

    # 5. Augmented Sample Policy Check (AUGMENTED must not enter test)
    for s in samples:
        if s.sample_id in assignments:
            is_aug = (s.data_origin == DataOrigin.AUGMENTED or str(s.data_origin) == "AUGMENTED")
            split_name = assignments[s.sample_id]
            if is_aug and split_name == "test":
                augmented_leakages.append({
                    "sample_id": s.sample_id,
                    "split": split_name,
                    "reason": "AUGMENTED origin samples are prohibited from test split",
                })

    total_violations = (
        len(physical_leakages)
        + len(capture_leakages)
        + len(duplicate_leakages)
        + len(component_leakages)
        + len(augmented_leakages)
        + len(strict_leakages)
    )

    is_passed = (total_violations == 0)

    return LeakageReport(
        is_passed=is_passed,
        total_violations=total_violations,
        physical_leakages=physical_leakages,
        capture_leakages=capture_leakages,
        duplicate_leakages=duplicate_leakages,
        component_leakages=component_leakages,
        augmented_leakages=augmented_leakages,
        strict_content_leakages=strict_leakages,
    )


def save_leakage_reports(report: LeakageReport, output_dir: str):
    """Save leakage_report.json and leakage_report.md."""
    os.makedirs(output_dir, exist_ok=True)
    json_path = os.path.join(output_dir, "leakage_report.json")
    md_path = os.path.join(output_dir, "leakage_report.md")

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report.model_dump(), f, indent=2, ensure_ascii=False)

    md_lines = [
        "# Leakage Gate Report",
        "",
        f"- **Status**: {'✅ PASSED' if report.is_passed else '❌ FAILED'}",
        f"- **Total Violations**: {report.total_violations}",
        "",
        "## Summary by Check",
        "",
        "| Gate Check | Violations | Status |",
        "|---|:---:|:---:|",
        f"| Physical Sample Leakage | {len(report.physical_leakages)} | {'PASS' if not report.physical_leakages else 'FAIL'} |",
        f"| Capture Sequence Leakage | {len(report.capture_leakages)} | {'PASS' if not report.capture_leakages else 'FAIL'} |",
        f"| Strict Content Leakage | {len(report.strict_content_leakages)} | {'PASS' if not report.strict_content_leakages else 'FAIL'} |",
        f"| Direct Verified Pair Leakage | {len(report.duplicate_leakages)} | {'PASS' if not report.duplicate_leakages else 'FAIL'} |",
        f"| Verified Component Leakage | {len(report.component_leakages)} | {'PASS' if not report.component_leakages else 'FAIL'} |",
        f"| Augmented Origin Policy | {len(report.augmented_leakages)} | {'PASS' if not report.augmented_leakages else 'FAIL'} |",
        "",
    ]

    if not report.is_passed:
        md_lines.append("## Violation Details")
        md_lines.append("")
        if report.physical_leakages:
            md_lines.append("### Physical Leakages")
            for item in report.physical_leakages:
                md_lines.append(f"- Physical ID `{item['physical_sample_id']}` across splits {item['splits']}: {item['sample_counts']}")
        if report.capture_leakages:
            md_lines.append("### Capture Leakages")
            for item in report.capture_leakages:
                md_lines.append(f"- Capture ID `{item['capture_sequence_id']}` across splits {item['splits']}: {item['sample_counts']}")
        if report.strict_content_leakages:
            md_lines.append("### Strict Content Leakages")
            for item in report.strict_content_leakages:
                md_lines.append(f"- Content group `{item['content_group_id']}` across splits {item['splits']}: {item['sample_ids']}")
        if report.duplicate_leakages:
            md_lines.append("### Duplicate Leakages")
            for item in report.duplicate_leakages:
                md_lines.append(f"- Direct pair `{item['sample_id_a']}` ({item['split_a']}) and `{item['sample_id_b']}` ({item['split_b']})")
        if report.component_leakages:
            md_lines.append("### Component Leakages")
            for item in report.component_leakages:
                md_lines.append(f"- Component across splits {item['splits']}: {item['sample_counts']}")
        if report.augmented_leakages:
            md_lines.append("### Augmented Leakages")
            for item in report.augmented_leakages:
                md_lines.append(f"- Sample `{item['sample_id']}` in split `{item['split']}`: {item['reason']}")

    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines) + "\n")
