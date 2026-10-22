import type { Filters, KnowledgeSnapshot } from "./contracts.js";
export const pages = {
  "industrial-datasets": "数据集管理",
  "industrial-images": "图像浏览",
  "industrial-exploration": "方向探索",
  "industrial-knowledge": "知识挖掘",
  "industrial-audit": "模型审计",
  "industrial-review": "人工复核",
} as const;
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
