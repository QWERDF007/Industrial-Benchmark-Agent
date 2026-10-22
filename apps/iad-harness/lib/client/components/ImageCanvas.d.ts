import React from "react";
import { type AnnotationLayerSource } from "./AnnotationLayer.js";
import { type ImageView, type InspectionContext, type InspectionSelection, type InspectionTransform } from "../inspection.js";
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
type ImageCanvasProps = {
    image: ImageSource;
    onClose?(): void;
    navigation?: ImageNavigation;
    embedded?: boolean;
    onExpand?(view: ImageView): void;
};
export declare function AnnotatedImage({ image, visible, onLoad }: {
    image: ImageSource;
    visible?: boolean;
    onLoad?: React.ReactEventHandler<HTMLImageElement>;
}): React.JSX.Element;
export declare function ImageCanvas({ image, onClose, navigation, embedded, onExpand }: ImageCanvasProps): React.JSX.Element;
export {};
//# sourceMappingURL=ImageCanvas.d.ts.map