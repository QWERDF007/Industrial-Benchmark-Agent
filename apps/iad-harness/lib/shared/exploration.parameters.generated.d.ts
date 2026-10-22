export declare const explorationParameters: {
    readonly dataset_id: {
        readonly type: "string";
        readonly title: "Dataset Id";
        readonly required: true;
    };
    readonly normal_images: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Normal Images";
        readonly required: true;
    };
    readonly defect_images: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly title: "Defect Images";
        readonly required: true;
    };
    readonly objective: {
        readonly type: "string";
        readonly title: "Objective";
        readonly default: "联合比较候选良品和异常样例，自行提出适合此数据集的可观察检查方向。";
    };
};
export declare const directionAdoptionParameters: {
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
    readonly expected_revision: {
        readonly type: "string";
        readonly title: "Expected Revision";
        readonly required: true;
    };
    readonly directions: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly direction_id: {
                    readonly type: "string";
                    readonly title: "Direction Id";
                    readonly required: true;
                };
                readonly title: {
                    readonly type: "string";
                    readonly title: "Title";
                };
                readonly instruction: {
                    readonly type: "string";
                    readonly title: "Instruction";
                };
                readonly enabled: {
                    readonly type: "boolean";
                    readonly title: "Enabled";
                    readonly default: true;
                };
            };
            readonly title: "DirectionChoice";
        };
        readonly title: "Directions";
        readonly required: true;
    };
};
//# sourceMappingURL=exploration.parameters.generated.d.ts.map