interface ReviewDraft {
    reviewer: string;
    comment: string;
}
export declare function useReviewDraft(datasetId: string, sampleId: string): {
    reviewer: string;
    comment: string;
    dirty: boolean;
    update: (patch: Partial<ReviewDraft>) => void;
    discard: () => void;
};
export {};
//# sourceMappingURL=useReviewDraft.d.ts.map