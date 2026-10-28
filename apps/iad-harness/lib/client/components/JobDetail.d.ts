import React from "react";
import type { JobSnapshot } from "../../shared/contracts.js";
export declare function JobDetail({ job, onChanged, stale, lastSyncedAt, onCopy }: {
    job: JobSnapshot;
    onChanged(): void;
    stale?: boolean;
    lastSyncedAt?: number | null;
    onCopy?(job: JobSnapshot): void;
}): React.JSX.Element;
//# sourceMappingURL=JobDetail.d.ts.map