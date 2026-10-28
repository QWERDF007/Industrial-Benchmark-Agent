import React from 'react';
import type { Dataset, RetrievalMember, RetrievalPage } from '../../shared/contracts.js';
export declare function ConsistencyCandidates({ groups, selected, datasets, onSelect, onCompare }: {
    groups: RetrievalPage['exact']['groups'];
    selected: RetrievalMember | undefined;
    datasets: Dataset[];
    onSelect(groupId: string, memberId: string): void;
    onCompare(trigger: HTMLButtonElement): void;
}): React.JSX.Element;
//# sourceMappingURL=ConsistencyCandidates.d.ts.map