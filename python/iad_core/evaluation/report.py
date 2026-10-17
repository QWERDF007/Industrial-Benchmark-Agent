import os
import json
import logging
from typing import List, Dict, Any, Optional

from iad_core.evaluation.contracts import EvaluationRun

logger = logging.getLogger("iad_core.evaluation.report")


def generate_comparison_report(
    runs: List[EvaluationRun],
    output_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generate multi-model comparison table and diagnosis (R612).
    """
    if not runs:
        return {"summary": "No runs provided for comparison", "models": []}

    comparison_data = []
    lines = [
        "# Model Benchmark Comparison Report",
        "",
        f"- **Task ID**: `{runs[0].task_id}`",
        f"- **Build ID**: `{runs[0].build_id}`",
        f"- **Evaluated Models**: {', '.join([r.model_id for r in runs])}",
        "",
        "## 1. Overall Image Metrics Comparison",
        "",
        "| Model ID | I-AUROC | I-AP | Recall@1%FPR | F1 Score | Hard Normal FPR | Threshold | Latency (s) |",
        "|---|---|---|---|---|---|---|---|",
    ]

    for r in runs:
        im = r.image_metrics
        hn = r.hard_normal_metrics
        auroc_str = f"{im.i_auroc:.4f}" if im.i_auroc is not None else "N/A"
        ap_str = f"{im.i_ap:.4f}" if im.i_ap is not None else "N/A"
        r01_str = f"{im.recall_at_fpr_01:.4f}" if im.recall_at_fpr_01 is not None else "N/A"
        f1_str = f"{im.f1:.4f}"
        hn_fpr_str = f"{hn.hard_normal_fpr:.4f}"
        th_str = f"{r.threshold.threshold:.4f}"

        lines.append(
            f"| `{r.model_id}` | `{auroc_str}` | `{ap_str}` | `{r01_str}` | `{f1_str}` | `{hn_fpr_str}` | `{th_str}` | `{r.elapsed_seconds:.2f}` |"
        )

        comparison_data.append({
            "model_id": r.model_id,
            "run_id": r.run_id,
            "i_auroc": im.i_auroc,
            "i_ap": im.i_ap,
            "recall_at_fpr_01": im.recall_at_fpr_01,
            "f1": im.f1,
            "accuracy": im.accuracy,
            "hard_normal_fpr": hn.hard_normal_fpr,
            "threshold": r.threshold.threshold,
            "elapsed_seconds": r.elapsed_seconds,
        })

    # Hard normal ranking: lowest hard normal FPR is best
    best_hn = min(runs, key=lambda x: x.hard_normal_metrics.hard_normal_fpr)
    lines.extend([
        "",
        "## 2. Hard Normal Robustness Diagnosis",
        "",
        f"- **Most Robust Model on Hard Normals**: `{best_hn.model_id}` (Hard Normal FPR: `{best_hn.hard_normal_metrics.hard_normal_fpr:.4f}`)",
        f"- **Hard Normal Separation Margins**:",
    ])
    for r in runs:
        lines.append(f"  - `{r.model_id}`: `{r.hard_normal_metrics.separation_margin:.4f}`")

    # Domain Shift Diagnosis (R707)
    lines.extend([
        "",
        "## 3. Domain Shift Diagnosis",
        "",
    ])
    for r in runs:
        lines.append(f"### Model: `{r.model_id}` Domain Breakdown")
        lines.append("| Domain | Accuracy | F1 | I-AUROC | FP Count |")
        lines.append("|---|---|---|---|---|")
        worst_dom = None
        worst_f1 = 1.1
        for dom, dm in r.domain_metrics.metrics_by_domain.items():
            auroc_str = f"{dm['i_auroc']:.4f}" if dm['i_auroc'] is not None else "N/A"
            lines.append(f"| `{dom}` | {dm['accuracy']:.4f} | {dm['f1']:.4f} | {auroc_str} | {dm['false_positive']} |")
            if dm['f1'] < worst_f1:
                worst_f1 = dm['f1']
                worst_dom = dom
        if worst_dom:
            lines.append(f"\n> **Challenging Domain for {r.model_id}**: `{worst_dom}` (F1: `{worst_f1:.4f}`)\n")

    report_md = "\n".join(lines) + "\n"

    result = {
        "task_id": runs[0].task_id,
        "build_id": runs[0].build_id,
        "models": comparison_data,
        "best_hard_normal_model": best_hn.model_id,
        "report_markdown": report_md,
    }

    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(report_md)
        json_path = output_path.replace(".md", ".json")
        with open(json_path, "w", encoding="utf-8") as f:
            f.write(json.dumps(result, indent=2))

    return result
