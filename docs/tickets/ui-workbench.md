# 工作台 UI 重构任务

依赖与完成标准统一引用[UI规格](../specs/ui-workbench.md)，设计图与交互以该规格为准。任务执行证据只记录在根 WORKLOG.md。工业功能共用统一模型设置。

| 编号 | 优先级 | 任务 | 依赖 | 规格 |
|---|---|---|---|---|
| UI-T01 | P0 | 宿主导航组合与统一元数据 | 无 | UI-01、10 |
| UI-T02 | P0 | tokens与页面基础布局 | T01 | UI-02、03 |
| UI-T03 | P0 | 数据集列表和宽配置 | T02 | UI-04、05 |
| UI-T04 | P0 | 图像网格、筛选和来源选择器 | T02 | UI-04、05、10 |
| UI-T05 | P0 | 方向探索章节与互斥视图 | T04 | UI-05、09 |
| UI-T06 | P0 | 知识结果优先与配置拆分 | T04、T05 | UI-05、06 |
| UI-T07 | P1 | 作业/版本紧凑呈现 | T06 | UI-06、09 |
| UI-T08 | P0 | 审计结果、配置抽屉与报告 | T04、T07 | UI-07 |
| UI-T09 | P0 | 嵌入原图与专注复核 | T04 | UI-03、08、10 |
| UI-T10 | P1 | 冲突、记录和辅助状态 | T06、T09 | UI-08、10 |
| UI-T11 | P0 | 定向回归和最终视觉验收 | T03–T10 | 全部 |

## UI-T01 宿主导航

实现：[导航元数据](../../apps/iad-harness/src/shared/navigation.ts)、[宿主组合](../../apps/iad-harness/src/client/host/IndustrialSidebar.tsx)、[固定依赖补丁](../../patches/@deepseek-ai__dsh-client-ui-sidebar@0.2.0-rc.2.patch)。

工作：单一侧栏实现三章节；六业务ID和模型设置ID保持，原生新会话/工作区/插件/设置/折叠全部保留；其它插件仍可到达；导航元数据单源。

实际锁定版本0.2.0-rc.2已核对：sidebar.panellist只暴露id/order/label；sidebar根独占声明workspaces/settings等子插槽，重复声明会失败。采用固定依赖的最小组合扩展：在原sidebar shell提供一个可替换内容插槽及默认回退，将panel行与原生workspaces的合法渲染能力交给工业内容组件。扩展通过仓库中的pnpm patch可重复安装，附类型契约，不直接编辑安装目录，不复制工作区/会话状态，不升级整套DSH。根shell继续拥有品牌、新会话、折叠和设置。工业组件按navigation元数据分组并折叠原生会话区域；其他插件入口保留在辅助区。

完成：六页选择与URL一致；原生会话、设置往返不丢业务上下文；没有两个展开侧栏；无DOM搬运、伪元素标题或未确认的group属性。记录实际公开契约或最小扩展位置。

## UI-T02 基础布局

文件：theme.ts、controls.ts、styles.ts、WorkbenchPage.tsx，必要的Header/Section/PageTabs。

工作：设计参数落入主题映射，统一层级、间距、字段、动作；按容器适配；合并重复规则，删除旧选择器；同步独立模型设置页面。

完成：三模板样例成立；同级起点与基线对齐；明暗/200%字号可用；不靠固定空卡片填满页面。

## UI-T03 数据集

文件：DatasetManager.tsx、FolderMapping.tsx、DatasetName.tsx。

工作：表格+下方宽配置；目录分类/Labelme均覆盖；导入复用Modal；详细ID折叠；删除进入更多菜单。

完成：0/1/多数据集布局正常；四行映射可读可改；保存重扫走原接口；未保存改动按需提示；无目录缩略图装饰。

## UI-T04 图片与来源选择

文件：SampleGrid.tsx、SampleCard.tsx、Pagination.tsx，新增SampleFilters/SourcePicker。

