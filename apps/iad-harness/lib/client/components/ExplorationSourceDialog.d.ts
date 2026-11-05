import React from 'react';
import type { ExplorationCandidate } from '../exploration-view.js';
export declare function ExplorationSourceDialog({ kind, candidates, selected, loading, onChange, onClose }: {
    kind: ExplorationCandidate['kind'];
    candidates: ExplorationCandidate[];
    selected: string[];
    loading: boolean;
    onChange(ids: string[]): void;
    onClose(): void;
}): React.JSX.Element;
//# sourceMappingURL=ExplorationSourceDialog.d.ts.map