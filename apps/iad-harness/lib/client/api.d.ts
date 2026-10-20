import type { AuditAnalysis, Filters, Sample, VisualEvidence } from "../shared/contracts.js";
export declare function request<T>(path: string, body?: unknown, method?: string, signal?: AbortSignal): Promise<T>;
export declare const initialFilters: Filters;
export declare const mediaUrl: (sample: Pick<Sample, "task_id" | "sample_id">, view?: "image" | "thumbnail" | "mask") => string;
export declare const message: (error: unknown) => string;
export declare const auditPhases: Record<string, string>;
export declare const auditEvidenceUrl: (suggestionId: string, image: Pick<VisualEvidence, "evidence_id">) => string;
export declare const regionSources: {
    annotation: string;
    model: string;
    coverage: string;
};
export declare const auditImageIndex: (analysis: AuditAnalysis) => Map<string, VisualEvidence>;
//# sourceMappingURL=api.d.ts.map