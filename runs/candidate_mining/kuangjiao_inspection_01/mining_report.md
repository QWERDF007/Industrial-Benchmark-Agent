# Hard Normal Candidate Mining Report: kuangjiao_inspection_01

> 本报告由 Industrial AD Benchmark Agent (Step 3 Hard Normal Mining) 自动生成。  
> ⚠️ **核心原则**: 本报告仅提供按视觉稀有度、法向距离与异常信号排序的**待审核候选集 (Candidate Queue)**。系统**未做任何自动打标**，保留原始标签。

> ⚠️ **警告**: 当前任务可信基准良品 (Reference Normal) 数量不足 (8 个，建议 >= 30 个)。
> 当前 Normal Distance 分数基于有限良品计算，建议优先审核前排样本扩充 Reference Normal 集！

## 1. 挖掘与排序概览 (Mining Overview)

- **Task ID**: `kuangjiao_inspection_01`
- **策略名称 (Policy Name)**: `default`
- **候选样本池 (Candidate Pool)**: 5,008 个样本
- **选取 Top-K**: 500 个样本
- **多样性抑制后实际入选 (Diverse Selected)**: 500 个样本
- **多样性抑制阈值 (Diversity Threshold)**: `0.92`
- **基准良品总数 (Reference Normal Count)**: 8 个
- **运算耗时 (Elapsed Time)**: 4.91 s (100% 复用特征缓存，0 次重新推理)

### 1.1 基准良品构成 (Reference Normal Breakdown)

| 良品参考来源 | 样本数 | 占比 |
|---|---:|---:|
| 原始确定良品 (Raw Confirmed PASS) | 5 | 62.50% |
| 人工审核良品 (Review Confirmed PASS) | 0 | 0.00% |
| 审核高难良品 (Review HARD_NORMAL) | 3 | 37.50% |
| **总计有效基准 (Total Reference)** | **8** | 100.0% |

### 1.2 评分权重配置 (Scoring Weights)

- `normal_distance` (良品法向距离权重): **0.35**
- `density_outlier` (局部密度离群权重): **0.25**
- `domain_novelty` (批次跨域新颖度权重): **0.20**
- `annotation_signal` (标注几何特征权重): **0.20**

## 2. 候选样本特征分布 (Candidate Distribution)

### 2.1 数据来源分布 (Data Origin)

| 数据来源 (Origin) | 候选样本数 | 占比 |
|---|---:|---:|
| `LEGACY_TRAIN` | 453 | 90.60% |
| `LEGACY_TEST` | 47 | 9.40% |

### 2.2 生产批次分布 TOP 10 (Production Date / Batch)

| 批次标识 (Batch ID) | 候选样本数 |
|---|---:|
| `2023-11-27` | 52 |
| `22-080610` | 45 |
| `2025-09-04` | 13 |
| `2025-10-27` | 12 |
| `2025-09-03` | 12 |
| `2025-03-02` | 9 |
| `2023-10-16` | 9 |
| `2023_07_18` | 9 |
| `22-041813` | 8 |
| `22-052410` | 8 |

## 3. 高优先级候选样本 TOP 20 (Top Priority Candidates)

以下样本外观特征与常规正常模式偏离较大，且通过了视觉多样性抑制，优先进入人工审核队列：

