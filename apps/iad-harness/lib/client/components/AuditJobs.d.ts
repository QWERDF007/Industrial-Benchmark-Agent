import React from 'react';
import type { Dataset, JobSnapshot } from '../../shared/contracts.js';
import type { useAuditJobSelection } from '../useAuditJobSelection.js';
export declare function AuditJobs({ selection, datasets, onDetails, onPrompt, onDelete, loading }: {
    selection: ReturnType<typeof useAuditJobSelection>;
    datasets: Dataset[];
    loading?: boolean;
    onDetails(job: JobSnapshot): void;
    onPrompt(job: JobSnapshot): void;
    onDelete(job: JobSnapshot): Promise<void>;
}): React.JSX.Element;
//# sourceMappingURL=AuditJobs.d.ts.map