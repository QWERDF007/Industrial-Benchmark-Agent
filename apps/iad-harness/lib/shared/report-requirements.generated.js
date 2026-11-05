/* Generated from Python report requirements. */
export const reportRequirements = {
    "technical_usability": {
        "card": "dataset",
        "title": "技术可用性",
        "data": [
            "technical_usability",
            "annotation_coverage"
        ],
        "required": "图像可读率、坐标有效率、原图与标注对应情况"
    },
    "label_trust": {
        "card": "dataset",
        "title": "标签可信性与 Gold 资格",
        "data": [
            "raw_labels",
            "gold_by_policy",
            "label_comparison"
        ],
        "required": "确认覆盖、未决、银标、独立随机抽查及加权标签错误估计"
    },
    "annotation_completeness": {
        "card": "dataset",
        "title": "标注完整性",
        "data": [
            "annotation_coverage"
        ],
        "required": "图像与区域核验、完整或部分标注资格、bbox 与真实 mask 分层"
    },
    "rule_explanation": {
        "card": "dataset",
        "title": "规则可解释性与正反证据",
        "data": [
            "knowledge_versions"
        ],
        "required": "可见事实、验收来源、适用条件、支持、反驳、独立验证与未决原因"
    },
    "normal_coverage": {
        "card": "dataset",
        "title": "正常变化覆盖",
        "data": [
            "independence",
            "capability_candidates"
        ],
        "required": "已知批次、域、允许变化覆盖及独立物理件数"
    },
    "defect_coverage": {
        "card": "dataset",
        "title": "缺陷覆盖",
        "data": [
            "annotation_coverage",
            "capability_candidates",
            "outcomes"
        ],
        "required": "形态、位置、框尺度、可见对比与结构关系，候选与确认分开"
    },
    "independence": {
        "card": "dataset",
        "title": "独立性与代表性",
        "data": [
            "independence"
        ],
        "required": "物理件、批次、连拍、重复、跨划分关联及生产分布范围"
    },
    "statistical_support": {
        "card": "dataset",
        "title": "统计支撑",
        "data": [
            "coverage",
            "independence",
            "capability_candidates"
        ],
        "required": "有效独立分子分母、各切片样本数、差异区间及最低可辨差异"
    },
    "discrimination": {
        "card": "dataset",
        "title": "区分能力",
        "data": [
            "evaluation_evidence"
        ],
        "required": "开发试评天花板或地板、同样本模型配对差异、排名稳定性和保留集确认"
    },
    "detection": {
        "card": "model",
        "title": "缺陷检出",
        "data": [
            "evaluation_evidence",
            "gold_by_policy",
            "detection_metrics"
        ],
        "required": "Val 冻结阈值的 Test Recall、TP、FN、各类漏检，I-AUROC 与 I-AP 及异常比例"
    },
    "normal_tolerance": {
        "card": "model",
        "title": "普通与困难良品容忍",
        "data": [
            "evaluation_evidence",
            "gold_by_policy",
            "normal_tolerance_metrics"
        ],
        "required": "Test FPR、FP、TN、Hard-Normal FPR，各自有效分母及未知样本"
    },
    "acceptance_boundary": {
        "card": "model",
        "title": "验收边界区分",
        "data": [
            "evaluation_evidence",
            "consistency_records",
            "acceptance_boundary_metrics"
        ],
        "required": "确认 OK/NG 成对同时判对率、对内排序、同分约定、配对连通组"
    },
    "small_defects": {
        "card": "model",
        "title": "细小与低对比缺陷",
        "data": [
            "evaluation_evidence",
            "capability_candidates",
            "annotation_coverage",
            "small_defects_metrics"
        ],
        "required": "原图尺度及模型输入尺度分层 Recall、定位召回、语义切片抽查"
    },
    "localization": {
        "card": "model",
        "title": "局部定位",
        "data": [
            "evaluation_evidence",
            "annotation_coverage",
            "localization_metrics"
        ],
        "required": "完整 bbox AP/Recall、部分标注区域召回、可靠 mask 的 P-AUROC/P-AP/P-AUPRO 与忽略区"
    },
    "structural_relations": {
        "card": "model",
        "title": "结构关系",
        "data": [
            "evaluation_evidence",
            "capability_candidates",
            "structural_relations_metrics"
        ],
        "required": "缺失、多件、错位及对应正常结构的独立切片 Recall/FPR"
    },
    "domain_generalization": {
        "card": "model",
        "title": "跨域泛化",
        "data": [
            "evaluation_evidence",
            "independence",
            "domain_generalization_metrics"
        ],
        "required": "固定阈值的原域与未见域 Recall/FPR 变化、目标域可见信息轨道"
    },
    "efficiency": {
        "card": "model",
        "title": "效率与系统成本",
        "data": [
            "evaluation_evidence",
            "efficiency_metrics"
        ],
        "required": "固定硬件和输入协议下的真实 p50/p95、吞吐、显存、内存、建库与调用成本"
    },
    "explanation_uncertainty": {
        "card": "model",
        "title": "解释证据与不确定性",
        "data": [
            "outcomes",
            "coverage",
            "explanation_uncertainty_metrics"
        ],
        "required": "MLLM 证据有效率、拒答覆盖与已回答风险；传统 AD 无语言输出不扣分"
    },
    "mllm_calibration": {
        "card": "calibration",
        "title": "MLLM 构建流程校准",
        "data": [
            "gold_by_policy",
            "outcomes",
            "coverage",
            "mllm_calibration_metrics"
        ],
        "required": "独立专家参考集、疑点发现 Precision/Recall、确定结论错误率、覆盖风险、切片可靠性及复核成本"
    },
    "benchmark_protocol": {
        "card": "protocol",
        "title": "任务协议与适用范围",
        "data": [
            "scope_dataset_ids",
            "evaluation_evidence",
            "independence"
        ],
        "required": "代表性、挑战、跨域三部分；Gold/银标/未决、独立划分、冻结提示词与输入预算、Val 阈值、预测和重试协议"
    }
};
