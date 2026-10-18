# Evaluation Report: feature_knn_dinov2

- **Task ID**: `kuangjiao_inspection_01`
- **Build ID**: `kuangjiao_inspection_01_20261017_003`
- **Run ID**: `eval_kuangjiao_inspection_01_feature_knn_dinov2_1792296184`
- **Elapsed**: `0.38s`

## 1. Split & Class Counts

- **Val Samples**: `23` (Normal: `2`, Anomaly: `21`)
- **Test Samples**: `24` (Normal: `2`, Hard Normal: `1`, Anomaly: `22`)

## 2. Threshold Configuration (Val-Fitted)

- **Strategy**: `f1_max`
- **Fitted Split**: `val` (23 samples)
- **Selected Threshold**: `0.2983`
- **Val Best F1**: `0.9767`

## 3. Test Image Metrics

| Metric | Value |
|---|---|
| I-AUROC | `0.5000` |
| I-AP | `0.8757` |
| Recall@FPR=1% | `0.0000` |
| Recall@FPR=5% | `0.0000` |
| Accuracy | `0.9167` |
| Precision | `0.9545` |
| Recall | `0.9545` |
| F1 Score | `0.9545` |
| Confusion (TP / FP / TN / FN) | `21 / 1 / 1 / 1` |

## 4. Hard Normal Robustness

| Metric | Value |
|---|---|
| Hard Normal Count | `1` |
| Hard Normal FPR | `1.0000` |
| Hard Normal Mean Score | `0.6240` |
| Normal Mean Score | `0.1193` |
| Separation Margin | `0.5047` |

## 5. Domain Stratified Breakdown

| Domain | Samples | Anomaly / Normal | Accuracy | F1 | I-AUROC | FP |
|---|---|---|---|---|---|---|
| `2023-11-27` | 1 | 1 / 0 | 1.0000 | 1.0000 | N/A | 0 |
| `2025-09-04` | 2 | 2 / 0 | 1.0000 | 1.0000 | N/A | 0 |
| `22-032315` | 2 | 2 / 0 | 1.0000 | 1.0000 | N/A | 0 |
| `22-080913` | 4 | 4 / 0 | 1.0000 | 1.0000 | N/A | 0 |
| `2023-07-03` | 1 | 1 / 0 | 1.0000 | 1.0000 | N/A | 0 |
| `2022_10_18` | 1 | 1 / 0 | 1.0000 | 1.0000 | N/A | 0 |
| `2024-06-13` | 1 | 1 / 0 | 1.0000 | 1.0000 | N/A | 0 |
| `2024-07-05` | 2 | 2 / 0 | 1.0000 | 1.0000 | N/A | 0 |
| `2024-07-26` | 1 | 0 / 1 | 1.0000 | 0.0000 | N/A | 0 |
| `2025-03-02` | 1 | 1 / 0 | 1.0000 | 1.0000 | N/A | 0 |
| `2025-05-17` | 1 | 1 / 0 | 0.0000 | 0.0000 | N/A | 0 |
| `2025-06-04` | 1 | 1 / 0 | 1.0000 | 1.0000 | N/A | 0 |
| `2025-08-28` | 1 | 1 / 0 | 1.0000 | 1.0000 | N/A | 0 |
| `2025-09-10` | 1 | 0 / 1 | 0.0000 | 0.0000 | N/A | 1 |
| `2026-06-29` | 1 | 1 / 0 | 1.0000 | 1.0000 | N/A | 0 |
| `2026-08-06` | 1 | 1 / 0 | 1.0000 | 1.0000 | N/A | 0 |
| `22-052410` | 1 | 1 / 0 | 1.0000 | 1.0000 | N/A | 0 |
| `UNKNOWN` | 1 | 1 / 0 | 1.0000 | 1.0000 | N/A | 0 |
