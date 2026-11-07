import type { GalleryReference, GroupAnalysisView } from '../shared/domain.generated.js';
export declare function useGroupAnalysis(reference: GalleryReference | null): {
    key: string;
    analysis: GroupAnalysisView | null;
    error: string;
    analyze: () => Promise<void>;
    busy: boolean;
} | {
    analysis: null;
    error: string;
    analyze: () => Promise<void>;
    busy: boolean;
};
//# sourceMappingURL=useGroupAnalysis.d.ts.map