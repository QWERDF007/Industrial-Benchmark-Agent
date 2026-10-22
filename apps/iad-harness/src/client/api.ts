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
export const initialFilters: Filters = { raw_label_filters: [], annotation_filters: [], model_status: "all", review_status: "all", technical: "all", reference_status: "all", search: "", sort_by: "default" };
export const initialReviewFilters: Filters = { ...initialFilters, review_status: "pending" };
export function sampleQuery(datasetId: string, filters: Filters, page: number, pageSize: number) {
  return new URLSearchParams({
    ...filters,
    raw_label_filters: JSON.stringify(filters.raw_label_filters || []),
    annotation_filters: JSON.stringify(filters.annotation_filters || []),
    dataset_id: datasetId,
    page: String(page),
    page_size: String(pageSize),
  }).toString();
}
export const mediaUrl = (sample: Pick<Sample, "task_id" | "sample_id">, view: "image" | "thumbnail" | "mask" = "image") =>
  `/api/iad/media/sample/${encodeURIComponent(sample.task_id)}/${encodeURIComponent(sample.sample_id)}/${view}${view === "thumbnail" ? "?size=240" : ""}`;
export const message = (error: unknown) => error instanceof Error ? error.message : String(error);

export const reviewLabels: Record<Decision, string> = { PASS: "良品", HARD_NORMAL: "困难正常", FAIL: "异常", UNCERTAIN: "不确定", SKIP: "跳过" };
export const reviewLabel = (decision: string) => reviewLabels[decision as Decision] || decision;
export const modelLabels: Record<AuditAnalysis["conclusion"]["suggested_label"], string> = { PASS: "无明显异常", FAIL: "发现疑点", UNCERTAIN: "证据不足" };

export const auditEvidenceUrl = (suggestionId: string, image: Pick<VisualEvidence, "evidence_id">) => `/api/iad/evidence/${encodeURIComponent(suggestionId)}/${encodeURIComponent(image.evidence_id)}`;
export const regionSources = { annotation: "Labelme 线索", model: "MLLM 候选", coverage: "细节覆盖" };

export const auditImageIndex = (analysis: AuditAnalysis) => new Map([analysis.overview, ...analysis.regions.map(region => region.image), ...analysis.auxiliary_evidence].map(image => [image.evidence_id, image] as const));
