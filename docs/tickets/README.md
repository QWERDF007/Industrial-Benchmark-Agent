# 数据集统一接入票据

本轮按用户要求采用本地票据并保存在 docs。测试边界和拆分确认前为 draft，确认后统一标记 ready-for-agent；无需创建外部 issue。进度仅记录于根 WORKLOG.md。

需求与验收口径以[完整规格](../specs/dataset-import.md)为准。逐票只定义可交付行为、必要验收与阻塞边，依赖以各票 Blocked by 为唯一来源；实现入口见[源码索引](../architecture.md)。

1. [统一格式契约并贯通 Labelme 导入](dataset-import/01-labelme-contract.md)
2. [预览目录角色并导入图像级数据](dataset-import/02-folder-import.md)
3. [筛选原始标签并修改目录映射](dataset-import/03-browse-rescan.md)
4. [从目录标签挖掘可追溯知识](dataset-import/04-knowledge-sources.md)
5. [屏蔽标签联合审计并对照报告](dataset-import/05-joint-audit-report.md)
6. [通过 DSH 对话完成目录知识审计](dataset-import/06-agent-workflow.md)
7. [来源变更后恢复知识与重审闭环](dataset-import/07-source-change-close-loop.md)

每票以可演示的用户流程交付其所需契约、存储、领域、HTTP/工具、UI和测试；不按数据库/后端/前端拆水平层。首票包含必要前置整理，后续只从全部阻塞票已完成的前沿推进。既有链路测试和人工裁决边界继续适用。
