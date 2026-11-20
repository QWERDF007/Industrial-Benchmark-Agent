import React from 'react';
import type { AuditSampleItem } from '../../shared/domain.generated.js';
import type { ImageNavigation } from './ImageViewer.js';
export declare function AuditSampleDialog({ sample, taskId, imageIndex, onImageIndexChange, navigation, onClose }: {
    sample: AuditSampleItem;
    taskId: string;
    imageIndex: number | null;
    onImageIndexChange(index: number | null): void;
    navigation: ImageNavigation;
    onClose(): void;
}): React.JSX.Element;
//# sourceMappingURL=AuditSampleDialog.d.ts.map