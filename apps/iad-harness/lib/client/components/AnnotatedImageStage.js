import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
/**
 * Unified Annotated Image Stage.
 * Single Source of Truth for rendering an image with bounding box annotations and category badges.
 * Automatically respects the natural aspect ratio of the image, preventing distortion and coordinate shift.
 */
export function AnnotatedImageStage({ src, alt = "", width, height, bboxes = [], showAnnotations = true, className = "", style, children, onLoadDimensions, }) {
    const [naturalSize, setNaturalSize] = useState({
        width: width || 0,
        height: height || 0,
    });
    const imgW = naturalSize.width || width || 800;
    const imgH = naturalSize.height || height || 600;
    return (_jsx("div", { className: `annotated-image-stage ${className}`, style: {
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            ...style,
        }, children: _jsxs("span", { className: "preview-image-frame", style: {
                aspectRatio: `${imgW} / ${imgH}`,
                maxWidth: "100%",
                maxHeight: "100%",
                height: "100%",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }, children: [_jsx("img", { src: src, alt: alt, draggable: false, style: {
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
                    } }), showAnnotations && bboxes && bboxes.length > 0 && (_jsx("span", { className: "preview-overlay", id: "preview-overlay", children: bboxes.map((item, idx) => {
                        if (!item.bbox || item.bbox.length < 4)
                            return null;
                        const [x1, y1, x2, y2] = item.bbox;
                        const minX = Math.min(x1, x2);
                        const minY = Math.min(y1, y2);
                        const maxX = Math.max(x1, x2);
                        const maxY = Math.max(y1, y2);
                        const label = item.raw_label ? item.raw_label.replace(/^类别\s*/, "") : "";
                        return (_jsx("span", { className: "bbox", "data-label": label, "aria-hidden": "true", style: {
                                position: "absolute",
                                left: `${((minX / imgW) * 100).toFixed(3)}%`,
                                top: `${((minY / imgH) * 100).toFixed(3)}%`,
                                width: `${(((maxX - minX) / imgW) * 100).toFixed(3)}%`,
                                height: `${(((maxY - minY) / imgH) * 100).toFixed(3)}%`,
                            } }, item.annotation_id || idx));
                    }) })), children] }) }));
}
