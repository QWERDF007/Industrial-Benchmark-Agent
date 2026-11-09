import type { ConsistencyResult, Filters, InspectionReference } from "../shared/contracts.js";
import { type ImageView, type InspectionSelection, type InspectionTransform, type InspectionView } from "./inspection.js";
import type { WorkbenchSession } from "./workbench-session.js";
import { type ConsistencyLocation, type PageId, type WorkbenchLocation } from "../shared/navigation.js";
import { type KnowledgeStatusFilter } from "../shared/knowledge-presentation.js";
export { pages, type PageId } from "../shared/navigation.js";
interface ViewState {
    explorationPrompt: import("../shared/domain.generated.js").FrozenExplorationPrompt | null;
    explorationPromptBase: string;
    datasetSettingsTab: "directories" | "basic";
    checkId: string;
    explorationVersion: string;
    explorationNormalCount: string;
    explorationDefectCount: string;
    explorationNormalImages: string[];
    explorationDefectImages: string[];
    explorationObjective: string;
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
    normalVersion: string;
    defectVersion: string;
    job: string;
    historyPage: number;
    historySearch: string;
    historySampleId: string;
    knowledgeSearch: string;
    knowledgeStatus: KnowledgeStatusFilter;
    inspection: InspectionView | null;
}
interface WorkspaceState {
    consistency: Omit<ConsistencyLocation, 'pageId'>;
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
    private leaveGuards;
    registerLeaveGuard(guard: () => boolean): () => void;
    private canLeave;
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
    view(page: PageId, datasetId?: string): {
        explorationPrompt: import("../shared/domain.generated.js").FrozenExplorationPrompt | null;
        explorationPromptBase: string;
        datasetSettingsTab: "directories" | "basic";
        checkId: string;
        explorationVersion: string;
        explorationNormalCount: string;
        explorationDefectCount: string;
        explorationNormalImages: string[];
        explorationDefectImages: string[];
        explorationObjective: string;
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
        normalVersion: string;
        defectVersion: string;
        job: string;
        historyPage: number;
        historySearch: string;
        historySampleId: string;
        knowledgeSearch: string;
        knowledgeStatus: KnowledgeStatusFilter;
        inspection: InspectionView | null;
    };
    private viewKey;
    connect(layout: Layout): () => void;
    navigate(pageId: PageId, selected?: string): void;
    updateConsistency(patch: Partial<WorkspaceState['consistency']>, replace?: boolean): void;
    openLocation(location: WorkbenchLocation): void;
    forgetDataset(datasetId: string): void;
    selectDataset(datasetId: string, replace?: boolean): void;
    updateView(page: PageId, patch: Partial<ViewState>, replace?: boolean): void;
    ask(reference: InspectionReference, selection: InspectionSelection | null, transform: InspectionTransform, question: string): Promise<void>;
    openSession(sessionId: string): Promise<void>;
    explainConsistency(result: Pick<ConsistencyResult, 'evidence_id' | 'result_id'>): Promise<void>;
    private commit;
    private restore;
}
export declare const WorkspaceContext: import("react").Context<Workspace | null>;
export declare function useWorkspace(): {
    workspace: Workspace;
    state: WorkspaceState;
};
//# sourceMappingURL=workspace.d.ts.map