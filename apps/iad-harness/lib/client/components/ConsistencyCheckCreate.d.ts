import React from 'react';
import type { DatasetCatalog, JobSnapshot } from '../../shared/contracts.js';
export declare function ConsistencyCheckCreate({ datasets, groups, parentId, datasetIds, onCancel, onStarted }: DatasetCatalog & {
    parentId: string;
    datasetIds: string[];
    onCancel(): void;
    onStarted(job: JobSnapshot, parentId: string, datasetIds: string[]): void;
}): React.JSX.Element;
//# sourceMappingURL=ConsistencyCheckCreate.d.ts.map