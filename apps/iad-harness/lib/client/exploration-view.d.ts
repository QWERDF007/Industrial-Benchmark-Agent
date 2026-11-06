import type { ExplorationSnapshot } from '../shared/domain.generated.js';
import type { DirectionItem } from './components/DirectionDetailDialog.js';
export interface ExplorationCandidate {
    id: string;
    filename: string;
    url: string;
    kind: 'normal' | 'defect';
    datasetId: string;
}
export declare function explorationCandidates(datasetIds: string[], signal?: AbortSignal): Promise<ExplorationCandidate[]>;
export declare function activeExplorationDirections(snapshot: ExplorationSnapshot | null, removedIds?: readonly string[]): import("../shared/domain.generated.js").ExploredDirection[];
export declare function explorationDirections(snapshots: ExplorationSnapshot[], removedIds?: readonly string[]): DirectionItem[];
//# sourceMappingURL=exploration-view.d.ts.map