# 图组方向探索资料索引

本页补充“从样例归纳候选检查方向”的外部依据。工业观察范围沿用[工业知识挖掘资料索引](industrial-knowledge-directions.md)，不重复方向清单；新增行为见[方向探索规格](../specs/direction-exploration.md)，既有约束见[知识挖掘规格](../specs/incremental-knowledge-mining.md)。

| 一手资料 | 实际支持的结论 | 应用边界 |
| --- | --- | --- |
| [AnomalyRuler 作者仓库](https://github.com/Yuchen413/AnomalyRuler#description)及[论文](https://arxiv.org/abs/2407.10299) | 将正常参考帧转换为描述，归纳并聚合规则，再用于后续推理；可借鉴“先归纳、后使用”的分阶段结构。 | 研究对象为视频异常，归纳来源主要是正常帧；不证明混合工业正常/异常图能可靠生成完整检查方向，也不直接提供本项目的人机编辑界面。 |
| [MMAD 作者仓库的 Domain Knowledge](https://github.com/jam-cc/MMAD#domain-knowledge)及[知识资料](https://github.com/jam-cc/MMAD/blob/main/dataset/MMAD/domain_knowledge.json) | 作者明确由专家借助大模型总结类别正常特征、异常类别及描述，支持把模型建议交给人审阅调整。 | 公开类别知识不是当前数据集的质量标准；该资源也不证明“混合图输入后自动生成方向”的特定实现效果。 |
| [AnomalyGPT 作者仓库](https://github.com/CASIA-LMC-Lab/AnomalyGPT#1-introduction-back-to-top)及[论文](https://arxiv.org/abs/2308.15366) | 将工业图像、异常位置和文字描述关联，并支持少量正常参考样本。 | 方法包含专门训练、视觉解码器与提示学习；本项目调用现有 MLLM，不继承其模型能力或实验结果。 |

本项目据此采用的工程判断：联合观察用户选择的正常与异常候选图，把可辨差异、共同结构和不可观察因素归纳为**待选方向**，由用户选择或修改后供深度挖掘使用。方向是“观察什么”的任务建议，不是已证实的质量知识；来源标签、ROI 或外观差异本身不能证明缺陷。保留样例引用与限制，才能让用户核对模型为何提出该方向。这些设计需由本项目真实图组验证，不能由上述论文代替验收。

检索核验日期：2026-10-22。已实际尝试网络搜索及 GitHub 仓库搜索；网络搜索工具返回 HTTP 403，改由 GitHub 官方 API 检索并读取作者仓库原文。检索没有找到能直接复用、完整实现“正常/异常混合图→可编辑方向→知识挖掘选项”全链路的一手项目；此结论仅限本次检索范围。
