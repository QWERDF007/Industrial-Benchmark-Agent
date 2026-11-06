import type { JobSnapshot } from '../shared/contracts.js';
export declare function useJobs(kind: 'audit' | 'knowledge' | 'exploration' | 'consistency', datasetId: string | string[], onProgress: () => void, selectedRunId?: string, refreshRevision?: number): {
    identity: string;
    loading: boolean;
    jobs: JobSnapshot[];
    pendingCount: number;
    error: string;
    lastSyncedAt: number | null;
    syncState: "current" | "stale" | "syncing";
    refresh: () => void;
};
//# sourceMappingURL=useJobs.d.ts.map