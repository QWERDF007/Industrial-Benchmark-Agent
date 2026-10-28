import React from "react";
import type { JobSnapshot } from "../../shared/contracts.js";
import { type PageId } from "../workspace.js";
export declare function JobTable({ jobs, pageId, onChanged, stale, lastSyncedAt, onCopy, }: {
    jobs: JobSnapshot[];
    pageId: PageId;
    onChanged(): void;
    stale?: boolean;
    lastSyncedAt?: number | null;
    onCopy?(job: JobSnapshot): void;
}): React.JSX.Element;
//# sourceMappingURL=JobTable.d.ts.map