import React from "react";
import type { VisualEvidence } from "../../shared/domain.generated.js";
import type { ImageNavigation, ImageSource } from "./ImageCanvas.js";
export { AnnotatedImage } from "./ImageCanvas.js";
export type { ImageSource, ImageNavigation } from "./ImageCanvas.js";
export interface EvidenceCollection {
    title: string;
    instruction: string;
    index: number;
    images: {
        image: ImageSource;
        label: string;
        id: string;
        group: string;
        originalSize: VisualEvidence["original_size"];
    }[];
}
export declare function ImageViewer({ image, onClose, navigation, collection }: {
    image: ImageSource;
    onClose(): void;
    navigation?: ImageNavigation;
    collection?: EvidenceCollection;
}): React.JSX.Element;
//# sourceMappingURL=ImageViewer.d.ts.map