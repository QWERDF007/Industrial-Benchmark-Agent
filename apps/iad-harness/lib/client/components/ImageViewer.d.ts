import React from "react";
import type { SampleDetail } from "../../shared/contracts.js";
import { type InspectionContext } from "./InspectionEvidence.js";
type Annotation = SampleDetail["annotations"][number];
export interface ImageSource {
    src: string;
    title: string;
    width?: number;
    height?: number;
    annotations?: Annotation[];
    inspection?: InspectionContext;
    focus?: {
        bbox: number[];
        label: string;
        findingId: string;
    };
}
export declare function AnnotatedImage({ image, visible }: {
    image: ImageSource;
    visible?: boolean;
}): React.JSX.Element;
export declare function ImageViewer({ image, onClose }: {
    image: ImageSource;
    onClose(): void;
}): React.JSX.Element;
export {};
//# sourceMappingURL=ImageViewer.d.ts.map