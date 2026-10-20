import React from "react";
import type { ReviewDecisionRecord, SampleDetail } from "../../shared/contracts.js";
export declare function HumanReviewForm({ datasetId, sampleId, detail, onSubmitted }: {
    datasetId: string;
    sampleId: string;
    detail: Pick<SampleDetail, "review_decision" | "review_history">;
    onSubmitted(record: ReviewDecisionRecord): void;
}): React.JSX.Element;
//# sourceMappingURL=HumanReviewForm.d.ts.map