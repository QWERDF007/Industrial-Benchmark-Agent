import React from 'react';
import type { KnowledgeCheckEvidencePage, KnowledgeDetailQuery, KnowledgeEvidence } from '../../shared/domain.generated.js';
import { type AnalysisReadSource } from '../analysis-results.js';
export declare function KnowledgeCheckEvidence({ source, checkId, role, active, onOpen, onLoaded }: {
    source: AnalysisReadSource;
    checkId: string;
    role: NonNullable<KnowledgeDetailQuery['evidence_role']>;
    active: boolean;
    onOpen(item: KnowledgeEvidence): void;
    onLoaded?(detail: KnowledgeCheckEvidencePage): void;
}): React.JSX.Element;
//# sourceMappingURL=KnowledgeCheckEvidence.d.ts.map