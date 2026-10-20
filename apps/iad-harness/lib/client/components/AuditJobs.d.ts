import React from "react";
import type { AuditJob, Dataset, Filters } from "../../shared/contracts.js";
export declare function AuditJobs({ dataset, filters, jobs, onJobsChanged }: {
    dataset: Dataset;
    filters: Filters;
    jobs: AuditJob[];
    onJobsChanged(): void;
}): React.JSX.Element;
export declare function AuditReport({ dataset }: {
    dataset: Dataset;
}): React.JSX.Element;
//# sourceMappingURL=AuditJobs.d.ts.map