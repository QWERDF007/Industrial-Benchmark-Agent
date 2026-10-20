import { type PageId, type Workspace } from "./workspace.js";
/** One plugin-level observer; labels are projections of persisted dataset and job records. */
export declare class SidebarProgress {
    private readonly workspace;
    constructor(workspace: Workspace);
    connect(present: (page: PageId, label: string) => void): () => void;
}
//# sourceMappingURL=sidebar-progress.d.ts.map