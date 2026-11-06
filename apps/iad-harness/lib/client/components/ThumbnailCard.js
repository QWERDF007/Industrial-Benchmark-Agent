import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
import { AnnotatedImageStage } from './AnnotatedImageStage.js';
import { MediaImage } from './MediaLoad.js';
export const ThumbnailCard = forwardRef(function ThumbnailCard({ src, image, variant = 'thumbnail', label, children, mediaOverlay, className = '', title = label, ...props }, ref) {
    return _jsxs("button", { ...props, "data-variant": variant, ref: ref, type: "button", className: `iad-thumbnail-card ${className}`, title: title, children: [_jsxs("span", { className: "iad-thumbnail-media", children: [image ? _jsx(AnnotatedImageStage, { src: image.src, alt: image.title, width: image.width, height: image.height, annotationLayer: image.annotationLayer }) : src ? _jsx(MediaImage, { src: src, alt: label, loading: "lazy", decoding: "async" }) : _jsx("span", { children: "\u56FE\u50CF\u4E0D\u53EF\u7528" }), mediaOverlay] }), _jsx("span", { className: "iad-thumbnail-caption", children: label }), children] });
});
