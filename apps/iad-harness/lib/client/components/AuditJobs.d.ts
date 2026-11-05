import React from 'react';
import type { Dataset, JobSnapshot } from '../../shared/contracts.js';
import type { useAuditJobSelection } from '../useAuditJobSelection.js';
export declare function AuditJobs({ selection, datasets, onDetails }: {
    selection: ReturnType<typeof useAuditJobSelection>;
    datasets: Dataset[];
    onDetails(job: JobSnapshot): void;
}): React.JSX.Element;
//# sourceMappingURL=AuditJobs.d.ts.map