import React from 'react';
import { type ConsistencyComparisonItem } from '../consistency-view.js';
import type { ImageNavigation } from './ImageViewer.js';
interface ConsistencyConflictDialogProps {
    conflict: ConsistencyComparisonItem;
    items: ConsistencyComparisonItem[];
    onSelect(id: string): void;
    onMove?(offset: -1 | 1): void;
    navigation?: ImageNavigation;
    onClose(): void;
    onReviewed(): void;
}
export declare function ConsistencyConflictDialog(props: ConsistencyConflictDialogProps): React.JSX.Element;
export {};
//# sourceMappingURL=ConsistencyConflictDialog.d.ts.map