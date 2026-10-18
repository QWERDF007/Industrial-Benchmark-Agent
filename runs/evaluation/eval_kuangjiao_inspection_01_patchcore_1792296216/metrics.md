# Evaluation Report: patchcore

- **Task ID**: `kuangjiao_inspection_01`
- **Build ID**: `kuangjiao_inspection_01_20261017_003`
- **Run ID**: `eval_kuangjiao_inspection_01_patchcore_1792296216`
- **Elapsed**: `7.19s`

## 1. Split & Class Counts

- **Val Samples**: `23` (Normal: `2`, Anomaly: `21`)
- **Test Samples**: `24` (Normal: `2`, Hard Normal: `1`, Anomaly: `22`)

## 2. Threshold Configuration (Val-Fitted)

- **Strategy**: `f1_max`
- **Fitted Split**: `val` (23 samples)
- **Selected Threshold**: `1546.9258`
- **Val Best F1**: `0.9767`

## 3. Test Image Metrics

| Metric | Value |
|---|---|
| I-AUROC | `0.5455` |
| I-AP | `0.9136` |
| Recall@FPR=1% | `0.0909` |
| Recall@FPR=5% | `0.0909` |
| Accuracy | `0.9583` |
| Precision | `0.9565` |
| Recall | `1.0000` |
| F1 Score | `0.9778` |
| Confusion (TP / FP / TN / FN) | `22 / 1 / 1 / 0` |

## 4. Hard Normal Robustness

| Metric | Value |
|---|---|
| Hard Normal Count | `1` |
| Hard Normal FPR | `1.0000` |
| Hard Normal Mean Score | `2594.4348` |
| Normal Mean Score | `1497.5793` |
| Separation Margin | `1096.8555` |

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
| `2025-05-17` | 1 | 1 / 0 | 1.0000 | 1.0000 | N/A | 0 |
| `2025-06-04` | 1 | 1 / 0 | 1.0000 | 1.0000 | N/A | 0 |
| `2025-08-28` | 1 | 1 / 0 | 1.0000 | 1.0000 | N/A | 0 |
| `2025-09-10` | 1 | 0 / 1 | 0.0000 | 0.0000 | N/A | 1 |
| `2026-06-29` | 1 | 1 / 0 | 1.0000 | 1.0000 | N/A | 0 |
| `2026-08-06` | 1 | 1 / 0 | 1.0000 | 1.0000 | N/A | 0 |
| `22-052410` | 1 | 1 / 0 | 1.0000 | 1.0000 | N/A | 0 |
| `UNKNOWN` | 1 | 1 / 0 | 1.0000 | 1.0000 | N/A | 0 |
