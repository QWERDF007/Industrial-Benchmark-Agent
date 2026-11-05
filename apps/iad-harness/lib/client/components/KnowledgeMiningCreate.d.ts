import React from 'react';
import type { Dataset, DatasetGroup, JobSnapshot } from '../../shared/contracts.js';
export declare function KnowledgeMiningCreate({ dataset, datasets, groups, selectedParentId, selectedChildId, onClose, onStarted }: {
    dataset: Dataset;
    datasets: Dataset[];
    groups: DatasetGroup[];
    selectedParentId: string;
    selectedChildId: string;
    onClose(): void;
    onStarted(jobs: JobSnapshot[]): void;
}): React.JSX.Element;
//# sourceMappingURL=KnowledgeMiningCreate.d.ts.map