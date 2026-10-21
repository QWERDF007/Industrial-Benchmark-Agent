# Industrial Benchmark Agent

工业外观数据的模型审计、人工复核、基准构建与评估工作台。以 DSH Web 为唯一宿主，TypeScript 原生插件通过 NDJSON 调用 Python 领域核心。

## 使用

```bash
pnpm install
pip install -e '.[dev]'
cp .env.example .env.local
# 编辑 .env.local 配置本地模型服务
./start.sh
```

访问启动器输出的认证地址。运行环境和依赖声明见 [package.json](package.json)、[pyproject.toml](pyproject.toml)；启停入口为 [start.sh](start.sh)、[stop.sh](stop.sh)、[status.sh](status.sh)。

Linux x64 的原生图像附件要求 GLIBC ≥ 2.28，见 [Sharp 官方运行要求](https://sharp.pixelplumbing.com/install/#prebuilt-binaries)。

- **模型审计**：导入 Labelme 或目录图像级数据并挖掘可用良品知识后，按筛选范围启动审计；执行与证据入口见[架构索引](docs/architecture.md)。
- **人工复核**：查看复核明细并提交人工裁决。
- **插件**：保留 DSH 原生插件管理入口。
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

独立知识工具、完整流程技能与后续审计的合成图验证入口为 [verify-knowledge-skills.js](apps/iad-harness/scripts/verify-knowledge-skills.js)，同样先导出模型环境变量，再运行 `node apps/iad-harness/scripts/verify-knowledge-skills.js`；生成独立数据库和本地验证记录。

自然语言会话验收使用 [verify-dataset-session.js](apps/iad-harness/scripts/verify-dataset-session.js)：显式导出 `LIVE_VLM_ENDPOINT` 和 `LIVE_VLM_KEY` 后运行 `node apps/iad-harness/scripts/verify-dataset-session.js`，默认验证 Labelme 服务器目录；`--workflow-only` 仅验证完整技能从导入至报告的一轮执行；`--folder` 验证包含 OK/NG/未知及错标合成图的目录格式，并验证源图变更后的后继知识与重审；可选 `--archive` 验证已有 ZIP 接口。脚本创建官方 DSH Agent/Session，经实际模型选择工具执行接入、完整分析技能、知识审计、报告读取及全图/ROI 追问；生成合成图、隔离数据库和会话轨迹，不使用主数据库。该验证不代表浏览器上传、独立工业准确率或全部 UI 已验收。

[verify-dataset-intake.js](apps/iad-harness/scripts/verify-dataset-intake.js) 验证真实 Agent 的自定义角色、仅正常、缺少正常来源及格式歧义处理。运行 `node apps/iad-harness/scripts/verify-dataset-intake.js <输出目录>`；可在末尾指定 `custom`、`normal-only`、`anomaly-only` 或 `ambiguous` 单独运行，模型环境要求同上。

[verify-import-scope.js](apps/iad-harness/scripts/verify-import-scope.js) 使用实际配置的 Agent 模型，在多次全新会话验证裸“导入”请求不会加载完整技能或启动模型作业。先导出模型环境变量，运行 `node apps/iad-harness/scripts/verify-import-scope.js <输出目录> [次数]`；默认三次，`LIVE_AGENT_MODEL` 可显式覆盖项目配置中的 Agent 模型。只使用新合成图、隔离库，任何越范围尝试会被记录并拦截。

跨产品验收运行 `node apps/iad-harness/scripts/verify-knowledge-products.js`，环境变量同上；[生成条件、真实会话与证据检查](apps/iad-harness/scripts/verify-knowledge-products.js)保存在独立验证目录，生成条件不属于模型输入或工业人工真值。

真实模型的工作进程恢复验收使用 [verify_job_recovery_live.py](scripts/verify_job_recovery_live.py)：导出同一模型环境变量后运行 `PYTHONPATH=python python scripts/verify_job_recovery_live.py`，使用合成图与隔离库；仅终止脚本创建的工作进程，不操作主服务。
