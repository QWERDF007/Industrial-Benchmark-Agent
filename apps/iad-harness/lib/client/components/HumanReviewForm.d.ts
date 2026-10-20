import React from "react";
import type { SampleDetail } from "../../shared/contracts.js";
export declare function HumanReviewForm({ datasetId, sampleId, detail, onChanged }: {
    datasetId: string;
    sampleId: string;
    detail: Pick<SampleDetail, "review_decision" | "review_history">;
    onChanged(): void;
}): React.JSX.Element;
//# sourceMappingURL=HumanReviewForm.d.ts.map