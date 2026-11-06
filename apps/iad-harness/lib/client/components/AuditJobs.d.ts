import React from 'react';
import type { Dataset, JobSnapshot } from '../../shared/contracts.js';
import type { useAuditJobSelection } from '../useAuditJobSelection.js';
export declare function AuditJobs({ selection, datasets, onDetails, loading }: {
    selection: ReturnType<typeof useAuditJobSelection>;
    datasets: Dataset[];
    loading?: boolean;
    onDetails(job: JobSnapshot): void;
}): React.JSX.Element;
//# sourceMappingURL=AuditJobs.d.ts.map