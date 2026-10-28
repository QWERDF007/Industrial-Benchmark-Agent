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
    readonly 'industrial-consistency': {
        readonly label: '数据一致性';
        readonly chapter: '质量审核';
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
export declare const consistencyTabs: readonly [{
    readonly id: 'conflicts';
    readonly label: '标注冲突';
}, {
    readonly id: 'search';
    readonly label: '图像检索';
}, {
    readonly id: 'groups';
    readonly label: '重复图组';
}, {
    readonly id: 'jobs';
    readonly label: '索引与作业';
}];
export type ConsistencyTab = typeof consistencyTabs[number]['id'];
type RouteValue<T extends {
    kind?: string;
}> = T extends unknown ? {
    [K in keyof T]: T[K];
} & Required<Pick<T, 'kind'>> : never;
type RouteFields<T> = {
    [K in keyof T]: Exclude<T[K], null>;
};
export type ConsistencyLocation = RouteFields<Omit<import('./domain.generated.js').ConsistencyReturnLocation, 'pageId' | 'scope' | 'query' | 'returnPage'>> & {
    pageId: 'industrial-consistency';
    scope?: RouteValue<import('./domain.generated.js').CorpusScope>;
    query?: RouteValue<import('./domain.generated.js').SampleImageQuery>;
    returnPage?: DatasetPageId;
};
export type DatasetPageId = Exclude<PageId, 'industrial-consistency'>;
export type WorkbenchLocation = ConsistencyLocation | {
    pageId: DatasetPageId;
    datasetId: string;
    explorationVersion?: string;
    directionFocus?: string;
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
export {};
//# sourceMappingURL=navigation.d.ts.map