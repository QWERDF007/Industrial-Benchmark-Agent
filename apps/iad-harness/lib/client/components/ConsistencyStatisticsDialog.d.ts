import React from 'react';
import type { ConflictCardItem } from '../consistency-view.js';
export type ConsistencyStatisticAction = 'stat-category' | 'stat-model' | 'stat-agreement';
export declare function ConsistencyStatisticsDialog({ items, onFilter, onClose }: {
    items: ConflictCardItem[];
    onFilter(action: ConsistencyStatisticAction, id: string): void;
    onClose(): void;
}): React.JSX.Element;
//# sourceMappingURL=ConsistencyStatisticsDialog.d.ts.map