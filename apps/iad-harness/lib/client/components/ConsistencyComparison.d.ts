import React from 'react';
import type { EvidenceBundle, RetrievalMember, SampleDetail } from '../../shared/contracts.js';
export declare function ConsistencyComparison({ member, query, temporary, differenceId, onDifference, frozen }: {
    member: RetrievalMember;
    query: SampleDetail | null;
    temporary: {
        preview: string;
        name: string;
    } | null;
    differenceId?: string;
    onDifference(id: string): void;
    frozen?: EvidenceBundle;
}): React.JSX.Element;
//# sourceMappingURL=ConsistencyComparison.d.ts.map