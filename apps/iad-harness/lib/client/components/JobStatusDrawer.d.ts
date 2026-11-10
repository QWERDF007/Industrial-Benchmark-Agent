import React from 'react';
import type { JobSnapshot } from '../../shared/contracts.js';
export declare function JobStatusButton({ job, onClick, children }: {
    job: JobSnapshot;
    onClick(): void;
    children?: React.ReactNode;
}): React.JSX.Element;
export declare function JobStatusAction({ job, onClick }: {
    job: JobSnapshot;
    onClick(): void;
}): React.JSX.Element;
export declare function JobStatusDrawer({ job, onClose, stale }: {
    job: JobSnapshot;
    onClose(): void;
    stale?: boolean;
}): React.JSX.Element;
//# sourceMappingURL=JobStatusDrawer.d.ts.map