# 联合方向探索

结果摘要与限制折叠以[方向探索专项](../96E5918EE7A2_9FE8868CE698_UIBCE596_AEE6B496E688_90E5B689%2588.zip)为准；其余视觉与交互依据为 [当前设计交付](../Industrial_Benchmark_UI_20261023.zip) 中的 HTML、`Exploration_Spec.md`、`Exploration_Prompts_Detail.md`；方向详情以 `UI_Refinement_*` 为准。通用页面约束见 [UI 规格](ui-workbench.md)，知识采用后的语义见 [知识规格](incremental-knowledge-mining.md)。

## 联合输入与结果

- 同一数据集的候选良品、异常图组均非空、无重复，复用来源资格与真实内容核验。两组数量独立，用户确认全部实际输入；一次联合生成，不拆组、不自动减张。
- 候选角色是来源线索，不能作为质量真值。模型提出可观察检查议题、适用类型、真实证据和限制，允许空方向；不直接发布质量知识或改标签。
- 容量、图像、提示词、模型及输出契约均在启动时冻结。结果是不可变版本；失败、取消和新配置不改写已发布版本。重试复用原冻结模型和整组输入，复制为新配置使用当前统一模型。
- 浏览结果或来源不采用方向。去知识挖掘只定位候选；显式勾选和保存后，才进入之后的知识请求。`applies_to` 在页面和服务端共同约束采用类型。

实现：[探索服务](../../python/iad_core/exploration/service.py)、[来源资格](../../python/iad_core/knowledge/sources.py)、[版本与证据](../../python/iad_core/exploration/repository.py)、[统一模型](workbench-model-settings.md)。

## E-01 队列与生命周期

- 队列键为数据集与方向探索类型；同键最多一个运行项，排队项按数据库单调 ID 先后执行。不同数据集沿用现有边界；知识和审计保留原准入限制。
- 入队即持久化完整冻结输入。真正运行前再次核验来源与生成契约。开始、终态、取消和出队由同一 JobRunner 的所有权锁、事务及取消事件协调。
- PENDING 可取消且不调用模型，终态清理 client；RUNNING 仅协作停止，当前请求返回并确认终态后，下一项才能开始。
- `after_finished` 覆盖排队和运行，真实终态才释放 client。关闭后不再出队，排队项中断并释放执行闭包；重启遗留未终结项为 INTERRUPTED，不自动重发模型请求。
- 列表取最近 30 项并补充仍运行项，去重；排队总数与位置由完整数据库队列派生。所选旧任务按现有 status 接口补读，每页展示 10 行。

实现：[唯一作业运行器](../../python/iad_core/workbench/jobs.py)、[模型执行生命周期](../../python/iad_core/workbench/runtime.py)、[快照契约](../../python/iad_core/workbench/job_models.py)。不建立浏览器执行队列、平行 worker 或全局调度服务。

## E-02 阶段与同步

- 准备数量仅记录真正完成的图像准备，不等于模型观察数；容量检查、联合生成、校验发布各有实际阶段时点。
- 模型请求未完整返回时展示不定进度和已用时间，不使用发布完成数作为逐图推理进度，不编造 token 百分比或剩余时间。请求开始/结束以 `model_calls` 为准，未结束记录不代表模型健康。
- 全页只有一个顺序状态轮询器；活跃和空闲间隔、状态读取超时及退避见 [useJobs](../../apps/iad-harness/src/client/useJobs.ts)。超时只取消状态读取，不取消模型作业。
- 手动刷新、提交/取消完成、返回前台触发状态读取；隐藏时可暂停，后端继续执行。卸载或换数据集取消旧请求，迟到结果不能覆盖新页。
- 每次成功响应更新最近同步时间；业务阶段不变仍是同步成功。失败保留快照并明确 stale，冻结旧快照的运行时钟与指示动画，保留编辑和重试同步入口。
- 发布或终态变化使结果失效；轮询和计时不覆盖草稿、选图弹窗、方向详情或用户选中的历史版本。新版本提供明确查看入口。
- 未确认结果的 POST 不自动重发；先同步已有作业。同步失败时不能继续提交未知队列状态下的新请求。

实现：[阶段与调用记录](../../python/iad_core/workbench/calls.py)、[探索页面](../../apps/iad-harness/src/client/components/ExplorationPage.tsx)、[探索配置](../../apps/iad-harness/src/client/components/ExplorationSetup.tsx)、[共享作业呈现](../../apps/iad-harness/src/client/components/JobTable.tsx)。

## E-03 提示词预设

- 四份内置正文由 [ExplorationPrompts](../../python/iad_core/exploration/prompts.py) 唯一定义。界面读取后完整展开并可编辑；补充目标独立，修改无需另存即可执行。
- 切换或重置预设遇到已修改正文，明确选择保留或替换；图组和补充目标不变。另存新预设只保存名称与正文，不能为空、不能重名，不覆写内置基线。
- 自定义预设存入工作台 SQLite 并跨数据集复用；草稿由现有 Workspace 按数据集保存。编辑草稿或预设目录不反向改写排队、运行、重试或历史版本的冻结正文。
- 未提供正文时，服务端取默认预设当次完整文本并冻结；明确提供正文时直接使用，不拼回另一份固定业务前缀。仍附真实图组元数据和结构化输出契约。
- 冻结正文可追溯；没有记录时显示未记录，不能拿当前默认文本冒充历史输入。

HTTP、Agent 与类型入口：[operations](../../python/iad_core/exploration/operations.py)、[路由](../../apps/iad-harness/src/server/routes/index.ts)、[工具](../../apps/iad-harness/src/server/exploration/index.ts)、[Pydantic 模型](../../python/iad_core/exploration/models.py)。

## 验收边界

公开工作台 → HTTP/Python → 真实 SQLite/PIL，仅替换外部模型 HTTP。必须证明 FIFO 与并发提交、排队/运行取消、来源变化、冻结提示词与模型、client 释放、关闭/重启、超过 30 项、慢模型与同步失败的区别、刷新/迟到响应、历史版本与草稿保持。

入口：[领域链测试](../../tests/test_direction_exploration.py)、[作业恢复](../../tests/test_job_recovery.py)、[冻结模型](../../tests/test_workbench_models.py)、[浏览器链](../../apps/iad-harness/browser/exploration.test.js)、[原生会话](../../apps/iad-harness/test/exploration-session.test.js)。实施依赖见 [票据](../tickets/ui-workbench.md)；执行证据只记根 WORKLOG.md。
