# Error Analysis: patchcore

- **Threshold**: `825.8611`
- **Total False Positives (FP)**: 2
- **Total False Negatives (FN)**: 0

## 1. Top False Positives (Normal or Hard Normal predicted as Anomaly)

| Sample ID | Image Score | Gold Label | Batch / Domain | Image Path |
|---|---|---|---|---|
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-10_09.25.16.695_(334)_1_-1_1_ch_333_13_1_.png` | `1998.2061` | `HARD_NORMAL` | `2025-09-10` | `/data1/wt/data/框胶数据集/ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-10_09.25.16.695_(334)_1_-1_1_ch_333_13_1_.png` |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2024-07-26_23.40.32.555_2_2893_small_2895_1_6774565086560736768_良品_1.png` | `1271.5376` | `NORMAL` | `2024-07-26` | `/data1/wt/data/框胶数据集/ExportImage_框胶10x连线蓝色背面厚_0904-Train/2024-07-26_23.40.32.555_2_2893_small_2895_1_6774565086560736768_良品_1.png` |

## 2. Top False Negatives (Anomaly predicted as Normal)

| Sample ID | Image Score | Gold Label | Batch / Domain | Image Path |
|---|---|---|---|---|
