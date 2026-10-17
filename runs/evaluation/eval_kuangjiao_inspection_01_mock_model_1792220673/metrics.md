# Evaluation Report: mock_model

- **Task ID**: `kuangjiao_inspection_01`
- **Build ID**: `kuangjiao_inspection_01_20261017_001`
- **Run ID**: `eval_kuangjiao_inspection_01_mock_model_1792220673`
- **Elapsed**: `0.34s`

## 1. Threshold Configuration (Val-Fitted)

- **Strategy**: `f1_max`
- **Fitted Split**: `val` (23 samples)
- **Selected Threshold**: `0.2426`
- **Val Best F1**: `0.0`

## 2. Test Image Metrics

| Metric | Value |
|---|---|
| I-AUROC | `N/A` |
| I-AP | `N/A` |
| Recall@FPR=1% | `N/A` |
| Recall@FPR=5% | `N/A` |
| Accuracy | `0.9565` |
| Precision | `0.0000` |
| Recall | `0.0000` |
| F1 Score | `0.0000` |
| Confusion (TP / FP / TN / FN) | `0 / 1 / 22 / 0` |

## 3. Hard Normal Robustness

| Metric | Value |
|---|---|
| Hard Normal Count | `1` |
| Hard Normal FPR | `0.0000` |
| Hard Normal Mean Score | `0.1188` |
| Normal Mean Score | `0.0000` |
| Separation Margin | `0.1188` |

## 4. Domain Stratified Breakdown

| Domain | Samples | Anomaly / Normal | Accuracy | F1 | I-AUROC | FP |
|---|---|---|---|---|---|---|
| `22-051215` | 1 | 0 / 1 | 1.0000 | 0.0000 | N/A | 0 |
| `2023-07-03` | 1 | 0 / 1 | 1.0000 | 0.0000 | N/A | 0 |
| `2023-10-16` | 1 | 0 / 1 | 1.0000 | 0.0000 | N/A | 0 |
| `2023-11-27` | 2 | 0 / 2 | 1.0000 | 0.0000 | N/A | 0 |
| `2023_09_28` | 1 | 0 / 1 | 1.0000 | 0.0000 | N/A | 0 |
| `2024-07-26` | 1 | 0 / 1 | 1.0000 | 0.0000 | N/A | 0 |
| `2024-08-13` | 2 | 0 / 2 | 1.0000 | 0.0000 | N/A | 0 |
| `2024_06_13` | 1 | 0 / 1 | 1.0000 | 0.0000 | N/A | 0 |
| `2025-03-02` | 1 | 0 / 1 | 1.0000 | 0.0000 | N/A | 0 |
| `2025-03-03` | 1 | 0 / 1 | 1.0000 | 0.0000 | N/A | 0 |
| `2025-09-03` | 1 | 0 / 1 | 1.0000 | 0.0000 | N/A | 0 |
| `2025-09-04` | 3 | 0 / 3 | 1.0000 | 0.0000 | N/A | 0 |
| `2025-10-27` | 1 | 0 / 1 | 1.0000 | 0.0000 | N/A | 0 |
| `2025-11-04` | 1 | 0 / 1 | 1.0000 | 0.0000 | N/A | 0 |
| `22-041411` | 1 | 0 / 1 | 1.0000 | 0.0000 | N/A | 0 |
| `UNKNOWN` | 2 | 0 / 2 | 1.0000 | 0.0000 | N/A | 0 |
| `2026_09_08` | 1 | 0 / 1 | 1.0000 | 0.0000 | N/A | 0 |
| `2026_09_07` | 1 | 0 / 1 | 0.0000 | 0.0000 | N/A | 1 |
