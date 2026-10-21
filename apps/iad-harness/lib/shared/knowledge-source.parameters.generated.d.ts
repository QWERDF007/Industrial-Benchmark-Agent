export declare const knowledgeSourceParameters: {
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