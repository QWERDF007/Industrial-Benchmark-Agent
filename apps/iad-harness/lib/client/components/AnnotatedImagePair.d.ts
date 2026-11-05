import React from 'react';
import { type ImageSource } from './ImageCanvas.js';
export declare function AnnotatedImagePair({ sources, labels, synchronized, focusRegion, overlays, onExpand }: {
    sources: readonly [ImageSource | null, ImageSource | null];
    labels: [string, string];
    synchronized?: boolean;
    focusRegion?: {
        id: string;
        bbox: number[];
    };
    overlays?: [React.ReactNode, React.ReactNode];
    onExpand?(image: ImageSource): void;
}): React.JSX.Element;
//# sourceMappingURL=AnnotatedImagePair.d.ts.map