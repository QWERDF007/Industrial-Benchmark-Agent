# 实现与验收索引

目标行为见[规格](specs/incremental-knowledge-mining.md)，依赖与验收条件见[实施索引](tickets/README.md)。本页索引实现与验证入口；进度、验收证据和待裁决事项仅见根 WORKLOG.md。

## 接入与状态

| 职责 | 唯一入口 |
| --- | --- |
| DSH 宿主与原生页面注册 | [服务端生命周期](../apps/iad-harness/src/server/index.ts)、[客户端注册](../apps/iad-harness/src/client/index.ts) |
| 服务与构建的运行环境选择 | [启动入口](../start.sh)、[配置模板](../.env.example)、[启动契约验证](../tests/test_launcher.py) |
| 工业角色及可用工具指导投影 | [提示词组装](../apps/iad-harness/src/server/prompt/index.ts)、[真实 Agent 验收](../apps/iad-harness/test/prompt.test.js) |
| HTTP / Python 桥接 | [路由](../apps/iad-harness/src/server/routes/index.ts)、[桥接](../apps/iad-harness/src/server/python-bridge/index.ts)、[领域操作](../python/iad_core/entry.py) |
| 一致性契约、冻结范围与原始像素比较 | [契约](../python/iad_core/consistency/models.py)、[范围](../python/iad_core/consistency/scopes.py)、[像素](../python/iad_core/duplicate/pixels.py)、[契约生成](../apps/iad-harness/scripts/generate-contracts.js) |
| 内容索引、成员分页与扫描原子发布 | [索引](../python/iad_core/duplicate/index.py)、[schema](../python/iad_core/storage/consistency_schema.py)、[扫描快照](../python/iad_core/dataset/scan_snapshot.py) |
| 规范元数据、标注逐实例匹配与差异 | [规范](../python/iad_core/consistency/policy.py)、[对账](../python/iad_core/consistency/annotations.py)、[比较域与像素预算](../python/iad_core/consistency/comparison_domain.py)、[几何](../python/iad_core/consistency/geometry.py)、[结果契约](../python/iad_core/consistency/annotation_models.py)、[源忽略标记](../python/iad_core/dataset/adapters/labelme.py)、[忽略区域验证](../tests/test_annotation_ignores.py) |
| 内容组特征缓存、唯一写入口与任务报告 | [缓存](../python/iad_core/feature/cache.py)、[仓储](../python/iad_core/storage/features.py)、[任务入口](../python/iad_core/feature/builder.py)、[复用验证](../tests/test_feature_content_cache.py)、[真实模型缓存链](../scripts/verify_content_feature_cache.py) |
| 跨集 CPU 索引、有界租约与原子制品 | [运行时缓存](../python/iad_core/feature/index.py)、[CPU FlatIP](../python/iad_core/feature/flat_index.py)、[制品](../python/iad_core/feature/index_artifacts.py)、[查询](../python/iad_core/feature/search.py)、[生命周期测试](../tests/test_feature_corpus_index.py)、[真实索引链](../scripts/verify_corpus_index.py) |
| 精确/视觉混合召回、全成员核验与受管临时图 | [统一服务与流式批量](../python/iad_core/consistency/service.py)、[批量逐项结果](../python/iad_core/consistency/retrieval_batch.py)、[内容去重向量查询](../python/iad_core/consistency/visual_queries.py)、[结果契约](../python/iad_core/consistency/retrieval_models.py)、[分页](../python/iad_core/consistency/retrieval_paging.py)、[核验](../python/iad_core/consistency/retrieval_verification.py)、[查询特征](../python/iad_core/consistency/query_features.py)、[临时资源](../python/iad_core/consistency/temporary_images.py)、[服务测试](../tests/test_image_retrieval.py)、[真实模型链](../scripts/verify_image_retrieval.py) |
| 严格/近似关系、原图区域统计与候选聚类 | [复核](../python/iad_core/duplicate/verify.py)、[复核契约](../python/iad_core/duplicate/verification_models.py)、[版本化关系仓储](../python/iad_core/duplicate/pair_repository.py)、[防泄漏投影](../python/iad_core/duplicate/repository.py)、[原始像素](../python/iad_core/duplicate/pixels.py)、[候选编排](../python/iad_core/duplicate/miner.py)、[稀疏聚类](../python/iad_core/duplicate/clusters.py)、[产物模型](../python/iad_core/duplicate/models.py)、[报告](../python/iad_core/duplicate/report.py)、[旧直接关系重核验](../scripts/reverify_duplicate_relations.py)、[复核测试](../tests/test_image_verification.py)、[真实工业图验证](../scripts/verify_image_verification.py) |
| 冻结比较事实、原图保留与证据导出 | [证据契约](../python/iad_core/consistency/evidence_models.py)、[唯一仓储](../python/iad_core/consistency/repository.py)、[比较编排](../python/iad_core/evidence/consistency.py)、[冻结来源](../python/iad_core/evidence/consistency_sources.py)、[持久原图](../python/iad_core/evidence/retained.py)、[媒体](../python/iad_core/evidence/consistency_media.py)、[导出](../python/iad_core/evidence/consistency_export.py)、[共享原子文件](../python/iad_core/evidence/files.py)、[历史界面](../apps/iad-harness/src/client/components/ConsistencyEvidencePage.tsx)、[历史测试](../tests/test_consistency_evidence.py)、[HTTP](../apps/iad-harness/test/consistency_evidence.test.js)、[真实资源验证](../scripts/verify_consistency_evidence.py) |
| 跨集批次、索引准备与执行恢复 | [批次契约](../python/iad_core/consistency/job_models.py)、[批次编排](../python/iad_core/consistency/jobs.py)、[实际执行](../python/iad_core/consistency/job_worker.py)、[批次仓储](../python/iad_core/consistency/batch_repository.py)、[唯一执行器](../python/iad_core/workbench/jobs.py)、[结果分页](../python/iad_core/consistency/result_queries.py)、[桌面作业](../apps/iad-harness/src/client/components/ConsistencyJobsPanel.tsx)、[范围选择](../apps/iad-harness/src/client/components/ConsistencyScopePicker.tsx)、[批次与原始像素索引准入验证](../tests/test_consistency_jobs.py)、[公开 HTTP 验证](../apps/iad-harness/test/consistency_jobs.test.js)、[真实模型验证](../scripts/verify_consistency_jobs.py) |
| 已验证图组的原像素复用与大组覆盖 | [像素身份与区域统计](../python/iad_core/duplicate/pixels.py)、[保留原图与有界缓存](../python/iad_core/evidence/retained.py)、[冻结范围校验](../python/iad_core/consistency/scopes.py)、[实际工业图验证](../scripts/verify_consistency_group.py) |
| 范围事实查询、分页快照与报告 | [契约](../python/iad_core/consistency/result_models.py)、[快照](../python/iad_core/consistency/result_snapshot.py)、[分页](../python/iad_core/consistency/result_queries.py)、[覆盖](../python/iad_core/consistency/query_coverage.py)、[去重统计](../python/iad_core/consistency/result_statistics.py)、[报告](../python/iad_core/consistency/reports.py)、[来源现状](../python/iad_core/evidence/current_sources.py)、[作业只读模型](../python/iad_core/workbench/job_snapshots.py)、[公共行为验证](../tests/test_consistency_query.py) |
| 范围冲突与严格图组浏览 | [范围结果](../apps/iad-harness/src/client/components/ConsistencyScopeResults.tsx)、[图组与成员](../python/iad_core/consistency/group_queries.py)、[图组页面](../apps/iad-harness/src/client/components/ConsistencyGallery.tsx)、[实际桌面验证](../apps/iad-harness/browser/consistency.test.js) |
| 一致性上下文、附件与原生会话往返 | [引用/预算契约](../python/iad_core/consistency/context_models.py)、[实际上下文](../python/iad_core/consistency/context.py)、[原生工具](../apps/iad-harness/src/server/consistency/index.ts)、[原生技能](../apps/iad-harness/src/server/consistency/skill.ts)、[共享附件入口](../apps/iad-harness/src/server/evidence-attachment.ts)、[会话准入](../apps/iad-harness/src/client/workbench-session.ts)、[公开行为验证](../tests/test_consistency_context.py)、[Agent/附件验证](../apps/iad-harness/test/consistency-session.test.js)、[原生宿主往返](../apps/iad-harness/browser/consistency-session.test.js)、[实际模型验证入口](../apps/iad-harness/scripts/verify-consistency-session.js) |
| 模型审计与独立一致性轴 | [审计入口](../python/iad_core/workbench/audit.py)、[一致性检查](../python/iad_core/consistency/audit.py)、[记录契约](../python/iad_core/consistency/audit_models.py)、[唯一记录仓储](../python/iad_core/consistency/audit_repository.py)、[模型结果引用](../python/iad_core/advisory/analysis.py)、[已有向量查询](../python/iad_core/consistency/query_features.py)、[页面结果](../apps/iad-harness/src/client/components/AuditConsistency.tsx)、[公共行为验证](../tests/test_audit_consistency.py)、[桌面往返验证](../apps/iad-harness/browser/audit-consistency.test.js) |
| 一致性人工处置与源修正验证 | [处置契约](../python/iad_core/consistency/review_models.py)、[事务入口](../python/iad_core/consistency/review.py)、[唯一处置仓储](../python/iad_core/consistency/review_repository.py)、[既有人审写入](../python/iad_core/workbench/review.py)、[状态投影](../python/iad_core/consistency/review_states.py)、[区域建议](../python/iad_core/consistency/region_proposals.py)、[处置页面](../apps/iad-harness/src/client/components/ConsistencyReviewPanel.tsx)、[公共行为验证](../tests/test_consistency_review.py)、[HTTP闭环](../apps/iad-harness/test/consistency_review.test.js) |
| 检索公共操作、multipart 与会话附件 | [领域操作](../python/iad_core/consistency/operations.py)、[HTTP适配](../apps/iad-harness/src/server/images/http.ts)、[上传解析](../apps/iad-harness/src/server/images/upload.ts)、[原生会话适配](../apps/iad-harness/src/server/images/native.ts)、[公开链测试](../apps/iad-harness/test/image_retrieval.test.js) |
| 跨集页面、单图检索与同步比较 | [页面引用](../apps/iad-harness/src/shared/navigation.ts)、[导航状态](../apps/iad-harness/src/client/workspace.tsx)、[页面](../apps/iad-harness/src/client/components/ConsistencyPage.tsx)、[比较器](../apps/iad-harness/src/client/components/ConsistencyComparison.tsx)、[共享画布](../apps/iad-harness/src/client/components/ImageCanvas.tsx)、[桌面交互验证](../apps/iad-harness/browser/consistency.test.js) |
| 图像编码器配置、实际模型与单模型生命周期 | [配置](../python/iad_core/feature/profiles.py)、[编码器](../python/iad_core/feature/encoder.py)、[操作](../python/iad_core/feature/operations.py)、[工作台](../python/iad_core/workbench/runtime.py)、[设置分区](../apps/iad-harness/src/client/components/ImageEncoderSettings.tsx) |
| 数据集配置、身份、来源、删除与参考资格 | [配置](../python/iad_core/task/config.py)、[注册](../python/iad_core/dataset/registry.py)、[关联审核清理](../python/iad_core/consistency/deletion.py) |
| 格式适配与原子扫描 | [适配器](../python/iad_core/dataset/adapters/)、[图像枚举](../python/iad_core/dataset/files.py)、[目录角色](../python/iad_core/dataset/folder_rules.py)、[预览确认](../python/iad_core/dataset/folder_preview.py)、[扫描](../python/iad_core/dataset/scanner.py)、[发布](../python/iad_core/dataset/scan_snapshot.py) |
| 数据模型、数据库与仓储 | [存储](../python/iad_core/storage/)、[知识来源存储迁移](../python/iad_core/storage/knowledge_schema.py) |
| 查询、筛选、数量与分项报告 | [查询](../python/iad_core/workbench/query.py)、[报告](../python/iad_core/workbench/report.py) |
| 知识资格、来源分页、冻结内容与来源变化 | [资格](../python/iad_core/knowledge/sources.py)、[来源契约](../python/iad_core/knowledge/models.py)、[内容指纹](../python/iad_core/evidence/sources.py)、[来源与变化查询](../python/iad_core/knowledge/query.py) |
| 联合方向探索、不可变结果及采用 | [探索领域](../python/iad_core/exploration/)、[独立技能与工具](../apps/iad-harness/src/server/exploration/index.ts)、[提示词预设](../python/iad_core/exploration/prompts.py)、[探索页面](../apps/iad-harness/src/client/components/ExplorationPage.tsx)、[公开链测试](../tests/test_direction_exploration.py)、[原生会话](../apps/iad-harness/test/exploration-session.test.js)、[浏览器链](../apps/iad-harness/browser/exploration.test.js) |
| 挖掘方向、业务提示词和冻结 | [方向契约与默认项](../python/iad_core/knowledge/instructions.py)、[配置存储](../python/iad_core/knowledge/prompts.py)、[方向编辑](../apps/iad-harness/src/client/components/KnowledgeDirections.tsx)、[观察范围](../apps/iad-harness/src/client/components/KnowledgeDiscovery.tsx) |
| 图组契约、支持策略与继承 | [图组及宿主调用](../python/iad_core/knowledge/requests.py)、[支持分组](../python/iad_core/knowledge/support.py)、[证据继承](../python/iad_core/knowledge/evolution.py)、[选图配置](../apps/iad-harness/src/client/components/KnowledgeSetup.tsx) |
| 先观察、修订比较、冲突隔离与人审重核验 | [冻结观察](../python/iad_core/knowledge/observation.py)、[冲突](../python/iad_core/knowledge/conflicts.py)、[重核验](../python/iad_core/knowledge/recheck.py)、[输入冻结](../python/iad_core/knowledge/frozen.py) |
| 连续范围、会话准入与进度 | [冻结范围](../python/iad_core/knowledge/scopes.py)、[范围界面](../apps/iad-harness/src/client/components/KnowledgeScopePanel.tsx)、[宿主会话](../apps/iad-harness/src/client/workbench-session.ts) |
| 未发布观察、证据分页及发布口径 | [观察追溯](../python/iad_core/knowledge/trace.py)、[作业投影](../python/iad_core/workbench/jobs.py)、[观察界面](../apps/iad-harness/src/client/components/KnowledgeJobEvidence.tsx) |
| 作业删除、条目移除与不可变历史 | [作业](../python/iad_core/workbench/jobs.py)、[知识维护](../python/iad_core/knowledge/maintenance.py)、[维护后新鲜度](../python/iad_core/knowledge/query.py)、[共享删除交互](../apps/iad-harness/src/client/components/DeleteAction.tsx) |
| 知识挖掘、版本、污染与标注核验 | [知识领域](../python/iad_core/knowledge/) |
| 全图/ROI、原图坐标与真实像素 | [图像证据](../python/iad_core/evidence/images.py)、[Mask](../python/iad_core/evidence/masks.py) |
| 冻结知识、单图联合分析、疑点与作业 | [审计](../python/iad_core/workbench/audit.py)、[单图](../python/iad_core/workbench/inspection.py)、[联合分析](../python/iad_core/workbench/joint.py)、[作业](../python/iad_core/workbench/jobs.py) |
| 模型传输、容量、结构化输出与调用记录 | [模型配置](../python/iad_core/workbench/model_profile.py)、[模型客户端](../python/iad_core/workbench/vision.py)、[分析契约](../python/iad_core/advisory/analysis.py)、[调用记录](../python/iad_core/workbench/calls.py) |
| 统一工业模型、原生提供商与冻结路由 | [设置契约及存储](../python/iad_core/workbench/model_settings.py)、[设置操作](../python/iad_core/workbench/model_operations.py)、[宿主解析](../apps/iad-harness/src/server/models/)、[独立设置页面](../apps/iad-harness/src/client/components/ModelSettingsPage.tsx)、[按作业运行时](../python/iad_core/workbench/runtime.py) |
| 人工提交与历史 | [人工复核](../python/iad_core/workbench/review.py)、[知识处置](../python/iad_core/workbench/knowledge_review.py)、[冲突复核界面](../apps/iad-harness/src/client/components/KnowledgeConflictReview.tsx)、[人审存储](../python/iad_core/storage/review_repository.py) |
| 原生工具、模型可见结果、当前技能注册、状态等待与图像附件 | [工作台工具](../apps/iad-harness/src/server/workbench-tools/index.ts)、[知识工具](../apps/iad-harness/src/server/knowledge/)、[结果投影](../apps/iad-harness/src/server/tool-output.ts)、[完整分析技能](../apps/iad-harness/src/server/workbench-tools/skill.ts)、[等待](../apps/iad-harness/src/server/job-status.ts)、[附件](../apps/iad-harness/src/server/evidence-attachment.ts) |
| 生成的客户端契约 | [契约](../apps/iad-harness/src/shared/contracts.ts)、[生成入口](../apps/iad-harness/scripts/generate-contracts.js) |
| 页面身份、知识类型与结果跳转 | [导航契约](../apps/iad-harness/src/shared/navigation.ts)、[工作区状态](../apps/iad-harness/src/client/workspace.tsx)、[结果链接](../apps/iad-harness/src/shared/tool-presentation.ts) |
| 页面、共享上下文与组件 | [工作台](../apps/iad-harness/src/client/WorkbenchPage.tsx)、[上下文](../apps/iad-harness/src/client/workspace.tsx)、[组件](../apps/iad-harness/src/client/components/)、[数据集页面](../apps/iad-harness/src/client/components/DatasetManager.tsx)、[数据集样式](../apps/iad-harness/src/client/styles/datasets.ts)、[目录预览](../apps/iad-harness/src/client/useFolderPreview.ts)、[目录映射](../apps/iad-harness/src/client/components/FolderMapping.tsx) |
| 主题、控件与模态焦点 | [主题](../apps/iad-harness/src/client/theme.ts)、[共享控件](../apps/iad-harness/src/client/controls.ts)、[图标按钮](../apps/iad-harness/src/client/components/IconButton.tsx)、[布局](../apps/iad-harness/src/client/styles.ts)、[模态](../apps/iad-harness/src/client/components/Modal.tsx) |
| 大图呈现、边缘切图与当前查询导航 | [画布](../apps/iad-harness/src/client/components/ImageCanvas.tsx)、[查看器](../apps/iad-harness/src/client/components/ImageViewer.tsx)、[样式](../apps/iad-harness/src/client/styles/overlays.ts)、[导航](../apps/iad-harness/src/client/useSampleNavigation.ts) |
| Gold、数据划分、基准及外部评估入口 | [Gold投影](../python/iad_core/gold/projection.py)、[一致性约束](../python/iad_core/gold/consistency.py)、[报告可用性](../python/iad_core/gold/readiness.py)、[当前严格内容关系](../python/iad_core/duplicate/relations.py)、[防泄漏关系](../python/iad_core/duplicate/repository.py)、[划分](../python/iad_core/split/)、[基准](../python/iad_core/benchmark/)、[评估](../python/iad_core/evaluation/)、[公共验证](../tests/test_gold_consistency.py)、[本地工业图验证](../scripts/verify_gold_consistency.py) |
| 工业图检索基准与真实权重对照 | [清单契约](../python/iad_core/evaluation/retrieval_models.py)、[来源和变换](../python/iad_core/evaluation/benchmark_images.py)、[统一链评测](../python/iad_core/evaluation/retrieval.py)、[报告](../python/iad_core/evaluation/retrieval_report.py)、[冻结入口](../scripts/build_retrieval_benchmark.py)、[评测入口](../scripts/evaluate_image_retrieval.py)、[公开行为验证](../tests/test_retrieval_evaluation.py) |
| 有界解码与大图资源验证 | [统一解码](../python/iad_core/consistency/decoding.py)、[资源配置](../python/iad_core/feature/profiles.py)、[内容缓存](../python/iad_core/feature/cache.py)、[原图复核](../python/iad_core/consistency/retrieval_verification.py)、[负载构造](../python/iad_core/evaluation/resource_workload.py)、[准备](../python/iad_core/evaluation/resource_preparation.py)、[独立进程测量与逐次时延](../python/iad_core/evaluation/resource_measurement.py)、[增量与取消](../python/iad_core/evaluation/resource_incremental.py)、[真实内核取消探针](../python/iad_core/evaluation/resource_cancellation.py)、[结果报告](../python/iad_core/evaluation/resource_report.py)、[构造入口](../scripts/build_retrieval_resource_workload.py)、[测量入口](../scripts/evaluate_retrieval_resources.py)、[公开行为验证](../tests/test_retrieval_resources.py) |

