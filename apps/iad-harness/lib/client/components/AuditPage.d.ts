import React from 'react';
import type { Dataset, DatasetGroup } from '../../shared/contracts.js';
export declare function AuditPage({ dataset, datasets, groups, refreshRevision, onDatasetsChanged }: {
    dataset: Dataset;
    datasets: Dataset[];
    groups: DatasetGroup[];
    refreshRevision: number;
    onDatasetsChanged(): void;
}): React.JSX.Element;
//# sourceMappingURL=AuditPage.d.ts.map