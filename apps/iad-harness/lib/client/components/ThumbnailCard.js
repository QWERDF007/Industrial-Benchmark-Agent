import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
import { MediaImage } from './MediaLoad.js';
export const ThumbnailCard = forwardRef(function ThumbnailCard({ src, label, children, className = '', title = label, ...props }, ref) {
    return _jsxs("button", { ...props, ref: ref, type: "button", className: `iad-thumbnail-card ${className}`, title: title, children: [_jsx("span", { className: "iad-thumbnail-media", children: src ? _jsx(MediaImage, { src: src, alt: label, loading: "lazy", decoding: "async" }) : _jsx("span", { children: "\u56FE\u50CF\u4E0D\u53EF\u7528" }) }), _jsx("span", { className: "iad-thumbnail-caption", children: label }), children] });
});
