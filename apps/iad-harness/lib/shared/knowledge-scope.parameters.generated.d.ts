export declare const knowledgeScopeParameters: {
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
    readonly objective: {
        readonly type: "string";
        readonly title: "Objective";
        readonly required: true;
    };
    readonly search: {
        readonly type: "string";
        readonly title: "Search";
        readonly default: "";
    };
    readonly seed: {
        readonly type: "integer";
        readonly title: "Seed";
    };
    readonly starting_version_id: {
        readonly type: "string";
        readonly title: "Starting Version Id";
    };
    readonly normal_version_id: {
        readonly type: "string";
        readonly title: "Normal Version Id";
    };
};
//# sourceMappingURL=knowledge-scope.parameters.generated.d.ts.map