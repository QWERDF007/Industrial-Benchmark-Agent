import type { JobSnapshot } from "./contracts.js";
import type { WorkbenchLocation } from "./navigation.js";
import { jobStatuses } from "./job-display.js";

export const workbenchTools = {
  direction_exploration_start: "探索检查方向", direction_exploration_status: "方向探索状态", direction_exploration_get: "方向探索结果",
  direction_exploration_cancel: "停止方向探索", direction_exploration_retry: "重试方向探索", knowledge_directions_adopt: "采用探索方向",
  dataset_list: "数据集列表", dataset_import: "接入数据集", dataset_rescan: "重新扫描目录", dataset_report: "数据集质量报告", knowledge_get: "知识版本",
  knowledge_scope_open: "建立知识范围", knowledge_scope_get: "知识范围进度", knowledge_scope_stop: "停止知识范围", knowledge_scope_resume: "继续知识范围",
  knowledge_details: "知识条目", knowledge_conflict_context: "知识冲突", knowledge_job_observations: "知识观察证据",
  knowledge_sources: "查询知识来源", knowledge_mine_normal: "挖掘良品知识", knowledge_mine_defect: "挖掘不良品知识",
  knowledge_job_status: "知识作业状态", knowledge_job_cancel: "停止知识作业", knowledge_job_retry: "重试知识作业",
  model_audit_start: "启动模型审计", model_audit_status: "审计作业状态", model_audit_cancel: "停止模型审计", model_audit_retry: "重试模型审计",
} as const;
export type ToolPresentation = {
  type: "industrial-workbench";
  links: Array<{ label: string; location: WorkbenchLocation }>;
  job: Pick<JobSnapshot, "status" | "completed" | "failed" | "total_samples"> | null;
};

/** A compact projection of recorded results; it contains references, never workflow state. */
export function toolPresentation(value: unknown): ToolPresentation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const links: ToolPresentation["links"] = [];
  let job: ToolPresentation["job"] = null;
  if (typeof record.dataset_id === "string") {
    const datasetId = record.dataset_id;
    const knowledgeKind = record.kind === "defect" ? "defect" : "normal";
    if (typeof record.scope_run_id === "string") links.push({ label: "查看连续范围", location: { pageId: "industrial-knowledge", datasetId, knowledgeKind, scopeRunId: record.scope_run_id, tab: "results" } });

    if (typeof record.run_id === "string") {
      const pageId = record.job_type === "DIRECTION_EXPLORATION" ? "industrial-exploration" : record.job_type === "MODEL_AUDIT" ? "industrial-audit" : "industrial-knowledge";
      links.push({ label: "查看作业", location: { pageId, datasetId, knowledgeKind, job: record.run_id, tab: "jobs" } });
      if (typeof record.status === "string" && record.status in jobStatuses && typeof record.completed === "number" && typeof record.failed === "number" && typeof record.total_samples === "number") {
        job = { status: record.status as JobSnapshot["status"], completed: record.completed, failed: record.failed, total_samples: record.total_samples };
      }
      if (typeof record.knowledge_version_id === "string") links.push({ label: "查看知识版本", location: { pageId, datasetId, knowledgeKind, version: record.knowledge_version_id, tab: "results" } });
    }
    if (record.exploration && typeof record.exploration === "object" && "version_id" in record.exploration && typeof record.exploration.version_id === "string")
      links.push({ label: "查看探索方向", location: { pageId: "industrial-exploration", datasetId, version: record.exploration.version_id, tab: "results" } });
    links.push({ label: "数据集管理", location: { pageId: "industrial-datasets", datasetId } }, { label: "图像浏览", location: { pageId: "industrial-images", datasetId } }, { label: "质量报告", location: { pageId: "industrial-audit", datasetId, tab: "reports" } });
  }
  if (Array.isArray(record.datasets)) for (const dataset of record.datasets) {
    if (dataset && typeof dataset === "object" && typeof dataset.dataset_id === "string" && typeof dataset.name === "string") links.push({ label: dataset.name, location: { pageId: "industrial-datasets", datasetId: dataset.dataset_id } });
  }
  const knowledge = record.knowledge;
  if (knowledge && typeof knowledge === "object" && "dataset_id" in knowledge && "version_id" in knowledge && "kind" in knowledge && typeof knowledge.dataset_id === "string" && typeof knowledge.version_id === "string" && (knowledge.kind === "normal" || knowledge.kind === "defect")) {
    links.push({ label: "查看知识版本", location: { pageId: "industrial-knowledge", knowledgeKind: knowledge.kind, datasetId: knowledge.dataset_id, version: knowledge.version_id, tab: "results" } });
  }
  return links.length ? { type: "industrial-workbench", links, job } : null;
}
