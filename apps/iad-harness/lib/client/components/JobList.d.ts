import React from 'react';
import type { Dataset, JobSnapshot } from '../../shared/contracts.js';
import type { useJobList } from '../useJobList.js';
import { type IconName } from './IconButton.js';
export interface JobListActions {
    status(job: JobSnapshot): void;
    prompt(job: JobSnapshot): void;
    delete(job: JobSnapshot): Promise<void>;
    additional?: {
        id: string;
        label: string;
        icon: IconName;
        onClick(job: JobSnapshot): void;
    }[];
}
export declare function JobList({ title, list, datasets, actions, loading, className }: {
    title: string;
    list: ReturnType<typeof useJobList>;
    datasets: Dataset[];
    actions: JobListActions;
    loading?: boolean;
    className?: string;
}): React.JSX.Element;
//# sourceMappingURL=JobList.d.ts.map