## 已有测试边界

正式基准发布与资源验收入口：[目录发布](../python/iad_core/benchmark/publication.py)、[发布失败验证](../tests/test_benchmark_publication.py)、[资源验收契约](../python/iad_core/evaluation/resource_models.py)、[已有实测汇总](../scripts/report_image_retrieval.py)。

完整一致性流程：[DSH 解释与源修正入口](../apps/iad-harness/scripts/verify-consistency-session.js)、[CLI 验证](../apps/iad-harness/test/consistency-workflow.test.js)、[审核与 Gold 联动](../tests/test_gold_consistency.py)、[基准工具状态](../python/iad_core/tools/benchmark_tools.py)。

多目录自主发现与跨集接入：[通用技能](../apps/iad-harness/src/server/consistency/skill.ts)、[只读目录及导入工具](../apps/iad-harness/src/server/workbench-tools/index.ts)、[原生会话混合格式验证](../apps/iad-harness/test/dataset_consistency_session.test.js)。

自然语言一致性意图：[实际模型入口](../apps/iad-harness/scripts/verify-consistency-intents.js)、[公开 CLI 验证](../apps/iad-harness/test/consistency-intents.test.js)；使用原生完整工具面和隔离数据库，区分 Agent 调用与恢复场景的驱动准备。

