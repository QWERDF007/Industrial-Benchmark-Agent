import type { Filters, KnowledgeSnapshot } from "./contracts.js";
export declare const navigation: {
    readonly 'industrial-datasets': {
        readonly label: '数据集管理';
        readonly chapter: '数据准备';
    };
    readonly 'industrial-images': {
        readonly label: '图像浏览';
        readonly chapter: '数据准备';
    };
    readonly 'industrial-exploration': {
        readonly label: '方向探索';
        readonly chapter: '知识构建';
    };
    readonly 'industrial-knowledge': {
        readonly label: '知识挖掘';
        readonly chapter: '知识构建';
    };
    readonly 'industrial-audit': {
        readonly label: '模型审计';
        readonly chapter: '质量审核';
    };
    readonly 'industrial-review': {
        readonly label: '人工复核';
        readonly chapter: '质量审核';
    };
    readonly 'industrial-model-settings': {
        readonly label: '模型设置';
        readonly chapter: '工具';
    };
};
export type PageId = keyof typeof navigation;
export declare const pages: Record<PageId, string>;
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