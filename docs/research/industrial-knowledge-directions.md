# 工业知识挖掘方向资料索引

本页只记录外部依据及其应用边界。需求以[规格](../specs/incremental-knowledge-mining.md)为准，通用方向及提示词组装以[指令契约](../../python/iad_core/knowledge/instructions.py)为唯一实现来源。

| 一手资料 | 可借鉴的观察范围 | 应用边界 |
| --- | --- | --- |
| [MVTec AD](https://www.mvtec.com/company/research/datasets/mvtec-ad) | 对象与纹理分别观察，保留局部异常位置 | 数据集覆盖范围不证明本项目已具备其检测能力 |
| [MVTec LOCO AD](https://www.mvtec.com/company/research/datasets/mvtec-loco) | 区分表面结构异常与部件缺失、错误位置等逻辑关系 | 数量、位置约束须从当前图组的实际证据建立 |
| [VisA 作者仓库](https://github.com/amazon-science/spot-diff) | 复杂 PCB 结构、多实例、姿态位置变化，缺件、错位、划伤等不同粒度 | 类别名称不能直接成为当前产品的缺陷规则 |
| [Real-IAD 作者页面](https://realiad4ad.github.io/Real-IAD/)及[实验仓库](https://github.com/Tencent/AnomalyDetection_Real-IAD) | 多视角工业对象及凹坑、形变、磨损、缺件、异物、污染等外观差异 | 当前没有提供的视角须标为不可观察，不推断背面或内部 |
| [MVTec AD 2](https://www.mvtec.com/company/research/datasets/mvtec-ad-2) | 检查不同照明条件对正常与异常外观的影响 | 光照域变化不能直接等同于产品缺陷 |
| [MPDD 作者仓库](https://github.com/stepanje/MPDD) | 金属部件制造中的真实局部缺陷与证据定位 | 不从公开示例推断当前产品材质、公差或工艺标准 |
| [MVTec Inspection](https://www.mvtec.com/knowledge-base/technologies/inspection) | 装配缺件、部件朝向、表面完整性、纹理、褶皱、污染等工业场景 | 厂商检测系统的能力不能移植为本项目 MLLM 的能力声明 |
| [MVTec OCR](https://www.mvtec.com/knowledge-base/technologies/ocr) | 标识存在、朝向、字符清晰完整，反光与背景纹理影响 | 可读不等于编码业务含义正确；不能宣称已经运行独立 OCR |
| [MVTec Measuring](https://www.mvtec.com/knowledge-base/technologies/measuring) | 区分位置、相对几何外观与精密测量 | 未提供标定、标尺或业务标准，不给绝对尺寸及合格判定 |
| [MMAD 作者仓库](https://github.com/jam-cc/MMAD) | 正常特征、异常类别及解释的知识表达 | 外部知识只用于设计观察方向，不直接灌入当前数据集的已证实知识 |
| [AnomalyGPT 作者仓库](https://github.com/CASIA-IVA-Lab/AnomalyGPT) | 视觉异常位置与语言解释联动的研究入口 | 本项目复用当前配置的 MLLM，不引入该项目训练权重或假称效果相同 |

这些资料共同支持“开放发现、观察范围记录、证据与限制分开表达”的设计选择；这属于结合项目作出的工程判断，不是论文证明。通用提示可选，数据集方向独立保存；模型自主发现不受方向列表封闭限制。

结构化生成的字符串约束参考 XGrammar 的[匹配语义问题](https://github.com/mlc-ai/xgrammar/issues/838)及[上游修复](https://github.com/mlc-ai/xgrammar/pull/925)。非空文本类型以[分析契约](../../python/iad_core/advisory/analysis.py)为唯一来源，生成约束与入库校验须表达同一文本范围。
