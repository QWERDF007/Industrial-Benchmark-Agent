import { jsx as _jsx } from "react/jsx-runtime";
import { Modal } from "./Modal.js";
import { ImageCanvas } from "./ImageCanvas.js";
export { AnnotatedImage } from "./ImageCanvas.js";
export function ImageViewer({ image, onClose, navigation }) {
    return _jsx(Modal, { title: "\u539F\u56FE\u68C0\u89C6\u5668", className: "iad-viewer-dialog", header: false, onClose: onClose, children: _jsx(ImageCanvas, { image: image, onClose: onClose, navigation: navigation }) });
}
