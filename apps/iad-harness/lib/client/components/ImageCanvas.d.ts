import type { ImageQualityLabel } from '../dataset-image-annotations.js';
import React from "react";
import { type AnnotationLayerSource } from "./AnnotationLayer.js";
import { type ImageView, type InspectionContext, type InspectionSelection, type InspectionTransform } from "../inspection.js";
import type { VisualEvidence } from '../../shared/contracts.js';
export interface ImageSource {
    qualityLabel?: ImageQualityLabel;
    sampleId?: string;
    evidence?: VisualEvidence;
    src: string;
    title: string;
    caption?: string;
    width?: number;
    height?: number;
    annotationLayer?: AnnotationLayerSource | null;
    inspection?: InspectionContext;
    initialSelection?: InspectionSelection | null;
    initialTransform?: InspectionTransform;
}
export interface ImageNavigation {
    previous: boolean;
    next: boolean;
    busy: boolean;
    error: string;
    move(offset: -1 | 1): void;
}
type ImageCanvasProps = {
    image: ImageSource;
    navigation?: ImageNavigation;
    onExpand?(view: ImageView): void;
    control?: {
        transform: InspectionTransform;
        onChange(transform: React.SetStateAction<InspectionTransform>): void;
    };
    focusRegion?: {
        id: string;
        bbox: number[];
    };
    overlay?: React.ReactNode;
};
export declare function AnnotatedImage({ image, visible, onLoad }: {
    image: ImageSource;
    visible?: boolean;
    onLoad?: React.ReactEventHandler<HTMLImageElement>;
}): React.JSX.Element;
export declare function ImageCanvas({ image, navigation, onExpand, control, focusRegion, overlay }: ImageCanvasProps): React.JSX.Element;
export {};
//# sourceMappingURL=ImageCanvas.d.ts.map