import React from 'react';
import type { Dataset } from '../../shared/contracts.js';
import type { ExplorationCandidate, ExplorationRole } from '../exploration-view.js';
export declare function ExplorationSourceDialog({ kind, datasets, candidates, selected, loading, onChange, onClose }: {
    kind: ExplorationRole;
    datasets: Dataset[];
    candidates: ExplorationCandidate[];
    selected: string[];
    loading: boolean;
    onChange(ids: string[]): void;
    onClose(): void;
}): React.JSX.Element;
//# sourceMappingURL=ExplorationSourceDialog.d.ts.map