# 工作台 UI 任务

视觉与交互以 [UI 规格](../specs/ui-workbench.md) 指向的交付包 HTML 和两份方案文档为准。任务证据只记根 WORKLOG.md；本表不另存执行状态。

| 票据 | 范围与源码入口 | 完成标准 | 依赖 |
| --- | --- | --- | --- |
| V01 | [主题](../../apps/iad-harness/src/client/theme.ts)、[控件](../../apps/iad-harness/src/client/controls.ts)、[布局样式](../../apps/iad-harness/src/client/styles/base.ts)、Header/PageTabs、IndustrialSidebar | 七页边线、字号、控件与章节节奏对齐 HTML；原生导航保留 | 无 |
| V02 | DatasetManager、DatasetName、FolderMapping、collections.ts | 紧凑资源表、详情页签与章节两栏；保留 Labelme 双目录、重扫事务与删除准入 | V01 |
| V03 | SampleFilters、SampleGrid、SampleCard、SourcePicker | 紧凑筛选和来源工具条；24 张分页、跨页选择、缩略图加载正确 | V01 |
| V04 | ExplorationPage、ExplorationSources、KnowledgeSetup、KnowledgeDirections | 配置按原型章节组织；独立短数量字段、选择器内按数量选取；保留方向保存与连续范围 | V03 |
| V05 | KnowledgePage、KnowledgeState、KnowledgeEvidenceGallery、knowledge.ts | 紧凑类型/版本/来源上下文；判据与证据布局、历史版本及无版本作业可用 | V01、V03 |
| V06 | SampleInspector、AuditSetup、AuditJobs | 限高侧图与可达操作；完整筛选范围、冻结依据及报告口径正确 | V03、V05 |
| V07 | ReviewWorkspace、HumanReviewForm、ReviewRecords、review.ts | 纵向裁决与独立提交区；空记录无旧详情；草稿、幂等、推进、冲突及历史查看正确 | V03、V05 |
| V08 | ModelSettingsPage、ProviderManager、models.ts 与现有浏览器验收 | 配置分区与提供商表格；原生资料互通、冻结重试及规定视口/主题/字号验收通过 | V01–V07 |

不新增并存的 Sidebar、ImageCanvas、JobTable、模型状态仓库或 API 层。实现入口与测试边界见 UI 规格；模型契约继续引用[模型设置规格](../specs/workbench-model-settings.md)。
