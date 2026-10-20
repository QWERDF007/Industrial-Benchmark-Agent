export const pages = {
  "industrial-datasets": "数据集管理",
  "industrial-images": "图像浏览",
  "industrial-normal": "挖掘良品知识",
  "industrial-defect": "挖掘不良品知识",
  "industrial-audit": "模型审计",
  "industrial-review": "人工复核",
} as const;
export type PageId = keyof typeof pages;
export type WorkbenchLocation = {
  pageId: PageId;
  datasetId: string;
  job?: string;
  version?: string;
  selected?: string;
  tab?: string;
};
