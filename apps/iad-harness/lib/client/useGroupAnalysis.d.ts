import type { GalleryReference, GroupAnalysisView } from '../shared/domain.generated.js';
export declare function useGroupAnalysis(reference: GalleryReference | null): {
    key: string;
    analysis: GroupAnalysisView | null;
    error: string;
} | {
    analysis: null;
    error: string;
};
//# sourceMappingURL=useGroupAnalysis.d.ts.map