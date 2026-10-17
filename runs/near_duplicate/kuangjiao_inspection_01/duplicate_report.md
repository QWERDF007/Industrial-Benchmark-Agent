# Visual Near-Duplicate Audit Report: kuangjiao_inspection_01

> 本报告由 Industrial AD Benchmark Agent (Step 2 Closeout & Verified Duplicate) 自动生成。  
> ⚠️ **核心原则**: 本报告产出分层为 **Candidate（高召回候选）** 与 **Verified（高置信二次验证）**。系统**未自动修改任何图像的质检标签**，亦**未自动删除任何样本**。

## 1. 挖掘与验证双层摘要 (Two-Tier Summary)

| 指标维度 | 候选层 (Candidate Level) | 确认层 (Verified Level) | 语义说明 |
|---|---:|---:|---|
| **判断依据** | DINOv2 Cosine `>= 0.98` | DINOv2 + NCC/Pixel Cosine 验证 | 候选负责全量召回，验证负责高置信收敛 |
| **群组数量 (Groups)** | 558 | 558 | 连通分量聚类群组数 |
| **涉及样本数 (Samples)** | 2,189 | 2,189 | 群组包含的总图片数 |
| **样本覆盖率 (Coverage)** | **43.14%** | **43.14%** | 占数据集总样本 (5,074) 比例 |
| **跨来源群组 (Cross-Origin)** | 186 | 186 | 跨历史 Train/Test/Augmented 碰撞群组 |

- **总耗时**: 106.66 s

## 2. 跨数据来源交叉碰撞对比 (Cross-Origin Comparison)

| 数据来源交叉碰撞 (Cross-Origin Pair) | 候选对数 (Candidate Pairs) | 确认对数 (Verified Pairs) | 潜在风险说明 |
|---|---:|---:|---|
| `AUGMENTED <-> LEGACY_TEST` | 5 | **5** | 原图与数据增强图极度相似，必须划分至同一 Split |
| `AUGMENTED <-> LEGACY_TRAIN` | 40 | **40** | 原图与数据增强图极度相似，必须划分至同一 Split |
| `AUGMENTED <-> MISSED_CASE` | 1 | **1** | 原图与数据增强图极度相似，必须划分至同一 Split |
| `LEGACY_TEST <-> LEGACY_TRAIN` | 1,286 | **1,286** | 历史训练集与测试集重复，存在重大评测泄漏风险 |
| `LEGACY_TRAIN <-> MISSED_CASE` | 4 | **4** | 跨域样本高度相似 |

## 3. 高置信近重复群组 (Top Verified Duplicate Groups)

展示经过像素级 NCC 与 Pixel Cosine 二次验证确认的近重复群组：

### 群组 `ver_group_0001` (🚨 **[跨来源泄漏]**)

