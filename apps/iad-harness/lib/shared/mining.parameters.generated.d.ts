export declare const miningParameters: {
    readonly dataset_id: {
        readonly type: "string";
        readonly title: "Dataset Id";
        readonly required: true;
    };
    readonly origin_session_id: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Origin Session Id";
        readonly default: null;
    };
    readonly kind: {
        readonly type: "string";
        readonly enum: readonly ["normal", "defect"];
        readonly title: "Kind";
        readonly required: true;
    };
    readonly normal_version_id: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly title: "Normal Version Id";
        readonly default: null;
    };
    readonly model_name: {
        readonly type: "string";
        readonly title: "Model Name";
        readonly default: "Qwen/Qwen3.8-27B-FP8";
    };
    readonly sample_ids: {
        readonly oneOf: readonly [{
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        }, {
            readonly type: "null";
        }];
        readonly description: "新增来源范围，与父版本仍合格来源合并核验；省略覆盖全部合格来源";
        readonly title: "Sample Ids";
        readonly default: null;
    };
    readonly base_version_id: {
        readonly oneOf: readonly [{
            readonly type: "string";
        }, {
            readonly type: "null";
        }];
        readonly description: "人工修订所依据的当前同类型知识版本";
        readonly title: "Base Version Id";
        readonly default: null;
    };
    readonly corrections: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly check_id: {
                    readonly type: "string";
                    readonly description: "冻结基准版本中的检查项ID";
                    readonly title: "Check Id";
                    readonly required: true;
                };
                readonly instruction: {
                    readonly type: "string";
                    readonly description: "待视觉核验的人工修订建议，不是已证实事实";
                    readonly title: "Instruction";
                    readonly required: true;
                };
            };
            readonly title: "KnowledgeCorrection";
        };
        readonly description: "待核验的人工修订，需同时指定base_version_id；不得直接作为事实";
        readonly title: "Corrections";
    };
};
//# sourceMappingURL=mining.parameters.generated.d.ts.map