数据一致性视图：[页面协调](../apps/iad-harness/src/client/components/ConsistencyPage.tsx)、[范围结果](../apps/iad-harness/src/client/components/ConsistencyScopeResults.tsx)、[候选图网格](../apps/iad-harness/src/client/components/ConsistencyCandidates.tsx)、[冻结对比复用](../apps/iad-harness/src/client/components/FrozenConsistencyComparison.tsx)、[批次启动](../apps/iad-harness/src/client/useConsistencyStart.ts)、[浏览器行为与桌面布局](../apps/iad-harness/browser/consistency.test.js)；视觉依据见[网格与宽屏弹窗专项交付](95E6AEB8E8B480E58C95E6B9A1E585_9CE788B2E78089%2588.zip)。

模型工具参数传输：[pi-ai 适配器](../patches/@deepseek-ai__dsh-llm-pi-ai@0.2.0-rc.2.patch)、[依赖声明](../package.json)、[传输与原生契约验证](../apps/iad-harness/test/consistency-intents.test.js)。领域参数仍由 Pydantic 生成。

实际模型审核至正式导出：[公开 CLI](../scripts/verify_gold_consistency.py)、[本机协议验证](../tests/test_gold_workflow_cli.py)。

局域网 HTTP 与缺少原生 UUID 接口的浏览器操作：[批次与人审验证](../apps/iad-harness/browser/consistency.test.js)。

