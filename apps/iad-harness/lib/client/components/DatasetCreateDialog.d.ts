import React from 'react';
import type { Dataset, DatasetGroup } from '../../shared/contracts.js';
export declare function DatasetCreateDialog({ groups, parentId, onCreated, onClose }: {
    groups: DatasetGroup[];
    parentId?: string;
    onClose(): void;
    onCreated(value: {
        kind: 'group';
        group: DatasetGroup;
    } | {
        kind: 'child';
        dataset: Dataset;
        groupId: string;
    }): void;
}): React.JSX.Element;
//# sourceMappingURL=DatasetCreateDialog.d.ts.map