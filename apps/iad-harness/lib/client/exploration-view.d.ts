import type { AnalysisPublicationView, AnalysisResultView, AnalysisCurrentResultView, AnalysisSource, AnalysisTarget } from '../shared/domain.generated.js';
import type { DirectionItem } from './components/DirectionDetailDialog.js';
export declare class ExplorationNarrative {
    private readonly names;
    private readonly pattern;
    constructor(publication: AnalysisResultView | AnalysisPublicationView, datasetNames?: Record<string, string>);
    text(value: string): string;
}
export type ExplorationRole = NonNullable<AnalysisTarget['candidate_role']>;
export interface ExplorationCandidate extends Pick<AnalysisSource, 'candidate_role' | 'annotation_categories'> {
    id: string;
    filename: string;
    url: string;
    datasetId: string;
}
export declare function explorationCandidates(datasetIds: string[], signal?: AbortSignal): Promise<ExplorationCandidate[]>;
export declare function explorationDirections(publication: AnalysisCurrentResultView | AnalysisPublicationView | null | undefined, referencedDirectionId?: string, datasetNames?: Record<string, string>): DirectionItem[];
//# sourceMappingURL=exploration-view.d.ts.map