import type { GalleryItem, GalleryMember, GalleryReference } from '../shared/domain.generated.js';
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
}
export declare class ConsistencyView {
    static media(image: GalleryItem['anchor'], thumbnail?: boolean): string;
    static load(batchId: string, signal: AbortSignal): Promise<{
        queryId: string;
        items: ConflictCardItem[];
    }>;
    static members(reference: GalleryReference, signal: AbortSignal): Promise<GalleryMember[]>;
}
//# sourceMappingURL=consistency-view.d.ts.map