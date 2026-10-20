import React from "react";
import type { JobSnapshot, Dataset, Filters } from "../../shared/contracts.js";
export declare function AuditJobs({ dataset, filters, jobs, revision, onJobsChanged }: {
    dataset: Dataset;
    filters: Filters;
    jobs: JobSnapshot[];
    revision: number;
    onJobsChanged(): void;
}): React.JSX.Element;
export declare function AuditReport({ dataset }: {
    dataset: Dataset;
}): React.JSX.Element;
//# sourceMappingURL=AuditJobs.d.ts.map