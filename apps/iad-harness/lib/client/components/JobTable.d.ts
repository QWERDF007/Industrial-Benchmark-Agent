import React from "react";
import type { JobSnapshot } from "../../shared/contracts.js";
import { type PageId } from "../workspace.js";
export declare function JobTable({ jobs, pageId, onChanged }: {
    jobs: JobSnapshot[];
    pageId: PageId;
    onChanged(): void;
}): React.JSX.Element;
//# sourceMappingURL=JobTable.d.ts.map