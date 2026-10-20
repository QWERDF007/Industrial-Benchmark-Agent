# 架构与源代码索引

DSH Web 是唯一 Web 宿主。浏览器调用同源 `/api/iad/*`；Node 将请求交给常驻 Python NDJSON worker；领域状态持久化到 SQLite。

## 工作台边界

| 职责 | 唯一实现入口 |
| --- | --- |
| 原生六页导航与共享页面上下文 | [client/index.ts](../apps/iad-harness/src/client/index.ts)、[workspace](../apps/iad-harness/src/client/workspace.tsx) |
| 宿主语义主题适配 | [theme.ts](../apps/iad-harness/src/client/theme.ts)、[styles.ts](../apps/iad-harness/src/client/styles.ts) |
| 页面与组件 | [WorkbenchPage.tsx](../apps/iad-harness/src/client/WorkbenchPage.tsx)、[components](../apps/iad-harness/src/client/components/) |
| 前后端接口类型 | [contracts.ts](../apps/iad-harness/src/shared/contracts.ts) |
| 宿主生命周期 | [server/index.ts](../apps/iad-harness/src/server/index.ts) |
| HTTP / RPC | [routes](../apps/iad-harness/src/server/routes/index.ts)、[remote](../apps/iad-harness/src/server/remote/index.ts) |
| NDJSON 调度与 worker | [PythonBridge](../apps/iad-harness/src/server/python-bridge/index.ts)、[entry.py](../python/iad_core/entry.py) |
| 数据集身份、服务器目录检查、名称和良品参考 | [DatasetRegistry](../python/iad_core/dataset/registry.py)、[会话根目录接入](../apps/iad-harness/src/server/workbench-tools/index.ts)、[数据集列表与目录导入](../apps/iad-harness/src/client/components/DatasetManager.tsx) |
| Labelme 定位与导入 | [LabelmeAdapter](../python/iad_core/dataset/adapters/labelme.py)、[scanner](../python/iad_core/dataset/scanner.py) |
| Labelme ZIP 目录检查、原样提取及统一导入 | [DatasetArchive](../python/iad_core/dataset/archive.py)、[DatasetImport / DatasetRegistry](../python/iad_core/dataset/registry.py)、[DSH 接入工具](../apps/iad-harness/src/server/workbench-tools/index.ts) |
| 样本筛选、分页、排序及报告投影 | [WorkbenchQuery](../python/iad_core/workbench/query.py) |
| 分项质量报告口径、范围及统一契约 | [DatasetReport / QualityAssessment](../python/iad_core/workbench/report.py)、[报告界面](../apps/iad-harness/src/client/components/QualityReport.tsx) |
| 审计冻结知识、版本关系与独立支持 | [InspectionKnowledge](../python/iad_core/workbench/knowledge.py) |
| 逐项适用性、规则区域来源及缺口追加 | [分析契约](../python/iad_core/advisory/analysis.py)、[SampleInspection](../python/iad_core/workbench/inspection.py)、[JointInspection](../python/iad_core/workbench/joint.py)、[规则证据视图](../apps/iad-harness/src/client/components/RuleAssessments.tsx) |
| 综合疑点、实际来源关联/消解与全图聚焦 | [疑点契约](../python/iad_core/advisory/analysis.py)、[FindingLedger](../python/iad_core/workbench/findings.py)、[疑点视图](../apps/iad-harness/src/client/components/AuditFindings.tsx)、[共享证据按钮](../apps/iad-harness/src/client/components/AuditEvidence.tsx)、[ImageViewer](../apps/iad-harness/src/client/components/ImageViewer.tsx) |
| Python 分析/知识契约与客户端类型生成 | [分析模型](../python/iad_core/advisory/analysis.py)、[知识模型](../python/iad_core/knowledge/models.py)、[生成器](../apps/iad-harness/scripts/generate-contracts.js) |
| 数据集良品/不良品知识挖掘与版本证据 | [KnowledgeService](../python/iad_core/knowledge/service.py)、[来源资格与指纹](../python/iad_core/knowledge/sources.py)、[全图/原图细节分组与归纳](../python/iad_core/knowledge/mining.py)、[契约](../python/iad_core/knowledge/models.py)、[仓储](../python/iad_core/knowledge/repository.py) |
| 良品候选疑点、原图定位与联合证据核验 | [NormalVerification](../python/iad_core/knowledge/verification.py) |
| 冻结良品版本、异常候选与标注核验 | [DefectVerification](../python/iad_core/knowledge/defect.py)、[共享联合核验](../python/iad_core/knowledge/findings.py) |
| 后继知识来源积累、检查项身份及拆分/合并/退役 | [KnowledgeService](../python/iad_core/knowledge/service.py)、[KnowledgeEvolution](../python/iad_core/knowledge/evolution.py) |
| 审计疑点回流、冻结来源与两类挖掘的重新核验 | [AuditCandidates](../python/iad_core/knowledge/candidates.py)、[来源资格](../python/iad_core/knowledge/sources.py)、[知识疑点契约](../python/iad_core/knowledge/models.py) |
| DSH 两项知识技能、原生执行工具及图像附件 | [技能定义](../apps/iad-harness/src/server/knowledge/skills.ts)、[工具](../apps/iad-harness/src/server/knowledge/index.ts)、[插件生命周期](../apps/iad-harness/src/server/index.ts) |
| DSH 会话的数据接入、知识审计、结果与报告操作 | [原生工作台工具及流程指引](../apps/iad-harness/src/server/workbench-tools/index.ts)、[统一聊天结果投影](../apps/iad-harness/src/server/tool-output.ts) |
| 会话知识/审计的有界等待及真实证据附件 | [共享状态等待](../apps/iad-harness/src/server/job-status.ts)、[共享附件读取](../apps/iad-harness/src/server/evidence-attachment.ts) |
| 全图、局部裁剪及综合判断 | [SampleInspection](../python/iad_core/workbench/inspection.py)、[分析类型](../python/iad_core/advisory/analysis.py) |
| 视觉证据、原图坐标、无损 ROI 与分块 | [EvidenceImages](../python/iad_core/evidence/images.py) |
| 源图、标注与 Mask 内容指纹 | [SampleContent](../python/iad_core/evidence/sources.py)、[知识来源资格](../python/iad_core/knowledge/sources.py) |
| Mask 像素、内容指纹、二值标注图与显示叠加 | [MaskImages / annotation_overlay](../python/iad_core/evidence/masks.py)、[Labelme 官方格式](https://github.com/wkentaro/labelme/blob/main/labelme/_label_file.py)、[官方坐标映射](https://github.com/wkentaro/labelme/blob/main/labelme/_utils/_shape.py) |
| 模型传输、实际 token 容量、结构化输出与响应校验 | [VlmClient](../python/iad_core/workbench/vision.py)、[vLLM 输出契约](https://github.com/vllm-project/vllm/blob/v0.18.0/docs/features/structured_outputs.md) |
| 全图与全部 ROI 联合分析、按实际容量分批 | [JointInspection](../python/iad_core/workbench/joint.py) |
| 知识/审计共享轮询与逐图刷新 | [useJobs](../apps/iad-harness/src/client/useJobs.ts) |
| 审计领域执行 | [AuditService](../python/iad_core/workbench/audit.py) |
| 审计/知识共享作业、原子完成、进程接管与关联重试 | [JobRunner / JobContext / JobRetry](../python/iad_core/workbench/jobs.py)、[WorkbenchRuntime](../python/iad_core/workbench/runtime.py) |
| 作业关联的真实模型请求、返回、错误与服务用量 | [ModelCalls](../python/iad_core/workbench/calls.py)、[VlmClient](../python/iad_core/workbench/vision.py)、[原文读取操作](../python/iad_core/entry.py) |
| 图像查看器与标注图层 | [ImageViewer](../apps/iad-harness/src/client/components/ImageViewer.tsx) |
| 知识独立页面、版本与真实证据 | [KnowledgePage](../apps/iad-harness/src/client/components/KnowledgePage.tsx)、[版本投影](../python/iad_core/knowledge/repository.py) |
| 复核草稿与共享模态焦点 | [useReviewDraft](../apps/iad-harness/src/client/useReviewDraft.ts)、[Modal](../apps/iad-harness/src/client/components/Modal.tsx) |
| 复核会话与裁决 | [HumanReview](../python/iad_core/workbench/review.py) |
| 数据表与迁移 | [Database](../python/iad_core/storage/database.py) |

初始无标注图作为良品参考，是本项目的数据约定；可通过数据集管理调整。自动与人工选定范围、参考资格、人工裁决优先级及目标图排除规则以 `DatasetRegistry.references` 为准。导入质量、模型建议和人工裁决分别保留各自来源。

数据集 ID 为稳定身份，名称是可编辑的显示属性。注册配置以数据库 `datasets` 表为准；YAML 用于命令行导入以及已有数据集的首次注册。显式标注目录的匹配规则以 `LabelmeAdapter` 为准。

## 基准与评估领域

- [领域模型与仓储](../python/iad_core/storage/)
- [特征提取](../python/iad_core/feature/)、[候选挖掘](../python/iad_core/candidate/)、[证据](../python/iad_core/evidence/)
- [Gold 裁决](../python/iad_core/gold/)、[划分和防泄漏](../python/iad_core/split/)
- [基准构建](../python/iad_core/benchmark/)、[模型评估](../python/iad_core/evaluation/)
- [内部工具](../python/iad_core/tools/)、[CLI](../python/iad_cli/main.py)

## 验证入口

- [冻结知识审计、独立支持与实际 Mask 输入测试](../tests/test_knowledge_audit.py)
- [规则逐项覆盖、适用性、真实区域追加与证据约束测试](../tests/test_rule_audit.py)
- [局部/整体疑点、实际引用、跨批关联与有据消解测试](../tests/test_audit_findings.py)
- [数据集、参考图和作业测试](../tests/test_dataset_workbench.py)
- [分项质量、拒绝图分母、最新人审与冻结版本](../tests/test_quality_report.py)
- [ZIP 接入、原图/Mask 保持与坏包原子拒绝](../tests/test_dataset_archive.py)
- [并发查询与独立 worker 的首次数据库初始化测试](../tests/test_workbench_concurrency.py)
- [良品知识、版本、真实证据与取消测试](../tests/test_dataset_knowledge.py)
- [来源积累、规则身份、拆分/合并/退役及容量归纳测试](../tests/test_knowledge_evolution.py)
- [审计候选回流、污染隔离、过期来源与并发冻结测试](../tests/test_knowledge_feedback.py)
- [单个大 Mask 的容量分组、原像素配对、综合缺证与真实模型测试](../tests/test_knowledge_capacity.py)
- [模型原文、用量、错误、并发隔离和取消追踪测试](../tests/test_model_calls.py)
- [部分失败、源变化、知识发布及真实工作进程终止恢复](../tests/test_job_recovery.py)
- [良品污染、正常解释、独立证据及核验分组测试](../tests/test_knowledge_contamination.py)
- [不良知识、标注核验、正常版本冻结与证据资格测试](../tests/test_defect_knowledge.py)
- [Mask 导入、像素、标注视图、版本与容量配对测试](../tests/test_mask_evidence.py)
- [复核、置信度和查询一致性测试](../tests/test_workbench_closeout.py)
- [真实 HTTP / Python 桥接测试](../apps/iad-harness/test/workbench.test.js)
- [真实 DSH 技能发现、加载、执行、取消及附件测试](../apps/iad-harness/test/knowledge_skills.test.js)
- [DSH 原生接入与工作台查询一致性测试](../apps/iad-harness/test/dataset_tools.test.js)
- [真实 DSH Agent/Session 与官方模型适配器测试](../apps/iad-harness/test/agent_session.test.js)
- [真实 MLLM 与原生知识技能验证](../apps/iad-harness/scripts/verify-knowledge-skills.js)
- [真实自然语言会话、知识审计与图像追问验证](../apps/iad-harness/scripts/verify-dataset-session.js)
- [合成图真实 MLLM 与进程终止恢复验证](../scripts/verify_job_recovery_live.py)
- [Firefox 用户流程测试](../apps/iad-harness/browser/workbench.test.js)
- [原生宿主侧栏与页面验收](../apps/iad-harness/scripts/verify-host-browser.js)
- [真实图像和模型验证](../scripts/verify_workbench_live.py)

命令见[项目 README](../README.md)，验证记录见本地 `WORKLOG.md`。

模型服务的容量预检要求见[MLLM 服务契约](operations/mllm.md)。
