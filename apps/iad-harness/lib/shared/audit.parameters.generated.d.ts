export declare const auditStartParameters: {
    readonly dataset_id: {
        readonly type: "string";
        readonly title: "Dataset Id";
        readonly required: true;
    };
    readonly normal_version_id: {
        readonly type: "string";
        readonly title: "Normal Version Id";
        readonly required: true;
    };
    readonly defect_version_id: {
        readonly type: "string";
        readonly title: "Defect Version Id";
    };
    readonly sample_ids: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Sample Ids";
    };
    readonly filters: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly raw_label_filters: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                    readonly enum: readonly ["PASS", "FAIL", "UNCERTAIN"];
                };
                readonly title: "Raw Label Filters";
            };
            readonly annotation_filters: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly title: "Annotation Filters";
            };
            readonly model_status: {
                readonly type: "string";
                readonly enum: readonly ["all", "pending", "audited", "risk", "PASS", "FAIL", "UNCERTAIN"];
                readonly title: "Model Status";
                readonly default: "all";
            };
            readonly review_status: {
                readonly type: "string";
                readonly enum: readonly ["all", "pending", "reviewed", "PASS", "HARD_NORMAL", "FAIL", "UNCERTAIN", "SKIP"];
                readonly title: "Review Status";
                readonly default: "all";
            };
            readonly technical: {
                readonly type: "string";
                readonly enum: readonly ["all", "issues"];
                readonly title: "Technical";
                readonly default: "all";
            };
            readonly reference_status: {
                readonly type: "string";
                readonly enum: readonly ["all", "candidate", "excluded"];
                readonly title: "Reference Status";
                readonly default: "all";
            };
            readonly search: {
                readonly type: "string";
                readonly title: "Search";
                readonly default: "";
            };
            readonly sort_by: {
                readonly type: "string";
                readonly enum: readonly ["default", "risk", "tech"];
                readonly title: "Sort By";
                readonly default: "default";
            };
        };
        readonly title: "SampleFilters";
    };
    readonly consistency_mode: {
        readonly type: "string";
        readonly enum: readonly ["exact", "visual", "combined"];
        readonly title: "Consistency Mode";
        readonly default: "exact";
    };
    readonly consistency_profile_id: {
        readonly type: "string";
        readonly title: "Consistency Profile Id";
    };
    readonly corpus_scope: {
        readonly oneOf: readonly [{
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["all_registered"];
                    readonly title: "Kind";
                    readonly default: "all_registered";
                };
            };
            readonly title: "AllRegisteredScope";
        }, {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly kind: {
                    readonly type: "string";
                    readonly enum: readonly ["datasets"];
                    readonly title: "Kind";
                    readonly default: "datasets";
                };
                readonly dataset_ids: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly title: "Dataset Ids";
                    readonly required: true;
                };
            };
            readonly title: "DatasetScope";
        }];
        readonly title: "Corpus Scope";
    };
};
//# sourceMappingURL=audit.parameters.generated.d.ts.map