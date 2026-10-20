import React from "react";
import type { JobSnapshot, Dataset, ReviewDecisionRecord } from "../../shared/contracts.js";
export declare function SampleInspector({ dataset, sampleId, mode, revision, onChanged, onReviewed, jobs, onJobsChanged }: {
    jobs: JobSnapshot[];
    onJobsChanged(): void;
    dataset: Dataset;
    sampleId: string;
    mode: "model" | "review" | "browse" | "dataset";
    revision: number;
    onChanged(): void;
    onReviewed(record: ReviewDecisionRecord, relativePath: string): void;
}): React.JSX.Element;
//# sourceMappingURL=SampleInspector.d.ts.map