# 图组知识挖掘票据

[完整规格](../specs/incremental-knowledge-mining.md)为需求唯一来源，测试边界、7 票粒度和依赖已确认；本地 docs 为指定交付位置。逐票均以 ready-for-agent 发布，状态不代表已实施；执行只取全部阻塞已完成的前沿。

1. [统一知识页面与按意图独立触发](knowledge-mining/01-unified-entry.md)
2. [三输入图组挖掘与真实选图](knowledge-mining/02-explicit-image-group.md)
3. [可选预设与可追溯知识续用](knowledge-mining/03-preset-evolution.md)
4. [整图与局部污染核验及复核联动](knowledge-mining/04-contamination-evidence.md)
5. [按实际能力分组并完整覆盖图像](knowledge-mining/05-capacity-coverage.md)
6. [冻结图组的取消恢复与历史保护](knowledge-mining/06-frozen-recovery.md)
7. [Agent连续调用与原生真实验收](knowledge-mining/07-agent-acceptance.md)

每票交付可演示的公开行为及所需契约、领域、存储、工具/HTTP、页面和测试；必要的前置整理随首票完成。各票 Blocked by 是依赖唯一来源；源码入口见[实现索引](../architecture.md)，进度仅进入根任务账本。
