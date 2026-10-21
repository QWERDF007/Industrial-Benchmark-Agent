import type { Decision, ReviewSubmission } from "../shared/contracts.js";
interface ReviewDraft {
    reviewer: string;
    comment: string;
    decision: Decision | null;
    pending: ReviewSubmission | null;
}
export declare function useReviewDraft(datasetId: string, sampleId: string): {
    reviewer: string;
    comment: string;
    decision: Decision | null;
    pending: ReviewSubmission | null;
    dirty: boolean;
    update: (patch: Partial<Pick<ReviewDraft, "reviewer" | "comment" | "decision">>) => void;
    prepare: (decision: Decision, duration: number) => ReviewSubmission;
    discard: () => void;
};
export {};
//# sourceMappingURL=useReviewDraft.d.ts.map