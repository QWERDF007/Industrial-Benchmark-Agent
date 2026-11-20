import React from 'react';
import { type ImageNavigation, type ImageSource } from './ImageViewer.js';
export declare function ImageGalleryViewer({ images, current, onChange, navigation }: {
    images: readonly ImageSource[];
    current: number | null;
    onChange(index: number | null): void;
    navigation?: ImageNavigation;
}): React.JSX.Element | null;
//# sourceMappingURL=ImageGalleryViewer.d.ts.map