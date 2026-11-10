import type { AnchorImageItem, ConsistencyAnchorRun, GalleryItem, GalleryMember, GalleryReference } from '../shared/domain.generated.js';
import { modelConclusionLabels } from '../shared/consistency.parameters.generated.js';
export declare const consistencyImageGroups: {
    readonly NO_CANDIDATES: '无候选';
    readonly NO_ELIGIBLE_CANDIDATES: '无有效候选';
};
export type ConsistencyImageGroup = 'images' | keyof typeof consistencyImageGroups;
export interface ConsistencyComparisonItem {
    id: string;
    type: string;
    filename: string;
    url: string;
    fullUrl: string;
    sourceWidth?: number;
    sourceHeight?: number;
    candidateCount: number;
    reason?: AnchorImageItem['summary']['reason'];
    reference: ConsistencyAnalysisReference;
    image?: GalleryItem['anchor'];
    model: {
        status: 'conflict' | 'no_conflict' | 'unknown';
        modelType: keyof typeof modelConclusionLabels | '';
    };
    review: GalleryItem['review_state'];
    agreement: 'same' | 'different' | null;
}
export interface ConflictCardItem extends ConsistencyComparisonItem {
    types: GalleryItem['conflict_categories'];
    memberCount: number;
    rawItem: GalleryItem;
    checkId?: string;
}
export interface ConsistencyFilterValues {
    search: string;
    model: keyof typeof modelConclusionLabels | 'all';
    agreement: NonNullable<ConsistencyComparisonItem['agreement']> | 'all';
    review: ConsistencyComparisonItem['review'] | 'all';
}
export declare const initialConsistencyFilters: ConsistencyFilterValues;
export type AnchorReviewReference = Pick<ConsistencyAnchorRun, 'job_id' | 'anchor_id'>;
export type ConsistencyAnalysisReference = GalleryReference | AnchorReviewReference;
export declare class ConsistencyView {
    static modelConclusion(value: string | null | undefined, verdict?: GalleryItem['model_state'] | null): keyof typeof modelConclusionLabels | '';
    static agreement(program: string, model: ConsistencyComparisonItem['model']['modelType']): ConsistencyComparisonItem['agreement'];
    static filter<T extends ConsistencyComparisonItem>(items: T[], filters: ConsistencyFilterValues, reason?: keyof typeof consistencyImageGroups): T[];
    static media(image: GalleryItem['anchor'], thumbnail?: boolean): string;
    static load(batchId: string, signal: AbortSignal): Promise<{
        queryId: string;
        items: ConflictCardItem[];
    }>;
    static loadCheck(runId: string, signal: AbortSignal): Promise<{
        queryId: string;
        items: ConflictCardItem[];
    }>;
    static loadImages(runId: string, signal: AbortSignal): Promise<ConsistencyComparisonItem[]>;
    private static cards;
    static imageCards(runId: string, items: AnchorImageItem[]): ConsistencyComparisonItem[];
    static members(reference: ConsistencyAnalysisReference, signal: AbortSignal): Promise<GalleryMember[]>;
}
//# sourceMappingURL=consistency-view.d.ts.map