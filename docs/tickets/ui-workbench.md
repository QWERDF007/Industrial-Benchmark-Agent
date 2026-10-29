# 工作台实施票据

需求唯一来源为 [UI 规格](../specs/ui-workbench.md)、[探索规格](../specs/direction-exploration.md) 及其指向的设计交付。这里只记录依赖和验收入口，状态与证据只记根 WORKLOG.md。

| 票据 | 实施入口 | 完成条件 | 依赖 |
| --- | --- | --- | --- |
| D01 数据集专项 | DatasetManager、FolderMapping、styles/datasets、theme；browser/datasets.test.js | 按 [数据集专项规格](../specs/ui-workbench.md#数据集管理) 对齐视觉、真实数据与草稿行为，保留原生宿主及接口 | 既有七页基线 |
| E01 真实阶段 | exploration/service.py、job_models.py、JobTable/JobDetail | 实际准备数量、容量/生成/发布时点；不显示逐图假进度 | 无 |
| E02 FIFO 与生命周期 | workbench/jobs.py、runtime.py | 并发准入、排队取消、运行停止、来源复验、client 清理、关闭及重启中断 | E01 |
| E03 同步 | useJobs、WorkbenchPage、探索列表操作 | 一个顺序轮询器；超时/失败/恢复、刷新、迟到响应、最近 30 项及运行/所选项、完整 pending_count | E01、E02 |
| E04 持续配置 | ExplorationPage、ExplorationSetup、exploration/setup 样式 | 宽主区与运行侧栏；运行时仍可编辑/排队；草稿、弹窗与历史版本保持 | E02、E03 |
| E05 提示词 | exploration/prompts.py、models/operations、存储、HTTP/工具、生成契约、Workspace | 读取/编辑/另存；默认单源；真实请求用编辑正文，排队与重试保留冻结正文 | E02、E04 |
| E06 方向详情 | DirectionDetail、ExplorationPage、KnowledgeDirections | 目标/依据/限制/分组证据；精确引用、类型准入与溯源；视觉按 U02/U03 | E04 |
| E07 探索验收 | test_direction_exploration、test_job_recovery、test_workbench_models、exploration 浏览器/会话 | 探索规格代表用户链通过，旧阻塞路径和重复文档清理 | E01–E06 |
| U01 全局视觉 | theme、controls、base 与领域样式、IndustrialSidebar | 七页及浮层共用主题；面板与控件边界区分，焦点/禁用/错误可读 | 无 |
| U02 共享详情 | DirectionDetail、exploration/overlays 样式 | 自然高度、正文独立滚动、真实引用与缺失状态、桌面 3+5 分组证据 | U01、E06 |
| U03 大图上下文 | ImageViewer、ImageCanvas、Modal、overlays | 当前集合导航、逐图变换、真实 100%、PgUp/PgDn、错误重试、Esc 与焦点返回；不损失 annotation/inspection | U02 |
| U06 大图边缘切图 | ImageCanvas、overlays、theme；workbench/session-handoff/exploration 浏览器链 | 按 [大图检视规格](../specs/ui-workbench.md#u-02-大图检视) 统一大图与嵌入复核画布的切图入口，复用既有导航逻辑 | U03 |
| U04 知识配置 | KnowledgeSetup、KnowledgeDirections、MiningDirectionList、KnowledgeDiscovery、setup/knowledge 样式 | 主区/侧栏、分类搜索、单行编辑；saved/draft、版本冲突、来源查看、Proposal 和 Agent 语义保持 | U01、U02 |
| U05 整体验收 | 既有浏览器/接口/原生宿主测试 | 规格验收完整覆盖，真实截图对照、主题/响应式/字号可用，无模拟字段进入生产协议 | U01–U04、E07 |

不建立第二套 JobRunner、画布、状态仓库或模型/知识 API。执行规则见仓库 AGENTS.md；使用与验证命令见根 README.md。
