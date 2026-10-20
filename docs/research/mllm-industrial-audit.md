# 工业模型审计：良品模式、全图与 ROI 证据

研究日期：2026-10-20。研究范围为作者论文、作者仓库及模型官方源代码。网页搜索工具返回 HTTP 403，已通过只读 HTTPS 访问 GitHub 搜索 API、作者原始文件、arXiv 与 CVF；没有把检索摘要当作已核验的实现。

## 结论与证据边界

本项目适合沿用现有 MLLM，形成“良品语义模式 → 全图观察 → 原图 ROI 观察 → 图文联合终审”。这是结合以下工作作出的工程方案；未找到可直接证明这一精确组合无需训练即可达到某个工业准确率的论文或官方实现。尤其要区分：**良品的文本描述、视觉特征向量记忆和把参考图送进上下文，是三种不同机制**。

| 一手方案 | 正常知识 / 视觉机制 | 训练与部署要求 | 本项目可借鉴处与限制 |
| --- | --- | --- | --- |
| [AnomalyGPT：作者仓库](https://github.com/CASIA-IVA-Lab/AnomalyGPT) | ImageBind、图像解码器与 Prompt Learner；少样本分支比较目标与正常样本 patch 特征。不是先生成一份正常文本后纯提示推理。 | 作者演示依赖 ImageBind、Vicuna、PandaGPT 和 AnomalyGPT 权重；训练示例使用 2 张 RTX3090。 | 借鉴局部定位和正常参考比较；不适合当作现有 HTTP MLLM 客户端的直接替换。 |
| [WinCLIP / WinCLIP+：CVPR 原论文](https://openaccess.thecvf.com/content/CVPR2023/html/Jeong_WinCLIP_Zero-Few-Shot_Anomaly_Classification_and_Segmentation_CVPR_2023_paper.html) | 组合状态词/提示模板，聚合 window、patch、image 级 CLIP 特征；WinCLIP+增加正常图像的信息。不是生成式 MLLM，也不保存自然语言检查记录。 | 论文报告不需进一步调优的零样本/少正常样本实验。 | 支持全局与局部信息互补的设计动机；不能据此推断文本模式足以保留微小纹理。GitHub 搜索找到的常用实现明确为非官方复现，未作为作者代码引用。 |
| [MMAD：作者仓库](https://github.com/jam-cc/MMAD) | 工业 MLLM 评估基准；示例支持正常参考图 ICL，以及专家在 LLM 辅助下整理的类别领域文本。 | 评估需要对应模型或 API；本身不是需要部署的异常检测模型。 | 最接近“正常语义知识 + 视觉输入”的可核验对照，但其领域文本不等于自动从本项目良品学习，也不是对本项目流水线的效果保证。 |
| [AgentIAD v2：作者论文，2026-04-14](https://arxiv.org/html/2512.13671v2) | 原图局部裁剪 PZ、正常实例比较 CR、外部领域文本检索 WS；新增图像/文本进入交互历史。 | Qwen2.5-VL-3B 上进行工具使用 SFT 与强化学习；论文训练环境为 8 张 A100 80GB。 | 与分阶段取证最贴近；可借鉴流程，但其效果包含训练贡献，不能迁移为当前未训练 MLLM 的性能承诺。 |
| [PatchCore：作者仓库](https://github.com/amazon-science/patchcore-inspection) | 正常图像 patch 嵌入、采样形成记忆库、最近邻距离计算异常。 | 需正常样本拟合记忆库及视觉骨干，属于视觉特征方法。 | 有助于解释“特征库”的严格含义；本轮不必额外引入新视觉骨干或训练栈。 |

## 可定位的外部实现

- AnomalyGPT 的 [openllama.py](https://github.com/CASIA-IVA-Lab/AnomalyGPT/blob/f21c51b93de1094440172051e48f114fb630a389/code/model/openllama.py)：`extract_multimodal_feature` 的 `normal_img_paths` 分支，调用 `encode_image_for_one_shot` 提取正常/目标 patch tokens，再计算余弦相似性；`prepare_generation_embedding` 将图像/异常相关表示用于生成。该实现不是独立的良品文本模式学习服务。
- MMAD 的 [qwen2_5_vl_query.py](https://github.com/jam-cc/MMAD/blob/1490f887b9570613565fa6a7b15d5f81aa183c54/evaluation/examples/Transformers/qwen2_5_vl_query.py)：`QwenQuery.get_query` 分别加入 `domain_knowledge`、`few_shot` 正常图和目标图；命令行支持 `--domain_knowledge`、`--similar_template`。领域知识的来源说明见[作者 README 的 Domain Knowledge](https://github.com/jam-cc/MMAD#domain-knowledge)。
- PatchCore 的 [patchcore.py](https://github.com/amazon-science/patchcore-inspection/blob/fcaa92f124fb1ad74a7acf56726decd4b27cbcad/src/patchcore/patchcore.py)：`fit` / `_fill_memory_bank` 提取并采样特征，再拟合最近邻评分器；`_predict` 对目标特征评分。可持久化的是视觉表示，与 MLLM 返回的文字有不同的信息损失边界。
- Qwen 官方 [vision_process.py](https://github.com/QwenLM/Qwen2.5-VL/blob/main/qwen-vl-utils/src/qwen_vl_utils/vision_process.py)：`smart_resize` / `fetch_image` 根据像素预算和 patch 倍数调整图像。发送原尺寸文件不等于模型实际保留原分辨率；还需核对部署端 processor 的像素预算。该仓库当前 README 已转向 Qwen3-VL，不能把其新模型参数直接套用到项目当前端点。

## AgentIAD 的具体边界

以[官方论文 v2 附录 6.1](https://arxiv.org/html/2512.13671v2#A6.SS1)为准：

- **PZ**：模型提出归一化框，环境从原图裁剪，裁剪图作为新的视觉观察加入历史。其价值在于重新获得细节，不能只把裁剪的文字描述送给后续步骤。
- **CR**：MMAD 实验直接返回 `similar_templates` 的一张正常图；MRI 实验用 CLIP ViT-B-32 预先确定最相似的正常训练图。它不等于先从一批良品离线总结文本。
- **WS**：模型用自然语言描述发起智谱搜索，返回一般领域文本知识；不检索数据集专有信息。WS 的专门效果实验在 Brain Tumor MRI，不能作为胶线工业场景的实测结论。

未从该论文 HTML 找到作者发布的实现链接；GitHub 搜索发现明确标记为 unofficial 的复现及归属未证实仓库。因此，本研究使用论文流程证据，不推荐将这些仓库当成官方可复现部署包。

## 本项目设计建议（工程判断）

以下是本项目待验证的设计决策，不是上述论文的实验结论。

1. **保留可复用的语义正常模式**：记录结构、纹理、部件相对位置、光照变化、正常允许差异及不确定项，并保留参考来源和版本。界面称为“良品模式/语义特征”；不要宣称已建立视觉 embedding 记忆库。对参考图、检测目标、模型或提炼规则的变化，应重新生成可追溯版本。
2. **概览与细节各司其职**：先用全图识别结构和空间关系；ROI 必须从原图裁剪并携带原图坐标、上下文边缘和缩放映射。超大 ROI 应按可审计预算拆成保留细节的局部视图。统一将所有输入压到长边 1280 会使原图微小异常变少于一个像素；后续放大无法恢复丢失信息。
3. **区分坐标空间**：明确全图发送尺寸与原图尺寸，要求模型输出匹配所见图像的坐标，再映射回原图。不能让模型看到缩小图，却把其输出直接解释成原图像素位置。ROI 元数据必须对应实际发送像素。
4. **终审仍需图像证据**：最后一步应同时收到良品模式、目标全图、已分析 ROI 图以及各阶段结构化观察，核验局部是否属于整体中的合理结构。只送阶段文字会把早期遗漏/幻觉变成后续无法复查的事实。若预算导致无法纳入必要证据，应记录缺失而不是静默截断。
5. **覆盖与不确定性**：已有标注作为待验证线索，不能当缺陷真值；全图模型提出的候选是另一来源。无标注也无候选，不代表原分辨率细节全部检查过，应使用确定的覆盖策略或明确覆盖不足。预算不足、关键部位模糊或位置/光照解释冲突时，不允许靠缺少证据自动判 PASS。
6. **位置与光照要有证据**：分别保留形状连续性、相对位置、反光/阴影等观察及允许变化；没有标定或配准时，不宣称已完成几何对齐或光照校正。对高反光、平移、局部极细划痕设置真实对照样本，由人工复核衡量误报与漏报。
7. **验证行为与效果分开**：请求载荷测试可证明正确传递模式和图像、坐标映射与覆盖预算；真实两图运行只证明端到端可执行。质量评估需独立正常/异常样本、按缺陷尺度及位置/光照分组，统计误报、漏报和 UNCERTAIN 比例，不能将模型自报置信度视为校准概率。

## 本项目代码索引

实现行为以源码为唯一信息源；本研究不维护第二份接口或状态说明。

- [良品模式与版本](../../python/iad_core/workbench/normal.py)
- [审计阶段与证据传递](../../python/iad_core/workbench/inspection.py)
- [模型传输及图像编码](../../python/iad_core/workbench/vision.py)
- [原图 ROI 与坐标映射](../../python/iad_core/evidence/views.py)
- [结构化审计证据](../../python/iad_core/advisory/analysis.py)
- [模型审计作业](../../python/iad_core/workbench/audit.py)
- [真实环境验证入口](../../scripts/verify_workbench_live.py)
