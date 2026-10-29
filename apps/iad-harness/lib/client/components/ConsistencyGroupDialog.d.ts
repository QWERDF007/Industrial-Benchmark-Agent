import React from 'react';
import type { GalleryItem } from '../../shared/domain.generated.js';
export declare function ConsistencyGroupDialog({ queryId, kind, item, position, total, onMove, onClose, onExpired, restoreFocus }: {
    queryId: string;
    kind: 'conflicts' | 'groups';
    item: GalleryItem;
    position: number;
    total: number;
    onMove(offset: -1 | 1): void;
    onClose(): void;
    onExpired(): void;
    restoreFocus(): HTMLElement | null;
}): React.JSX.Element;
//# sourceMappingURL=ConsistencyGroupDialog.d.ts.map