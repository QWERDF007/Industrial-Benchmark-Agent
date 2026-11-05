export declare const knowledgeDetailParameters: {
    readonly version_id: {
        readonly type: "string";
        readonly title: "Version Id";
        readonly required: true;
    };
    readonly check_id: {
        readonly type: "string";
        readonly title: "Check Id";
    };
    readonly evidence_role: {
        readonly type: "string";
        readonly enum: readonly ["support", "counter"];
        readonly title: "Evidence Role";
    };
    readonly section: {
        readonly type: "string";
        readonly enum: readonly ["checks", "discovery", "evidence"];
        readonly title: "Section";
        readonly default: "checks";
    };
    readonly evidence_ids: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Evidence Ids";
    };
    readonly page: {
        readonly type: "integer";
        readonly title: "Page";
        readonly default: 1;
    };
    readonly page_size: {
        readonly type: "integer";
        readonly title: "Page Size";
        readonly default: 10;
    };
    readonly search: {
        readonly type: "string";
        readonly title: "Search";
        readonly default: "";
    };
    readonly review_status: {
        readonly type: "string";
        readonly enum: readonly ["all", "pending", "confirmed", "rejected", "conflict"];
        readonly title: "Review Status";
        readonly default: "all";
    };
};
//# sourceMappingURL=knowledge-detail.parameters.generated.d.ts.map