一致性人审响应丢失、刷新恢复与同请求重试：[桌面浏览器链](../apps/iad-harness/browser/consistency.test.js)。Agent 人审事实与作业去重投影：[统一输出](../apps/iad-harness/src/server/tool-output.ts)、[原生工具验证](../apps/iad-harness/test/consistency-session.test.js)。

| 边界 | 现有验证入口 |
| --- | --- |
| 一致性范围、计数、原始像素及独立运行时 | [契约](../tests/test_consistency_contracts.py)、[冻结范围](../tests/test_consistency_scopes.py)、[像素](../tests/test_pixel_content.py)、[运行时](../tests/test_consistency_runtime.py)、[原生契约](../apps/iad-harness/test/consistency-contracts.test.js) |
| 完整快照图像网格、固定代表及成员分页 | [派生查询](../python/iad_core/consistency/gallery.py)、[网格](../apps/iad-harness/src/client/components/ConsistencyGallery.tsx)、[宽屏弹窗](../apps/iad-harness/src/client/components/ConsistencyGroupDialog.tsx)、[数据行为验证](../tests/test_consistency_gallery.py)、[桌面真实链](../apps/iad-harness/browser/consistency-gallery.test.js) |
| 图组模型解释、结构化引用与真实状态 | [模型合同](../python/iad_core/consistency/group_analysis_models.py)、[既有作业集成](../python/iad_core/consistency/group_analysis.py)、[结果读取](../apps/iad-harness/src/client/components/ConsistencyGroupAnalysis.tsx)、[协议/引用验证](../tests/test_consistency_group_analysis.py) |
| 内容索引增量、回滚与基础CPU安装 | [索引测试](../tests/test_pixel_index.py)、[独立CPU验证](../scripts/verify_image_index_cpu.py) |
| 逐实例对账、规范/角色、真实mask与歧义 | [标注对账](../tests/test_annotation_consistency.py)、[原生规范导入](../apps/iad-harness/test/dataset_tools.test.js) |
| 实际图像模型、独立设置与桌面交互 | [配置及预处理](../tests/test_embedding_profiles.py)、[本地DINOv3制品](../python/iad_core/feature/local_dino.py)、[真实权重](../scripts/verify_image_encoders.py)、[公开HTTP](../apps/iad-harness/test/image_settings.test.js)、[原生浏览器](../apps/iad-harness/browser/model-settings.test.js) |
| 接入、重扫、删除、身份与源文件保留 | [工作台](../tests/test_dataset_workbench.py)、[来源](../tests/test_dataset_sources.py)、[删除与审核联动](../tests/test_dataset_deletion.py) |
| 公开 HTTP 与 DSH 工具状态一致 | [HTTP操作](../apps/iad-harness/test/workbench.test.js)、[原生工具](../apps/iad-harness/test/dataset_tools.test.js) |
| 三输入、版本继承、支持策略与覆盖查询 | [公开原生/HTTP图组链](../apps/iad-harness/test/incremental_group.test.js) |
| 正常/异常知识、来源发现、污染与反馈 | [正常知识](../tests/test_dataset_knowledge.py)、[异常知识](../tests/test_defect_knowledge.py)、[来源发现](../apps/iad-harness/test/knowledge_sources.test.js)、[污染](../tests/test_knowledge_contamination.py)、[反馈](../tests/test_knowledge_feedback.py) |
| 连续范围、恢复与人工重核验 | [HTTP冻结覆盖](../apps/iad-harness/test/knowledge_scope.test.js)、[真实Agent调用链](../apps/iad-harness/test/knowledge_scope_agent.test.js)、[人工处置与取消恢复](../apps/iad-harness/test/knowledge_scope_review.test.js)、[原生知识会话](../apps/iad-harness/browser/knowledge-session.test.js) |
| 删除确认、历史证据与维护版本 | [公开HTTP维护链](../apps/iad-harness/test/knowledge_maintenance.test.js)、[知识浏览器操作](../apps/iad-harness/browser/knowledge-navigation.test.js)、[数据集共享交互](../apps/iad-harness/browser/workbench.test.js) |
| 完整图组、实际容量、输出预算与失败决策 | [公开容量链](../apps/iad-harness/test/knowledge_capacity.test.js)、[完整图组及输出预算](../tests/test_vlm_output_budget.py)、[原生Agent失败确认](../apps/iad-harness/scripts/verify-knowledge-failure-confirmation.js) |
| 输入屏蔽与知识独立支持 | [提示边界](../tests/test_knowledge_prompt_scope.py)、[冻结知识审计](../tests/test_knowledge_audit.py) |
| 规则、疑点、分块与Mask真实证据 | [规则](../tests/test_rule_audit.py)、[疑点](../tests/test_audit_findings.py)、[容量](../tests/test_knowledge_capacity.py)、[Mask](../tests/test_mask_evidence.py) |
| 口径与中断恢复 | [报告](../tests/test_quality_report.py)、[目录变更闭环](../tests/test_folder_source_change_closed_loop.py)、[恢复](../tests/test_job_recovery.py)、[调用记录](../tests/test_model_calls.py) |
| 知识类型/数据集切换、历史与刷新 | [统一入口浏览器操作](../apps/iad-harness/browser/knowledge-navigation.test.js) |
| 浏览器公开用户链 | [工作台操作](../apps/iad-harness/browser/workbench.test.js) |
| 数据集管理视觉、草稿与真实导入/重扫 | [数据集原生浏览器链](../apps/iad-harness/browser/datasets.test.js) |
| 真实DSH会话及页面/图像往返 | [原生宿主](../apps/iad-harness/browser/session-handoff.test.js)、[Agent会话](../apps/iad-harness/test/agent_session.test.js) |
| 统一模型、提供商互通、会话独立与冻结重试 | [原生设置及四类任务](../apps/iad-harness/browser/model-settings.test.js)、[独立执行与重试](../tests/test_workbench_models.py) |
| 明暗、桌面布局、模态与焦点 | [页面布局](../apps/iad-harness/browser/workbench-layout.js)、[详情交互](../apps/iad-harness/browser/workbench-surfaces.js) |
| 合成图真实MLLM与会话验收 | [指定来源挖掘](../apps/iad-harness/scripts/verify-knowledge-selection.js)、[连续范围](../apps/iad-harness/scripts/verify-knowledge-scope.js)、[完整流程](../apps/iad-harness/scripts/verify-knowledge-products.js)、[接入边界](../apps/iad-harness/scripts/verify-dataset-intake.js)、[单步导入](../apps/iad-harness/scripts/verify-import-scope.js)、[恢复验证](../scripts/verify_job_recovery_live.py) |

