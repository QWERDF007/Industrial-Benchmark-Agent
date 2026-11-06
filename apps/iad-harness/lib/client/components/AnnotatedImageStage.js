import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { AnnotationLayer } from "./AnnotationLayer.js";
/**
 * Unified Annotated Image Stage.
 * Single Source of Truth for rendering an image with bounding box annotations and category badges.
 * Automatically respects the natural aspect ratio of the image, preventing distortion and coordinate shift.
 */
export function AnnotatedImageStage({ src, alt = "", width, height, bboxes = [], annotationLayer, showAnnotations = true, className = "", style, children, onLoadDimensions, }) {
    const [naturalSize, setNaturalSize] = useState({
        width: width || 0,
        height: height || 0,
    });
    const imgW = naturalSize.width || width || 800;
    const imgH = naturalSize.height || height || 600;
    return (_jsxs("div", { className: `annotated-image-stage ${className}`, style: {
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            ...style,
        }, children: [_jsx("img", { "data-media-label": "\u56FE\u50CF", src: src, alt: alt, draggable: false, style: {
                    maxWidth: "100%",
                    maxHeight: "100%",
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                    pointerEvents: "none",
                    userSelect: "none",
                }, onLoad: (e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth && img.naturalHeight) {
                        setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                        onLoadDimensions?.({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
                    }
                } }), showAnnotations && (annotationLayer || bboxes.length > 0) && _jsx(AnnotationLayer, { fit: "contain", source: annotationLayer || { kind: 'boxes', annotations: bboxes, width: imgW, height: imgH } }), children] }));
}
