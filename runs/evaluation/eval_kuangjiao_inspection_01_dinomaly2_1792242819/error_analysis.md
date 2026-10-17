# Error Analysis: dinomaly2

- **Threshold**: `0.1256`
- **Total False Positives (FP)**: 1
- **Total False Negatives (FN)**: 2

## 1. Top False Positives (Normal or Hard Normal predicted as Anomaly)

| Sample ID | Image Score | Gold Label | Batch / Domain | Image Path |
|---|---|---|---|---|
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2024-07-26_23.40.32.555_2_2893_small_2895_1_6774565086560736768_良品_1.png` | `0.1356` | `NORMAL` | `2024-07-26` | `/data1/wt/data/框胶数据集/ExportImage_框胶10x连线蓝色背面厚_0904-Train/2024-07-26_23.40.32.555_2_2893_small_2895_1_6774565086560736768_良品_1.png` |

## 2. Top False Negatives (Anomaly predicted as Normal)

| Sample ID | Image Score | Gold Label | Batch / Domain | Image Path |
|---|---|---|---|---|
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2024-06-13_10.44.44.583_2_(8156)_ch_8158_4612835339407937025_0.png` | `0.1215` | `ANOMALY` | `2024-06-13` | `/data1/wt/data/框胶数据集/ExportImage_框胶10x连线蓝色背面厚_0904-Train/2024-06-13_10.44.44.583_2_(8156)_ch_8158_4612835339407937025_0.png` |
| `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/22-0809130022865__vec_image_29387_11429_2537_TrackImg-219_0.png` | `0.1235` | `ANOMALY` | `22-080913` | `/data1/wt/data/框胶数据集/ExportImage_框胶10x连线蓝色背面厚_0904-Train/22-0809130022865__vec_image_29387_11429_2537_TrackImg-219_0.png` |
