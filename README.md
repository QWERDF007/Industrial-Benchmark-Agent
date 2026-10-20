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
- [4. 服务启动与局域网访问 (Service Startup & LAN Access)](#4-服务启动与局域网访问-service-startup--lan-access)
- [5. 数据集配置 (Dataset Config)](#5-数据集配置-dataset-config)
- [6. 运行指南 (Scan & Audit)](#6-运行指南-scan--audit)
- [7. 标注与质量语义规范](#7-标注与质量语义规范)
- [8. Benchmark 赛道就绪性 (Track Readiness) 判定逻辑](#8-benchmark-赛道就绪性-track-readiness-判定逻辑)
- [9. 真实数据集接入情况 (框胶数据集)](#9-真实数据集接入情况-框胶数据集)
- [10. 如何新增 Dataset Adapter](#10-如何新增-dataset-adapter)
- [11. 测试套件](#11-测试套件)
- [12. 交付清单](#12-交付清单)

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
├── apps/
│   └── iad-harness/          # DSH 原生扩展双面插件 (Server + Web Client)
├── config/                   # 局域网与框架 Patch 配置
│   └── dsh_web_lan_patch.yml # DeepSeek Harness Web 局域网绑定与鉴权 Patch
├── configs/
│   ├── example.yaml          # 规范示例配置
│   └── kuangjiao.yaml        # 真实工业数据配置 (框胶外观检测)
├── python/                   # 后端核心包与 CLI 入口
│   ├── iad_core/             # 数据底座、特征检索、基线评测与 CLI 桥接 (entry.py)
│   ├── iad_agent/            # DSH Agent Runtime 对接逻辑
│   └── iad_cli/              # CLI 命令行入口
├── node_modules/             # DeepSeek Harness 前端与 Cordis 运行库
├── tests/                    # 完整单元与集成测试套件
├── runs/                     # 运行日志与审计报告生成目录 (自动忽略)
├── start.sh                  # 一键启动脚本 (单一 DSH Web 进程，端口 5173)
├── stop.sh                   # 一键停止脚本
└── status.sh                 # 服务运行状态检查脚本
```

---

## 3. 环境与安装

本项目后端基于 **Python 3.12**，前端及交互内核基于 **Node.js (>= 22)**。

### 3.1 Python 3.12 虚拟环境 (`iad_agent`)

推荐使用专用的 conda 环境 `iad_agent`：

```bash
# 创建并激活环境
conda create -n iad_agent python=3.12 -y
conda activate iad_agent

# 安装项目核心与开发依赖 (可编辑模式)
pip install -e ".[dev]"
```

> **环境路径说明**：本机默认 Python 解释器路径为 `/home/dell/anaconda3/envs/iad_agent/bin/python`。

### 3.2 Node.js 运行时

DeepSeek Harness Web 端需使用 Node.js >= 22（推荐 v24）。本机已配置兼容系统 glibc 2.17+ 的 Node.js：

```bash
# 查看 Node.js 版本 (确认输出 >= v22)
node -v

# 安装前端依赖
pnpm install
```

---

## 4. 服务启动与局域网访问 (Service Startup & LAN Access)

系统采用单一 Web 宿主架构（DSH Web Host），基于 DeepSeek Harness 原生双面扩展插件提供一体化工业质量审计工作台，避免端口分叉与多进程开销。
通过绑定局域网 IP（`0.0.0.0:5173`），局域网内任意客户端浏览器均可直接访问控制台与原生看板。

### 4.1 一键启停命令

```bash
# 启动单一 DSH Web 宿主服务 (后台守护运行并输出访问 URL 与 Token)
./start.sh
# 或
pnpm start

# 查看当前服务运行状态与监听端口
./status.sh
# 或
pnpm status

# 停止服务并释放 5173 端口
./stop.sh
# 或
pnpm stop
```

### 4.2 局域网访问端点

服务启动后，终端将输出专属访问地址（以主机局域网 IP `192.168.2.87` 为例）：

| 服务模块 | 局域网访问地址 | 默认端口 | 说明 |
|---|---|---|---|
| **DSH 原生工业审计工作台** | `http://192.168.2.87:5173/?token=<TOKEN>` | `5173` | 单一宿主 Web 前端，左侧边栏内置“工业审计”工作台面板，集成数据集总览、任务审计、图像查看、人机复核与报告导出 |
| **工作台原生 API 路由** | `http://192.168.2.87:5173/api/iad/*` | `5173` | 由 DSH Web 宿主挂载的原生路由，直调 Python CLI 桥接，无独立后端端口 |

> **提示**：运行日志持久化存储在 `runs/dsh_web.log`，可通过 `tail -f runs/dsh_web.log` 实时监控。

### 4.3 外部多模态 VLM 推理接入

系统内置支持标准 OpenAI 兼容协议的多模态大模型：
- **服务端点**：`http://192.168.2.197:30002/v1`
- **模型名称**：`Qwen/Qwen3.8-27B-FP8`
- **API Key**：`sk-123456`


---

## 5. 数据集配置 (Dataset Config)

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

## 6. 运行指南 (Scan & Audit)

### 6.1 CLI 命令行方式 (`iad-benchmark` / `iad`)

```bash
# 执行数据集扫描与入库
iad scan --config configs/kuangjiao.yaml --db data/benchmark.db

# 执行数据质量与 Benchmark 赛道就绪性审计
iad audit --task kuangjiao_inspection_01 --db data/benchmark.db
```

### 6.2 Python 模块调用方式

```bash
# 扫描
python -m iad_cli.main scan --config configs/kuangjiao.yaml --db data/benchmark.db

# 审计
python -m iad_cli.main audit --task kuangjiao_inspection_01 --db data/benchmark.db
```

---

## 7. 标注与质量语义规范

| 概念 | 对应实体 | 语义 | 示例 |
|---|---|---|---|
| **Quality Status** | `Sample.quality_status` | 工业质检最终判定结论：`PASS`, `FAIL`, `UNCERTAIN` | 经过复检确认的不良品为 `FAIL`，无确定标注时为 `UNCERTAIN` |
| **Annotation** | `Annotation` | 图像上的具体视觉现象与几何位置 | `phenomenon: glue_overflow`, `bbox: [544.99, 978.68, 631.65, 1009.84]` |
| **Physical Sample ID** | `Sample.physical_sample_id` | 真实世界中的物理工件 ID（用于防止跨机位/跨角度拍摄产生 Split Leakage） | `ch_1374`, `TrackImg-219` |
| **Batch ID** | `Sample.batch_id` | 生产批次或生产日期（用于评测 Domain Shift 跨域泛化） | `2025-09-19`, `2022_08_19` |

---

## 8. Benchmark 赛道就绪性 (Track Readiness) 判定逻辑

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

## 9. 真实数据集接入情况 (框胶数据集)

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

## 10. 如何新增 Dataset Adapter

实现自定义数据集适配器只需继承 `iad_core.dataset.adapters.base.DatasetAdapter` 并重写核心方法：

```python
from iad_core.dataset.adapters.base import DatasetAdapter, RawImage, RawAnnotation

class CustomDetectorAdapter(DatasetAdapter):
    def load_annotations(self, image: RawImage, width: int, height: int) -> list[RawAnnotation]:
        # 1. 查找对应标注文件
        # 2. 解析坐标为 [xmin, ymin, xmax, ymax] 或 polygon
        # 3. 映射 raw_label 到标准 phenomenon
        return annotations
```

然后在 `python/iad_core/dataset/adapters/__init__.py` 的 `get_adapter` 工厂方法中注册即可。

---

## 11. 测试套件

运行完整单元测试与集成测试：

```bash
# 使用 npm/pnpm 统一命令 (基于 iad_agent Python 3.12 执行)
pnpm test

# 或直接通过虚拟环境执行指定测试模块
/home/dell/anaconda3/envs/iad_agent/bin/python -m pytest tests/test_internal_api.py tests/test_internal_tools.py -v
```

测试覆盖包括：
- `tests/test_schema.py`: Schema 约束与非法状态过滤
- `tests/test_database.py`: SQLite 数据库与幂等性插入验证
- `tests/test_adapters.py`: Folder, Labelme, YOLO 适配器独立解析验证
- `tests/test_scanner.py`: 扫描服务流式处理、损坏图像容错与幂等重跑验证
- `tests/test_audit.py`: 审计指标计算、缺失率与报告输出校验
- `tests/test_internal_api.py`: FastAPI 内部接口与中间件测试
- `tests/test_internal_tools.py`: 领域工具网关与 Feature / Review / Task 执行测试
- `tests/test_live_vlm_e2e.py`: 真实远程 VLM 模型端到端质检与留痕测试

---

## 12. 交付清单

- 核心源码：`python/iad_core/`, `python/iad_domain_server/`, `python/iad_cli/`
- 前端与交互内核：`config/dsh_web_lan_patch.yml`, `node_modules/`
- 运维脚本：`start.sh`, `stop.sh`, `status.sh`
- 数据集配置与数据库：`configs/`, `data/benchmark.db`
- 结构化审计结果：`runs/dataset_audit/kuangjiao_inspection_01/audit_report.json`
- Markdown 审计报告：`runs/dataset_audit/kuangjiao_inspection_01/audit_report.md`
- 架构设计与工单记录：`docs/`
