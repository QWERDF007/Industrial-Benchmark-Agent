import type { Filters, Sample } from "../shared/contracts.js";
export declare function request<T>(path: string, body?: unknown, method?: string, signal?: AbortSignal): Promise<T>;
export declare const initialFilters: Filters;
export declare const mediaUrl: (sample: Pick<Sample, "task_id" | "sample_id">, thumbnail?: boolean) => string;
export declare const message: (error: unknown) => string;
export declare const auditPhases: Record<string, string>;
//# sourceMappingURL=api.d.ts.map