export async function request(path, body, method, signal) {
    const multipart = body instanceof FormData;
    const response = await fetch("/api/iad" + path, {
        method: method || (body === undefined ? "GET" : "POST"),
        headers: body === undefined || multipart ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : multipart ? body : JSON.stringify(body), signal,
    });
    const data = await response.json();
    if (!response.ok)
        throw new Error(data.error?.message || `请求失败 (${response.status})`);
    return data;
}
export const initialFilters = { raw_label_filters: [], annotation_filters: [], model_status: "all", review_status: "all", technical: "all", reference_status: "all", search: "", sort_by: "default" };
export const initialReviewFilters = { ...initialFilters, review_status: "pending" };
export function sampleQuery(datasetId, filters, page, pageSize) {
    return new URLSearchParams({
        ...filters,
        raw_label_filters: JSON.stringify(filters.raw_label_filters || []),
        annotation_filters: JSON.stringify(filters.annotation_filters || []),
        dataset_id: datasetId,
        page: String(page),
        page_size: String(pageSize),
    }).toString();
}
export const mediaUrl = (sample, view = "image") => `/api/iad/media/sample/${encodeURIComponent(sample.task_id)}/${encodeURIComponent(sample.sample_id)}/${view}${view === "thumbnail" ? "?size=240" : ""}`;
export const message = (error) => error instanceof Error ? error.message : String(error);
export const reviewLabels = { PASS: "良品", HARD_NORMAL: "困难正常", FAIL: "异常", UNCERTAIN: "不确定", SKIP: "跳过" };
export const reviewLabel = (decision) => reviewLabels[decision] || decision;
export const modelLabels = { PASS: "无明显异常", FAIL: "发现疑点", UNCERTAIN: "证据不足" };
export const auditEvidenceUrl = (suggestionId, image) => `/api/iad/evidence/${encodeURIComponent(suggestionId)}/${encodeURIComponent(image.evidence_id)}`;
export const regionSources = { annotation: "Labelme 线索", model: "MLLM 候选", coverage: "细节覆盖" };
export const auditImageIndex = (analysis) => new Map([analysis.overview, ...analysis.regions.map(region => region.image), ...analysis.auxiliary_evidence].map(image => [image.evidence_id, image]));
