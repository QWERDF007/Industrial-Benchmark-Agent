import { jsx as _jsx } from "react/jsx-runtime";
import { ImageViewer } from './ImageViewer.js';
export function ImageGalleryViewer({ images, current, onChange, navigation }) {
    const image = current === null ? undefined : images[current];
    if (!image || current === null)
        return null;
    return _jsx(ImageViewer, { image: image, onClose: () => onChange(null), navigation: navigation || (images.length > 1 ? {
            previous: current > 0, next: current < images.length - 1, busy: false, error: '', move: offset => onChange(current + offset),
        } : undefined) });
}
