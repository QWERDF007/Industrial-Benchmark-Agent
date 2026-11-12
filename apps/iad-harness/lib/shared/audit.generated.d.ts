export declare const auditCapabilityLabels: {
    readonly representative_test_set: "代表性测试集";
    readonly ordinary_normal: "普通正常";
    readonly hard_normal: "困难良品";
    readonly near_ok_ng_pair: "相似异标签对";
    readonly tiny_defect: "微小异常";
    readonly low_contrast_defect: "低对比异常";
    readonly structural_relation: "结构关系";
    readonly missing_component: "缺失";
    readonly misalignment: "错位";
    readonly multi_object: "多件与多实例";
    readonly in_domain: "原域";
    readonly unseen_batch: "未见批次";
    readonly lighting_shift: "光照变化";
};
export declare const auditCoverageLabels: {
    readonly observed: "已观察到";
    readonly candidate: "能力候选";
    readonly not_observed: "未观察到";
    readonly not_applicable: "不适用";
};
export declare const auditDiscoveryStatusLabels: {
    readonly pending: "待验证";
    readonly supported: "有支持";
    readonly disputed: "存在分歧";
    readonly withdrawn: "已撤回";
};
export declare const auditPurposeLabels: {
    readonly exploration: "视觉探索";
    readonly training_experiment: "训练实验";
    readonly debug: "内部调试";
    readonly image_evaluation: "图像级评测";
    readonly bbox_evaluation: "框级评测";
    readonly pixel_evaluation: "像素级评测";
    readonly formal_benchmark: "正式 Benchmark";
};
export declare const auditUsabilityLabels: {
    readonly usable: "可用";
    readonly candidate: "可作候选";
    readonly not_ready: "条件不足";
    readonly not_evaluated: "未评价";
};
export declare const auditReadinessLabels: {
    readonly ready: "就绪";
    readonly partial: "部分条件满足";
    readonly not_ready: "条件不足";
    readonly not_evaluated: "未评价";
};
export declare const auditStateLabels: {
    readonly suspect: "发现疑点";
    readonly insufficient: "证据不足";
    readonly normal: "审计正常";
    readonly unprocessed: "未处理";
    readonly incomplete: "未完成";
};
export declare const auditIssueLabels: {
    readonly image_label_mismatch: "类别不一致";
    readonly category_mismatch: "类别不一致";
    readonly extra_annotation: "多标";
    readonly missing_annotation: "少标";
    readonly position_difference: "位置差异";
    readonly split: "拆分";
    readonly merge: "合并";
};
export declare const auditIssueTypesByFormat: {
    readonly labelme: readonly ["category_mismatch", "extra_annotation", "missing_annotation", "position_difference", "split", "merge"];
    readonly folder_classification: readonly ["image_label_mismatch"];
};
export declare const auditAssessmentLabels: {
    readonly supported: "支持为疑点";
    readonly unsupported: "不支持为疑点";
    readonly insufficient: "证据不足";
};
export declare const auditConsistencyLabels: {
    readonly NO_CANDIDATES: "无候选";
    readonly NO_ELIGIBLE_CANDIDATES: "无有效候选";
    readonly "MODEL_REVIEWED:MATERIAL": "存在标注差异";
    readonly "MODEL_REVIEWED:EQUIVALENT": "标注一致";
    readonly "MODEL_REVIEWED:UNCERTAIN": "待核实";
};
//# sourceMappingURL=audit.generated.d.ts.map