export declare const miningParameters: {
    readonly knowledge_preset: {
        readonly oneOf: readonly [{
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        }, {
            readonly type: "null";
        }];
        readonly description: "可选父知识版本引用；省略或空列表表示不使用预设，不隐式读取当前版本";
        readonly title: "Knowledge Preset";
    };
    readonly image_count: {
        readonly type: "integer";
        readonly description: "本次原始图像数量，必须严格等于images长度";
        readonly title: "Image Count";
        readonly required: true;
    };
    readonly images: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly description: "从knowledge_sources查询复制的已导入sample_id引用，不接受相对路径或图像编码";
        readonly title: "Images";
        readonly required: true;
    };
    readonly mining_prompt: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly properties: {
            readonly objective: {
                readonly type: "string";
                readonly title: "Objective";
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
                            readonly required: true;
                        };
                        readonly instruction: {
                            readonly type: "string";
                            readonly title: "Instruction";
                            readonly required: true;
                        };
                        readonly enabled: {
                            readonly type: "boolean";
                            readonly title: "Enabled";
                            readonly default: true;
                            readonly required: true;
                        };
                        readonly origin: {
                            readonly type: "string";
                            readonly enum: readonly ["preset", "dataset", "explored"];
                            readonly title: "Origin";
                            readonly default: "dataset";
                            readonly required: true;
                        };
                    };
                    readonly title: "MiningDirection";
                };
                readonly title: "Directions";
                readonly required: true;
            };
            readonly instruction: {
                readonly type: "string";
                readonly title: "Instruction";
                readonly required: true;
            };
            readonly exploration: {
                readonly oneOf: readonly [{
                    readonly type: "object";
                    readonly additionalProperties: false;
                    readonly properties: {
                        readonly version_id: {
                            readonly type: "string";
                            readonly title: "Version Id";
                            readonly required: true;
                        };
                        readonly summary: {
                            readonly type: "string";
                            readonly title: "Summary";
                            readonly required: true;
                        };
                        readonly limitations: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly title: "Limitations";
                            readonly required: true;
                        };
                    };
                    readonly title: "MiningExploration";
                }, {
                    readonly type: "null";
                }];
                readonly required: true;
            };
        };
        readonly title: "SubmittedMiningPrompt";
        readonly required: true;
    };
};
//# sourceMappingURL=mining.parameters.generated.d.ts.map