工作：明确状态替代方块；次要分数脱离默认卡片；单一分页；批量选择独立；来源选择器供后续复用。

完成：长文件名、各纵横比不破坏网格；普通点击看原图；仅选择模式有checkbox；跨页已选不丢；没有整库原图请求。

## UI-T05 方向探索

文件：ExplorationPage.tsx、ExplorationSources.tsx、workspace.tsx。

工作：结果/新建/作业互斥；新建三章节；两组字段及图片对齐；完整选图复用选择器；结果提供采用跳转。

完成：不再混排长页；数量不足显示缺口；实际请求是选择的两组图；失败保留配置；完成不会自动采用/自动挖掘。

## UI-T06 知识页面

文件：KnowledgePage.tsx、KnowledgeSetup.tsx、KnowledgeDirections.tsx、KnowledgeState.tsx、KnowledgeScopePanel.tsx、workspace.tsx。

工作：默认判据和证据；新建独立；类型与tab分层；配置按方式/方向/图组/确认组织；连续范围、预设、良品依据保留。

完成：tab互斥；无知识时仍看作业；矛盾不显示为确认；数据集/类型不串草稿；真实请求使用已保存方向；选中、版本、返回可恢复。

## UI-T07 作业与版本

实现：[作业表](../../apps/iad-harness/src/client/components/JobTable.tsx)、[作业详情](../../apps/iad-harness/src/client/components/JobDetail.tsx)、[知识版本](../../apps/iad-harness/src/client/components/KnowledgeVersions.tsx)。

工作：紧凑列表；错误/证据/重试范围/关系/源会话按需；统一呈现但保留任务动作差异。

完成：运行/完成/失败/取消/中断动作正确；all_sources重试限制保留；冻结依据可查；行不轮询；深链任务可定位；知识任务特有删除不能套给所有类型。

## UI-T08 审计与报告

文件：WorkbenchPage.tsx、AuditSetup.tsx、AuditJobs.tsx、SampleInspector.tsx、QualityReport.tsx。

工作：结果首屏、设置抽屉、真实范围摘要、详情分层、分章节报告；仅展示统一工业模型及设置入口，不恢复逐任务模型覆盖。

完成：无知识/有知识/不匹配准入准确；筛选120张、页24张时仍审计120张；报告说明全数据集范围；不伪造AUROC或误报率。

## UI-T09 专注复核

文件：ImageViewer.tsx、SampleInspector.tsx、HumanReviewForm.tsx、useSampleNavigation.ts、useReviewDraft.ts，新增ImageCanvas/ReviewWorkspace。

工作：现有画布提取为嵌入/全屏共用；容器重排；固定提交；五裁决、草稿、submission保留；图和表单同对象。

完成：1366×768真实宿主可见图与提交；bbox/mask、缩放、证据无坐标回归；成功/失败/待确认正确；末页与非pending不误跳；全屏返回位置焦点恢复。

## UI-T10 冲突、记录、状态

文件：KnowledgeConflictReview.tsx、ReviewRecords.tsx、InspectionEvidence.tsx、InspectionQuestion.tsx、Modal.tsx及空态。

工作：冲突列表、对照证据、处置分区；记录表格；加载/错误/空态统一；问答仍进入原生会话。

完成：四种处置和重核验可执行；历史/来源变化准入正确；没有装饰插图、空KPI和第二套聊天系统；键盘可完成操作。

## UI-T11 验收清理

文件：browser现有测试、定向契约/单元测试、docs索引、WORKLOG。

工作：更新固化旧布局的断言；真实浏览器+固定fixture留代表截图；宿主往返、分页、草稿、原图、tab验证；清除旧CSS和重复组件。

完成：按[验收清单](../specs/ui-workbench.md#验收清单)给证据；未通过如实列明；不把生成图当运行截图；不以全量测试堆积替代交互验证。
