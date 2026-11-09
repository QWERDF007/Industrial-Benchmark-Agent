import type { AnalysisPublicationView, AnalysisTarget } from '../shared/domain.generated.js';
import type { DirectionItem } from './components/DirectionDetailDialog.js';
export type ExplorationRole = NonNullable<AnalysisTarget['candidate_role']>;
export interface ExplorationCandidate {
    id: string;
    filename: string;
    url: string;
    datasetId: string;
}
export declare function explorationCandidates(datasetIds: string[], signal?: AbortSignal): Promise<ExplorationCandidate[]>;
export declare function explorationDirections(publication: AnalysisPublicationView | null | undefined, referencedDirectionId?: string): DirectionItem[];
//# sourceMappingURL=exploration-view.d.ts.map