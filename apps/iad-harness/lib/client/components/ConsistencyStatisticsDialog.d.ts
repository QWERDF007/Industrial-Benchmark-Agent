import React from 'react';
import type { ConflictCardItem } from '../consistency-view.js';
export type ConsistencyStatisticAction = 'stat-category' | 'stat-model' | 'stat-agreement';
type FilterStatistics = (action: ConsistencyStatisticAction, id: string) => void;
export declare function ConsistencyStatisticsDialog({ items, onFilter, onClose, loading, error }: {
    items: ConflictCardItem[];
    onFilter?: FilterStatistics;
    onClose(): void;
    loading?: boolean;
    error?: string;
}): React.JSX.Element;
export {};
//# sourceMappingURL=ConsistencyStatisticsDialog.d.ts.map