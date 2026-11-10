export declare const auditStateLabels: {
    readonly suspect: "发现疑点";
    readonly insufficient: "证据不足";
    readonly normal: "审计正常";
    readonly unprocessed: "未处理";
    readonly incomplete: "未完成";
};
export declare const auditIssueLabels: {
    readonly image_label_mismatch: "图像级标签疑点";
    readonly category_mismatch: "类别不一致";
    readonly extra_annotation: "多标";
    readonly missing_annotation: "少标";
    readonly position_difference: "位置差异";
    readonly split: "拆分";
    readonly merge: "合并";
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