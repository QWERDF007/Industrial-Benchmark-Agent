# Error Analysis: feature_knn

- **Threshold**: `0.2794`
- **Total False Positives (FP)**: 3
- **Total False Negatives (FN)**: 0

## 1. Top False Positives (Normal or Hard Normal predicted as Anomaly)

| Sample ID | Image Score | Gold Label | Batch / Domain | Image Path |
|---|---|---|---|---|
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-11-04_02.08.46.420_(1136)_1_-1_2_ch_1135_16_0_.png` | `0.2957` | `FAIL` | `2025-11-04` | `/data1/wt/data/框胶数据集/ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-11-04_02.08.46.420_(1136)_1_-1_2_ch_1135_16_0_.png` |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2024_06_13_15_58_45_153004.png` | `0.2929` | `FAIL` | `2024_06_13` | `/data1/wt/data/框胶数据集/ExportImage_框胶10x连线蓝色背面厚_0904-Train/2024_06_13_15_58_45_153004.png` |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-10-16_16.02.46.273_1_(25626)_ch_25627_6989599391453740545_1.png` | `0.2822` | `FAIL` | `2023-10-16` | `/data1/wt/data/框胶数据集/ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-10-16_16.02.46.273_1_(25626)_ch_25627_6989599391453740545_1.png` |

## 2. Top False Negatives (Anomaly predicted as Normal)

| Sample ID | Image Score | Gold Label | Batch / Domain | Image Path |
|---|---|---|---|---|
