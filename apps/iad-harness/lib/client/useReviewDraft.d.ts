import type { Decision, ReviewSubmission } from "../shared/contracts.js";
interface ReviewDraft {
    reviewer: string;
    comment: string;
    pending: ReviewSubmission | null;
}
export declare function useReviewDraft(datasetId: string, sampleId: string): {
    reviewer: string;
    comment: string;
    pending: ReviewSubmission | null;
    dirty: boolean;
    update: (patch: Partial<Pick<ReviewDraft, "reviewer" | "comment">>) => void;
    prepare: (decision: Decision, duration: number) => ReviewSubmission;
    discard: () => void;
};
export {};
//# sourceMappingURL=useReviewDraft.d.ts.map