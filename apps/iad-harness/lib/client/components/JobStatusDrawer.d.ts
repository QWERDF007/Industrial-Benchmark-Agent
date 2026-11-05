import React from 'react';
import type { JobSnapshot } from '../../shared/contracts.js';
export declare function JobStatusButton({ job, onClick, children }: {
    job: JobSnapshot;
    onClick(): void;
    children?: React.ReactNode;
}): React.JSX.Element;
export declare function JobStatusDrawer({ job, onClose, onChanged, stale, lastSyncedAt }: {
    job: JobSnapshot;
    onClose(): void;
    onChanged(): void;
    stale?: boolean;
    lastSyncedAt?: number | null;
}): React.JSX.Element;
//# sourceMappingURL=JobStatusDrawer.d.ts.map