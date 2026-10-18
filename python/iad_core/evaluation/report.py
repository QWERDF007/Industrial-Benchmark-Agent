import os
import json
import logging
from typing import List, Dict, Any, Optional, Tuple

from iad_core.evaluation.contracts import EvaluationRun

logger = logging.getLogger("iad_core.evaluation.report")


def generate_comparison_report(
    runs: List[EvaluationRun],
    output_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generate multi-model comparison table and diagnosis (R612, NV-14, NV-15, NS-10, NS-11).
    - Deduplicates runs: exactly ONE row per (model_id, protocol), keeping the latest valid run.
    - Records build_id, task_id, and selected_eval_run_ids mapping.
    - Reports ground truth test counts, FPR resolution (1/n_normal), and track readiness.
    - Formats Recall@1%FPR as NOT_EVALUATED or EMPIRICAL_ONLY when resolution > 0.01.
    - Reports Hard Normal FPR as fraction (e.g. 0/1) marked PROVISIONAL.
    - Sets domain I-AUROC to N/A when normal or anomaly count is 0.
    """
    if not runs:
        return {"summary": "No runs provided for comparison", "models": []}

    # 1. Deduplicate runs: keep latest valid run for each (model_id, protocol)
    grouped: Dict[Tuple[str, str], EvaluationRun] = {}
    for r in runs:
        if getattr(r, "status", "COMPLETED") in ("FAILED", "PROTOCOL_INVALID"):
            continue
        key = (r.model_id, r.protocol or "UNKNOWN")
        grouped[key] = r

    deduped_runs = sorted(list(grouped.values()), key=lambda x: x.model_id)
    if not deduped_runs:
        return {"summary": "No valid runs found for comparison", "models": []}

    first_run = deduped_runs[0]
    n_normal = first_run.test_class_counts.get("NORMAL", 0)
    n_hn = first_run.test_class_counts.get("HARD_NORMAL", first_run.hard_normal_metrics.hard_normal_count)
    n_anomaly = first_run.test_class_counts.get("ANOMALY", 0)
    n_reg_normal = max(0, n_normal - n_hn)
    n_total = n_normal + n_anomaly

    fpr_resolution = (1.0 / n_normal) if n_normal > 0 else 1.0
    res_pct = fpr_resolution * 100.0

    if n_normal < 50:
        track_readiness = f"PARTIAL (Provisional - statistical power limited by test normal count n={n_normal})"
    else:
        track_readiness = "READY"

    selected_eval_run_ids = {r.model_id: r.run_id for r in deduped_runs}

    comparison_data = []
    lines = [
        "# Model Benchmark Comparison Report",
        "",
        f"- **Task ID**: `{first_run.task_id}`",
        f"- **Build ID**: `{first_run.build_id}`",
        f"- **Track Readiness**: `{track_readiness}`",
        f"- **Test Ground Truth**: `{n_total}` samples ({n_reg_normal} Regular Normal + {n_hn} Hard Normal = {n_normal} Normal, {n_anomaly} Anomaly)",
        f"- **Target FPR Resolution**: `{res_pct:.1f}%` (`1 / {n_normal}`)",
        "- **Selected Eval Runs**:",
    ]
    for r in deduped_runs:
        lines.append(f"  - `{r.model_id}` (`{r.protocol or 'N/A'}`): `{r.run_id}`")

    lines.extend([
        "",
        "## 1. Overall Image Metrics Comparison",
        "",
        "| Model ID | Protocol | I-AUROC | I-AP | Recall@1%FPR | F1 Score | Hard Normal FPR | Threshold | Latency (s) |",
        "|---|---|---|---|---|---|---|---|---|",
    ])

    for r in deduped_runs:
        im = r.image_metrics
        hn = r.hard_normal_metrics
        auroc_str = f"{im.i_auroc:.4f}" if im.i_auroc is not None else "N/A"
        ap_str = f"{im.i_ap:.4f}" if im.i_ap is not None else "N/A"

        # Recall@1%FPR statistical validity check
        if fpr_resolution > 0.01:
            r01_status = "NOT_EVALUATED"
            r01_str = f"NOT_EVALUATED (res={res_pct:.0f}%)"
        else:
            r01_status = "EVALUATED"
            r01_str = f"{im.recall_at_fpr_01:.4f}" if im.recall_at_fpr_01 is not None else "N/A"

        f1_str = f"{im.f1:.4f}"
        hn_fp = int(round(hn.hard_normal_fpr * hn.hard_normal_count))
        hn_fpr_str = f"{hn_fp}/{hn.hard_normal_count} ({hn.hard_normal_fpr:.4f}) [PROVISIONAL]"
        th_str = f"{r.threshold.threshold:.4f}"

        lines.append(
            f"| `{r.model_id}` | `{r.protocol or 'N/A'}` | `{auroc_str}` | `{ap_str}` | `{r01_str}` | `{f1_str}` | `{hn_fpr_str}` | `{th_str}` | `{r.elapsed_seconds:.2f}` |"
        )

        comparison_data.append({
            "model_id": r.model_id,
            "run_id": r.run_id,
            "protocol": r.protocol,
            "training_origin": r.training_origin,
            "i_auroc": im.i_auroc,
            "i_ap": im.i_ap,
            "recall_at_fpr_01": im.recall_at_fpr_01,
            "recall_at_fpr_01_status": r01_status,
            "f1": im.f1,
            "accuracy": im.accuracy,
            "hard_normal_fpr": hn.hard_normal_fpr,
            "hard_normal_fp_count": hn_fp,
            "hard_normal_count": hn.hard_normal_count,
            "threshold": r.threshold.threshold,
            "elapsed_seconds": r.elapsed_seconds,
        })

    # Hard normal ranking
    best_hn = min(deduped_runs, key=lambda x: x.hard_normal_metrics.hard_normal_fpr)
    best_hn_fp = int(round(best_hn.hard_normal_metrics.hard_normal_fpr * best_hn.hard_normal_metrics.hard_normal_count))

    lines.extend([
        "",
        "## 2. Hard Normal Robustness Diagnosis",
        "",
    ])
    if n_hn <= 5:
        lines.extend([
            f"> [!NOTE]",
            f"> Hard Normal sample count is very small (n={n_hn}). Robustness rankings and FPR metrics ({best_hn_fp}/{best_hn.hard_normal_metrics.hard_normal_count}) are PROVISIONAL and cannot solely determine production selection.",
            "",
        ])

    lines.extend([
        f"- **Lowest Hard Normal FPR Model**: `{best_hn.model_id}` ({best_hn_fp}/{best_hn.hard_normal_metrics.hard_normal_count}, FPR: `{best_hn.hard_normal_metrics.hard_normal_fpr:.4f}`) [PROVISIONAL]",
        "- **Hard Normal Separation Margins**:",
    ])
    for r in deduped_runs:
        lines.append(f"  - `{r.model_id}`: `{r.hard_normal_metrics.separation_margin:.4f}`")

    # Domain Shift Diagnosis
    lines.extend([
        "",
        "## 3. Domain Shift Diagnosis",
        "",
    ])
    for r in deduped_runs:
        lines.append(f"### Model: `{r.model_id}` Domain Breakdown")
        lines.append("| Domain | Normal Count | Anomaly Count | Accuracy | F1 | I-AUROC | FP Count | FN Count |")
        lines.append("|---|---|---|---|---|---|---|---|")
        worst_dom = None
        worst_f1 = 1.1
        for dom, dm in r.domain_metrics.metrics_by_domain.items():
            norm_cnt = dm.get("normal_count", 0)
            anom_cnt = dm.get("anomaly_count", 0)
            if norm_cnt == 0 or anom_cnt == 0:
                auroc_str = "N/A"
            else:
                auroc_str = f"{dm['i_auroc']:.4f}" if dm.get("i_auroc") is not None else "N/A"
            lines.append(
                f"| `{dom}` | {norm_cnt} | {anom_cnt} | {dm['accuracy']:.4f} | {dm['f1']:.4f} | {auroc_str} | {dm['false_positive']} | {dm.get('false_negative', 0)} |"
            )
            if dm["f1"] < worst_f1:
                worst_f1 = dm["f1"]
                worst_dom = dom
        if worst_dom:
            lines.append(f"\n> **Challenging Domain for {r.model_id}**: `{worst_dom}` (F1: `{worst_f1:.4f}`)\n")

    report_md = "\n".join(lines) + "\n"

    result = {
        "task_id": first_run.task_id,
        "build_id": first_run.build_id,
        "track_readiness": track_readiness,
        "selected_eval_run_ids": selected_eval_run_ids,
        "test_counts": {
            "normal": n_normal,
            "hard_normal": n_hn,
            "anomaly": n_anomaly,
            "total": n_total,
        },
        "fpr_resolution": fpr_resolution,
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