## 模型服务与运行

启动、环境配置、命令和验证开关以[项目README](../README.md)、[环境模板](../.env.example)、[客户端](../python/iad_core/workbench/vision.py)及验证入口为准。实际地址、密钥和调用原文只保留在本地配置或运行库。

DSH 设置组件的版本以[依赖覆盖](../package.json)为准；局域网认证浏览器的设置持久化依据[上游修复 #4201](https://github.com/deepseek-ai/deepseek-harness/commit/23c29d067a865107d5157c6924dbbe09c571d4c4)。会话提供商通过原生【设置 → 模型】管理，再由输入框模型菜单选择；独立视觉作业的服务配置由上述模型客户端读取。

当前模型客户端的既有实现使用多图、JSON Schema 判别联合及包含视觉 token 的容量预检；这不代表所有 MLLM 都具有相同端点或限制，目标能力契约见规格 A09。现有 vLLM 后端的多模态 tokenize 缓存问题官方修复见[PR #38545](https://github.com/vllm-project/vllm/pull/38545)；无法升级时可使用官方参数 `--mm-processor-cache-gb 0` 禁用该层缓存。此项是运行约束，不改变知识或联合分析行为。usage 缺失表示服务未报告，不能替换成零或估算费用。

原生会话区域与底部工具的滚动边界：[侧栏](../apps/iad-harness/src/client/host/IndustrialSidebar.tsx)、[真实宿主布局验证](../apps/iad-harness/browser/workbench-layout.js)、[含会话验证](../apps/iad-harness/browser/consistency-session.test.js)。
