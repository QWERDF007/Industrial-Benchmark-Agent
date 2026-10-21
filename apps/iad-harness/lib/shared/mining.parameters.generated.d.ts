export declare const miningParameters: {
    readonly knowledge_preset: {
        readonly type: "array";
        readonly items: {
            readonly type: "string";
        };
        readonly description: "可选知识版本引用；省略或空列表表示不使用预设，不隐式读取当前版本";
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
};
//# sourceMappingURL=mining.parameters.generated.d.ts.map