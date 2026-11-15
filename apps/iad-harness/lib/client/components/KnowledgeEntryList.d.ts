import React from 'react';
import type { KnowledgeCheckSummary } from '../../shared/domain.generated.js';
import type { AnalysisReadSource } from '../analysis-results.js';
import type { RowSelection } from '../row-selection.js';
export declare function KnowledgeEntryList({ source, revision, actions, selection, headerActions, children }: {
    source: AnalysisReadSource | null;
    revision?: number;
    selection?: RowSelection;
    headerActions?: React.ReactNode;
    children?: React.ReactNode;
    actions: {
        view(entry: KnowledgeCheckSummary): void;
        remove?: {
            enabled: boolean;
            run(entry: KnowledgeCheckSummary): void;
        };
    };
}): React.JSX.Element;
//# sourceMappingURL=KnowledgeEntryList.d.ts.map