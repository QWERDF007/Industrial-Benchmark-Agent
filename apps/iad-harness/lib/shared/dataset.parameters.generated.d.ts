export declare const folderRulesParameter: {
    readonly type: "array";
    readonly items: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly path: {
                readonly type: "string";
                readonly description: "Relative directory path under dataset root, or '.' for root images";
                readonly title: "Path";
                readonly required: true;
            };
            readonly role: {
                readonly type: "string";
                readonly enum: readonly ["normal", "anomaly", "unlabeled", "excluded"];
                readonly description: "Role assigned to this directory";
                readonly title: "Role";
                readonly required: true;
            };
        };
        readonly title: "FolderRule";
    };
};
export declare const annotationPolicyParameter: {
    readonly type: "object";
    readonly additionalProperties: false;
    readonly properties: {
        readonly policy_id: {
            readonly type: "string";
            readonly title: "Policy Id";
        };
        readonly annotation_role: {
            readonly type: "string";
            readonly enum: readonly ["REFERENCE", "PREDICTION", "UNKNOWN"];
            readonly title: "Annotation Role";
            readonly default: "UNKNOWN";
        };
        readonly annotation_coverage: {
            readonly type: "string";
            readonly enum: readonly ["EXHAUSTIVE", "PARTIAL", "UNKNOWN"];
            readonly title: "Annotation Coverage";
            readonly default: "UNKNOWN";
        };
        readonly category_mapping: {
            readonly type: "object";
            readonly additionalProperties: true;
            readonly properties: {};
            readonly title: "Category Mapping";
        };
    };
    readonly title: "AnnotationPolicy";
};
//# sourceMappingURL=dataset.parameters.generated.d.ts.map