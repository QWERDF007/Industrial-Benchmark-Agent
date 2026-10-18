# Error Analysis: feature_knn_dinov2

- **Threshold**: `0.2983`
- **Total False Positives (FP)**: 1
- **Total False Negatives (FN)**: 1

## 1. Top False Positives (Normal or Hard Normal predicted as Anomaly)

| Sample ID | Image Score | Gold Label | Batch / Domain | Image Path |
|---|---|---|---|---|
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-10_09.25.16.695_(334)_1_-1_1_ch_333_13_1_.png` | `0.6240` | `HARD_NORMAL` | `2025-09-10` | `/data1/wt/data/框胶数据集/ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-10_09.25.16.695_(334)_1_-1_1_ch_333_13_1_.png` |

## 2. Top False Negatives (Anomaly predicted as Normal)

| Sample ID | Image Score | Gold Label | Batch / Domain | Image Path |
|---|---|---|---|---|
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-05-17_16.30.24.695_(10152)_1_-1_2_ch_10151_1_2_.png` | `0.2888` | `ANOMALY` | `2025-05-17` | `/data1/wt/data/框胶数据集/ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-05-17_16.30.24.695_(10152)_1_-1_2_ch_10151_1_2_.png` |
