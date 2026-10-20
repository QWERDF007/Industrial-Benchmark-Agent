import React from "react";
import type { JobSnapshot, Dataset, Filters } from "../../shared/contracts.js";
export interface AuditSetupProps {
    dataset: Dataset;
    filters: Filters;
    jobs: JobSnapshot[];
    revision: number;
    onJobsChanged(): void;
}
export declare function AuditSetup({ dataset, filters, jobs, revision, onJobsChanged, compact }: AuditSetupProps & {
    compact?: boolean;
}): React.JSX.Element;
//# sourceMappingURL=AuditSetup.d.ts.map