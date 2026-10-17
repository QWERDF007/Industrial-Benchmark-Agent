---
name: benchmark-evaluate
description: Executes anomaly detection baseline evaluations, enforces Val-only threshold fitting, and compares multi-model performance.
---

# Benchmark Evaluate Skill

## 1. Trigger Conditions
Use this skill when:
- Evaluating baseline models (PatchCore, Dinomaly2, Feature KNN) on a constructed benchmark build.
- Comparing model accuracy, robustness against hard normals, and domain shift generalization.
- Performing error analysis on false positives and false negatives.

## 2. Tool Invocation Sequence
1. `benchmark_status`: Verify that the target benchmark build exists and has passed leakage checks.
2. `evaluation_plan`: Formulate evaluation plan specifying models, threshold strategy (`f1_max`, `recall_at_fpr`, `percentile`), and target FPR.
3. `baseline_run`: Run evaluation for each model:
   - Prepare model on Train split.
   - Run inference on Val split.
   - Fit threshold strictly on Val split predictions.
   - Evaluate Test split at Val threshold.
   - Calculate Image Metrics (I-AUROC, I-AP, Recall@1%FPR), Hard Normal FPR, and Domain breakdown.
4. `evaluation_compare`: Generate cross-model comparison table, Hard Normal robustness ranking, and Domain Shift diagnosis.

## 3. Strict Invariant Rules
- **Val/Test Security Invariant**: Test split predictions are NEVER passed to threshold selection. Threshold must be fitted on Validation predictions ONLY.
- **Hard Normal FPR as Tier-1 Metric**: Robustness against hard normal false alarms is a primary acceptance criterion.
- **Metric-based Domain Diagnosis**: Domain shift evaluations must be grounded in actual per-domain metrics.

## 4. Completion & Stop Conditions
- Evaluation runs recorded in SQLite `evaluation_runs`.
- Detailed metrics, predictions, and error analysis exported to `runs/evaluation/<run_id>/`.
- Cross-model comparison report generated at `runs/evaluation/compare_<build_id>/comparison.md`.
