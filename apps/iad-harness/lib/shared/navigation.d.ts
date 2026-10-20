export declare const pages: {
    readonly "industrial-datasets": "数据集管理";
    readonly "industrial-images": "图像浏览";
    readonly "industrial-normal": "挖掘良品知识";
    readonly "industrial-defect": "挖掘不良品知识";
    readonly "industrial-audit": "模型审计";
    readonly "industrial-review": "人工复核";
};
export type PageId = keyof typeof pages;
export type WorkbenchLocation = {
    pageId: PageId;
    datasetId: string;
    job?: string;
    version?: string;
    selected?: string;
    tab?: string;
};
//# sourceMappingURL=navigation.d.ts.map