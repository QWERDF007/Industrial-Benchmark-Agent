import React from 'react';
import type { AnnotationDifference } from '../../shared/domain.generated.js';
import { type ImageSource } from './ImageCanvas.js';
export declare function ConsistencyCanvasPair({ sources, selected, synchronized, showDifferences, onExpand, anchorSide, labels }: {
    sources: readonly [ImageSource | null, ImageSource | null];
    selected?: AnnotationDifference;
    synchronized?: boolean;
    showDifferences?: boolean;
    onExpand?(image: ImageSource): void;
    anchorSide?: 'left' | 'right';
    labels?: [string, string];
}): React.JSX.Element;
//# sourceMappingURL=ConsistencyCanvasPair.d.ts.map