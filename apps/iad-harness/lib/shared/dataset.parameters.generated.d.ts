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
//# sourceMappingURL=dataset.parameters.generated.d.ts.map