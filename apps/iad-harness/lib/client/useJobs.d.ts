import type { JobSnapshot } from "../shared/contracts.js";
export declare function useJobs(kind: "audit" | "knowledge", datasetId: string, onProgress: () => void, selectedRunId?: string): {
    jobs: JobSnapshot[];
    error: string;
    refresh: () => void;
};
//# sourceMappingURL=useJobs.d.ts.map