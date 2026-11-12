import type { AnalysisPublicationView, AnalysisCurrentResultView, KnowledgeCheckEvidencePage } from '../shared/domain.generated.js';
export type AnalysisReadSource = {
    kind: 'published';
    versionId: string;
} | {
    kind: 'current';
    view: AnalysisCurrentResultView;
};
export declare function analysisReadSource(view: AnalysisCurrentResultView | AnalysisPublicationView): AnalysisReadSource;
export declare function analysisReadPath(source: AnalysisReadSource): string;
export declare function analysisImageUrl(source: AnalysisReadSource, evidenceId: string): string;
export declare function currentKnowledgeDetail(view: AnalysisCurrentResultView, checkId: string, role: 'support' | 'counter', page: number, size: number): KnowledgeCheckEvidencePage;
//# sourceMappingURL=analysis-results.d.ts.map