| 排名 | 综合得分 | Normal Dist | Density Outlier | Domain Novelty | Ann Signal | 来源 | 批次 | 样本相对路径 |
|---:|---:|---:|---:|---:|---:|---|---|---|
| 1 | **0.7455** | 0.541 | 1.000 | 0.651 | 0.880 | `LEGACY_TRAIN` | `2025-11-03` | `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-11-03_14.24.56.549_(4621)_1_-1_2_ch_4620_16_0_.png` |
| 2 | **0.6512** | 0.564 | 0.559 | 0.819 | 0.752 | `LEGACY_TRAIN` | `22-092112` | `ExportImage_框胶10x连线蓝色背面厚_0904-Train/22-0921122911973__vec_image_1074005_64003_10789_TrackImg-174_3.png` |
| 3 | **0.6210** | 0.559 | 0.777 | 0.609 | 0.547 | `LEGACY_TRAIN` | `2025-09-04` | `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-04_02.56.09.769_(1211)_1_-1_2_ch_1210_25_2_.png` |
| 4 | **0.5882** | 0.406 | 0.642 | 0.534 | 0.893 | `LEGACY_TRAIN` | `2023_10_08` | `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023_10_08_16_12_00_780514.png` |
| 5 | **0.5875** | 0.525 | 0.762 | 0.498 | 0.567 | `LEGACY_TRAIN` | `2025-10-27` | `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-10-27_13.51.25.607_(21513)_1_-1_2_ch_21512_14_0_.png` |
| 6 | **0.5848** | 0.456 | 0.626 | 0.610 | 0.735 | `LEGACY_TRAIN` | `22-041813` | `ExportImage_框胶10x连线蓝色背面厚_0904-Train/22-0418131824001__vec_image_3200_1908_3199_ImageClipping-19_3.png` |
| 7 | **0.5829** | 0.497 | 0.484 | 0.695 | 0.745 | `LEGACY_TRAIN` | `22-092112` | `ExportImage_框胶10x连线蓝色背面厚_0904-Train/22-0921122912792__vec_image_1074036_64013_10791_TrackImg-174_3.png` |
| 8 | **0.5514** | 0.472 | 0.563 | 0.544 | 0.683 | `LEGACY_TRAIN` | `2023_08_21` | `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2023_08_21_20_56_15_862628.png` |
| 9 | **0.5509** | 0.434 | 0.572 | 0.542 | 0.737 | `LEGACY_TRAIN` | `22-041813` | `ExportImage_框胶10x连线蓝色背面厚_0904-Train/22-0418131819826__vec_image_3194_1874_3193_ImageClipping-19_3.png` |
| 10 | **0.5462** | 0.499 | 0.583 | 0.608 | 0.521 | `LEGACY_TRAIN` | `22-042011` | `ExportImage_框胶10x连线蓝色背面厚_0904-Train/22-0420111352853__vec_image_50_63_49_ImageClipping-19_3.png` |
| 11 | **0.5461** | 0.517 | 0.586 | 0.574 | 0.519 | `LEGACY_TRAIN` | `2025-03-02` | `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-03-02_03.37.47.470_(19369)_1_-1_2_ch_19368_17_2_.png` |
| 12 | **0.5444** | 0.452 | 0.607 | 0.427 | 0.747 | `LEGACY_TRAIN` | `2025-08-28` | `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-08-28_09.08.32.970_(43628)_1_-1_2_ch_43627_19_0_.png` |
| 13 | **0.5423** | 0.452 | 0.442 | 0.641 | 0.728 | `LEGACY_TRAIN` | `22-091918` | `ExportImage_框胶10x连线蓝色背面厚_0904-Train/22-0919181159366__vec_image_3385_522_89_TrackImg-174_3.png` |
| 14 | **0.5407** | 0.347 | 0.508 | 1.000 | 0.462 | `LEGACY_TEST` | `22-041512` | `ExportImage_框胶10x连线蓝色背面厚_0904-Test/22-0415125933574__vec_image_81_150_80_ImageClipping-152_2.png` |
| 15 | **0.5377** | 0.354 | 0.641 | 0.540 | 0.727 | `LEGACY_TRAIN` | `2024-07-05` | `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2024-07-05_15.53.57.888_1_(37390)_ch_37392_1369681640456650753_1.png` |
| 16 | **0.5375** | 0.397 | 0.650 | 0.416 | 0.765 | `LEGACY_TRAIN` | `2022_10_18` | `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2022_10_18_15_23_34_132092.png` |
| 17 | **0.5344** | 0.432 | 0.576 | 0.558 | 0.637 | `LEGACY_TEST` | `2023-11-27` | `ExportImage_框胶10x连线蓝色背面厚_0904-Test/2023-11-27_08.14.50.423_1_(18110)_ch_18112_4179918017498738177_3.png` |
| 18 | **0.5263** | 0.426 | 0.650 | 0.398 | 0.675 | `LEGACY_TRAIN` | `2025-09-04` | `ExportImage_框胶10x连线蓝色背面厚_0904-Train/2025-09-04_09.49.01.420_(51502)_1_-1_1_ch_51501_19_3_.png` |
| 19 | **0.5230** | 0.443 | 0.358 | 0.656 | 0.736 | `LEGACY_TRAIN` | `22-092108` | `ExportImage_框胶10x连线蓝色背面厚_0904-Train/22-0921085213983__vec_image_1963_281_49_TrackImg-174_1.png` |
| 20 | **0.5226** | 0.417 | 0.551 | 0.434 | 0.760 | `LEGACY_TRAIN` | `22-052410` | `ExportImage_框胶10x连线蓝色背面厚_0904-Train/22-0524104548008__vec_image_1839_1414_1838_ImageClipping-19_0.png` |

---
**后续审核指导 (Review Guidance)**:
1. 通过 `iad-benchmark review serve --task <task_id>` 启动轻量审核界面；
2. 优先对上述前排样本进行研判并给出决策 (`PASS`, `HARD_NORMAL`, `FAIL`, `UNCERTAIN`, `SKIP`)；
3. 标注为 `HARD_NORMAL` 的样本将作为高质量复杂正常参考，反哺后续 Benchmark 基准。
