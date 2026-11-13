import React from 'react';
import type { GalleryStatistics } from '../../shared/domain.generated.js';
export type ConsistencyStatisticAction = 'stat-category' | 'stat-model' | 'stat-agreement';
export declare function ConsistencyStatisticsDialog({ statistics, onFilter, onClose, loading, error }: {
    statistics?: GalleryStatistics;
    onFilter?(action: ConsistencyStatisticAction, id: string): void;
    onClose(): void;
    loading?: boolean;
    error?: string;
}): React.JSX.Element;
//# sourceMappingURL=ConsistencyStatisticsDialog.d.ts.map