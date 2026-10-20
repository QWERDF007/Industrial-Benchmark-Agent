import type { Filters, Sample } from "../shared/contracts.js";

export async function request<T>(path: string, body?: unknown, method?: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch("/api/iad" + path, {
    method: method || (body === undefined ? "GET" : "POST"),
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body), signal,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `请求失败 (${response.status})`);
  return data as T;
}
export const initialFilters: Filters = { annotation_filters: [], model_status: "all", review_status: "all", technical: "all", search: "", sort_by: "default" };
export const mediaUrl = (sample: Pick<Sample, "task_id" | "sample_id">, thumbnail = false) =>
  `/api/iad/media/sample/${encodeURIComponent(sample.task_id)}/${encodeURIComponent(sample.sample_id)}/${thumbnail ? "thumbnail?size=240" : "image"}`;
export const message = (error: unknown) => error instanceof Error ? error.message : String(error);

export const auditPhases: Record<string, string> = { LEARNING_NORMAL: "学习良品模式", GLOBAL: "全图观察", REGIONS: "ROI 细看", SYNTHESIS: "全图与 ROI 联合分析", SAMPLE_COMPLETED: "图像审计完成" };
