# Industrial AD Benchmark Agent - Step 1: 数据基础层与 Dataset Scanner

[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-17%20passed-brightgreen.svg)]()

> **Step 1 目标**：将真实工业异常检测历史数据目录稳定转换为统一的结构化数据模型，批量持久化至 SQLite 数据库，并输出可审计的数据质量与 Benchmark 赛道就绪性报告。

---

## 目录

- [1. 核心设计原则](#1-核心设计原则)
- [2. 架构与工程结构](#2-架构与工程结构)
- [3. 环境与安装](#3-环境与安装)
- [4. 数据集配置 (Dataset Config)](#4-数据集配置-dataset-config)
- [5. 运行指南 (Scan & Audit)](#5-运行指南-scan--audit)
- [6. 标注与质量语义规范](#6-标注与质量语义规范)
- [7. Benchmark 赛道就绪性 (Track Readiness) 判定逻辑](#7-benchmark-赛道就绪性-track-readiness-判定逻辑)
- [8. 真实数据集接入情况 (框胶数据集)](#8-真实数据集接入情况-框胶数据集)
- [9. 如何新增 Dataset Adapter](#9-如何新增-dataset-adapter)
- [10. 测试套件](#10-测试套件)
- [11. 交付清单](#11-交付清单)

---

## 1. 核心设计原则

1. **视觉现象不等于质量结论**：
   - 彻底解耦 `Annotation` 与 `QualityLabel`。
   - 工业场景中，存在缺陷/瑕疵标注（如微小气泡或溢胶）不一定代表工件判定为 FAIL（良品在工艺容差范围内也可带瑕疵）。系统严禁因样本含有 `bbox` 就自动赋予 `FAIL`。
2. **不确定就保留 UNCERTAIN**：
   - 缺少可信质检判定来源时，`quality_status` 必须为 `UNCERTAIN`，绝不凭空推断或伪造 ground truth。
3. **Inspection Task 为数据组织基本单位**：
   - 按真实工位维度组织：`product + station + camera + inspection_target`。
4. **流式处理与鲁棒容错**：
   - 严禁全量像素加载入内存；仅读取图像 Header 获取尺寸，支持 10 万+ 张图像级扩展。
   - 单张损坏图像或非法标注坐标自动截断并记入 `import_issues` 表，不阻断主扫描流程。
5. **扫描幂等性**：
   - 以 `dataset_id + relative_path` 为逻辑唯一约束，重复执行扫描不会导致样本与标注记录膨胀。

---

## 2. 架构与工程结构

```text
Industrial-Benchmark-Agent/
├── app/
│   ├── schemas/              # Pydantic 核心数据模型与配置定义
│   │   ├── task.py           # InspectionTask
│   │   ├── sample.py         # Sample, QualityStatus (PASS, FAIL, UNCERTAIN)
│   │   ├── annotation.py     # Annotation, AnnotationType, AnnotationSource
│   │   ├── issue.py          # ImportIssue, IssueType, Severity
│   │   ├── audit.py          # DatasetAudit, TrackReadiness
│   │   └── config.py         # DatasetConfig, load_config
│   ├── adapters/             # 数据集格式适配层
│   │   ├── base.py           # DatasetAdapter 抽象基类与通用解析
│   │   ├── folder.py         # GenericFolderAdapter
│   │   ├── labelme.py        # LabelmeAdapter (支持矩形、多边形与配对路径替换)
│   │   └── yolo.py           # YOLOAdapter (归一化坐标转换)
│   ├── tools/
│   │   └── dataset.py        # 顶层数据扫描与审计工具入口
│   ├── services/             # 业务服务层
│   │   ├── dataset_service.py # 流式批量扫描与事务写入 (scan_dataset)
│   │   └── audit_service.py  # 审计聚合统计与 Markdown/JSON 报告生成 (audit_dataset)
│   ├── storage/              # SQLite 存储层
│   │   ├── database.py       # WAL 模式与表结构初始化
│   │   └── repositories.py   # Task, Sample, Annotation, Issue 仓储操作
│   └── cli/
│       └── main.py           # Typer CLI (iad-benchmark scan / audit)
├── configs/
│   ├── example.yaml          # 规范示例配置
│   └── kuangjiao.yaml        # 真实工业数据配置 (框胶外观检测)
├── scripts/
│   ├── scan_dataset.py       # 独立扫描脚本
│   └── audit_dataset.py      # 独立审计脚本
├── tests/                    # 完整单元与集成测试套件
│   ├── test_schema.py        # Schema 约束与合法性测试
│   ├── test_database.py      # 数据库与幂等性测试
│   ├── test_adapters.py      # Folder, Labelme, YOLO Adapter 测试
│   ├── test_scanner.py       # 数据集扫描端到端与异常恢复测试
│   └── test_audit.py         # 审计统计精度与赛道判定测试
├── data/
│   └── benchmark.db          # SQLite 数据库持久化存储
└── runs/
    └── dataset_audit/        # 审计输出报告目录
        └── <task_id>/
            ├── audit_report.json
            └── audit_report.md
```

---

## 3. 环境与安装

本项目使用 Python 3.8+。推荐使用既有的 conda 环境：

```bash
# 激活环境
conda activate dinomaly
# 或使用完整二进制路径: /home/dell/anaconda3/envs/dinomaly/bin/python

# 安装本工程依赖 (以可编辑模式安装)
pip install -e .
```

---

## 4. 数据集配置 (Dataset Config)

通过 YAML 文件声明数据集目录、检测任务、质检标签来源与标注转换规则。以生产线框胶数据为例 (`configs/kuangjiao.yaml`)：

```yaml
dataset:
  id: kuangjiao_dataset
  description: "生产线框胶外观缺陷检测历史数据"

root: /data1/wt/data/框胶数据集

task:
  task_id: kuangjiao_inspection_01
  product: kuangjiao
  station: station_01
  camera: cam_01
  inspection_target: glue_defect
  description: "框胶10x连线蓝色背面厚外观缺陷检测"

images:
  glob:
    - "**/*.png"
    - "**/*.jpg"
  exclude: []

quality:
  source: folder
  default: UNCERTAIN
  mapping:
    "漏检": FAIL
    "良品": PASS
    "good": PASS
    "bad": FAIL

annotations:
  format: labelme
  labels:
    "1": scratch
    "11": bubble
    "12": contamination
    "13": foreign_object
    "14": deformation
    "15": breakage
    "16": displacement
    "17": stain
    "18": glue_overflow
    "19": missing
  source: imported
  location_mode: auto
  folder_replace:
    "ExportImage_": "ExportLabel_"

metadata:
  batch_id:
    source: filename_regex
    pattern: "(?P<batch_id>\\d{4}[-_]\\d{2}[-_]\\d{2}|\\d{2}-\\d{6})"
  physical_sample_id:
    source: filename_regex
    pattern: "(?P<physical_sample_id>ch_\\d+|TrackImg-\\d+|sample_\\d+|\\(\\d+\\))"
  station:
    source: fixed
    value: station_01
  camera:
    source: fixed
    value: cam_01
```

---

## 5. 运行指南 (Scan & Audit)

### 5.1 CLI 命令行方式 (`iad-benchmark`)

```bash
# 执行数据集扫描与入库
iad-benchmark scan --config configs/kuangjiao.yaml --db data/benchmark.db

# 执行数据质量与 Benchmark 赛道就绪性审计
iad-benchmark audit --task kuangjiao_inspection_01 --db data/benchmark.db
```

### 5.2 Python 模块调用方式

```bash
# 扫描
python -m scripts.scan_dataset --config configs/kuangjiao.yaml --db data/benchmark.db

# 审计
python -m scripts.audit_dataset --task kuangjiao_inspection_01 --db data/benchmark.db
```

---

## 6. 标注与质量语义规范

| 概念 | 对应实体 | 语义 | 示例 |
|---|---|---|---|
| **Quality Status** | `Sample.quality_status` | 工业质检最终判定结论：`PASS`, `FAIL`, `UNCERTAIN` | 经过复检确认的不良品为 `FAIL`，无确定标注时为 `UNCERTAIN` |
| **Annotation** | `Annotation` | 图像上的具体视觉现象与几何位置 | `phenomenon: glue_overflow`, `bbox: [544.99, 978.68, 631.65, 1009.84]` |
| **Physical Sample ID** | `Sample.physical_sample_id` | 真实世界中的物理工件 ID（用于防止跨机位/跨角度拍摄产生 Split Leakage） | `ch_1374`, `TrackImg-219` |
| **Batch ID** | `Sample.batch_id` | 生产批次或生产日期（用于评测 Domain Shift 跨域泛化） | `2025-09-19`, `2022_08_19` |

---

## 7. Benchmark 赛道就绪性 (Track Readiness) 判定逻辑

Step 1 仅根据数据底层结构进行严谨初判，绝不伪造结果：

1. **Standard AD (标准无监督/少样本异常检测)**:
   - 判为 `READY` 的最低条件：`PASS > 0 且 FAIL > 0`。
   - 若任一为 0，则为 `NOT_READY`。
2. **Open Normal (开集正常样本挖掘)**:
   - 本阶段未运行 Hard Normal Mining，评定为 `NOT_EVALUATED`。
3. **Domain Shift (跨域泛化)**:
   - 领域标识字段（`batch_id` / `camera` / `station`）中任一项独立取值数 $\ge 2$，评定为 `PARTIAL`。
4. **Small / Weak (微弱缺陷与定位评估)**:
   - 存在 BBox 或 Mask 定位标注（数量 $> 0$），评定为 `PARTIAL`。
5. **Global / Logical (结构与逻辑异常)**:
   - 缺乏明确时序/结构约束标注时，评定为 `NOT_EVALUATED`。

---

## 8. 真实数据集接入情况 (框胶数据集)

已完成 `/data1/wt/data/框胶数据集` 全量数据扫描入库与审计：

- **图像总数**: 5,074 张 (涵盖 Train、Test、数据增强与漏检目录)
- **标注总数**: 6,754 个边界框 (Labelme JSON 格式解析转换)
- **样本质检分布**:
  - `PASS`: 5
  - `FAIL`: 4 (来自 `ExportImage_漏检`)
  - `UNCERTAIN`: 5,065 (无明确质检判定的历史排查样本，依法依规保留 UNCERTAIN)
- **元数据抽取率**:
  - `batch_id`: 99.7% 覆盖 (识别 425 个独立生产批次)
  - `physical_sample_id`: 82.0% 覆盖 (识别真实工件/通道)
- **抽样人工校验 (T19 验收标准)**:
  - 随机抽样 100 个样本尺寸与路径：100% 吻合。
  - 随机抽样 50 个缺陷标注坐标与现象映射：100% 吻合。
- **报告生成路径**:
  - `runs/dataset_audit/kuangjiao_inspection_01/audit_report.json`
  - `runs/dataset_audit/kuangjiao_inspection_01/audit_report.md`

---

## 9. 如何新增 Dataset Adapter

实现自定义数据集适配器只需继承 `app.adapters.base.DatasetAdapter` 并重写核心方法：

```python
from app.adapters.base import DatasetAdapter, RawImage, RawAnnotation

class CustomDetectorAdapter(DatasetAdapter):
    def load_annotations(self, image: RawImage, width: int, height: int) -> list[RawAnnotation]:
        # 1. 查找对应标注文件
        # 2. 解析坐标为 [xmin, ymin, xmax, ymax] 或 polygon
        # 3. 映射 raw_label 到标准 phenomenon
        return annotations
```

然后在 `app/adapters/__init__.py` 的 `get_adapter` 工厂方法中注册即可。

---

## 10. 测试套件

运行完整单元测试与集成测试：

```bash
/home/dell/anaconda3/envs/dinomaly/bin/python -m pytest -v
```

当前全部 17 项测试均通过：
- `tests/test_schema.py`: Schema 约束与非法状态过滤
- `tests/test_database.py`: SQLite 数据库与幂等性插入验证
- `tests/test_adapters.py`: Folder, Labelme, YOLO 适配器独立解析验证
- `tests/test_scanner.py`: 扫描服务流式处理、损坏图像容错与幂等重跑验证
- `tests/test_audit.py`: 审计指标计算、缺失率与报告输出校验

---

## 11. 交付清单

- 源码与 CLI：`app/`, `scripts/`, `configs/`
- SQLite 数据库：`data/benchmark.db`
- 结构化审计结果：`runs/dataset_audit/kuangjiao_inspection_01/audit_report.json`
- Markdown 审计报告：`runs/dataset_audit/kuangjiao_inspection_01/audit_report.md`
- 规格文档与工单记录：`docs/Step1_Dataset_Foundation_SPECS.md`, `docs/Step1_Dataset_Foundation_TICKETS.md`
