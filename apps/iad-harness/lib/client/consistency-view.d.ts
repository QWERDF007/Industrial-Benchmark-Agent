import type { AnchorImageItem, ConsistencyAnchorRun, GalleryItem, GalleryMember, GalleryReference } from '../shared/domain.generated.js';
import { conflictCategoryLabels } from '../shared/consistency.parameters.generated.js';
export interface ConsistencyComparisonItem {
    id: string;
    type: string;
    filename: string;
    url: string;
    fullUrl: string;
    sourceWidth?: number;
    sourceHeight?: number;
    candidateCount: number;
    reference: ConsistencyAnalysisReference;
    image?: GalleryItem['anchor'];
    model: {
        status: 'conflict' | 'no_conflict' | 'unknown';
        modelType: keyof typeof conflictCategoryLabels | '';
    };
}
export interface ConflictCardItem extends ConsistencyComparisonItem {
    types: GalleryItem['conflict_categories'];
    memberCount: number;
    review: GalleryItem['review_state'];
    rawItem: GalleryItem;
    checkId?: string;
    agreement: 'same' | 'different' | null;
}
export type AnchorReviewReference = Pick<ConsistencyAnchorRun, 'job_id' | 'anchor_id'>;
export type ConsistencyAnalysisReference = GalleryReference | AnchorReviewReference;
export declare class ConsistencyView {
    static modelConclusion(value: string | null | undefined): keyof typeof conflictCategoryLabels | '';
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
    static imageCards(runId: string, items: AnchorImageItem[]): ConsistencyComparisonItem[];
    static members(reference: ConsistencyAnalysisReference, signal: AbortSignal): Promise<GalleryMember[]>;
}
//# sourceMappingURL=consistency-view.d.ts.map