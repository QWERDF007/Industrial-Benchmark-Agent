import type { ConsistencyAnchorRun, GalleryItem, GalleryMember, GalleryReference } from '../shared/domain.generated.js';
export interface ConflictCardItem {
    id: string;
    type: string;
    types: GalleryItem['conflict_categories'];
    filename: string;
    url: string;
    fullUrl: string;
    sourceWidth: number;
    sourceHeight: number;
    memberCount: number;
    review: GalleryItem['review_state'];
    model: {
        status: 'conflict' | 'no_conflict' | 'unknown';
        modelType: string;
    };
    rawItem: GalleryItem;
    checkId?: string;
    agreement: 'same' | 'different' | null;
}
export type AnchorReviewReference = Pick<ConsistencyAnchorRun, 'job_id' | 'anchor_id'>;
export type ConsistencyAnalysisReference = GalleryReference | AnchorReviewReference;
export declare class ConsistencyView {
    static media(image: GalleryItem['anchor'], thumbnail?: boolean): string;
    static load(batchId: string, signal: AbortSignal): Promise<{
        queryId: string;
        items: ConflictCardItem[];
    }>;
    static loadCheck(runId: string, signal: AbortSignal): Promise<{
        queryId: string;
        items: ConflictCardItem[];
    }>;
    private static cards;
    static members(reference: ConsistencyAnalysisReference, signal: AbortSignal): Promise<GalleryMember[]>;
}
//# sourceMappingURL=consistency-view.d.ts.map