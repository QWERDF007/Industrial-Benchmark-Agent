import type { ConsistencyBatchSummary } from '../shared/domain.generated.js';
import type { JobSnapshot } from '../shared/contracts.js';
export type ConsistencyJob = Pick<ConsistencyBatchSummary, 'batch_id' | 'status' | 'created_at' | 'duration_seconds' | 'conflict_count'> & {
    analysis: JobSnapshot;
    dataset_ids: string[];
};
export declare function useConsistencyJobs(datasetIds: string[], onProgress: () => void): {
    identity: string;
    pendingCount: number;
    lastSyncedAt: number | null;
    syncState: "current" | "stale" | "syncing";
    jobs: ConsistencyJob[];
    refresh: () => void;
    loading: boolean;
    error: string;
};
//# sourceMappingURL=useConsistencyJobs.d.ts.map