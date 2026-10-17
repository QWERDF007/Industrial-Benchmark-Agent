# Dataset Audit Report: task_no_policy

> 本报告由 Industrial AD Benchmark Agent (Step 1 Closeout Audit) 自动生成。

## 1. Inspection Task 基本信息

- **Task ID**: `task_no_policy`
- **Product**: `N/A`
- **Station**: `N/A`
- **Camera**: `N/A`
- **Inspection Target**: `defect`
- **Description**: 无

## 2. 数据规模与质量分布 (Samples)

| 类别 | 数量 | 占比 | 说明 |
|---|---:|---:|---|
| **总样本数 (Total Samples)** | 9 | 100.0% | 资产目录内有效图像全集 |
| PASS (良品) | 5 | 55.6% | 经显式规则确认为良品 |
| FAIL (缺陷/不良) | 4 | 44.4% | 经显式规则确认为不良 (如漏检案例) |
| UNCERTAIN (未定/无明确质检标签) | 0 | 0.0% | 缺少明确可信标签，依法依规保留 UNCERTAIN |

### 2.1 数据来源谱系分布 (Data Origin Distribution)

| 数据来源 (Data Origin) | 样本数量 | 占比 |
|---|---:|---:|
| `UNKNOWN` | 9 | 100.0% |

## 3. 标注与几何质量统计 (Annotations & Geometry)

| 标注项 | 统计值 | 说明 |
|---|---:|---|
| **总标注几何体数** | 0 | 原始提取到的所有标注 |
| 边界框总数 (BBox Total) | 0 | 全部 BBox 标注数 |
| - 合法未修改 (BBox Valid) | 0 | 坐标位于图像尺寸边界内 |
| - 安全截断修复 (BBox Clipped) | 0 | 依据 Policy 安全裁剪至有效范围 |
| - 比例缩放 (BBox Scaled) | 0 | 依据源图尺寸失配 Policy 缩放 |
| - 无效/不可用 (BBox Invalid) | 0 | 越界被 Policy 拒绝或坐标倒置，不参与评测 |
| **可用 BBox 数 (BBox Usable)** | **0** | **Valid + Clipped + Scaled (真正可用于 Benchmark)** |
| 多边形 (Polygon) | 0 | - |
| 掩膜 (Mask) | 0 | - |
| 图像级标注 (Image-level) | 0 | - |
| 已标注样本数 (Annotated Samples) | 0 | 至少包含 1 个标注的图像样本 |
| 未标注样本数 (Unannotated Samples) | 9 | 无任何标注的图像样本 |

## 4. 元数据完整率与缺失统计 (Metadata)

| 字段 | 缺失率 | 唯一值数量 / 状态 |
|---|---:|---|
| `batch_id` (生产批次) | 100.0% | 0 批次 |
| `physical_sample_id` (物理工件 ID) | 100.0% | - |
| `capture_sequence_id` (拍摄序号/时间戳) | 100.0% | - |
| `station` (工位) | 100.0% | 0 工位 |
| `camera` (相机) | 100.0% | 0 相机 |

## 5. 数据导入与质量问题 (Import Issues)

未发现导入异常，所有样本均合规解析。

## 6. Benchmark Track 就绪性判定 (Track Readiness V2)

| 评测赛道 (Track) | 就绪状态 | 判定依据 (Readiness Basis) |
|---|:---:|---|
| **Standard AD** | `PARTIAL` | PASS=5, FAIL=4 present; no readiness policy configured (PARTIAL by default) |
| **Open Normal** | `NOT_EVALUATED` | Hard Normal Mining not executed in Step 1 |
| **Domain Shift** | `NOT_EVALUATED` | Insufficient domain diversity |
| **Small / Weak** | `NOT_EVALUATED` | No usable local geometry annotations |
| **Global / Logical** | `NOT_EVALUATED` | No logical/sequence anomaly labels |

## 7. 现象与分辨率分布

### 7.1 现象标签分布 (Phenomenon Distribution)

暂无现象标签。

### 7.2 分辨率分布 (Resolution Distribution TOP 15)

| 分辨率 (WxH) | 样本数 |
|---|---:|
| `100x100` | 9 |

---
**说明**: 本报告依据 Step 1 Closeout Specs 设计规则生成。已关闭数据唯一性、几何质量状态及赛道就绪性边界。
