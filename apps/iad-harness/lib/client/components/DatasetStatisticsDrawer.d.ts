import React from 'react';
export interface DatasetStatisticsTarget {
    kind: 'group' | 'dataset';
    id: string;
    name: string;
}
export declare function DatasetStatisticsDrawer({ target, onClose }: {
    target: DatasetStatisticsTarget;
    onClose(): void;
}): React.JSX.Element;
//# sourceMappingURL=DatasetStatisticsDrawer.d.ts.map