export declare const reportRequirements: {
    readonly technical_usability: {
        readonly card: "dataset";
        readonly title: "技术可用性";
        readonly data: readonly ["technical_usability", "technical_states", "annotation_coverage"];
        readonly required: "图像可读率、坐标有效率、原图与标注对应情况";
    };
    readonly label_trust: {
        readonly card: "dataset";
        readonly title: "标签可信性与 Gold 资格";
        readonly data: readonly ["raw_labels", "gold_by_policy", "label_comparison"];
        readonly required: "确认覆盖、未决、银标、独立随机抽查及加权标签错误估计";
    };
    readonly annotation_completeness: {
        readonly card: "dataset";
        readonly title: "标注完整性";
        readonly data: readonly ["annotation_coverage"];
        readonly required: "图像与区域核验、完整或部分标注资格、bbox 与真实 mask 分层";
    };
    readonly rule_explanation: {
        readonly card: "dataset";
        readonly title: "规则可解释性与正反证据";
        readonly data: readonly ["knowledge_versions"];
        readonly required: "可见事实、验收来源、适用条件、支持、反驳、独立验证与未决原因";
    };
    readonly normal_coverage: {
        readonly card: "dataset";
        readonly title: "正常变化覆盖";
        readonly data: readonly ["independence", "capability_candidates"];
        readonly required: "已知批次、域、允许变化覆盖及独立物理件数";
    };
    readonly defect_coverage: {
        readonly card: "dataset";
        readonly title: "缺陷覆盖";
        readonly data: readonly ["annotation_coverage", "bbox_scale", "capability_candidates", "outcomes"];
        readonly required: "形态、位置、框尺度、可见对比与结构关系，候选与确认分开";
    };
    readonly independence: {
        readonly card: "dataset";
        readonly title: "独立性与代表性";
        readonly data: readonly ["independence"];
        readonly required: "物理件、批次、连拍、重复、跨划分关联及生产分布范围";
    };
    readonly statistical_support: {
        readonly card: "dataset";
        readonly title: "统计支撑";
        readonly data: readonly ["coverage", "independence", "capability_candidates"];
        readonly required: "有效独立分子分母、各切片样本数、差异区间及最低可辨差异";
    };
    readonly discrimination: {
        readonly card: "dataset";
        readonly title: "区分能力";
        readonly data: readonly ["evaluation_evidence"];
        readonly required: "开发试评天花板或地板、同样本模型配对差异、排名稳定性和保留集确认";
    };
    readonly detection: {
        readonly card: "model";
        readonly title: "缺陷检出";
        readonly data: readonly ["evaluation_evidence", "gold_by_policy", "detection_metrics"];
        readonly required: "Val 冻结阈值的 Test Recall、TP、FN、各类漏检，I-AUROC 与 I-AP 及异常比例";
    };
    readonly normal_tolerance: {
        readonly card: "model";
        readonly title: "普通与困难良品容忍";
        readonly data: readonly ["evaluation_evidence", "gold_by_policy", "normal_tolerance_metrics"];
        readonly required: "Test FPR、FP、TN、Hard-Normal FPR，各自有效分母及未知样本";
    };
    readonly acceptance_boundary: {
        readonly card: "model";
        readonly title: "验收边界区分";
        readonly data: readonly ["evaluation_evidence", "consistency_records", "acceptance_boundary_metrics"];
        readonly required: "确认 OK/NG 成对同时判对率、对内排序、同分约定、配对连通组";
    };
    readonly small_defects: {
        readonly card: "model";
        readonly title: "细小与低对比缺陷";
        readonly data: readonly ["evaluation_evidence", "capability_candidates", "annotation_coverage", "bbox_scale", "small_defects_metrics"];
        readonly required: "原图尺度及模型输入尺度分层 Recall、定位召回、语义切片抽查";
    };
    readonly localization: {
        readonly card: "model";
        readonly title: "局部定位";
        readonly data: readonly ["evaluation_evidence", "annotation_coverage", "localization_metrics"];
        readonly required: "完整 bbox AP/Recall、部分标注区域召回、可靠 mask 的 P-AUROC/P-AP/P-AUPRO 与忽略区";
    };
    readonly structural_relations: {
        readonly card: "model";
        readonly title: "结构关系";
        readonly data: readonly ["evaluation_evidence", "capability_candidates", "structural_relations_metrics"];
        readonly required: "缺失、多件、错位及对应正常结构的独立切片 Recall/FPR";
    };
    readonly domain_generalization: {
        readonly card: "model";
        readonly title: "跨域泛化";
        readonly data: readonly ["evaluation_evidence", "independence", "domain_generalization_metrics"];
        readonly required: "固定阈值的原域与未见域 Recall/FPR 变化、目标域可见信息轨道";
    };
    readonly efficiency: {
        readonly card: "model";
        readonly title: "效率与系统成本";
        readonly data: readonly ["evaluation_evidence", "efficiency_metrics"];
        readonly required: "固定硬件和输入协议下的真实 p50/p95、吞吐、显存、内存、建库与调用成本";
    };
    readonly explanation_uncertainty: {
        readonly card: "model";
        readonly title: "解释证据与不确定性";
        readonly data: readonly ["outcomes", "coverage", "explanation_uncertainty_metrics"];
        readonly required: "MLLM 证据有效率、拒答覆盖与已回答风险；传统 AD 无语言输出不扣分";
    };
    readonly mllm_calibration: {
        readonly card: "calibration";
        readonly title: "MLLM 构建流程校准";
        readonly data: readonly ["gold_by_policy", "outcomes", "coverage", "mllm_calibration_metrics"];
        readonly required: "独立专家参考集、疑点发现 Precision/Recall、确定结论错误率、覆盖风险、切片可靠性及复核成本";
    };
    readonly benchmark_protocol: {
        readonly card: "protocol";
        readonly title: "任务协议与适用范围";
        readonly data: readonly ["scope_dataset_ids", "evaluation_evidence", "independence"];
        readonly required: "代表性、挑战、跨域三部分；Gold/银标/未决、独立划分、冻结提示词与输入预算、Val 阈值、预测和重试协议";
    };
};
//# sourceMappingURL=report-requirements.generated.d.ts.map