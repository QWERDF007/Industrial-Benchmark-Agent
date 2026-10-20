import React from "react";
import type { JobSnapshot, Dataset, ReviewDecisionRecord } from "../../shared/contracts.js";
import type { SampleNavigation } from "../useSampleNavigation.js";
export declare function SampleInspector({ dataset, sampleId, mode, revision, onChanged, onReviewed, jobs, onJobsChanged, navigation }: {
    navigation?: SampleNavigation;
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