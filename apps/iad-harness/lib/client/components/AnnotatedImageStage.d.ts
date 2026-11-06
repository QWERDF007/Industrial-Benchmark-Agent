import React from "react";
import { type ImageBoxAnnotation, type AnnotationLayerSource } from "./AnnotationLayer.js";
import type { ImageQualityLabel } from '../dataset-image-annotations.js';
export interface AnnotatedImageStageProps {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
    bboxes?: ImageBoxAnnotation[];
    annotationLayer?: AnnotationLayerSource | null;
    qualityLabel?: ImageQualityLabel;
    showAnnotations?: boolean;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    onLoadDimensions?: (dimensions: {
        naturalWidth: number;
        naturalHeight: number;
    }) => void;
}
/**
 * Unified Annotated Image Stage.
 * Single Source of Truth for rendering an image with bounding box annotations and category badges.
 * Automatically respects the natural aspect ratio of the image, preventing distortion and coordinate shift.
 */
export declare function AnnotatedImageStage({ src, alt, width, height, bboxes, annotationLayer, qualityLabel, showAnnotations, className, style, children, onLoadDimensions, }: AnnotatedImageStageProps): React.JSX.Element;
//# sourceMappingURL=AnnotatedImageStage.d.ts.map