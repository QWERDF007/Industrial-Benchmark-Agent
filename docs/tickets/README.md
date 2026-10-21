# 图组知识挖掘票据

[完整规格](../specs/incremental-knowledge-mining.md)为需求唯一来源；8票粒度、依赖、公开测试边界与默认冲突继续策略已确认。本地docs为指定交付位置，ready-for-agent不表示已实施；执行只取全部阻塞已完成的前沿。

| 票据 | 交付 |
| --- | --- |
| [01 统一入口](knowledge-mining/01-unified-entry.md) | 同一知识页与独立任务意图。 |
| [02 三输入图组](knowledge-mining/02-explicit-image-group.md) | 明确数量、真实选图与无预设归纳。 |
| [03 预设续用](knowledge-mining/03-preset-evolution.md) | 后继版本与真实未覆盖查询。 |
| [04 冲突证据](knowledge-mining/04-contamination-evidence.md) | 知识/图像/ROI关联、标记与隔离。 |
| [05 人工闭环](knowledge-mining/05-human-resolution.md) | 人工确认、明确重核验与新版本。 |
| [06 容量覆盖](knowledge-mining/06-capacity-coverage.md) | 实际多图请求边界与完整证据。 |
| [07 冻结恢复](knowledge-mining/07-frozen-recovery.md) | 取消、关联重试及历史保护。 |
| [08 连续验收](knowledge-mining/08-agent-acceptance.md) | 原生Agent连续推进与真实工作台验收。 |

每票交付完整可演示的公开行为及所需契约、领域、存储、工具/HTTP、页面和测试；必要整理随切片完成。各票Blocked by是阻塞边唯一来源；代码入口见[实现索引](../architecture.md)，进度仅进入根任务账本。
