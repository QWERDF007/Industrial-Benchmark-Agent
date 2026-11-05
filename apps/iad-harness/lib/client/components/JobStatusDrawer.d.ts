import React from 'react';
import type { JobSnapshot } from '../../shared/contracts.js';
import { type JobDetailProps } from './JobDetail.js';
export declare function JobStatusButton({ job, onClick, children }: {
    job: JobSnapshot;
    onClick(): void;
    children?: React.ReactNode;
}): React.JSX.Element;
export declare function JobStatusDrawer({ job, onClose, onChanged, stale, lastSyncedAt }: {
    onClose(): void;
} & Pick<JobDetailProps, 'job' | 'onChanged' | 'stale' | 'lastSyncedAt'>): React.JSX.Element;
//# sourceMappingURL=JobStatusDrawer.d.ts.map