import React from 'react';
import type { ExplorationCandidate, ExplorationRole } from '../exploration-view.js';
export declare function ExplorationSourceDialog({ kind, candidates, selected, loading, onChange, onClose }: {
    kind: ExplorationRole;
    candidates: ExplorationCandidate[];
    selected: string[];
    loading: boolean;
    onChange(ids: string[]): void;
    onClose(): void;
}): React.JSX.Element;
//# sourceMappingURL=ExplorationSourceDialog.d.ts.map