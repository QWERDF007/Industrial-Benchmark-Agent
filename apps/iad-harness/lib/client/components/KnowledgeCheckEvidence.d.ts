import React from 'react';
import type { KnowledgeCheckEvidencePage, KnowledgeDetailQuery, KnowledgeEvidence } from '../../shared/domain.generated.js';
export declare function KnowledgeCheckEvidence({ versionId, checkId, role, active, onOpen, onLoaded }: {
    versionId: string;
    checkId: string;
    role: NonNullable<KnowledgeDetailQuery['evidence_role']>;
    active: boolean;
    onOpen(item: KnowledgeEvidence): void;
    onLoaded?(detail: KnowledgeCheckEvidencePage): void;
}): React.JSX.Element;
//# sourceMappingURL=KnowledgeCheckEvidence.d.ts.map