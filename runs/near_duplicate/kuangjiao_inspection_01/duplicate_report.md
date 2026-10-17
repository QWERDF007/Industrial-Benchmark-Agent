# Visual Near-Duplicate Audit Report: kuangjiao_inspection_01

> 本报告由 Industrial AD Benchmark Agent (Step 2 Closeout & Verified Duplicate) 自动生成。  
> ⚠️ **核心原则**: 本报告产出分层为 **Candidate（高召回候选）** 与 **Verified（高置信二次验证）**。系统**未自动修改任何图像的质检标签**，亦**未自动删除任何样本**。

## 1. 挖掘与验证双层摘要 (Two-Tier Summary)

| 指标维度 | 候选层 (Candidate Level) | 确认层 (Verified Level) | 语义说明 |
|---|---:|---:|---|
| **判断依据** | DINOv2 Cosine `>= 0.98` | DINOv2 + NCC/Pixel Cosine 验证 | 候选负责全量召回，验证负责高置信收敛 |
| **群组数量 (Groups)** | 558 | 460 | 连通分量聚类群组数 |
| **涉及样本数 (Samples)** | 2,189 | 1,379 | 群组包含的总图片数 |
| **样本覆盖率 (Coverage)** | **43.14%** | **27.18%** | 占数据集总样本 (5,074) 比例 |
| **跨来源群组 (Cross-Origin)** | 186 | 146 | 跨历史 Train/Test/Augmented 碰撞群组 |

- **总耗时**: 143.05 s

## 2. 跨数据来源交叉碰撞对比 (Cross-Origin Comparison)

| 数据来源交叉碰撞 (Cross-Origin Pair) | 候选对数 (Candidate Pairs) | 确认对数 (Verified Pairs) | 潜在风险说明 |
|---|---:|---:|---|
| `AUGMENTED <-> LEGACY_TEST` | 5 | **5** | 原图与数据增强图极度相似，必须划分至同一 Split |
| `AUGMENTED <-> LEGACY_TRAIN` | 40 | **37** | 原图与数据增强图极度相似，必须划分至同一 Split |
| `AUGMENTED <-> MISSED_CASE` | 1 | **1** | 原图与数据增强图极度相似，必须划分至同一 Split |
| `LEGACY_TEST <-> LEGACY_TRAIN` | 1,286 | **403** | 历史训练集与测试集重复，存在重大评测泄漏风险 |
| `LEGACY_TRAIN <-> MISSED_CASE` | 4 | **4** | 跨域样本高度相似 |

## 3. 高置信近重复群组 (Top Verified Duplicate Groups)

展示经过像素级 NCC 与 Pixel Cosine 二次验证确认的近重复群组：

### 群组 `ver_group_0001` (🚨 **[跨来源泄漏]**)

