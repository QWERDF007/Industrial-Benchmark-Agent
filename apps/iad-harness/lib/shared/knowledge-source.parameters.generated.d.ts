export declare const knowledgeSourceParameters: {
    readonly recheck_from_version: {
        readonly type: "string";
        readonly description: "仅查询所选版本中判据修订后尚待视觉重核验的历史合格来源";
        readonly title: "Recheck From Version";
    };
    readonly include_observed: {
        readonly type: "boolean";
        readonly description: "明确重核验选图时包含已观察的合格来源；不扩大冻结范围，不启动作业";
        readonly title: "Include Observed";
        readonly default: false;
    };
    readonly scope_run_id: {
        readonly type: "string";
        readonly title: "Scope Run Id";
    };
    readonly dataset_id: {
        readonly type: "string";
        readonly title: "Dataset Id";
        readonly required: true;
    };
    readonly kind: {
        readonly type: "string";
        readonly enum: readonly ["normal", "defect"];
        readonly title: "Kind";
        readonly required: true;
    };
    readonly normal_version_id: {
        readonly type: "string";
        readonly title: "Normal Version Id";
    };
    readonly uncovered_from_version: {
        readonly type: "string";
        readonly description: "仅查询指定版本语义链尚未观察的新来源；已变更旧来源单列待重核验";
        readonly title: "Uncovered From Version";
    };
    readonly page: {
        readonly type: "integer";
        readonly title: "Page";
        readonly default: 1;
    };
    readonly page_size: {
        readonly type: "integer";
        readonly description: "每页1..200，默认10；仅取本次已确认图组所需引用，不预先枚举全库";
        readonly title: "Page Size";
        readonly default: 10;
    };
    readonly search: {
        readonly type: "string";
        readonly title: "Search";
        readonly default: "";
    };
};
//# sourceMappingURL=knowledge-source.parameters.generated.d.ts.map