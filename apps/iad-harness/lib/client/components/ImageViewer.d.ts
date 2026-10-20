import React from "react";
import { type AnnotationLayerSource } from "./AnnotationLayer.js";
import { type InspectionContext } from "./InspectionEvidence.js";
export interface ImageSource {
    src: string;
    title: string;
    width?: number;
    height?: number;
    annotationLayer?: AnnotationLayerSource;
    inspection?: InspectionContext;
    focus?: {
        bbox: number[];
        label: string;
        findingId: string;
    };
}
export declare function AnnotatedImage({ image, visible, onLoad }: {
    image: ImageSource;
    visible?: boolean;
    onLoad?: React.ReactEventHandler<HTMLImageElement>;
}): React.JSX.Element;
export declare function ImageViewer({ image, onClose }: {
    image: ImageSource;
    onClose(): void;
}): React.JSX.Element;
//# sourceMappingURL=ImageViewer.d.ts.map