export declare const knowledgeScopeParameters: {
    readonly dataset_id: {
        readonly type: "string";
        readonly title: "Dataset Id";
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
        readonly oneOf: readonly [{
            readonly type: "integer";
        }, {
            readonly type: "null";
        }];
        readonly title: "Seed";
    };
    readonly starting_version_id: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Starting Version Id";
    };
};
//# sourceMappingURL=knowledge-scope.parameters.generated.d.ts.map