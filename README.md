# Industrial Benchmark Agent

工业外观数据的模型审计、人工复核、基准构建与评估工作台。以 DSH Web 为唯一宿主，TypeScript 原生插件通过 NDJSON 调用 Python 领域核心。

## 使用

```bash
conda activate iad_agent
pnpm install
python -m pip install -e '.[dev]'
cp .env.example .env.local
# 编辑 .env.local 配置本地模型服务
./start.sh
```

访问启动器输出的认证地址。Python 环境选择见[桥接入口](apps/iad-harness/src/server/python-bridge/index.ts)；运行依赖见 [package.json](package.json)、[pyproject.toml](pyproject.toml)；启停入口为 [start.sh](start.sh)、[stop.sh](stop.sh)、[status.sh](status.sh)。

Linux x64 的原生图像附件要求 GLIBC ≥ 2.28，见 [Sharp 官方运行要求](https://sharp.pixelplumbing.com/install/#prebuilt-binaries)。

使用独立 Node 运行环境时，在 `.env.local` 指定 `IAD_NODE_PATH`；[启动入口](start.sh)让服务与构建共用该可执行文件，不设置全局 `LD_LIBRARY_PATH`。

基础 Python 安装支持原始像素内容索引，无需 torch、FAISS 或模型服务。CPU 向量检索使用 `pip install -e '.[retrieval]'`；编码器依赖见 [pyproject.toml](pyproject.toml) 的 `encoders` 组合，CPU torch 轮子按 [PyTorch 官方安装入口](https://pytorch.org/get-started/locally/)选择。每个环境只安装一种 FAISS 发行包；已有 GPU FAISS 的环境不要叠加 CPU 包。

【模型设置 → 图像检索】独立配置图像编码器、实际权重、官方源码目录与运行资源。支持的骨干和预处理以[配置契约](python/iad_core/feature/profiles.py)为准；加载检查实际编码一张检查图，不代表工业召回率。真实权重验证入口为[verify_image_encoders.py](scripts/verify_image_encoders.py)，参数见脚本帮助。

DINO 源码目录使用官方 [DINOv2](https://github.com/facebookresearch/dinov2) 或 [DINOv3](https://github.com/facebookresearch/dinov3) 仓库根目录；SSCD 使用官方 TorchScript 权重。公开接口的实际加载验证见[verify_image_encoder_http.mjs](scripts/verify_image_encoder_http.mjs)。

在仅有基础依赖的独立虚拟环境运行 `python scripts/verify_image_index_cpu.py`，可验证真实导入、严格同图分组、16位TIFF、单像素alpha差异、增量复用及无模型运行时。

侧栏【模型设置】为方向探索、良品/异常知识挖掘、模型审计统一选择提供商与模型。提供商页与 DSH 原生设置共用资料及凭据；DSH 会话通过输入框的模型菜单独立选择。行为与能力范围见[设置规格](docs/specs/workbench-model-settings.md)，实现和验收见[架构索引](docs/architecture.md)。[启动补丁](config/dsh_web_lan_patch.yml)只配置服务监听和工业插件；独立 Python 验证的环境配置见下文。

- **模型审计**：导入 Labelme 或目录图像级数据并挖掘可用良品知识后，按筛选范围启动审计；执行与证据入口见[架构索引](docs/architecture.md)。
- **人工复核**：查看复核明细并提交人工裁决。
- **插件**：保留 DSH 原生插件管理入口。
- **方向探索**：在侧栏【方向探索】联合选择良品、异常图；也可在 DSH 对话中调用 [`explore-inspection-directions`](apps/iad-harness/src/server/exploration/index.ts)。结果在【知识挖掘 → 挖掘方向 → 探索方向】勾选、修改并保存后使用；来源和验收见[独立方向探索](docs/specs/direction-exploration.md)。
- **知识工具**：[独立良品/异常挖掘工具](apps/iad-harness/src/server/knowledge/index.ts)可直接调用；用户请求完整分析时，按需加载 [`analyze-dataset`](apps/iad-harness/src/server/workbench-tools/skill.ts) 技能。完整流程不注入普通会话系统提示词。
- **DSH 对话**：例如“服务器上的 `/data1/data/xxx` 数据集，挖掘良品、不良品知识，审计并评估质量”。Agent 检查目录并识别 Labelme 图像、标注位置，调用与数据集管理相同的导入入口；[原生工具与流程指引](apps/iad-harness/src/server/workbench-tools/index.ts)定义目录识别与歧义处理。分项质量报告使用[统一口径与契约](python/iad_core/workbench/report.py)，会话和页面读取同一报告。Labelme 与目录图像级数据共用[统一接入契约](python/iad_core/dataset/registry.py)，现有实现见[源码索引](docs/architecture.md)，图组工具与统一知识页面的目标见[规格](docs/specs/incremental-knowledge-mining.md)。

## 开发入口

- [文档索引](docs/README.md)
- [架构与源代码索引](docs/architecture.md)
- [数据集配置示例](configs/example.yaml)
- [命令行入口](python/iad_cli/main.py)
- 本地任务账本：`WORKLOG.md`（不纳入版本控制）

```bash
pnpm --filter @industrial-benchmark/iad-harness build
pnpm --filter @industrial-benchmark/iad-harness typecheck
pnpm --filter @industrial-benchmark/iad-harness test
PYTHONPATH=python python -m pytest tests/
# Firefox + geckodriver，使用临时数据集与独立数据库
GECKODRIVER_PATH=/path/to/geckodriver pnpm --filter @industrial-benchmark/iad-harness test:browser
# 已启动的 DSH 原生宿主，只读验收（需支持 Intl.Segmenter 的 Firefox）
FIREFOX_PATH=/path/to/firefox GECKODRIVER_PATH=/path/to/geckodriver pnpm --filter @industrial-benchmark/iad-harness verify:host-browser
```

真实模型验证入口为 [verify_workbench_live.py](scripts/verify_workbench_live.py)，使用数据库快照，需可访问数据集目录及项目配置的 VLM。命令行验证前需导出模型环境变量；本地配置模板见 [.env.example](.env.example)，启动器自动加载 `.env.local`。模型服务环境变量及实际上下文检查见 [VlmClient](python/iad_core/workbench/vision.py)；现有客户端采用多图、结构化 JSON 输出与含视觉 token 的容量预检；具体服务协议以客户端实现及运行配置为准，不据模型名称推断能力。

同图标注的真实 DSH 验证见 [verify-consistency-session.js](apps/iad-harness/scripts/verify-consistency-session.js)：提供 `--env-file`、`--image` 和全新 `--output` 目录；`--case missing-instances --verify-corrections` 验证 B/E/F 证据解释及临时标注副本的建议、改源、重扫闭环。构造标签仅用于流程验证，不是工业缺陷真值。

自然语言单图查询、全库检查及原批次恢复见 [verify-consistency-intents.js](apps/iad-harness/scripts/verify-consistency-intents.js)，公开 CLI 验证见 [consistency-intents.test.js](apps/iad-harness/test/consistency-intents.test.js)。

[verify_gold_consistency.py](scripts/verify_gold_consistency.py) 的 `--live-audit` 将实际模型审核接入批次、人审与正式导出验证；模型输入包含指定图片及两张合成对照图，产物保存于全新 `--output-dir`。合成知识仅用于流程对照，不作为工业正常判据验收。

独立图组验证见 [verify-knowledge-selection.js](apps/iad-harness/scripts/verify-knowledge-selection.js)，连续自然语言会话验证见 [verify-knowledge-scope.js](apps/iad-harness/scripts/verify-knowledge-scope.js)。真实模型验证先配置 [本地环境模板](.env.example) 对应环境变量，再运行相应 Node 脚本并提供新的输出目录；仅创建合成图、隔离库和本地轨迹。公开原生工具与完整流程技能的行为验收见 [knowledge_skills.test.js](apps/iad-harness/test/knowledge_skills.test.js)，会话与侧栏往返见 [knowledge-session.test.js](apps/iad-harness/browser/knowledge-session.test.js)。验证结果不代表工业准确率。

明确请求完整分析的两产品合成图验证见 [verify-knowledge-products.js](apps/iad-harness/scripts/verify-knowledge-products.js)，记录实际挖掘、审计、报告及模型是否发现污染；裸导入边界见 [verify-import-scope.js](apps/iad-harness/scripts/verify-import-scope.js)。

[verify-dataset-intake.js](apps/iad-harness/scripts/verify-dataset-intake.js) 验证真实 Agent 的自定义角色、仅正常、缺少正常来源及格式歧义处理。运行 `node apps/iad-harness/scripts/verify-dataset-intake.js <输出目录>`；可在末尾指定 `custom`、`normal-only`、`anomaly-only` 或 `ambiguous` 单独运行，模型环境要求同上。

[verify-import-scope.js](apps/iad-harness/scripts/verify-import-scope.js) 使用实际配置的 Agent 模型，在多次全新会话验证裸“导入”请求不会加载完整技能或启动模型作业。先导出模型环境变量，运行 `node apps/iad-harness/scripts/verify-import-scope.js <输出目录> [次数]`；默认三次，`LIVE_AGENT_MODEL` 可显式覆盖项目配置中的 Agent 模型。只使用新合成图、隔离库，任何越范围尝试会被记录并拦截。

跨产品验收运行 `node apps/iad-harness/scripts/verify-knowledge-products.js`，环境变量同上；[生成条件、真实会话与证据检查](apps/iad-harness/scripts/verify-knowledge-products.js)保存在独立验证目录，生成条件不属于模型输入或工业人工真值。

真实模型的工作进程恢复验收使用 [verify_job_recovery_live.py](scripts/verify_job_recovery_live.py)：导出同一模型环境变量后运行 `PYTHONPATH=python python scripts/verify_job_recovery_live.py`，使用合成图与隔离库；仅终止脚本创建的工作进程，不操作主服务。
