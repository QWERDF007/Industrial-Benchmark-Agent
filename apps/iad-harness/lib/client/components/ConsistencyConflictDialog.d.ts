import React from 'react';
import { type ConflictCardItem } from '../consistency-view.js';
interface ConsistencyConflictDialogProps {
    conflict: ConflictCardItem;
    items: ConflictCardItem[];
    queryId: string;
    onSelect(id: string): void;
    onClose(): void;
    onReviewed(): void;
}
export declare function ConsistencyConflictDialog({ conflict: currentConflict, items: visibleConflicts, queryId: activeQueryId, onSelect, onClose, onReviewed }: ConsistencyConflictDialogProps): React.JSX.Element;
export {};
//# sourceMappingURL=ConsistencyConflictDialog.d.ts.map