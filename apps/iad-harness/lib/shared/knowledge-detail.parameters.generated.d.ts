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
    readonly section: {
        readonly type: "string";
        readonly enum: readonly ["checks", "discovery"];
        readonly title: "Section";
        readonly default: "checks";
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
};
//# sourceMappingURL=knowledge-detail.parameters.generated.d.ts.map