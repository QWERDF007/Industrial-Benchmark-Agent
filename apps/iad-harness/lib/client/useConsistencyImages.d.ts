import type { AnchorImageQuery } from '../shared/domain.generated.js';
import { type ConsistencyComparisonItem } from './consistency-view.js';
export interface ConsistencyImageCollection {
    items: ConsistencyComparisonItem[];
    total: number;
    counts: Record<string, number>;
    pending: boolean;
    error: string | null;
}
export declare function useConsistencyImages(jobId: string | undefined, revision: string, running: boolean, query: AnchorImageQuery, page: number): ConsistencyImageCollection;
//# sourceMappingURL=useConsistencyImages.d.ts.map