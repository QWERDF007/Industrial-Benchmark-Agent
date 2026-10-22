# 实现与验收索引

目标行为见[规格](specs/incremental-knowledge-mining.md)，依赖与验收条件见[逐票索引](tickets/README.md)。本页索引实现与验证入口；验收状态见逐票定义，进度和待裁决事项仅见根 WORKLOG.md。

## 接入与状态

| 职责 | 唯一入口 |
| --- | --- |
| DSH 宿主与原生页面注册 | [服务端生命周期](../apps/iad-harness/src/server/index.ts)、[客户端注册](../apps/iad-harness/src/client/index.ts) |
| 工业角色及可用工具指导投影 | [提示词组装](../apps/iad-harness/src/server/prompt/index.ts)、[真实 Agent 验收](../apps/iad-harness/test/prompt.test.js) |
| HTTP / Python 桥接 | [路由](../apps/iad-harness/src/server/routes/index.ts)、[桥接](../apps/iad-harness/src/server/python-bridge/index.ts)、[领域操作](../python/iad_core/entry.py) |
| 数据集配置、身份、来源、删除与参考资格 | [配置](../python/iad_core/task/config.py)、[注册](../python/iad_core/dataset/registry.py) |
| 格式适配与原子扫描 | [适配器](../python/iad_core/dataset/adapters/)、[图像枚举](../python/iad_core/dataset/files.py)、[目录角色](../python/iad_core/dataset/folder_rules.py)、[预览确认](../python/iad_core/dataset/folder_preview.py)、[扫描](../python/iad_core/dataset/scanner.py)、[发布](../python/iad_core/dataset/scan_snapshot.py) |
| 数据模型、数据库与仓储 | [存储](../python/iad_core/storage/)、[知识来源存储迁移](../python/iad_core/storage/knowledge_schema.py) |
| 查询、筛选、数量与分项报告 | [查询](../python/iad_core/workbench/query.py)、[报告](../python/iad_core/workbench/report.py) |
| 知识资格、来源分页、冻结内容与来源变化 | [资格](../python/iad_core/knowledge/sources.py)、[来源契约](../python/iad_core/knowledge/models.py)、[内容指纹](../python/iad_core/evidence/sources.py)、[来源与变化查询](../python/iad_core/knowledge/query.py) |
| 图组契约、支持策略与继承 | [图组及宿主调用](../python/iad_core/knowledge/requests.py)、[支持分组](../python/iad_core/knowledge/support.py)、[证据继承](../python/iad_core/knowledge/evolution.py)、[选图配置](../apps/iad-harness/src/client/components/KnowledgeSetup.tsx) |
| 先观察、修订比较、冲突隔离与人审重核验 | [冻结观察](../python/iad_core/knowledge/observation.py)、[冲突](../python/iad_core/knowledge/conflicts.py)、[重核验](../python/iad_core/knowledge/recheck.py)、[输入冻结](../python/iad_core/knowledge/frozen.py) |
| 连续范围、会话准入与进度 | [冻结范围](../python/iad_core/knowledge/scopes.py)、[范围界面](../apps/iad-harness/src/client/components/KnowledgeScopePanel.tsx)、[宿主会话](../apps/iad-harness/src/client/workbench-session.ts) |
| 未发布观察、证据分页及发布口径 | [观察追溯](../python/iad_core/knowledge/trace.py)、[作业投影](../python/iad_core/workbench/jobs.py)、[观察界面](../apps/iad-harness/src/client/components/KnowledgeJobEvidence.tsx) |
| 作业删除、条目移除与不可变历史 | [作业](../python/iad_core/workbench/jobs.py)、[知识维护](../python/iad_core/knowledge/maintenance.py)、[维护后新鲜度](../python/iad_core/knowledge/query.py)、[共享删除交互](../apps/iad-harness/src/client/components/DeleteAction.tsx) |
| 知识挖掘、版本、污染与标注核验 | [知识领域](../python/iad_core/knowledge/) |
| 全图/ROI、原图坐标与真实像素 | [图像证据](../python/iad_core/evidence/images.py)、[Mask](../python/iad_core/evidence/masks.py) |
| 冻结知识、单图联合分析、疑点与作业 | [审计](../python/iad_core/workbench/audit.py)、[单图](../python/iad_core/workbench/inspection.py)、[联合分析](../python/iad_core/workbench/joint.py)、[作业](../python/iad_core/workbench/jobs.py) |
| 模型传输、容量、结构化输出与调用记录 | [模型配置](../python/iad_core/workbench/model_profile.py)、[模型客户端](../python/iad_core/workbench/vision.py)、[分析契约](../python/iad_core/advisory/analysis.py)、[调用记录](../python/iad_core/workbench/calls.py) |
| 人工提交与历史 | [人工复核](../python/iad_core/workbench/review.py)、[知识处置](../python/iad_core/workbench/knowledge_review.py)、[冲突复核界面](../apps/iad-harness/src/client/components/KnowledgeConflictReview.tsx)、[人审存储](../python/iad_core/storage/review_repository.py) |
| 原生工具、模型可见结果、当前技能注册、状态等待与图像附件 | [工作台工具](../apps/iad-harness/src/server/workbench-tools/index.ts)、[知识工具](../apps/iad-harness/src/server/knowledge/)、[结果投影](../apps/iad-harness/src/server/tool-output.ts)、[完整分析技能](../apps/iad-harness/src/server/workbench-tools/skill.ts)、[等待](../apps/iad-harness/src/server/job-status.ts)、[附件](../apps/iad-harness/src/server/evidence-attachment.ts) |
| 生成的客户端契约 | [契约](../apps/iad-harness/src/shared/contracts.ts)、[生成入口](../apps/iad-harness/scripts/generate-contracts.js) |
| 页面身份、知识类型与结果跳转 | [导航契约](../apps/iad-harness/src/shared/navigation.ts)、[工作区状态](../apps/iad-harness/src/client/workspace.tsx)、[结果链接](../apps/iad-harness/src/shared/tool-presentation.ts) |
| 页面、共享上下文与组件 | [工作台](../apps/iad-harness/src/client/WorkbenchPage.tsx)、[上下文](../apps/iad-harness/src/client/workspace.tsx)、[组件](../apps/iad-harness/src/client/components/)、[目录预览](../apps/iad-harness/src/client/useFolderPreview.ts)、[目录映射](../apps/iad-harness/src/client/components/FolderMapping.tsx) |
| 主题、控件与模态焦点 | [主题](../apps/iad-harness/src/client/theme.ts)、[共享控件](../apps/iad-harness/src/client/controls.ts)、[布局](../apps/iad-harness/src/client/styles.ts)、[模态](../apps/iad-harness/src/client/components/Modal.tsx) |
| Gold、数据划分、基准及外部评估入口 | [Gold](../python/iad_core/gold/)、[划分](../python/iad_core/split/)、[基准](../python/iad_core/benchmark/)、[评估](../python/iad_core/evaluation/) |

