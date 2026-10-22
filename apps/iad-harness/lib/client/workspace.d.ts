import type { Filters, InspectionReference, KnowledgeSnapshot } from "../shared/contracts.js";
import { type ImageView, type InspectionSelection, type InspectionTransform, type InspectionView } from "./inspection.js";
import type { WorkbenchSession } from "./workbench-session.js";
import { type PageId, type WorkbenchLocation } from "../shared/navigation.js";
import { type KnowledgeStatusFilter } from "../shared/knowledge-presentation.js";
export { pages, type PageId } from "../shared/navigation.js";
interface ViewState {
    miningSourceMode: "uncovered" | "all" | "recheck";
    scopeRunId: string;
    scopeSessionId: string;
    miningContinuous: boolean;
    conflictId: string;
    miningCount: string;
    miningImages: string[];
    miningPreset: string;
    miningSearch: string;
    miningPage: number;
    filters: Filters;
    page: number;
    selected: string;
    tab: string;
    version: string;
    model: string;
    normalVersion: string;
    defectVersion: string;
    job: string;
    historyPage: number;
    historySearch: string;
    knowledgeSearch: string;
    knowledgeStatus: KnowledgeStatusFilter;
    inspection: InspectionView | null;
}
type KnowledgeKind = KnowledgeSnapshot["kind"];
interface WorkspaceState {
    knowledgeKind: KnowledgeKind;
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
    constructor(conversation: WorkbenchSession);
    private state;
    private listeners;
    private layout?;
    private imageViews;
    private pagePositions;
    imageView(source: string): ImageView | undefined;
    rememberImageView(source: string, view: ImageView): void;
    pagePosition(source: string): number;
    rememberPagePosition(source: string, top: number): void;
    private defaults;
    getSnapshot: () => WorkspaceState;
    subscribe: (listener: () => void) => () => void;
    view(page: PageId, kind?: import("../shared/domain.generated.js").Kind8): {
        miningSourceMode: "uncovered" | "all" | "recheck";
        scopeRunId: string;
        scopeSessionId: string;
        miningContinuous: boolean;
        conflictId: string;
        miningCount: string;
        miningImages: string[];
        miningPreset: string;
        miningSearch: string;
        miningPage: number;
        filters: Filters;
        page: number;
        selected: string;
        tab: string;
        version: string;
        model: string;
        normalVersion: string;
        defectVersion: string;
        job: string;
        historyPage: number;
        historySearch: string;
        knowledgeSearch: string;
        knowledgeStatus: KnowledgeStatusFilter;
        inspection: InspectionView | null;
    };
    private viewKey;
    selectKnowledgeKind(knowledgeKind: KnowledgeKind): void;
    connect(layout: Layout): () => void;
    navigate(pageId: PageId, selected?: string): void;
    openLocation({ pageId, datasetId, knowledgeKind, ...view }: WorkbenchLocation): void;
    selectDataset(datasetId: string, replace?: boolean): void;
    updateView(page: PageId, patch: Partial<ViewState>, replace?: boolean): void;
    ask(reference: InspectionReference, selection: InspectionSelection | null, transform: InspectionTransform, question: string): Promise<void>;
    mineScope(scopeRunId: string, imageCount: number, images: string[]): Promise<void>;
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