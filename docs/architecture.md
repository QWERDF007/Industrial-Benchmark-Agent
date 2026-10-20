# 架构与源代码索引

DSH Web 是唯一 Web 宿主。浏览器调用同源 `/api/iad/*`；Node 将请求交给常驻 Python NDJSON worker；领域状态持久化到 SQLite。

## 工作台边界

| 职责 | 唯一实现入口 |
| --- | --- |
| 原生导航：模型审计、人工复核 | [client/index.ts](../apps/iad-harness/src/client/index.ts) |
| 页面与组件 | [WorkbenchPage.tsx](../apps/iad-harness/src/client/WorkbenchPage.tsx)、[components](../apps/iad-harness/src/client/components/) |
| 前后端接口类型 | [contracts.ts](../apps/iad-harness/src/shared/contracts.ts) |
| 宿主生命周期 | [server/index.ts](../apps/iad-harness/src/server/index.ts) |
| HTTP / RPC | [routes](../apps/iad-harness/src/server/routes/index.ts)、[remote](../apps/iad-harness/src/server/remote/index.ts) |
| NDJSON 调度与 worker | [PythonBridge](../apps/iad-harness/src/server/python-bridge/index.ts)、[entry.py](../python/iad_core/entry.py) |
| 数据集身份、目录、名称和良品参考 | [DatasetRegistry](../python/iad_core/dataset/registry.py) |
| Labelme 定位与导入 | [LabelmeAdapter](../python/iad_core/dataset/adapters/labelme.py)、[scanner](../python/iad_core/dataset/scanner.py) |
| 样本筛选、分页、评分及报告投影 | [WorkbenchQuery](../python/iad_core/workbench/query.py) |
| 良品模式学习、版本及参考变更失效 | [NormalProfiles](../python/iad_core/workbench/normal.py) |
| 数据集良品/不良品知识挖掘与版本证据 | [KnowledgeService](../python/iad_core/knowledge/service.py)、[来源资格与指纹](../python/iad_core/knowledge/sources.py)、[全图/原图细节分组与归纳](../python/iad_core/knowledge/mining.py)、[契约](../python/iad_core/knowledge/models.py)、[仓储](../python/iad_core/knowledge/repository.py) |
| 良品候选疑点、原图定位与联合证据核验 | [NormalVerification](../python/iad_core/knowledge/verification.py) |
| 冻结良品版本、异常候选与标注核验 | [DefectVerification](../python/iad_core/knowledge/defect.py)、[共享联合核验](../python/iad_core/knowledge/findings.py) |
| DSH 两项知识技能、原生执行工具及图像附件 | [技能定义](../apps/iad-harness/src/server/knowledge/skills.ts)、[工具](../apps/iad-harness/src/server/knowledge/index.ts)、[插件生命周期](../apps/iad-harness/src/server/index.ts) |
| 全图、局部裁剪及综合判断 | [SampleInspection](../python/iad_core/workbench/inspection.py)、[分析类型](../python/iad_core/advisory/analysis.py) |
| 视觉证据、原图坐标、无损 ROI 与分块 | [EvidenceImages](../python/iad_core/evidence/images.py) |
| Mask 像素、内容指纹、二值标注图与显示叠加 | [MaskImages / annotation_overlay](../python/iad_core/evidence/masks.py)、[Labelme 官方格式](https://github.com/wkentaro/labelme/blob/main/labelme/_label_file.py)、[官方坐标映射](https://github.com/wkentaro/labelme/blob/main/labelme/_utils/_shape.py) |
| 模型传输、实际 token 容量、结构化输出与响应校验 | [VlmClient](../python/iad_core/workbench/vision.py)、[vLLM 输出契约](https://github.com/vllm-project/vllm/blob/v0.18.0/docs/features/structured_outputs.md) |
| 全图与全部 ROI 联合分析、按实际容量分批 | [JointInspection](../python/iad_core/workbench/joint.py) |
| 页面统一作业轮询与逐图刷新 | [useAuditJobs](../apps/iad-harness/src/client/useAuditJobs.ts) |
| 审计领域执行 | [AuditService](../python/iad_core/workbench/audit.py) |
| 审计/知识共享作业生命周期 | [JobRunner](../python/iad_core/workbench/jobs.py)、[WorkbenchRuntime](../python/iad_core/workbench/runtime.py) |
| 图像查看器与标注图层 | [ImageViewer](../apps/iad-harness/src/client/components/ImageViewer.tsx) |
| 复核会话与裁决 | [HumanReview](../python/iad_core/workbench/review.py) |
| 数据表与迁移 | [Database](../python/iad_core/storage/database.py) |

初始无标注图作为良品参考，是本项目的数据约定；可通过模型审计页面调整。参考资格、人工裁决优先级及目标图排除规则以 `DatasetRegistry.references` 为准。导入质量、模型建议和人工裁决分别保留各自来源。

数据集 ID 为稳定身份，名称是可编辑的显示属性。注册配置以数据库 `datasets` 表为准；YAML 用于命令行导入以及已有数据集的首次注册。显式标注目录的匹配规则以 `LabelmeAdapter` 为准。

## 基准与评估领域

- [领域模型与仓储](../python/iad_core/storage/)
- [特征提取](../python/iad_core/feature/)、[候选挖掘](../python/iad_core/candidate/)、[证据](../python/iad_core/evidence/)
- [Gold 裁决](../python/iad_core/gold/)、[划分和防泄漏](../python/iad_core/split/)
- [基准构建](../python/iad_core/benchmark/)、[模型评估](../python/iad_core/evaluation/)
- [内部工具](../python/iad_core/tools/)、[CLI](../python/iad_cli/main.py)

## 验证入口

- [数据集、参考图和作业测试](../tests/test_dataset_workbench.py)
- [良品知识、版本、真实证据与取消测试](../tests/test_dataset_knowledge.py)
- [良品污染、正常解释、独立证据及核验分组测试](../tests/test_knowledge_contamination.py)
- [不良知识、标注核验、正常版本冻结与证据资格测试](../tests/test_defect_knowledge.py)
- [Mask 导入、像素、标注视图、版本与容量配对测试](../tests/test_mask_evidence.py)
- [复核、置信度和查询一致性测试](../tests/test_workbench_closeout.py)
- [真实 HTTP / Python 桥接测试](../apps/iad-harness/test/workbench.test.js)
- [真实 DSH 技能发现、加载、执行、取消及附件测试](../apps/iad-harness/test/knowledge_skills.test.js)
- [真实 MLLM 与原生知识技能验证](../apps/iad-harness/scripts/verify-knowledge-skills.js)
- [Firefox 用户流程测试](../apps/iad-harness/browser/workbench.test.js)
- [原生宿主侧栏与页面验收](../apps/iad-harness/scripts/verify-host-browser.js)
- [真实图像和模型验证](../scripts/verify_workbench_live.py)

命令见[项目 README](../README.md)，验证记录见本地 `WORKLOG.md`。

模型服务的容量预检要求见[MLLM 服务契约](operations/mllm.md)。
