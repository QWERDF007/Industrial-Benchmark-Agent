import React from "react";
import { type AnnotationLayerSource } from "./AnnotationLayer.js";
import { type InspectionContext, type InspectionSelection, type InspectionTransform } from "../inspection.js";
export interface ImageSource {
    src: string;
    title: string;
    width?: number;
    height?: number;
    annotationLayer?: AnnotationLayerSource;
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
type ImageViewerProps = {
    image: ImageSource;
    onClose(): void;
    navigation?: ImageNavigation;
};
export declare function AnnotatedImage({ image, visible, onLoad }: {
    image: ImageSource;
    visible?: boolean;
    onLoad?: React.ReactEventHandler<HTMLImageElement>;
}): React.JSX.Element;
export declare function ImageViewer({ image, onClose, navigation }: ImageViewerProps): React.JSX.Element;
export {};
//# sourceMappingURL=ImageViewer.d.ts.map