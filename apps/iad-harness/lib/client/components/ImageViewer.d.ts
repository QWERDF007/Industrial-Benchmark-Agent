import React from "react";
import { type ImageNavigation, type ImageSource } from "./ImageCanvas.js";
export { AnnotatedImage } from "./ImageCanvas.js";
export type { ImageSource, ImageNavigation } from "./ImageCanvas.js";
export declare function ImageViewer({ image, onClose, navigation }: {
    image: ImageSource;
    onClose(): void;
    navigation?: ImageNavigation;
}): React.JSX.Element;
//# sourceMappingURL=ImageViewer.d.ts.map