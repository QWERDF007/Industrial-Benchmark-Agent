/* Generated from Python audit result models by scripts/generate-contracts.js. */
export const auditCapabilityLabels = {
    "representative_test_set": "代表性测试集",
    "ordinary_normal": "普通正常",
    "hard_normal": "困难良品",
    "near_ok_ng_pair": "相似异标签对",
    "tiny_defect": "微小异常",
    "low_contrast_defect": "低对比异常",
    "structural_relation": "结构关系",
    "missing_component": "缺失",
    "misalignment": "错位",
    "multi_object": "多件与多实例",
    "in_domain": "原域",
    "unseen_batch": "未见批次",
    "lighting_shift": "光照变化"
};
export const auditCoverageLabels = {
    "observed": "已观察到",
    "candidate": "能力候选",
    "not_observed": "未观察到",
    "not_applicable": "不适用"
};
export const auditDiscoveryStatusLabels = {
    "pending": "待验证",
    "supported": "有支持",
    "disputed": "存在分歧",
    "withdrawn": "已撤回"
};
export const auditPurposeLabels = {
    "exploration": "视觉探索",
    "training_experiment": "训练实验",
    "debug": "内部调试",
    "image_evaluation": "图像级评测",
    "bbox_evaluation": "框级评测",
    "pixel_evaluation": "像素级评测",
    "formal_benchmark": "正式 Benchmark"
};
export const auditUsabilityLabels = {
    "usable": "可用",
    "candidate": "可作候选",
    "not_ready": "条件不足",
    "not_evaluated": "未评价"
};
export const auditReadinessLabels = {
    "ready": "就绪",
    "partial": "部分条件满足",
    "not_ready": "条件不足",
    "not_evaluated": "未评价"
};
export const auditStateLabels = {
    "suspect": "发现疑点",
    "insufficient": "证据不足",
    "normal": "审计正常",
    "unprocessed": "未处理",
    "incomplete": "未完成"
};
export const auditIssueLabels = {
    "image_label_mismatch": "类别不一致",
    "category_mismatch": "类别不一致",
    "extra_annotation": "多标",
    "missing_annotation": "少标",
    "position_difference": "位置差异",
    "split": "拆分",
    "merge": "合并"
};
export const auditIssueTypesByFormat = {
    "labelme": [
        "category_mismatch",
        "extra_annotation",
        "missing_annotation",
        "position_difference",
        "split",
        "merge"
    ],
    "folder_classification": [
        "image_label_mismatch"
    ]
};
export const auditAssessmentLabels = {
    "supported": "支持为疑点",
    "unsupported": "不支持为疑点",
    "insufficient": "证据不足"
};
export const auditConsistencyLabels = {
    "NO_CANDIDATES": "无候选",
    "NO_ELIGIBLE_CANDIDATES": "无有效候选",
    "MODEL_REVIEWED:MATERIAL": "存在标注差异",
    "MODEL_REVIEWED:EQUIVALENT": "标注一致",
    "MODEL_REVIEWED:UNCERTAIN": "待核实"
};
