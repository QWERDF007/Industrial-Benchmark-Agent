import type { ImageQualityLabel } from '../dataset-image-annotations.js';
import React from "react";
import { type AnnotationLayerSource, type ImageBoxAnnotation } from './AnnotationLayer.js';
import type { VisualEvidence } from '../../shared/contracts.js';
import type { ImageNavigation } from './ImageCanvas.js';
import type { InspectionTransform } from '../inspection.js';
export type FullscreenViewerAnnotation = ImageBoxAnnotation;
export interface FullscreenViewerItem {
    qualityLabel?: ImageQualityLabel;
    sampleId?: string;
    evidence?: VisualEvidence;
    annotationLayer?: AnnotationLayerSource | null;
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
    navigation?: ImageNavigation;
    context?: React.ReactNode;
    overlay?: React.ReactNode;
    initialTransform?: InspectionTransform;
    onTransform?(value: InspectionTransform): void;
    onImageClick?(point: [number, number]): void;
}
/**
 * Reusable full-dialog image viewer.
 * Provides pan, zoom, fit to window, annotation overlay toggle, and keyboard navigation.
 * Standardized across Image Browsing and Direction Exploration pages.
 */
export declare function FullscreenViewer({ open, item, items, currentIndex, onClose, onNavigate, navigation, context, overlay, initialTransform, onTransform, onImageClick, }: FullscreenViewerProps): React.JSX.Element | null;
//# sourceMappingURL=FullscreenViewer.d.ts.map