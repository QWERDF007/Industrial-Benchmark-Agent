import type { GroupAnalysisView } from '../shared/domain.generated.js';
import type { ConsistencyAnalysisReference } from './consistency-view.js';
export declare function useGroupAnalysis(reference: ConsistencyAnalysisReference | null): {
    key: string;
    analysis: GroupAnalysisView | null;
    error: string;
} | {
    analysis: null;
    error: string;
};
//# sourceMappingURL=useGroupAnalysis.d.ts.map