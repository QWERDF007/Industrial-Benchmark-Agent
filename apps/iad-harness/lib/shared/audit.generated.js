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
    "bbox_evaluation": "矩形框定位评测",
    "pixel_evaluation": "像素区域评测",
    "formal_benchmark": "正式评测基准"
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
export const auditIssueDescriptions = {
    "image_label_mismatch": "内容相同的两张图，整图标签不同，例如一张记为OK，另一张记为NG。",
    "category_mismatch": "同一目标在两张图中的类别记录不同。",
    "extra_annotation": "主图有标注，对照图中同一处可见内容没有相应标注。",
    "missing_annotation": "对照图有标注，主图中同一处可见内容没有相应标注。",
    "position_difference": "两张图都标了同一目标，但框圈住的实际内容有明显差别，例如一侧漏掉了目标的一部分。",
    "split": "同一组可见内容在主图中分成多个框，在对照图中用一个框圈住。",
    "merge": "同一组可见内容在主图中用一个框圈住，在对照图中分成多个框。"
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
    "MODEL_REVIEWED:EQUIVALENT": "标注一致",
    "MODEL_REVIEWED:MATERIAL": "标注冲突",
    "MODEL_REVIEWED:UNCERTAIN": "待核实"
};
export const auditConsistencyDescriptions = {
    "NO_CANDIDATES": "检索没有找到可作对照的其他图像。",
    "NO_ELIGIBLE_CANDIDATES": "找到了候选图，但内容不同，或看不清是否拍的是相同内容，因此没有进入标注比较。",
    "MODEL_REVIEWED:EQUIVALENT": "已有内容相同的对照图，比较后，双方标注的类别、数量和覆盖关系相符。",
    "MODEL_REVIEWED:MATERIAL": "已有内容相同的对照图，比较后发现至少一处标注不同，具体差别按下面的类型归类。",
    "MODEL_REVIEWED:UNCERTAIN": "已有内容相同的对照图，但部分标注关系还需要复看，例如目标的边缘看不清。"
};
