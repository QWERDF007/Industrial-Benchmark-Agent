import type { AuditJob } from "../shared/contracts.js";
export declare function useJobs<T extends AuditJob>(kind: "audit" | "knowledge", datasetId: string, onProgress: () => void): {
    jobs: T[];
    error: string;
    refresh: () => void;
};
//# sourceMappingURL=useJobs.d.ts.map