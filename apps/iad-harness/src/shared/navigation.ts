import type { Filters, KnowledgeSnapshot } from "./contracts.js";
export const navigation = {
  'industrial-datasets': {label: '数据集管理', chapter: '数据准备'},
  'industrial-images': {label: '图像浏览', chapter: '数据准备'},
  'industrial-exploration': {label: '方向探索', chapter: '知识构建'},
  'industrial-knowledge': {label: '知识挖掘', chapter: '知识构建'},
  'industrial-consistency': {label: '数据一致性', chapter: '质量审核'},
  'industrial-audit': {label: '模型审计', chapter: '质量审核'},
  'industrial-review': {label: '人工复核', chapter: '质量审核'},
  'industrial-model-settings': {label: '模型设置', chapter: '工具'},
} as const;
export type PageId = keyof typeof navigation;
export const pages = Object.fromEntries(Object.entries(navigation).map(([id, page]) => [id, page.label])) as Record<PageId, string>;
export const consistencyTabs = [{id:'conflicts',label:'标注冲突'}, {id:'search',label:'图像检索'}, {id:'groups',label:'重复图组'}, {id:'jobs',label:'索引与作业'}] as const;
export type ConsistencyTab = typeof consistencyTabs[number]['id'];
type RouteValue<T extends {kind?:string}> = T extends unknown ? {[K in keyof T]:T[K]} & Required<Pick<T,'kind'>> : never;
type RouteFields<T> = {[K in keyof T]:Exclude<T[K],null>};
export type ConsistencyLocation = RouteFields<Omit<import('./domain.generated.js').ConsistencyReturnLocation,'pageId'|'scope'|'query'|'returnPage'>> & {
  pageId:'industrial-consistency';
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
