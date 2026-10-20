import type { AuditJob } from "../shared/contracts.js";
export declare function useAuditJobs(datasetId: string, onProgress: () => void): {
    jobs: AuditJob[];
    error: string;
    refresh: () => void;
};
//# sourceMappingURL=useAuditJobs.d.ts.map