- **成员数量**: 81 张图片
- **来源分布**: LEGACY_TEST: 10, LEGACY_TRAIN: 71
- **DINO 相似度**: 0.9800 ~ 0.9937 (均值 0.9860)
- **二次验证指标**: Pixel Cosine = 0.9999, NCC = 0.9995
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_06.55.35.940_(1200)_1_-1_1_ch_1199_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_06.55.35.940_(1200)_1_-1_1_ch_1199_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_06.55.38.495_(1206)_1_-1_1_ch_1205_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_06.55.38.495_(1206)_1_-1_1_ch_1205_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.06.50.598_(1415)_1_-1_1_ch_1414_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.06.50.598_(1415)_1_-1_1_ch_1414_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.07.30.681_(1490)_1_-1_1_ch_1489_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.07.30.681_(1490)_1_-1_1_ch_1489_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.07.47.224_(1523)_1_-1_1_ch_1522_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.07.47.224_(1523)_1_-1_1_ch_1522_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - *(其余 76 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0002` (🚨 **[跨来源泄漏]**)

- **成员数量**: 51 张图片
- **来源分布**: LEGACY_TEST: 5, LEGACY_TRAIN: 46
- **DINO 相似度**: 0.9800 ~ 0.9924 (均值 0.9846)
- **二次验证指标**: Pixel Cosine = 0.9998, NCC = 0.9994
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_06.57.58.945_(1275)_1_-1_1_ch_1274_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_06.57.58.945_(1275)_1_-1_1_ch_1274_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.07.10.459_(1445)_1_-1_1_ch_1444_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.07.10.459_(1445)_1_-1_1_ch_1444_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.10.49.705_(1691)_1_-1_1_ch_1690_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.10.49.705_(1691)_1_-1_1_ch_1690_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.12.03.228_(1838)_1_-1_1_ch_1837_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.12.03.228_(1838)_1_-1_1_ch_1837_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.14.59.501_(2192)_1_-1_1_ch_2191_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_07.14.59.501_(2192)_1_-1_1_ch_2191_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - *(其余 46 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0003` (🚨 **[跨来源泄漏]**)

- **成员数量**: 32 张图片
- **来源分布**: LEGACY_TEST: 5, LEGACY_TRAIN: 27
- **DINO 相似度**: 0.9800 ~ 0.9932 (均值 0.9855)
- **二次验证指标**: Pixel Cosine = 1.0, NCC = 0.9999
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_10.03.40.765_(19245)_1_-1_1_ch_19244_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_10.03.40.765_(19245)_1_-1_1_ch_19244_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_10.05.21.969_(19437)_1_-1_1_ch_19436_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_10.05.21.969_(19437)_1_-1_1_ch_19436_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_10.07.22.195_(19597)_1_-1_1_ch_19596_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_10.07.22.195_(19597)_1_-1_1_ch_19596_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_10.10.53.749_(19776)_1_-1_1_ch_19775_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_10.10.53.749_(19776)_1_-1_1_ch_19775_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_10.12.40.629_(19977)_1_-1_1_ch_19976_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-15_10.12.40.629_(19977)_1_-1_1_ch_19976_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-15`
  - *(其余 27 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0004` (🚨 **[跨来源泄漏]**)

- **成员数量**: 30 张图片
- **来源分布**: LEGACY_TEST: 3, LEGACY_TRAIN: 27
- **DINO 相似度**: 0.9801 ~ 0.9920 (均值 0.9860)
- **二次验证指标**: Pixel Cosine = 0.9999, NCC = 0.9992
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-01_08.47.10.456_(248)_1_-1_2_ch_247_1_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-01_08.47.10.456_(248)_1_-1_2_ch_247_1_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-01`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-01_08.47.27.033_(281)_1_-1_2_ch_280_1_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-01_08.47.27.033_(281)_1_-1_2_ch_280_1_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-01`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-01_08.48.00.644_(348)_1_-1_2_ch_347_1_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-07-01_08.48.00.644_(348)_1_-1_2_ch_347_1_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-07-01`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-07-01_07.35.16.498_(232)_1_-1_2_ch_231_1_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-07-01_07.35.16.498_(232)_1_-1_2_ch_231_1_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-07-01`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-07-01_07.35.17.508_(234)_1_-1_2_ch_233_1_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-07-01_07.35.17.508_(234)_1_-1_2_ch_233_1_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-07-01`
  - *(其余 25 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0005` (🚨 **[跨来源泄漏]**)

- **成员数量**: 29 张图片
- **来源分布**: LEGACY_TEST: 6, LEGACY_TRAIN: 23
- **DINO 相似度**: 0.9801 ~ 0.9924 (均值 0.9858)
- **二次验证指标**: Pixel Cosine = 0.9999, NCC = 0.9996
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-22_11.25.29.612_(18609)_1_-1_2_ch_18608_12_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-22_11.25.29.612_(18609)_1_-1_2_ch_18608_12_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-08-22`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-22_11.25.33.292_(18618)_1_-1_2_ch_18617_12_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-22_11.25.33.292_(18618)_1_-1_2_ch_18617_12_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-08-22`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-22_11.25.38.616_(18631)_1_-1_2_ch_18630_12_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-22_11.25.38.616_(18631)_1_-1_2_ch_18630_12_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-08-22`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-22_11.25.41.100_(18637)_1_-1_2_ch_18636_12_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-22_11.25.41.100_(18637)_1_-1_2_ch_18636_12_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-08-22`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-22_11.25.49.897_(18657)_1_-1_2_ch_18656_12_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-22_11.25.49.897_(18657)_1_-1_2_ch_18656_12_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-08-22`
  - *(其余 24 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0008` (🚨 **[跨来源泄漏]**)

- **成员数量**: 10 张图片
- **来源分布**: LEGACY_TEST: 1, LEGACY_TRAIN: 9
- **DINO 相似度**: 0.9823 ~ 0.9940 (均值 0.9884)
- **二次验证指标**: Pixel Cosine = 0.9998, NCC = 0.9995
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-18_18.02.53.983_(420)_1_-1_2_ch_419_14_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-18_18.02.53.983_(420)_1_-1_2_ch_419_14_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-08-18`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_17.58.51.508_(30)_1_-1_2_ch_29_14_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_17.58.51.508_(30)_1_-1_2_ch_29_14_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-08-18`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_17.59.21.530_(70)_1_-1_2_ch_69_14_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_17.59.21.530_(70)_1_-1_2_ch_69_14_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-08-18`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_18.00.14.772_(168)_1_-1_2_ch_167_14_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_18.00.14.772_(168)_1_-1_2_ch_167_14_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-08-18`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_18.00.26.252_(188)_1_-1_2_ch_187_14_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_18.00.26.252_(188)_1_-1_2_ch_187_14_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-08-18`
  - *(其余 5 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0009` (🚨 **[跨来源泄漏]**)

- **成员数量**: 9 张图片
- **来源分布**: LEGACY_TEST: 1, LEGACY_TRAIN: 8
- **DINO 相似度**: 0.9800 ~ 0.9910 (均值 0.9861)
- **二次验证指标**: Pixel Cosine = 0.9999, NCC = 0.9994
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-18_15.02.36.332_(31591)_1_-1_2_ch_31590_14_3_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-08-18_15.02.36.332_(31591)_1_-1_2_ch_31590_14_3_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-08-18`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_15.02.40.990_(31599)_1_-1_2_ch_31598_14_3_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_15.02.40.990_(31599)_1_-1_2_ch_31598_14_3_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-08-18`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_15.03.03.879_(31647)_1_-1_2_ch_31646_14_3_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_15.03.03.879_(31647)_1_-1_2_ch_31646_14_3_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-08-18`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_15.06.08.263_(32027)_1_-1_2_ch_32026_14_3_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_15.06.08.263_(32027)_1_-1_2_ch_32026_14_3_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-08-18`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_15.07.03.400_(32141)_1_-1_2_ch_32140_14_3_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-08-18_15.07.03.400_(32141)_1_-1_2_ch_32140_14_3_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-08-18`
  - *(其余 4 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0010` (🚨 **[跨来源泄漏]**)

- **成员数量**: 9 张图片
- **来源分布**: LEGACY_TEST: 1, LEGACY_TRAIN: 8
- **DINO 相似度**: 0.9803 ~ 0.9879 (均值 0.9844)
- **二次验证指标**: Pixel Cosine = 0.9998, NCC = 0.9994
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-09-03_10.19.17.834_(1397)_1_-1_1_ch_1396_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-09-03_10.19.17.834_(1397)_1_-1_1_ch_1396_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2025-09-03`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-03_10.19.26.948_(1417)_1_-1_1_ch_1416_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-03_10.19.26.948_(1417)_1_-1_1_ch_1416_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-09-03`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-03_10.19.37.380_(1441)_1_-1_1_ch_1440_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-03_10.19.37.380_(1441)_1_-1_1_ch_1440_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-09-03`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-03_10.21.16.429_(1669)_1_-1_1_ch_1668_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-03_10.21.16.429_(1669)_1_-1_1_ch_1668_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-09-03`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-03_10.22.18.101_(1811)_1_-1_1_ch_1810_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-03_10.22.18.101_(1811)_1_-1_1_ch_1810_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-09-03`
  - *(其余 4 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0014` (🚨 **[跨来源泄漏]**)

- **成员数量**: 7 张图片
- **来源分布**: LEGACY_TEST: 1, LEGACY_TRAIN: 6
- **DINO 相似度**: 1.0000 ~ 1.0000 (均值 1.0000)
- **二次验证指标**: Pixel Cosine = 1.0, NCC = 1.0
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-05-07_10.58.04.649_(5443)_1_-1_2_ch_5442__copy_2_260324.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2026-05-07_10.58.04.649_(5443)_1_-1_2_ch_5442__copy_2_260324.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2026-05-07`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-05-07_10.58.04.649_(5443)_1_-1_2_ch_5442_1_1_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-05-07_10.58.04.649_(5443)_1_-1_2_ch_5442_1_1_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-05-07`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-05-07_10.58.04.649_(5443)_1_-1_2_ch_5442__copy_0_260324.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-05-07_10.58.04.649_(5443)_1_-1_2_ch_5442__copy_0_260324.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-05-07`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-05-07_10.58.04.649_(5443)_1_-1_2_ch_5442__copy_1_260324.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-05-07_10.58.04.649_(5443)_1_-1_2_ch_5442__copy_1_260324.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-05-07`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-05-07_10.58.04.649_(5443)_1_-1_2_ch_5442__copy_2_260324.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2026-05-07_10.58.04.649_(5443)_1_-1_2_ch_5442__copy_2_260324.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2026-05-07`
  - *(其余 2 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0018` (🚨 **[跨来源泄漏]**)

- **成员数量**: 7 张图片
- **来源分布**: LEGACY_TEST: 1, LEGACY_TRAIN: 6
- **DINO 相似度**: 0.9834 ~ 0.9950 (均值 0.9894)
- **二次验证指标**: Pixel Cosine = 0.9999, NCC = 0.9995
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-10-28_12.03.44.335_(6155)_1_-1_1_ch_6154_14_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-10-28_12.03.44.335_(6155)_1_-1_1_ch_6154_14_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2025-10-28`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-28_12.00.40.128_(5787)_1_-1_1_ch_5786_14_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-28_12.00.40.128_(5787)_1_-1_1_ch_5786_14_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-10-28`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-28_12.01.03.798_(5841)_1_-1_1_ch_5840_14_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-28_12.01.03.798_(5841)_1_-1_1_ch_5840_14_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-10-28`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-28_12.01.16.069_(5869)_1_-1_1_ch_5868_14_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-28_12.01.16.069_(5869)_1_-1_1_ch_5868_14_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-10-28`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-28_12.01.16.959_(5871)_1_-1_1_ch_5870_14_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-28_12.01.16.959_(5871)_1_-1_1_ch_5870_14_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-10-28`
  - *(其余 2 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0013` (🚨 **[跨来源泄漏]**)

- **成员数量**: 7 张图片
- **来源分布**: LEGACY_TEST: 1, LEGACY_TRAIN: 6
- **DINO 相似度**: 0.9811 ~ 0.9896 (均值 0.9856)
- **二次验证指标**: Pixel Cosine = 0.9999, NCC = 0.9997
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-10-25_12.57.57.968_(5222)_1_-1_1_ch_5221_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-10-25_12.57.57.968_(5222)_1_-1_1_ch_5221_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2025-10-25`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-25_12.57.32.117_(5169)_1_-1_1_ch_5168_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-25_12.57.32.117_(5169)_1_-1_1_ch_5168_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-10-25`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-25_12.57.35.315_(5176)_1_-1_1_ch_5175_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-25_12.57.35.315_(5176)_1_-1_1_ch_5175_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-10-25`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-25_12.57.36.714_(5179)_1_-1_1_ch_5178_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-25_12.57.36.714_(5179)_1_-1_1_ch_5178_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-10-25`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-25_12.57.41.368_(5189)_1_-1_1_ch_5188_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-25_12.57.41.368_(5189)_1_-1_1_ch_5188_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-10-25`
  - *(其余 2 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0015` (🚨 **[跨来源泄漏]**)

- **成员数量**: 7 张图片
- **来源分布**: LEGACY_TEST: 1, LEGACY_TRAIN: 6
- **DINO 相似度**: 0.9810 ~ 0.9887 (均值 0.9857)
- **二次验证指标**: Pixel Cosine = 0.9999, NCC = 0.9995
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-10-10_11.03.53.040_(1810)_1_-1_1_ch_1809_19_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-10-10_11.03.53.040_(1810)_1_-1_1_ch_1809_19_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2025-10-10`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-10_11.04.12.092_(1849)_1_-1_1_ch_1848_14_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-10_11.04.12.092_(1849)_1_-1_1_ch_1848_14_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-10-10`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-10_11.04.33.555_(1893)_1_-1_1_ch_1892_14_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-10_11.04.33.555_(1893)_1_-1_1_ch_1892_14_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-10-10`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-10_11.04.46.118_(1920)_1_-1_1_ch_1919_14_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-10_11.04.46.118_(1920)_1_-1_1_ch_1919_14_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-10-10`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-10_11.04.57.082_(1943)_1_-1_1_ch_1942_14_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-10_11.04.57.082_(1943)_1_-1_1_ch_1942_14_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-10-10`
  - *(其余 2 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0012` (🚨 **[跨来源泄漏]**)

- **成员数量**: 7 张图片
- **来源分布**: LEGACY_TEST: 2, LEGACY_TRAIN: 5
- **DINO 相似度**: 0.9804 ~ 0.9882 (均值 0.9835)
- **二次验证指标**: Pixel Cosine = 1.0, NCC = 0.9998
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-09-10_09.13.29.934_(8557)_1_-1_2_ch_8556_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-09-10_09.13.29.934_(8557)_1_-1_2_ch_8556_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2025-09-10`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-09-10_09.13.33.139_(8565)_1_-1_2_ch_8564_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-09-10_09.13.33.139_(8565)_1_-1_2_ch_8564_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2025-09-10`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-10_09.12.49.974_(8475)_1_-1_2_ch_8474_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-10_09.12.49.974_(8475)_1_-1_2_ch_8474_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-09-10`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-10_09.12.51.488_(8479)_1_-1_2_ch_8478_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-10_09.12.51.488_(8479)_1_-1_2_ch_8478_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-09-10`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-10_09.12.55.625_(8490)_1_-1_2_ch_8489_1_0_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-10_09.12.55.625_(8490)_1_-1_2_ch_8489_1_0_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-09-10`
  - *(其余 2 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0017` (🚨 **[跨来源泄漏]**)

- **成员数量**: 7 张图片
- **来源分布**: LEGACY_TEST: 1, LEGACY_TRAIN: 6
- **DINO 相似度**: 0.9801 ~ 0.9872 (均值 0.9831)
- **二次验证指标**: Pixel Cosine = 0.9998, NCC = 0.9995
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2023-11-27_08.20.39.258_1_(18722)_ch_18724_5116666740170404865_0.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2023-11-27_08.20.39.258_1_(18722)_ch_18724_5116666740170404865_0.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2023-11-27`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-11-27_08.20.19.114_1_(18664)_ch_18666_5909300274577297921_0.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-11-27_08.20.19.114_1_(18664)_ch_18666_5909300274577297921_0.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2023-11-27`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-11-27_08.20.35.615_1_(18711)_ch_18713_1657902226347998721_0.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-11-27_08.20.35.615_1_(18711)_ch_18713_1657902226347998721_0.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2023-11-27`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-11-27_08.20.36.267_1_(18712)_ch_18714_2810823730955179521_0.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-11-27_08.20.36.267_1_(18712)_ch_18714_2810823730955179521_0.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2023-11-27`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-11-27_08.20.41.765_1_(18727)_ch_18729_1874075008464931329_0.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023-11-27_08.20.41.765_1_(18727)_ch_18729_1874075008464931329_0.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2023-11-27`
  - *(其余 2 个样本略，详见 verified_groups.json)*

### 群组 `ver_group_0016` (🚨 **[跨来源泄漏]**)

- **成员数量**: 7 张图片
- **来源分布**: LEGACY_TEST: 2, LEGACY_TRAIN: 5
- **DINO 相似度**: 0.9800 ~ 0.9859 (均值 0.9834)
- **二次验证指标**: Pixel Cosine = 0.9998, NCC = 0.9988
- **代表性成员样本**:
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-09-03_08.51.13.211_(31080)_1_-1_1_ch_31079_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-09-03_08.51.13.211_(31080)_1_-1_1_ch_31079_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2025-09-03`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-09-03_08.51.14.421_(31083)_1_-1_1_ch_31082_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2025-09-03_08.51.14.421_(31083)_1_-1_1_ch_31082_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TEST` | 批次: `2025-09-03`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-03_08.51.11.993_(31077)_1_-1_1_ch_31076_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-03_08.51.11.993_(31077)_1_-1_1_ch_31076_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-09-03`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-03_08.51.12.435_(31078)_1_-1_1_ch_31077_1_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-03_08.51.12.435_(31078)_1_-1_1_ch_31077_1_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-09-03`
  - `kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-03_09.03.49.841_(31154)_1_-1_1_ch_31153_19_2_.png` | 路径: `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-03_09.03.49.841_(31154)_1_-1_1_ch_31153_19_2_.png` | 状态: `UNCERTAIN` | 来源: `LEGACY_TRAIN` | 批次: `2025-09-03`
  - *(其余 2 个样本略，详见 verified_groups.json)*

---
**说明**:
1. `candidate_groups.json`: 涵盖所有视觉相似度高的候选，用于评估粗粒度数据分布及高召回排查；
2. `verified_groups.json`: 经过严格 NCC / 像素比对的真近重复，作为后续 Step 4 Split 去泄漏的核心阻断依据；
3. 本报告严格遵守无破坏原则，未自动修改数据库中的质量标签。
