import React from 'react';
import { type ConsistencyComparisonItem } from '../consistency-view.js';
interface ConsistencyConflictDialogProps {
    conflict: ConsistencyComparisonItem;
    items: ConsistencyComparisonItem[];
    onSelect(id: string): void;
    onClose(): void;
    onReviewed(): void;
}
export declare function ConsistencyConflictDialog({ conflict: currentConflict, items: visibleConflicts, onSelect, onClose, onReviewed }: ConsistencyConflictDialogProps): React.JSX.Element;
export {};
//# sourceMappingURL=ConsistencyConflictDialog.d.ts.map