## 已有测试边界

| 边界 | 现有验证入口 |
| --- | --- |
| 接入、重扫、删除、身份与源文件保留 | [工作台](../tests/test_dataset_workbench.py)、[来源](../tests/test_dataset_sources.py)、[删除](../tests/test_dataset_deletion.py) |
| 公开 HTTP 与 DSH 工具状态一致 | [HTTP操作](../apps/iad-harness/test/workbench.test.js)、[原生工具](../apps/iad-harness/test/dataset_tools.test.js) |
| 三输入、版本继承、支持策略与覆盖查询 | [公开原生/HTTP图组链](../apps/iad-harness/test/incremental_group.test.js) |
| 正常/异常知识、来源发现、污染与反馈 | [正常知识](../tests/test_dataset_knowledge.py)、[异常知识](../tests/test_defect_knowledge.py)、[来源发现](../apps/iad-harness/test/knowledge_sources.test.js)、[污染](../tests/test_knowledge_contamination.py)、[反馈](../tests/test_knowledge_feedback.py) |
| 连续范围、恢复与人工重核验 | [HTTP冻结覆盖](../apps/iad-harness/test/knowledge_scope.test.js)、[真实Agent调用链](../apps/iad-harness/test/knowledge_scope_agent.test.js)、[人工处置与取消恢复](../apps/iad-harness/test/knowledge_scope_review.test.js)、[原生知识会话](../apps/iad-harness/browser/knowledge-session.test.js) |
| 删除确认、历史证据与维护版本 | [公开HTTP维护链](../apps/iad-harness/test/knowledge_maintenance.test.js)、[知识浏览器操作](../apps/iad-harness/browser/knowledge-navigation.test.js)、[数据集共享交互](../apps/iad-harness/browser/workbench.test.js) |
| 实际视觉输入容量、带图综合、输出预算及能力未知/超时 | [公开容量链](../apps/iad-harness/test/knowledge_capacity.test.js)、[连续图组输出预算](../tests/test_vlm_output_budget.py) |
| 输入屏蔽与知识独立支持 | [提示边界](../tests/test_knowledge_prompt_scope.py)、[冻结知识审计](../tests/test_knowledge_audit.py) |
| 规则、疑点、分块与Mask真实证据 | [规则](../tests/test_rule_audit.py)、[疑点](../tests/test_audit_findings.py)、[容量](../tests/test_knowledge_capacity.py)、[Mask](../tests/test_mask_evidence.py) |
| 口径与中断恢复 | [报告](../tests/test_quality_report.py)、[目录变更闭环](../tests/test_folder_source_change_closed_loop.py)、[恢复](../tests/test_job_recovery.py)、[调用记录](../tests/test_model_calls.py) |
| 知识类型/数据集切换、历史与刷新 | [统一入口浏览器操作](../apps/iad-harness/browser/knowledge-navigation.test.js) |
| 浏览器公开用户链 | [工作台操作](../apps/iad-harness/browser/workbench.test.js) |
| 真实DSH会话及页面/图像往返 | [原生宿主](../apps/iad-harness/browser/session-handoff.test.js)、[Agent会话](../apps/iad-harness/test/agent_session.test.js) |
| 明暗、视口、字号、模态与焦点 | [页面布局](../apps/iad-harness/browser/workbench-layout.js)、[详情交互](../apps/iad-harness/browser/workbench-surfaces.js) |
| 合成图真实MLLM与会话验收 | [指定来源挖掘](../apps/iad-harness/scripts/verify-knowledge-selection.js)、[连续范围](../apps/iad-harness/scripts/verify-knowledge-scope.js)、[完整流程](../apps/iad-harness/scripts/verify-knowledge-products.js)、[接入边界](../apps/iad-harness/scripts/verify-dataset-intake.js)、[单步导入](../apps/iad-harness/scripts/verify-import-scope.js)、[恢复验证](../scripts/verify_job_recovery_live.py) |

## 模型服务与运行

启动、环境配置、命令和验证开关以[项目README](../README.md)、[环境模板](../.env.example)、[客户端](../python/iad_core/workbench/vision.py)及验证入口为准。实际地址、密钥和调用原文只保留在本地配置或运行库。

当前模型客户端的既有实现使用多图、JSON Schema 判别联合及包含视觉 token 的容量预检；这不代表所有 MLLM 都具有相同端点或限制，目标能力契约见规格 A09。现有 vLLM 后端的多模态 tokenize 缓存问题官方修复见[PR #38545](https://github.com/vllm-project/vllm/pull/38545)；无法升级时可使用官方参数 `--mm-processor-cache-gb 0` 禁用该层缓存。此项是运行约束，不改变知识或联合分析行为。usage 缺失表示服务未报告，不能替换成零或估算费用。
