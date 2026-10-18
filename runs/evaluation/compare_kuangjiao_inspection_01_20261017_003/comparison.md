# Model Benchmark Comparison Report

- **Task ID**: `kuangjiao_inspection_01`
- **Build ID**: `kuangjiao_inspection_01_20261017_003`
- **Track Readiness**: `PARTIAL (Provisional - statistical power limited by test normal count n=2)`
- **Test Ground Truth**: `24` samples (1 Regular Normal + 1 Hard Normal = 2 Normal, 22 Anomaly)
- **Target FPR Resolution**: `50.0%` (`1 / 2`)
- **Selected Eval Runs**:
  - `dinomaly2` (`PRETRAINED_INFERENCE`): `eval_kuangjiao_inspection_01_dinomaly2_1792296251`
  - `feature_knn_dinov2` (`UNSUPERVISED_NORMAL`): `eval_kuangjiao_inspection_01_feature_knn_dinov2_1792296184`
  - `patchcore` (`UNSUPERVISED_NORMAL`): `eval_kuangjiao_inspection_01_patchcore_1792296216`

## 1. Overall Image Metrics Comparison

| Model ID | Protocol | I-AUROC | I-AP | Recall@1%FPR | F1 Score | Hard Normal FPR | Threshold | Latency (s) |
|---|---|---|---|---|---|---|---|---|
| `dinomaly2` | `PRETRAINED_INFERENCE` | `0.8409` | `0.9839` | `NOT_EVALUATED (res=50%)` | `0.9302` | `0/1 (0.0000) [PROVISIONAL]` | `0.1256` | `18.86` |
| `feature_knn_dinov2` | `UNSUPERVISED_NORMAL` | `0.5000` | `0.8757` | `NOT_EVALUATED (res=50%)` | `0.9545` | `1/1 (1.0000) [PROVISIONAL]` | `0.2983` | `0.38` |
| `patchcore` | `UNSUPERVISED_NORMAL` | `0.5455` | `0.9136` | `NOT_EVALUATED (res=50%)` | `0.9778` | `1/1 (1.0000) [PROVISIONAL]` | `1546.9258` | `7.19` |

## 2. Hard Normal Robustness Diagnosis

> [!NOTE]
> Hard Normal sample count is very small (n=1). Robustness rankings and FPR metrics (0/1) are PROVISIONAL and cannot solely determine production selection.

- **Lowest Hard Normal FPR Model**: `dinomaly2` (0/1, FPR: `0.0000`) [PROVISIONAL]
- **Hard Normal Separation Margins**:
  - `dinomaly2`: `-0.0213`
  - `feature_knn_dinov2`: `0.5047`
  - `patchcore`: `1096.8555`

## 3. Domain Shift Diagnosis

### Model: `dinomaly2` Domain Breakdown
| Domain | Normal Count | Anomaly Count | Accuracy | F1 | I-AUROC | FP Count | FN Count |
|---|---|---|---|---|---|---|---|
| `2023-11-27` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2025-09-04` | 0 | 2 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `22-032315` | 0 | 2 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `22-080913` | 0 | 4 | 0.7500 | 0.8571 | N/A | 0 | 1 |
| `2023-07-03` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2022_10_18` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2024-06-13` | 0 | 1 | 0.0000 | 0.0000 | N/A | 0 | 1 |
| `2024-07-05` | 0 | 2 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2024-07-26` | 1 | 0 | 0.0000 | 0.0000 | N/A | 1 | 0 |
| `2025-03-02` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2025-05-17` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2025-06-04` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2025-08-28` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2025-09-10` | 1 | 0 | 1.0000 | 0.0000 | N/A | 0 | 0 |
| `2026-06-29` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2026-08-06` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `22-052410` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `UNKNOWN` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |

> **Challenging Domain for dinomaly2**: `2024-06-13` (F1: `0.0000`)

### Model: `feature_knn_dinov2` Domain Breakdown
| Domain | Normal Count | Anomaly Count | Accuracy | F1 | I-AUROC | FP Count | FN Count |
|---|---|---|---|---|---|---|---|
| `2023-11-27` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2025-09-04` | 0 | 2 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `22-032315` | 0 | 2 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `22-080913` | 0 | 4 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2023-07-03` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2022_10_18` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2024-06-13` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2024-07-05` | 0 | 2 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2024-07-26` | 1 | 0 | 1.0000 | 0.0000 | N/A | 0 | 0 |
| `2025-03-02` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2025-05-17` | 0 | 1 | 0.0000 | 0.0000 | N/A | 0 | 1 |
| `2025-06-04` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2025-08-28` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2025-09-10` | 1 | 0 | 0.0000 | 0.0000 | N/A | 1 | 0 |
| `2026-06-29` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2026-08-06` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `22-052410` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `UNKNOWN` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |

> **Challenging Domain for feature_knn_dinov2**: `2024-07-26` (F1: `0.0000`)

### Model: `patchcore` Domain Breakdown
| Domain | Normal Count | Anomaly Count | Accuracy | F1 | I-AUROC | FP Count | FN Count |
|---|---|---|---|---|---|---|---|
| `2023-11-27` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2025-09-04` | 0 | 2 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `22-032315` | 0 | 2 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `22-080913` | 0 | 4 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2023-07-03` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2022_10_18` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2024-06-13` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2024-07-05` | 0 | 2 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2024-07-26` | 1 | 0 | 1.0000 | 0.0000 | N/A | 0 | 0 |
| `2025-03-02` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2025-05-17` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2025-06-04` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2025-08-28` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2025-09-10` | 1 | 0 | 0.0000 | 0.0000 | N/A | 1 | 0 |
| `2026-06-29` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `2026-08-06` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `22-052410` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |
| `UNKNOWN` | 0 | 1 | 1.0000 | 1.0000 | N/A | 0 | 0 |

> **Challenging Domain for patchcore**: `2024-07-26` (F1: `0.0000`)

