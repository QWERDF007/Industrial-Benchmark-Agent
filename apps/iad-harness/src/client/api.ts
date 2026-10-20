import type { AuditAnalysis, Decision, Filters, Sample, VisualEvidence } from "../shared/contracts.js";

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
export const mediaUrl = (sample: Pick<Sample, "task_id" | "sample_id">, view: "image" | "thumbnail" | "mask" = "image") =>
  `/api/iad/media/sample/${encodeURIComponent(sample.task_id)}/${encodeURIComponent(sample.sample_id)}/${view}${view === "thumbnail" ? "?size=240" : ""}`;
export const message = (error: unknown) => error instanceof Error ? error.message : String(error);

export const auditPhases: Record<string, string> = { PREPARING_KNOWLEDGE: "准备冻结知识", GLOBAL: "全图观察", REGIONS: "ROI 细看", SYNTHESIS: "全图与 ROI 联合分析", SAMPLE_COMPLETED: "图像审计完成" };
export const reviewLabels: Record<Decision, string> = { PASS: "良品", HARD_NORMAL: "困难正常", FAIL: "异常", UNCERTAIN: "不确定", SKIP: "跳过" };
export const reviewLabel = (decision: string) => reviewLabels[decision as Decision] || decision;

export const auditEvidenceUrl = (suggestionId: string, image: Pick<VisualEvidence, "evidence_id">) => `/api/iad/evidence/${encodeURIComponent(suggestionId)}/${encodeURIComponent(image.evidence_id)}`;
export const regionSources = { annotation: "Labelme 线索", model: "MLLM 候选", coverage: "细节覆盖" };

export const auditImageIndex = (analysis: AuditAnalysis) => new Map([analysis.overview, ...analysis.regions.map(region => region.image), ...analysis.auxiliary_evidence].map(image => [image.evidence_id, image] as const));
