# Dataset Audit Report: kuangjiao_inspection_01

> 本报告由 Industrial AD Benchmark Core v2 自动生成。

## 1. Inspection Task 基本信息

- **Task ID**: `kuangjiao_inspection_01`
- **Product**: `kuangjiao`
- **Station**: `station_01`
- **Camera**: `cam_01`
- **Inspection Target**: `glue_defect`
- **Description**: 框胶10x连线蓝色背面厚外观缺陷检测

## 2. 数据规模与质量分布 (Samples)

| 类别 | 数量 | 占比 | 说明 |
|---|---:|---:|---|
| **总样本数 (Total Samples)** | 5074 | 100.0% | 资产目录内有效图像全集 |
| PASS (良品) | 5 | 0.1% | 经显式规则确认为良品 |
| FAIL (缺陷/不良) | 4 | 0.1% | 经显式规则确认为不良 |
| UNCERTAIN (未定/无明确质检标签) | 5065 | 99.8% | 缺少明确可信标签，保留 UNCERTAIN |

### 2.1 数据来源谱系分布 (Data Origin Distribution)

| 数据来源 (Data Origin) | 样本数量 | 占比 |
|---|---:|---:|
| `LEGACY_TRAIN` | 4,508 | 88.8% |
| `LEGACY_TEST` | 505 | 10.0% |
| `AUGMENTED` | 57 | 1.1% |
| `MISSED_CASE` | 4 | 0.1% |

## 3. 标注与几何质量统计 (Annotations & Geometry)

| 标注项 | 统计值 | 说明 |
|---|---:|---|
| **总标注几何体数** | 6754 | 原始提取到的所有标注 |
| 边界框总数 (BBox Total) | 6754 | 全部 BBox 标注数 |
| - 合法未修改 (BBox Valid) | 6377 | 坐标位于图像尺寸边界内 |
| - 安全截断修复 (BBox Clipped) | 377 | 依据 Policy 安全裁剪至有效范围 |
| - 比例缩放 (BBox Scaled) | 0 | 依据源图尺寸失配 Policy 缩放 |
| - 无效/不可用 (BBox Invalid) | 0 | 越界被 Policy 拒绝，不参与评测 |
| **可用 BBox 数 (BBox Usable)** | **6754** | **Valid + Clipped + Scaled** |
| 多边形 (Polygon) | 0 | - |
| 掩膜 (Mask) | 0 | - |
| 图像级标注 (Image-level) | 0 | - |
| 已标注样本数 (Annotated Samples) | 3641 | 至少包含 1 个标注的图像样本 |
| 未标注样本数 (Unannotated Samples) | 1433 | 无任何标注的图像样本 |

## 4. 元数据完整率与缺失统计 (Metadata)

| 字段 | 缺失率 | 唯一值数量 / 状态 |
|---|---:|---|
| `batch_id` (生产批次) | 0.3% | 425 批次 |
| `physical_sample_id` (物理工件 ID) | 18.0% | - |
| `capture_sequence_id` (拍摄序号/时间戳) | 100.0% | - |
| `station` (工位) | 0.0% | 1 工位 |
| `camera` (相机) | 0.0% | 1 相机 |

## 5. 数据导入与质量问题 (Import Issues)

| 问题类型 (Issue Type) | 发生频次 |
|---|---:|
| `invalid_bbox` | 377 |

## 6. Benchmark Track 就绪性判定 (Track Readiness V2)

| 评测赛道 (Track) | 就绪状态 | 判定依据 (Readiness Basis) |
|---|:---:|---|
| **Standard AD** | `PARTIAL` | PASS=5, FAIL=4 present; no readiness policy configured (PARTIAL by default) |
| **Open Normal** | `NOT_EVALUATED` | Hard Normal Mining not evaluated at dataset audit stage |
| **Domain Shift** | `NOT_EVALUATED` | Distinct batches=425 but metadata semantic unconfirmed |
| **Small / Weak** | `PARTIAL` | Usable BBox=6754 (valid=6377, clipped=377, scaled=0) |
| **Global / Logical** | `NOT_EVALUATED` | No logical/sequence anomaly labels |

## 7. 现象与分辨率分布

### 7.1 现象标签分布 (Phenomenon Distribution)

| 现象 (Phenomenon) | 标注数量 |
|---|---:|
| `foreign_object` | 2297 |
| `breakage` | 1926 |
| `deformation` | 607 |
| `glue_overflow` | 575 |
| `displacement` | 506 |
| `stain` | 397 |
| `contamination` | 241 |
| `scratch` | 107 |
| `missing` | 64 |
| `bubble` | 34 |

### 7.2 分辨率分布 (Resolution Distribution TOP 15)

| 分辨率 (WxH) | 样本数 |
|---|---:|
| `745x613` | 166 |
| `902x633` | 154 |
| `964x705` | 144 |
| `846x633` | 107 |
| `893x610` | 84 |
| `989x755` | 68 |
| `869x631` | 58 |
| `937x705` | 57 |
| `890x610` | 52 |
| `952x705` | 47 |
| `854x621` | 46 |
| `837x691` | 45 |
| `819x630` | 44 |
| `1205x1010` | 44 |
| `999x755` | 43 |
