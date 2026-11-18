export declare const auditDistributionParameters: {
    readonly dataset_id: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Dataset Id";
    };
    readonly category: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Category";
    };
    readonly scoring: {
        readonly type: "boolean";
        readonly title: "Scoring";
        readonly default: false;
    };
};
//# sourceMappingURL=distribution.parameters.generated.d.ts.map