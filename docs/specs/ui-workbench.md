# 工作台 UI

七页设计基线为 [Industrial_Benchmark_UI_20261023.zip](../Industrial_Benchmark_UI_20261023.zip)。实际交互按包内 HTML；全局视觉、知识配置、方向详情与大图按 `UI_Refinement_*`，探索执行按 [探索规格](direction-exploration.md)，其余区域沿用包内七页基线。不将原型演示数据、计时器或本地队列接入生产。

数据集管理以 [数据集专项交付](../Industrial_Benchmark_95E6AE9BE6BF94E6A796E688.zip) 中的 HTML、调整说明及截图为准；仅覆盖数据集列表、目录映射、基本信息和相关弹窗，保留原生导航与后端契约。

大图窗口切图入口以 [左右悬浮切图专项交付](../A4E5BE9FE78B99E6ACB5E5A68FE5879BE58C95E4A4BB%2598.zip) 为准，覆盖此前顶栏切图按钮的呈现要求。

方向探索结果与知识挖掘作业记录以[合并专项交付](../96E5918EE7A2_9FE8868CE698_UIBCE596_AEE6B496E688_90E5B689%2588.zip)为准，复用既有领域数据与公共弹层。

数据一致性以[网格与宽屏弹窗专项交付](../95E6AEB8E8B480E58C95E6B9A1E585_9CE788B2E78089%2588.zip)为当前视觉与交互依据；业务实现及验收见[统一索引](../architecture.md)。

## 结构与单一来源

- 数据准备、知识构建、质量审核各两个业务入口，模型设置在辅助区。每页一个 h1；页头、页签及页面状态复用现有导航和 Workspace。
- 主题由 DSH 决定，页面、原生侧栏、工具卡、tooltip、浮层和 dialog 使用同一 token 作用域。颜色、字号、边界和间距只在 [主题](../../apps/iad-harness/src/client/theme.ts)、[控件](../../apps/iad-harness/src/client/controls.ts) 及 [领域样式索引](../../apps/iad-harness/src/client/styles.ts) 定义。
- 独立内容面板具备完整外边界；控件边界与结构分隔区分。主操作、选中、焦点、禁用和错误保持语义一致。普通面板不加常驻阴影，不增加装饰模块或示例指标。
- 运行与验收以 PC 1920×1080、正常字号为准；保留业务容器的桌面布局，不提供手机及手机放大字号专用适配。

## 页面契约

| 页面 | 当前结构与不变量 |
| --- | --- |
| 数据集 | 紧凑资源表、选中名称、目录映射/基本信息页签；单页和空列表无无效分页。Labelme 双目录、无标注来源与目录分类映射通过原子保存并重扫入口写入。 |
| 图像 | 普通浏览与来源批量选择分开；24 张页长、筛选总量与当前页区分、跨页/搜索不丢选择。缩略图按比例显示，不裁切缺陷。 |
| 探索 | 配置主区与运行侧栏、真实阶段与服务端队列；运行不锁新草稿。无结果、进行中、发布、失败和同步失败分别呈现，详见探索规格。 |
| 知识 | 类型/版本/来源上下文；判据、待核实、版本、作业互斥；空版本仍可查失败任务。配置使用下述列表与侧栏，业务语义沿用知识规格。 |
| 审计 | 结果优先，配置抽屉；筛选占内容全宽。冻结全筛选范围而非当前页，统一模型与知识依据不被新选择改写。限高详情图使观察与复核操作可达。 |
| 复核 | 队列、共享画布、纵向五裁决；字段与提交区分开。面板保持草稿和焦点，空历史不显示队列旧详情。 |
| 模型 | 工作台模型/提供商页签，模型选择与高级能力分区；JSON 对象校验就近显示，原生资料共用、会话独立、历史作业与重试冻结配置保持。 |

数据与人工口径分别见 [知识规格](incremental-knowledge-mining.md)、[模型规格](workbench-model-settings.md) 与 [实现索引](../architecture.md)，不在 UI 文档复制。

## 数据集管理

- 列表与当前配置保持上下两段，读取同一 Dataset；搜索、分页、重命名、选择和删除继续复用现有入口。
- 数据表、目录角色表的字号、行高、列宽及配置面板布局由 [数据集样式](../../apps/iad-harness/src/client/styles/datasets.ts) 统一定义。专项浅色变量仍由 [主题](../../apps/iad-harness/src/client/theme.ts) 管理，不影响其余页面，深色沿用共享调色。
- 基本信息展示真实名称、格式、图像及标注/标签数量、数据集标识；名称编辑仍使用 [DatasetName](../../apps/iad-harness/src/client/components/DatasetName.tsx)。目录草稿、撤销及真实重扫共用 [DatasetManager](../../apps/iad-harness/src/client/components/DatasetManager.tsx)，目录角色与预览继续使用 [FolderMapping](../../apps/iad-harness/src/client/components/FolderMapping.tsx)。
- 数据集专项验收入口为 [原生浏览器链](../../apps/iad-harness/browser/datasets.test.js)，覆盖真实 HTTP/Python/SQLite/PIL；数据身份、目录来源和扫描契约见 [实现索引](../architecture.md)，不迁入演示数据或计时器。

## U-01 共享方向详情

- 从探索结果或知识配置来源原地打开同一组件，不丢配置类型与草稿。弹窗自然高度，超出屏幕只滚正文，标题和底部操作保持可达。
- 全宽观察目标 → 比较依据/限制 → 全宽分组证据；保留服务端长原文，不为布局自动改写。
- 通过当前方向 evidence_ids、snapshot.evidence 和来源 sample_id 精确映射局部 N/A 别名。文本安全拆分引用按钮；未知引用保留原文，缺图显示缺失，不生成替代图片。
- 点击引用滚动并聚焦对应证据；两组同时展示，大集合按组展开更多，数量来自实际集合。完整 ID 与溯源折叠。
- 去知识挖掘只定位候选；适用类型约束与显式勾选、保存要求不变。

