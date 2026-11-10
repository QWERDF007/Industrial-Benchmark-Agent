/* Generated from Python audit result models by scripts/generate-contracts.js. */
export const auditStateLabels = {
    "suspect": "发现疑点",
    "insufficient": "证据不足",
    "normal": "审计正常",
    "unprocessed": "未处理",
    "incomplete": "未完成"
};
export const auditIssueLabels = {
    "image_label_mismatch": "图像级标签疑点",
    "category_mismatch": "类别不一致",
    "extra_annotation": "多标",
    "missing_annotation": "少标",
    "position_difference": "位置差异",
    "split": "拆分",
    "merge": "合并"
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
