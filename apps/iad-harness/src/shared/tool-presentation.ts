import type { JobSnapshot } from "./contracts.js";
import type { WorkbenchLocation } from "./navigation.js";
import { jobStatuses } from "./job-display.js";

export const workbenchTools = {
  dataset_list: "数据集列表", dataset_import: "接入数据集", dataset_report: "数据集质量报告", knowledge_get: "知识版本",
  knowledge_mine_normal: "挖掘良品知识", knowledge_mine_defect: "挖掘不良品知识",
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
    if (typeof record.run_id === "string") {
      const pageId = record.job_type === "MODEL_AUDIT" ? "industrial-audit" : record.kind === "normal" ? "industrial-normal" : "industrial-defect";
      links.push({ label: "查看作业", location: { pageId, datasetId, job: record.run_id, tab: "jobs" } });
      if (typeof record.status === "string" && record.status in jobStatuses && typeof record.completed === "number" && typeof record.failed === "number" && typeof record.total_samples === "number") {
        job = { status: record.status as JobSnapshot["status"], completed: record.completed, failed: record.failed, total_samples: record.total_samples };
      }
      if (typeof record.knowledge_version_id === "string") links.push({ label: "查看知识版本", location: { pageId, datasetId, version: record.knowledge_version_id, tab: "results" } });
    }
    links.push({ label: "数据集管理", location: { pageId: "industrial-datasets", datasetId } }, { label: "图像浏览", location: { pageId: "industrial-images", datasetId } }, { label: "质量报告", location: { pageId: "industrial-audit", datasetId, tab: "reports" } });
  }
  if (Array.isArray(record.datasets)) for (const dataset of record.datasets) {
    if (dataset && typeof dataset === "object" && typeof dataset.dataset_id === "string" && typeof dataset.name === "string") links.push({ label: dataset.name, location: { pageId: "industrial-datasets", datasetId: dataset.dataset_id } });
  }
  const knowledge = record.knowledge;
  if (knowledge && typeof knowledge === "object" && "dataset_id" in knowledge && "version_id" in knowledge && "kind" in knowledge && typeof knowledge.dataset_id === "string" && typeof knowledge.version_id === "string" && (knowledge.kind === "normal" || knowledge.kind === "defect")) {
    links.push({ label: "查看知识版本", location: { pageId: knowledge.kind === "normal" ? "industrial-normal" : "industrial-defect", datasetId: knowledge.dataset_id, version: knowledge.version_id, tab: "results" } });
  }
  return links.length ? { type: "industrial-workbench", links, job } : null;
}
