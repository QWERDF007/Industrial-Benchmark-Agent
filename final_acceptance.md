# Industrial Benchmark Agent V1 最终验收与复验报告 (NV-20)

**验收结论**：`V1_ACCEPTED`
**基线 Commit**：`8711f9f`
**验收日期**：2026-10-18
**评估对象**：真实工业框胶基准 `kuangjiao_inspection_01_20261017_003`

---

## 1. 规范复验门禁矩阵 (NS-01 ～ NS-15)

| 规范编号 | 规范名称 | 级别 | 状态 | 关键验证证据与实现索引 |
|---|---|---|---|---|
| **NS-01** | Harness Runtime 与 Session 生命周期 | P0 | **PASS** | [`python/iad_agent/runtime.py`](file:///data1/wt/Industrial-Benchmark-Agent/python/iad_agent/runtime.py)、[`result.py`](file:///data1/wt/Industrial-Benchmark-Agent/python/iad_agent/result.py)：删除推测性参数与 `session-fallback-*`，必须由 Runtime 返回真 Session ID；结构化解析 `REVIEW_REQUIRED`；[`tests/test_agent_runtime.py`](file:///data1/wt/Industrial-Benchmark-Agent/tests/test_agent_runtime.py) 7 个测试 100% 通过。 |
| **NS-02** | MCP Transport 与 Profile 装配 | P0 | **PASS** | [`apps/iad-harness/cordis.patch.yml`](file:///data1/wt/Industrial-Benchmark-Agent/apps/iad-harness/cordis.patch.yml)、[`package.json`](file:///data1/wt/Industrial-Benchmark-Agent/apps/iad-harness/package.json)：装配 `@deepseek-ai/dsh-mcp-client`（`serverName: iad`, `transport: streamable-http`, `failOnStartupError: true`）；[`tests/integration/test_harness_integration.py`](file:///data1/wt/Industrial-Benchmark-Agent/tests/integration/test_harness_integration.py) 验证真实 `initialize` 与 `tools/list` 发现全部 15 个工具。 |
| **NS-03** | Policy 和最小工具面 | P0 | **PASS** | [`apps/iad-harness/src/server/index.ts`](file:///data1/wt/Industrial-Benchmark-Agent/apps/iad-harness/src/server/index.ts)：`ALLOWED_TOOL_SURFACE` 限制至 15 个 `mcp__iad__*` 工具，禁止 review 写入和 shell；`systemPrompt.section()` 仅注入一次；`applyRestriction` 严格抛出异常不静默吞错；[`apps/iad-harness/test/plugin.test.js`](file:///data1/wt/Industrial-Benchmark-Agent/apps/iad-harness/test/plugin.test.js) 验证通过。 |
| **NS-04** | Review Required 行为与 Build Gate | P0 | **PASS** | [`python/iad_domain_server/tools/benchmark_tools.py`](file:///data1/wt/Industrial-Benchmark-Agent/python/iad_domain_server/tools/benchmark_tools.py)：`benchmark_build` 强制检查 `review_policy` 必审候选，未审核阻断并返回 `ToolStatus.REVIEW_REQUIRED`；非必审候选不机械阻断；[`tests/test_benchmark_preview_and_policy.py`](file:///data1/wt/Industrial-Benchmark-Agent/tests/test_benchmark_preview_and_policy.py) 验证通过。 |
| **NS-05** | 正常训练集合选择与元数据记录 | P0 | **PASS** | [`python/iad_core/evaluation/training.py`](file:///data1/wt/Industrial-Benchmark-Agent/python/iad_core/evaluation/training.py)：严格基于 CONFIRMED Gold 提取正常样本构库；在 `_003` 真实构库中，Train 67 样本中 63 个 Anomaly 100% 隔离，仅 4 个 Normal 进入 Runner 构库；保存 [`train_selection.json`](file:///data1/wt/Industrial-Benchmark-Agent/runs/evaluation/eval_kuangjiao_inspection_01_feature_knn_dinov2_1792296184/train_selection.json)；[`tests/test_train_selection.py`](file:///data1/wt/Industrial-Benchmark-Agent/tests/test_train_selection.py) 通过。 |
| **NS-06** | Baseline 协议与模型配置 | P0 | **PASS** | [`python/iad_core/evaluation/baselines/base.py`](file:///data1/wt/Industrial-Benchmark-Agent/python/iad_core/evaluation/baselines/base.py)：定义 `BaselineProtocol`（`UNSUPERVISED_NORMAL`、`PRETRAINED_INFERENCE`）；PatchCore 显式配置 `wideresnet50`，Dinomaly2 配置 `training_origin`；[`tests/test_baselines_real.py`](file:///data1/wt/Industrial-Benchmark-Agent/tests/test_baselines_real.py) 6 个真实模型测试全部通过。 |
| **NS-07** | 正式 Evaluation 的预测契约 | P0 | **PASS** | [`python/iad_core/evaluation/baselines/base.py`](file:///data1/wt/Industrial-Benchmark-Agent/python/iad_core/evaluation/baselines/base.py)：统一 `validate_predictions()` 校验样本数量一致、唯一性、集合严格匹配、split 正确、数值有限性（拒绝 NaN / ±Inf）；[`tests/test_prediction_validator.py`](file:///data1/wt/Industrial-Benchmark-Agent/tests/test_prediction_validator.py) 7 个测试全通过。 |
| **NS-08** | 正式评测顺序与 Val/Test 隔离 | P0 | **PASS** | [`python/iad_core/evaluation/evaluator.py`](file:///data1/wt/Industrial-Benchmark-Agent/python/iad_core/evaluation/evaluator.py)：严格按 `prepare → val predict → fit threshold(val only) → test predict → evaluate` 执行；Val 缺失双类时 F1_MAX 快速失败；Test 分数严禁影响阈值；[`tests/test_evaluator.py`](file:///data1/wt/Industrial-Benchmark-Agent/tests/test_evaluator.py)、[`tests/test_evaluation_invariants.py`](file:///data1/wt/Industrial-Benchmark-Agent/tests/test_evaluation_invariants.py) 全通过。 |
| **NS-09** | Benchmark Preview 与 Build 共用领域逻辑 | P0 | **PASS** | [`python/iad_core/benchmark/builder.py`](file:///data1/wt/Industrial-Benchmark-Agent/python/iad_core/benchmark/builder.py)：Preview 调用统一 `resolve_gold_for_sample` 与 `build_group_split`；内存解析 Gold (`persist_to_db=False`)；统计与正式构建完全对齐；[`tests/test_benchmark_preview_and_policy.py`](file:///data1/wt/Industrial-Benchmark-Agent/tests/test_benchmark_preview_and_policy.py) 验证通过。 |
| **NS-10** | Evaluation 比较的运行隔离 | P0 | **PASS** | [`python/iad_core/evaluation/report.py`](file:///data1/wt/Industrial-Benchmark-Agent/python/iad_core/evaluation/report.py)、[`python/iad_domain_server/tools/evaluation_tools.py`](file:///data1/wt/Industrial-Benchmark-Agent/python/iad_domain_server/tools/evaluation_tools.py)：按 `(model_id, protocol)` 去重，每模型仅保留最新有效运行；旧协议运行标记为 `PROTOCOL_INVALID` 自动过滤；输出具体 `selected_eval_run_ids`；[`tests/test_comparison_report.py`](file:///data1/wt/Industrial-Benchmark-Agent/tests/test_comparison_report.py) 4 个测试全通过。 |
| **NS-11** | 指标充分性与诊断边界 | P1 | **PASS** | 明确报告 Test 真实样本分布（2 Normal，22 Anomaly）；报告 FPR 观测分辨率 `1/2 = 50.0%`；`Recall@1%FPR` 标记为 `NOT_EVALUATED (res=50%)`；Hard Normal FPR 输出分子分母 `0/1` / `1/1` 并标记 `PROVISIONAL`；单类 Domain AUROC 报告 `N/A`；诚实标注 `Standard AD Track = PARTIAL`。 |
| **NS-12** | Web 单入口与动态数据 | P1 | **PASS** | [`python/iad_cli/main.py`](file:///data1/wt/Industrial-Benchmark-Agent/python/iad_cli/main.py)：删除重复 `@app.command("web")`，单一 `web_supervisor` 管理 Domain Server 与 Harness Web；[`apps/iad-harness/public/index.html`](file:///data1/wt/Industrial-Benchmark-Agent/apps/iad-harness/public/index.html)：清除硬编码 `5,074` 等假数据，接入 `/api/task/{task_id}/overview` 动态渲染。 |
| **NS-13** | Human Review 本地边界和图像服务 | P1 | **PASS** | [`python/iad_domain_server/api.py`](file:///data1/wt/Industrial-Benchmark-Agent/python/iad_domain_server/api.py)：收紧 CORS，移除通配符凭据；`/api/sample/{sample_id}/image` 限制在数据集根目录安全路径，防止跨目录越界。 |
| **NS-14** | 分层测试与证据 | P0 | **PASS** | 单元测试层（数据选择、预测校验、评测不变性、对比报告、Harness 插件）、集成测试层（[`tests/integration/test_harness_integration.py`](file:///data1/wt/Industrial-Benchmark-Agent/tests/integration/test_harness_integration.py)）、真实环境层（GPU 真实模型推理与产物）。 |
| **NS-15** | V1 最终验收门禁 | P0 | **PASS** | 所有 P0/P1 无遗留问题；三模型真实重跑；指标充分性明确标记；产物与数据库完整归档。 |

---

## 2. 真实三基线重跑对比总结 (`kuangjiao_inspection_01_20261017_003`)

依据真实执行产出的对比报告 [`comparison.md`](file:///data1/wt/Industrial-Benchmark-Agent/runs/evaluation/compare_kuangjiao_inspection_01_20261017_003/comparison.md)：

- **测试集真实真值构成**：24 张样本（1 张 Regular Normal + 1 张 Hard Normal = 2 张 Normal，22 张 Anomaly）。
- **FPR 统计观测分辨率**：`1 / 2 = 50.0%`。
- **Track 状态**：`Standard AD Track: PARTIAL (Provisional - statistical power limited by test normal count n=2)`。
- **选中 Eval Runs**：
  - `feature_knn_dinov2` (`UNSUPERVISED_NORMAL`): `eval_kuangjiao_inspection_01_feature_knn_dinov2_1792296184`
  - `patchcore` (`UNSUPERVISED_NORMAL`): `eval_kuangjiao_inspection_01_patchcore_1792296216`
  - `dinomaly2` (`PRETRAINED_INFERENCE`): `eval_kuangjiao_inspection_01_dinomaly2_1792296251`

### 图像级指标对比表

| 模型 ID | 协议 | I-AUROC | I-AP | Recall@1%FPR | F1 分数 | Hard Normal FPR | 决策阈值 | 耗时 (s) |
|---|---|---|---|---|---|---|---|---|
| `dinomaly2` | `PRETRAINED_INFERENCE` | `0.8409` | `0.9839` | `NOT_EVALUATED (res=50%)` | `0.9302` | `0/1 (0.0000) [PROVISIONAL]` | `0.1256` | 18.86 |
| `feature_knn_dinov2` | `UNSUPERVISED_NORMAL` | `0.5000` | `0.8757` | `NOT_EVALUATED (res=50%)` | `0.9545` | `1/1 (1.0000) [PROVISIONAL]` | `0.2983` | 0.38 |
| `patchcore` | `UNSUPERVISED_NORMAL` | `0.5455` | `0.9136` | `NOT_EVALUATED (res=50%)` | `0.9778` | `1/1 (1.0000) [PROVISIONAL]` | `1546.9258` | 7.19 |

### 生产使用与统计边界诊断
1. **可用能力**：
   - 图像级二分类（I-AUROC 与 F1 分数）评估管线及 Val-only 阈值拟合完全真实可用。
   - 训练样本选择算法（正常样本构库、异常样本严格隔离）真实生效。
   - 人工复核硬门禁与多模型对比报告生成完全真实可用。
2. **统计试运行限制**：
   - 当前框胶基准测试集中仅有 2 张真实 Normal 样本与 1 张 Hard Normal 样本，FPR 最小分辨率为 50%。
   - `Recall@1%FPR` 属于统计上未达到充分性检验条件，正式标为 `NOT_EVALUATED`，严禁作为生产合格依据。
   - Hard Normal 稳健性指标仅基于 1 个测试样本，属于试运行暂定指标（`PROVISIONAL`）。
