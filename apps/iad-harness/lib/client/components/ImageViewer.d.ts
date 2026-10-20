import React from "react";
import type { SampleDetail } from "../../shared/contracts.js";
type Annotation = SampleDetail["annotations"][number];
export interface ImageSource {
    src: string;
    title: string;
    width?: number;
    height?: number;
    annotations?: Annotation[];
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