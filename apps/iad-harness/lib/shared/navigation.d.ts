import type { Filters, KnowledgeSnapshot } from "./contracts.js";
export declare const pages: {
    readonly "industrial-datasets": "数据集管理";
    readonly "industrial-images": "图像浏览";
    readonly "industrial-exploration": "方向探索";
    readonly "industrial-knowledge": "知识挖掘";
    readonly "industrial-audit": "模型审计";
    readonly "industrial-review": "人工复核";
    readonly "industrial-model-settings": "模型设置";
};
export type PageId = keyof typeof pages;
export type WorkbenchLocation = {
    pageId: PageId;
    datasetId: string;
    explorationVersion?: string;
    knowledgeKind?: KnowledgeSnapshot["kind"];
    job?: string;
    version?: string;
    conflictId?: string;
    miningPreset?: string;
    scopeRunId?: string;
    scopeSessionId?: string;
    miningContinuous?: boolean;
    miningSourceMode?: "uncovered" | "all" | "recheck";
    normalVersion?: string;
    defectVersion?: string;
    selected?: string;
    tab?: string;
    filters?: Filters;
    page?: number;
};
//# sourceMappingURL=navigation.d.ts.map