import React from "react";
import type { AuditJob, Dataset } from "../../shared/contracts.js";
export declare function SampleInspector({ dataset, sampleId, mode, revision, onChanged, jobs, onJobsChanged }: {
    jobs: AuditJob[];
    onJobsChanged(): void;
    dataset: Dataset;
    sampleId: string;
    mode: "model" | "review" | "browse" | "dataset";
    revision: number;
    onChanged(): void;
}): React.JSX.Element;
//# sourceMappingURL=SampleInspector.d.ts.map