# Evaluation Report: mock

- **Task ID**: `eval_task_01`
- **Build ID**: `eval_build_01`
- **Run ID**: `eval_eval_task_01_mock_1792242632`
- **Elapsed**: `0.01s`

## 1. Split & Class Counts

- **Val Samples**: `2` (Normal: `1`, Anomaly: `1`)
- **Test Samples**: `3` (Normal: `2`, Hard Normal: `1`, Anomaly: `1`)

## 2. Threshold Configuration (Val-Fitted)

- **Strategy**: `f1_max`
- **Fitted Split**: `val` (2 samples)
- **Selected Threshold**: `0.8413`
- **Val Best F1**: `1.0`

## 3. Test Image Metrics

| Metric | Value |
|---|---|
| I-AUROC | `1.0000` |
| I-AP | `1.0000` |
| Recall@FPR=1% | `1.0000` |
| Recall@FPR=5% | `1.0000` |
| Accuracy | `1.0000` |
| Precision | `1.0000` |
| Recall | `1.0000` |
| F1 Score | `1.0000` |
| Confusion (TP / FP / TN / FN) | `1 / 0 / 2 / 0` |

## 4. Hard Normal Robustness

| Metric | Value |
|---|---|
| Hard Normal Count | `1` |
| Hard Normal FPR | `0.0000` |
| Hard Normal Mean Score | `0.1731` |
| Normal Mean Score | `0.1874` |
| Separation Margin | `-0.0143` |

## 5. Domain Stratified Breakdown

| Domain | Samples | Anomaly / Normal | Accuracy | F1 | I-AUROC | FP |
|---|---|---|---|---|---|---|
| `UNKNOWN` | 3 | 1 / 2 | 1.0000 | 1.0000 | 1.0000 | 0 |
