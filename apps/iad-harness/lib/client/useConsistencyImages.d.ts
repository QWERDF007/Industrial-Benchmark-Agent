import { type ConsistencyComparisonItem } from './consistency-view.js';
export interface ConsistencyImageCollection {
    items: ConsistencyComparisonItem[];
    pending: boolean;
    error: string | null;
}
export declare function useConsistencyImages(jobId: string | undefined, revision: string, running: boolean): ConsistencyImageCollection;
//# sourceMappingURL=useConsistencyImages.d.ts.map