import React from "react";
import type { JobSnapshot } from "../../shared/contracts.js";
export interface JobDetailProps {
    job: JobSnapshot;
    onChanged(): void;
    stale?: boolean;
    lastSyncedAt?: number | null;
    presentation?: 'inline' | 'drawer';
    onClose?(): void;
}
export declare function JobDetail({ job, onChanged, stale, lastSyncedAt, onClose, presentation }: JobDetailProps): React.JSX.Element;
//# sourceMappingURL=JobDetail.d.ts.map