import type { Filters, InspectionReference } from "../shared/contracts.js";
import { type InspectionSelection, type InspectionTransform, type InspectionView } from "./inspection.js";
import type { InspectionSession } from "./inspection-session.js";
import { type PageId, type WorkbenchLocation } from "../shared/navigation.js";
export { pages, type PageId } from "../shared/navigation.js";
interface ViewState {
    filters: Filters;
    page: number;
    selected: string;
    tab: string;
    version: string;
    normalVersion: string;
    job: string;
    historyPage: number;
    historySearch: string;
    inspection: InspectionView | null;
}
interface WorkspaceState {
    active: boolean;
    pageId: PageId;
    datasetId: string;
    views: Record<string, ViewState>;
}
interface Layout {
    selectPanel(id: string | null): void;
    panelInfo: {
        getSnapshot(): {
            activePanelId: string | null;
        };
        subscribe(listener: () => void): () => void;
    };
}
/** One navigation owner per plugin instance; URLs contain identifiers and filters only. */
export declare class Workspace {
    private readonly conversation;
    constructor(conversation: InspectionSession);
    private state;
    private listeners;
    private layout?;
    private defaults;
    getSnapshot: () => WorkspaceState;
    subscribe: (listener: () => void) => () => void;
    view(page: PageId): {
        filters: Filters;
        page: number;
        selected: string;
        tab: string;
        version: string;
        normalVersion: string;
        job: string;
        historyPage: number;
        historySearch: string;
        inspection: InspectionView | null;
    };
    connect(layout: Layout): () => void;
    navigate(pageId: PageId, selected?: string): void;
    openLocation({ pageId, datasetId, ...view }: WorkbenchLocation): void;
    selectDataset(datasetId: string, replace?: boolean): void;
    updateView(page: PageId, patch: Partial<ViewState>, replace?: boolean): void;
    ask(reference: InspectionReference, selection: InspectionSelection | null, transform: InspectionTransform, question: string): Promise<void>;
    openSession(sessionId: string): Promise<void>;
    private commit;
    private restore;
}
export declare const WorkspaceContext: import("react").Context<Workspace | null>;
export declare function useWorkspace(): {
    workspace: Workspace;
    state: WorkspaceState;
};
//# sourceMappingURL=workspace.d.ts.map