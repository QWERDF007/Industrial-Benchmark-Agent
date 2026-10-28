import type { JobSnapshot } from "../shared/contracts.js";
type SyncState = "syncing" | "current" | "stale";
export declare function useJobs(kind: "audit" | "knowledge" | "exploration", datasetId: string, onProgress: () => void, selectedRunId?: string, refreshRevision?: number): {
    identity: string;
    jobs: JobSnapshot[];
    pendingCount: number;
    error: string;
    lastSyncedAt: number | null;
    syncState: SyncState;
    refresh: () => void;
};
export {};
//# sourceMappingURL=useJobs.d.ts.map