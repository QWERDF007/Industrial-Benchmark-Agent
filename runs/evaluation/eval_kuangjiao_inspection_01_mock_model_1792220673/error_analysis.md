# Error Analysis: mock_model

- **Threshold**: `0.2426`
- **Total False Positives (FP)**: 1
- **Total False Negatives (FN)**: 0

## 1. Top False Positives (Normal or Hard Normal predicted as Anomaly)

| Sample ID | Image Score | Gold Label | Batch / Domain | Image Path |
|---|---|---|---|---|
| `kuangjiao_dataset:ExportImage_漏检/picture_0_2026_09_07_14_58_38_432.png` | `0.8900` | `FAIL` | `2026_09_07` | `/data1/wt/data/框胶数据集/ExportImage_漏检/picture_0_2026_09_07_14_58_38_432.png` |

## 2. Top False Negatives (Anomaly predicted as Normal)

| Sample ID | Image Score | Gold Label | Batch / Domain | Image Path |
|---|---|---|---|---|
