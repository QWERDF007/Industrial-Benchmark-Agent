import React from 'react';
import type { RetrievalMember } from '../../shared/contracts.js';
export declare function ConsistencyDifferences({ member, differenceId, onDifference, anchorSide }: {
    member: RetrievalMember;
    differenceId?: string;
    onDifference(id: string): void;
    anchorSide?: 'left' | 'right';
}): React.JSX.Element;
//# sourceMappingURL=ConsistencyDifferences.d.ts.map