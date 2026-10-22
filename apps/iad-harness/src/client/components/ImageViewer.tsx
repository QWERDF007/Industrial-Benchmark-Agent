import React from "react";
import { Modal } from "./Modal.js";
import { ImageCanvas, type ImageNavigation, type ImageSource } from "./ImageCanvas.js";
export { AnnotatedImage } from "./ImageCanvas.js";
export type { ImageSource, ImageNavigation } from "./ImageCanvas.js";

export function ImageViewer({image, onClose, navigation}: {image: ImageSource; onClose(): void; navigation?: ImageNavigation}) {
  return <Modal title="原图检视器" className="iad-viewer-dialog" header={false} onClose={onClose}><ImageCanvas image={image} onClose={onClose} navigation={navigation} /></Modal>;
}
