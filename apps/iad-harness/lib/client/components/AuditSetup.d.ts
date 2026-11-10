import React from 'react';
import type { Dataset, JobSnapshot } from '../../shared/contracts.js';
export declare function AuditSetup({ datasets, jobs, revision, onStarted, onCancel, onBusyChange }: {
    datasets: Dataset[];
    jobs: JobSnapshot[];
    revision: number;
    onStarted(jobs: JobSnapshot[]): void;
    onCancel(): void;
    onBusyChange(busy: boolean): void;
}): React.JSX.Element;
//# sourceMappingURL=AuditSetup.d.ts.map