实现：[DirectionDetail](../../apps/iad-harness/src/client/components/DirectionDetail.tsx)。

## U-02 大图检视

- 复用 [ImageViewer](../../apps/iad-harness/src/client/components/ImageViewer.tsx) → [ImageCanvas](../../apps/iad-harness/src/client/components/ImageCanvas.tsx)，保留真实像素缩放、适应、滚轮锚点、平移、ResizeObserver、annotation 和 inspection。
- 工具栏包含返回、完整可访问文件名、角色/集合位置、缩放、标注/图层及关闭。画布深色，辅助栏只显示当前方向与当前证据集合、折叠图像资料；与 inspection 共用一个辅助区。
- 大图和嵌入复核画布统一使用左右边缘独立悬浮按钮；键盘聚焦可见，无悬浮能力的设备直接显示可用按钮。命中区域、显隐和图形由 [大图样式](../../apps/iad-harness/src/client/styles/overlays.ts) 管理，行为与禁用状态继续复用 [当前查询导航](../../apps/iad-harness/src/client/useSampleNavigation.ts)。
- 切图限定当前集合，首尾禁用；[媒体加载组件](../../apps/iad-harness/src/client/components/MediaLoad.tsx)统一呈现当前图像的加载、错误和重试状态，失败不自动跳过。按 src 记住每图变换；100% 是原生像素倍率，不能冒充适应窗口。
- PgUp/PgDn 切图，方向键继续平移。Esc 先清理画布局部状态，再返回详情；恢复原滚动位置与打开图像的按钮焦点。画布与辅助证据栏并排展示。

## U-03 知识配置

- 主区依次为方式与依据、挖掘目标、挖掘方向；侧栏为图像范围、运行确认。按业务容器重排为单列，不保留装饰空栏。
- 通用/探索/自定义分类、搜索、仅已选只影响可见列表，不清空隐藏选择。标题、单行摘要与固定操作列对齐；完整说明在单行编辑中展开。
- 一次编辑一行；取消恢复该行进入编辑时的内容及原顺序，不改其他行。完成编辑只确认草稿，保存方向才写服务。打开未修改的行不产生 dirty，也不自动采用探索候选。
- 继续由 KnowledgeDirections 持有 saved/draft/dirty/saving/invalid，保留 useUnsavedChanges 和 onPending。沿用 expected_revision 保存、configuration:null 重置；失败和冲突保留草稿，明确载入或保留比较，不静默覆盖。
- 放弃或恢复默认需要明确确认；预览显示已保存正文，不显示未保存草稿。来源浏览不采用，明确 DirectionProposal 仍按原语义加入。
- 来源资格、筛选、目标数量、依赖变化后的选图核验继续复用 SourcePicker 与服务端规则；连续范围交给 onContinuous/Agent，不引入前端循环。
- 未保存、保存中、非法输入、来源不匹配或模型未就绪时，运行确认显示一个最直接原因并禁止启动。保存不改写已创建任务。

实现：[KnowledgeSetup](../../apps/iad-harness/src/client/components/KnowledgeSetup.tsx)、[KnowledgeDirections](../../apps/iad-harness/src/client/components/KnowledgeDirections.tsx)、[方向列表](../../apps/iad-harness/src/client/components/MiningDirectionList.tsx)、[提示词写入口](../../python/iad_core/knowledge/prompts.py)。

## 验收

- 真实 HTTP/Python/SQLite/PIL 用户链，仅替换外部 MLLM HTTP；验证请求竞态、保存版本/冲突、草稿守卫、选择资格、连续 Agent 交接和冻结输入，不用内部状态模拟替代行为。
- 七页和弹窗按上述运行范围检查明暗主题、横溢、可见报错和操作可达；长标题、长文件名、多限制和大集合仍可访问。当前 3+5 证据在桌面可同时查看。
- 保留复核草稿、submission 幂等、成功才推进、历史独立选择、bbox/mask 像素和原生会话往返；不能用静态 HTML 或构建通过代替这些验收。

测试入口：[布局](../../apps/iad-harness/browser/workbench-layout.js)、[交互表面](../../apps/iad-harness/browser/workbench-surfaces.js)、[探索](../../apps/iad-harness/browser/exploration.test.js)、[知识导航](../../apps/iad-harness/browser/knowledge-navigation.test.js)、[工作台](../../apps/iad-harness/browser/workbench.test.js)、[原生宿主](../../apps/iad-harness/browser/session-handoff.test.js)、[模型](../../apps/iad-harness/browser/model-settings.test.js)。实施依赖见 [票据](../tickets/ui-workbench.md)，证据只进入根 WORKLOG.md。

桌面内容使用可用宽度；数据集操作直接提供配置和删除，配置定位到详情。图标操作复用 [IconButton](../../apps/iad-harness/src/client/components/IconButton.tsx) 与[共享控件样式](../../apps/iad-harness/src/client/controls.ts)，外观参照数据集名称编辑；业务提交按钮保持含义明确。侧栏布局由 [IndustrialSidebar](../../apps/iad-harness/src/client/host/IndustrialSidebar.tsx) 统一定义，验证见[原生侧栏布局](../../apps/iad-harness/browser/workbench-layout.js)。

样本详情操作以 [SampleInspector](../../apps/iad-harness/src/client/components/SampleInspector.tsx) 为准；同图检索使用数据一致性页面，详情不增加独立检索入口。