- **成员数量**: 87 张图片
- **来源分布**: LEGACY_TEST: 10, LEGACY_TRAIN: 77
- **DINO 相似度**: 0.9800 ~ 0.9937 (均值 0.9852)
- **二次验证指标**: Pixel Cosine = 0.9999, NCC = 0.9997
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_06.55.35.940_(1200)_1_-1_1_ch_1199_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_06.55.35.940_(1200)_1_-1_1_ch_1199_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_06.55.38.495_(1206)_1_-1_1_ch_1205_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_06.55.38.495_(1206)_1_-1_1_ch_1205_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.06.50.598_(1415)_1_-1_1_ch_1414_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.06.50.598_(1415)_1_-1_1_ch_1414_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.07.30.681_(1490)_1_-1_1_ch_1489_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.07.30.681_(1490)_1_-1_1_ch_1489_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.07.47.224_(1523)_1_-1_1_ch_1522_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.07.47.224_(1523)_1_-1_1_ch_1522_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - *(其余 82 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0002` (🚨 **[跨来源泄漏]**)

- **成员数量**: 59 张图片
- **来源分布**: LEGACY_TEST: 6, LEGACY_TRAIN: 53
- **DINO 相似度**: 0.9800 ~ 0.9924 (均值 0.9841)
- **二次验证指标**: Pixel Cosine = 0.9999, NCC = 0.9997
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_06.57.58.945_(1275)_1_-1_1_ch_1274_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_06.57.58.945_(1275)_1_-1_1_ch_1274_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_06.58.09.936_(1301)_1_-1_1_ch_1300_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_06.58.09.936_(1301)_1_-1_1_ch_1300_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.07.10.459_(1445)_1_-1_1_ch_1444_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.07.10.459_(1445)_1_-1_1_ch_1444_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.10.49.705_(1691)_1_-1_1_ch_1690_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.10.49.705_(1691)_1_-1_1_ch_1690_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.12.03.228_(1838)_1_-1_1_ch_1837_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.12.03.228_(1838)_1_-1_1_ch_1837_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - *(其余 54 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0003` (🚨 **[跨来源泄漏]**)

- **成员数量**: 51 张图片
- **来源分布**: AUGMENTED: 1, LEGACY_TEST: 8, LEGACY_TRAIN: 42
- **DINO 相似度**: 0.9801 ~ 0.9926 (均值 0.9846)
- **二次验证指标**: Pixel Cosine = 0.9998, NCC = 0.9995
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_数据增强/picture_33_2026_09_08_11_48_24_356.png` | 路径: `ExportImage_数据增强/picture_33_2026_09_08_11_48_24_356.png` | 状态: `UNCERTAIN` | 来源: `AUGMENTED` | 批次: `2026_09_08`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-22_11.25.29.612_(18609)_1_-1_2_ch_18608_12_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-22_11.25.29.612_(18609)_1_-1_2_ch_18608_12_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-08-22`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-22_11.25.33.292_(18618)_1_-1_2_ch_18617_12_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-22_11.25.33.292_(18618)_1_-1_2_ch_18617_12_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-08-22`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-22_11.25.38.616_(18631)_1_-1_2_ch_18630_12_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-22_11.25.38.616_(18631)_1_-1_2_ch_18630_12_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-08-22`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-22_11.25.41.100_(18637)_1_-1_2_ch_18636_12_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-22_11.25.41.100_(18637)_1_-1_2_ch_18636_12_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-08-22`
  - *(其余 46 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0004` (🚨 **[跨来源泄漏]**)

- **成员数量**: 40 张图片
- **来源分布**: LEGACY_TEST: 6, LEGACY_TRAIN: 34
- **DINO 相似度**: 0.9800 ~ 0.9893 (均值 0.9826)
- **二次验证指标**: Pixel Cosine = 0.9956, NCC = 0.9862
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/22-0913142627106__vec_image_111684_18703_3174_TrackImg-174_2.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/22-0913142627106__vec_image_111684_18703_3174_TrackImg-174_2.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `22-091314`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/22-0913142631422__vec_image_111793_18757_3183_TrackImg-174_2.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/22-0913142631422__vec_image_111793_18757_3183_TrackImg-174_2.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `22-091314`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/22-0913142631987__vec_image_111806_18763_3184_TrackImg-174_2.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/22-0913142631987__vec_image_111806_18763_3184_TrackImg-174_2.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `22-091314`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/22-0913142651050__vec_image_112211_18852_3199_TrackImg-174_2.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/22-0913142651050__vec_image_112211_18852_3199_TrackImg-174_2.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `22-091314`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/22-0913142653412__vec_image_112277_18888_3205_TrackImg-174_2.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/22-0913142653412__vec_image_112277_18888_3205_TrackImg-174_2.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `22-091314`
  - *(其余 35 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0005` (🚨 **[跨来源泄漏]**)

- **成员数量**: 38 张图片
- **来源分布**: LEGACY_TEST: 6, LEGACY_TRAIN: 32
- **DINO 相似度**: 0.9800 ~ 0.9932 (均值 0.9847)
- **二次验证指标**: Pixel Cosine = 1.0, NCC = 0.9999
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_10.03.40.765_(19245)_1_-1_1_ch_19244_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_10.03.40.765_(19245)_1_-1_1_ch_19244_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_10.05.21.969_(19437)_1_-1_1_ch_19436_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_10.05.21.969_(19437)_1_-1_1_ch_19436_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_10.07.22.195_(19597)_1_-1_1_ch_19596_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_10.07.22.195_(19597)_1_-1_1_ch_19596_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_10.10.53.749_(19776)_1_-1_1_ch_19775_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_10.10.53.749_(19776)_1_-1_1_ch_19775_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_10.12.40.629_(19977)_1_-1_1_ch_19976_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_10.12.40.629_(19977)_1_-1_1_ch_19976_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - *(其余 33 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0006` (🚨 **[跨来源泄漏]**)

- **成员数量**: 36 张图片
- **来源分布**: LEGACY_TEST: 4, LEGACY_TRAIN: 32
- **DINO 相似度**: 0.9800 ~ 0.9905 (均值 0.9828)
- **二次验证指标**: Pixel Cosine = 0.9997, NCC = 0.9985
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2023_08_10_17_40_43_455001.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2023_08_10_17_40_43_455001.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2023_08_10`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2023_08_10_17_40_54_593487.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2023_08_10_17_40_54_593487.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2023_08_10`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2023_08_10_17_40_54_800944.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2023_08_10_17_40_54_800944.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2023_08_10`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2023_08_10_17_40_59_340918.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2023_08_10_17_40_59_340918.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2023_08_10`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023_08_10_17_40_25_724536.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023_08_10_17_40_25_724536.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2023_08_10`
  - *(其余 31 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0007` (🚨 **[跨来源泄漏]**)

- **成员数量**: 33 张图片
- **来源分布**: LEGACY_TEST: 3, LEGACY_TRAIN: 30
- **DINO 相似度**: 0.9800 ~ 0.9920 (均值 0.9844)
- **二次验证指标**: Pixel Cosine = 0.9999, NCC = 0.9988
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-01_08.47.10.456_(248)_1_-1_2_ch_247_1_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-01_08.47.10.456_(248)_1_-1_2_ch_247_1_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-01`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-01_08.47.27.033_(281)_1_-1_2_ch_280_1_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-01_08.47.27.033_(281)_1_-1_2_ch_280_1_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-01`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-01_08.48.00.644_(348)_1_-1_2_ch_347_1_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-01_08.48.00.644_(348)_1_-1_2_ch_347_1_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-01`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-07-01_07.35.16.498_(232)_1_-1_2_ch_231_1_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-07-01_07.35.16.498_(232)_1_-1_2_ch_231_1_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-07-01`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-07-01_07.35.17.508_(234)_1_-1_2_ch_233_1_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-07-01_07.35.17.508_(234)_1_-1_2_ch_233_1_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-07-01`
  - *(其余 28 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0008` (🚨 **[跨来源泄漏]**)

- **成员数量**: 26 张图片
- **来源分布**: LEGACY_TEST: 2, LEGACY_TRAIN: 24
- **DINO 相似度**: 0.9800 ~ 0.9889 (均值 0.9824)
- **二次验证指标**: Pixel Cosine = 0.9986, NCC = 0.9946
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-03-03_09.59.12.473_(4003)_1_-1_1_ch_4002_13_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-03-03_09.59.12.473_(4003)_1_-1_1_ch_4002_13_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2025-03-03`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-03-03_10.14.38.964_(5369)_1_-1_1_ch_5368_12_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-03-03_10.14.38.964_(5369)_1_-1_1_ch_5368_12_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2025-03-03`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-03-03_09.55.50.489_(3569)_1_-1_1_ch_3568_13_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-03-03_09.55.50.489_(3569)_1_-1_1_ch_3568_13_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-03-03`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-03-03_09.55.59.327_(3587)_1_-1_1_ch_3586_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-03-03_09.55.59.327_(3587)_1_-1_1_ch_3586_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-03-03`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-03-03_09.56.07.006_(3604)_1_-1_1_ch_3603_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-03-03_09.56.07.006_(3604)_1_-1_1_ch_3603_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-03-03`
  - *(其余 21 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0009` (🚨 **[跨来源泄漏]**)

- **成员数量**: 24 张图片
- **来源分布**: LEGACY_TEST: 2, LEGACY_TRAIN: 22
- **DINO 相似度**: 0.9800 ~ 0.9912 (均值 0.9841)
- **二次验证指标**: Pixel Cosine = 0.9999, NCC = 0.9996
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-18_09.12.00.244_(57)_1_-1_2_ch_56_1_3_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-18_09.12.00.244_(57)_1_-1_2_ch_56_1_3_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-08-18`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-18_15.02.36.332_(31591)_1_-1_2_ch_31590_14_3_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-18_15.02.36.332_(31591)_1_-1_2_ch_31590_14_3_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-08-18`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_09.06.53.399_(3660)_1_-1_2_ch_3659_1_3_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_09.06.53.399_(3660)_1_-1_2_ch_3659_1_3_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-08-18`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_13.55.32.364_(24451)_1_-1_2_ch_24450_1_3_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_13.55.32.364_(24451)_1_-1_2_ch_24450_1_3_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-08-18`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_13.55.51.018_(24489)_1_-1_2_ch_24488_1_3_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_13.55.51.018_(24489)_1_-1_2_ch_24488_1_3_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-08-18`
  - *(其余 19 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0011` (🚨 **[跨来源泄漏]**)

- **成员数量**: 19 张图片
- **来源分布**: LEGACY_TEST: 4, LEGACY_TRAIN: 15
- **DINO 相似度**: 0.9800 ~ 1.0000 (均值 0.9854)
- **二次验证指标**: Pixel Cosine = 0.9991, NCC = 0.997
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-22_08.53.52.912_(410)_1_-1_1_ch_409_18_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-22_08.53.52.912_(410)_1_-1_1_ch_409_18_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-22`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-22_08.54.01.965_(424)_1_-1_1_ch_423_18_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-22_08.54.01.965_(424)_1_-1_1_ch_423_18_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-22`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-22_10.04.44.157_(158)_1_-1_1_ch_157_18_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-22_10.04.44.157_(158)_1_-1_1_ch_157_18_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-22`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-22_10.46.50.055_(84)_1_-1_1_ch_83_18_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-22_10.46.50.055_(84)_1_-1_1_ch_83_18_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-22`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-07-22_08.53.37.801_(392)_1_-1_1_ch_391_18_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-07-22_08.53.37.801_(392)_1_-1_1_ch_391_18_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-07-22`
  - *(其余 14 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0012` (🚨 **[跨来源泄漏]**)

- **成员数量**: 18 张图片
- **来源分布**: LEGACY_TEST: 2, LEGACY_TRAIN: 16
- **DINO 相似度**: 0.9801 ~ 0.9872 (均值 0.9821)
- **二次验证指标**: Pixel Cosine = 0.9994, NCC = 0.9981
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2023-11-27_08.16.15.984_1_(18251)_ch_18253_6629876214832095233_0.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2023-11-27_08.16.15.984_1_(18251)_ch_18253_6629876214832095233_0.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2023-11-27`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2023-11-27_08.20.39.258_1_(18722)_ch_18724_5116666740170404865_0.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2023-11-27_08.20.39.258_1_(18722)_ch_18724_5116666740170404865_0.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2023-11-27`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-11-27_08.15.57.066_1_(18215)_ch_18217_6557818620784481281_0.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-11-27_08.15.57.066_1_(18215)_ch_18217_6557818620784481281_0.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2023-11-27`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-11-27_08.16.07.584_1_(18235)_ch_18237_7998970501548425217_0.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-11-27_08.16.07.584_1_(18235)_ch_18237_7998970501548425217_0.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2023-11-27`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-11-27_08.16.14.817_1_(18250)_ch_18252_2090247790442037761_0.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-11-27_08.16.14.817_1_(18250)_ch_18252_2090247790442037761_0.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2023-11-27`
  - *(其余 13 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0014` (🚨 **[跨来源泄漏]**)

- **成员数量**: 17 张图片
- **来源分布**: LEGACY_TEST: 1, LEGACY_TRAIN: 16
- **DINO 相似度**: 0.9801 ~ 0.9940 (均值 0.9869)
- **二次验证指标**: Pixel Cosine = 0.9999, NCC = 0.9998
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-18_18.02.53.983_(420)_1_-1_2_ch_419_14_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-18_18.02.53.983_(420)_1_-1_2_ch_419_14_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-08-18`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_17.58.51.508_(30)_1_-1_2_ch_29_14_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_17.58.51.508_(30)_1_-1_2_ch_29_14_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-08-18`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_17.59.21.530_(70)_1_-1_2_ch_69_14_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_17.59.21.530_(70)_1_-1_2_ch_69_14_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-08-18`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_18.00.14.772_(168)_1_-1_2_ch_167_14_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_18.00.14.772_(168)_1_-1_2_ch_167_14_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-08-18`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_18.00.17.302_(173)_1_-1_2_ch_172_14_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_18.00.17.302_(173)_1_-1_2_ch_172_14_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-08-18`
  - *(其余 12 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0013` (🚨 **[跨来源泄漏]**)

- **成员数量**: 17 张图片
- **来源分布**: LEGACY_TEST: 1, LEGACY_TRAIN: 16
- **DINO 相似度**: 0.9804 ~ 0.9906 (均值 0.9842)
- **二次验证指标**: Pixel Cosine = 1.0, NCC = 0.9998
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-10-25_12.57.57.968_(5222)_1_-1_1_ch_5221_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-10-25_12.57.57.968_(5222)_1_-1_1_ch_5221_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2025-10-25`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-22_05.05.31.583_(17550)_1_-1_1_ch_17549_18_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-22_05.05.31.583_(17550)_1_-1_1_ch_17549_18_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-10-22`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-25_12.57.27.899_(5160)_1_-1_1_ch_5159_12_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-25_12.57.27.899_(5160)_1_-1_1_ch_5159_12_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-10-25`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-25_12.57.28.787_(5162)_1_-1_1_ch_5161_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-25_12.57.28.787_(5162)_1_-1_1_ch_5161_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-10-25`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-25_12.57.32.117_(5169)_1_-1_1_ch_5168_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-25_12.57.32.117_(5169)_1_-1_1_ch_5168_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-10-25`
  - *(其余 12 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0015` (🚨 **[跨来源泄漏]**)

- **成员数量**: 16 张图片
- **来源分布**: LEGACY_TEST: 1, LEGACY_TRAIN: 15
- **DINO 相似度**: 0.9801 ~ 1.0000 (均值 0.9866)
- **二次验证指标**: Pixel Cosine = 0.9996, NCC = 0.9985
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2023_09_04_19_13_08_128540_copy_0_250904.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2023_09_04_19_13_08_128540_copy_0_250904.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2023_09_04`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-08-28_09.07.18.844_2_(23321)_ch_23322_1585277658243102724_3.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-08-28_09.07.18.844_2_(23321)_ch_23322_1585277658243102724_3.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2023-08-28`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-08-28_09.20.30.278_2_(166)_ch_167_2233796004989668356_3.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-08-28_09.20.30.278_2_(166)_ch_167_2233796004989668356_3.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2023-08-28`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023_09_04_19_12_49_898814.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023_09_04_19_12_49_898814.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2023_09_04`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023_09_04_19_13_09_959693.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023_09_04_19_13_09_959693.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2023_09_04`
  - *(其余 11 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0017` (🚨 **[跨来源泄漏]**)

- **成员数量**: 15 张图片
- **来源分布**: LEGACY_TEST: 2, LEGACY_TRAIN: 13
- **DINO 相似度**: 0.9801 ~ 0.9955 (均值 0.9871)
- **二次验证指标**: Pixel Cosine = 0.999, NCC = 0.9969
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-10-28_12.01.40.662_(5925)_1_-1_1_ch_5924_14_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-10-28_12.01.40.662_(5925)_1_-1_1_ch_5924_14_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2025-10-28`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-10-28_12.03.44.335_(6155)_1_-1_1_ch_6154_14_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-10-28_12.03.44.335_(6155)_1_-1_1_ch_6154_14_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2025-10-28`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-27_12.30.52.543_(16217)_1_-1_1_ch_16216_19_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-27_12.30.52.543_(16217)_1_-1_1_ch_16216_19_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-10-27`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-28_12.00.40.128_(5787)_1_-1_1_ch_5786_14_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-28_12.00.40.128_(5787)_1_-1_1_ch_5786_14_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-10-28`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-28_12.00.44.485_(5797)_1_-1_1_ch_5796_14_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-28_12.00.44.485_(5797)_1_-1_1_ch_5796_14_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-10-28`
  - *(其余 10 个样本略，详见 verified_groups.json)*

---
**说明**:
1. `candidate_groups.json`: 涵盖所有视觉相似度高的候选，用于评估粗粒度数据分布及高召回排查；
2. `verified_groups.json`: 经过严格 NCC / 像素比对的真近重复，作为后续 Step 4 Split 去泄漏的核心阻断依据；
3. 本报告严格遵守无破坏原则，未自动修改数据库中的质量标签。
