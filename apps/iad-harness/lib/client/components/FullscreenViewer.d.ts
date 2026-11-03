import React from "react";
export interface FullscreenViewerAnnotation {
    annotation_id?: string;
    raw_label: string;
    bbox?: number[] | null;
}
export interface FullscreenViewerItem {
    id: string;
    title: string;
    imageUrl: string;
    width?: number;
    height?: number;
    bboxes?: FullscreenViewerAnnotation[];
}
export interface FullscreenViewerProps {
    open: boolean;
    item: FullscreenViewerItem | null;
    items?: FullscreenViewerItem[];
    currentIndex?: number;
    onClose: () => void;
    onNavigate?: (index: number) => void;
}
/**
 * Reusable full-dialog image viewer.
 * Provides pan, zoom, fit to window, annotation overlay toggle, and keyboard navigation.
 * Standardized across Image Browsing and Direction Exploration pages.
 */
export declare function FullscreenViewer({ open, item, items, currentIndex, onClose, onNavigate, }: FullscreenViewerProps): React.JSX.Element | null;
//# sourceMappingURL=FullscreenViewer.d.ts.map