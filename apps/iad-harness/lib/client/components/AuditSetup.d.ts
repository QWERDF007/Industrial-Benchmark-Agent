import React from "react";
import type { JobSnapshot, Dataset, Filters } from "../../shared/contracts.js";
export interface AuditSetupProps {
    dataset: Dataset;
    filters: Filters;
    jobs: JobSnapshot[];
    revision: number;
    onJobsChanged(): void;
    onStarted?(job: JobSnapshot): void;
}
export declare function AuditSetup({ dataset, filters, jobs, revision, onJobsChanged, onStarted }: AuditSetupProps): React.JSX.Element;
//# sourceMappingURL=AuditSetup.d.ts.map