# 外部基线索引

| 基线 | 官方源码 | 项目入口 |
| --- | --- | --- |
| PatchCore | [amazon-science/patchcore-inspection](https://github.com/amazon-science/patchcore-inspection) | [Adapter](../python/iad_core/evaluation/baselines/patchcore.py) |
| Dinomaly2 | [guojiajeremy/Dinomaly2](https://github.com/guojiajeremy/Dinomaly2) | [Runner](../python/iad_core/evaluation/baselines/dinomaly.py)、[Bridge](../python/iad_core/evaluation/baselines/dinomaly_bridge.py) |
| Feature KNN | [facebookresearch/dinov2](https://github.com/facebookresearch/dinov2) | [Runner](../python/iad_core/evaluation/baselines/feature_knn.py) |

本机源码、解释器及权重路径由运行环境配置；接口与配置字段以各入口为准。

## MLLM 研究参考

- [MMAD：领域知识与独立人工评估](https://github.com/jam-cc/MMAD)
- [AnomalyGPT：专门训练的多模态异常检测模型](https://github.com/CASIA-IVA-Lab/AnomalyGPT)
- [DSH：原生技能注册与提供方接口](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill/README.zh.md)

本项目的知识挖掘与证据审计实现见[架构索引](architecture.md)。
