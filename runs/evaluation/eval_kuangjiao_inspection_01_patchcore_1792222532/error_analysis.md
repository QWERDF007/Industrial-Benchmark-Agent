# Error Analysis: patchcore

- **Threshold**: `0.2947`
- **Total False Positives (FP)**: 1
- **Total False Negatives (FN)**: 0

## 1. Top False Positives (Normal or Hard Normal predicted as Anomaly)

| Sample ID | Image Score | Gold Label | Batch / Domain | Image Path |
|---|---|---|---|---|
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/22-0323151527418__vec_image_747_7407_746_zoom_rois-64_0.png` | `0.2955` | `FAIL` | `22-032315` | `/data1/wt/data/框胶数据集/ExportImage_框胶10x连线蓝色背面厚_0904-Test/22-0323151527418__vec_image_747_7407_746_zoom_rois-64_0.png` |

## 2. Top False Negatives (Anomaly predicted as Normal)

| Sample ID | Image Score | Gold Label | Batch / Domain | Image Path |
|---|---|---|---|---|
