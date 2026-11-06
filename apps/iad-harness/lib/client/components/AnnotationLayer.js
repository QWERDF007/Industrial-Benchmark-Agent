import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { MediaMask } from "./MediaLoad.js";
import { auditEvidenceUrl, mediaUrl } from "../api.js";
export function AnnotationLayer({ source, viewport, fit = "stretch" }) {
    const namespace = useId();
    const [width, height] = source.kind === "sample" ? [source.sample.width, source.sample.height]
        : source.kind === 'boxes' ? [source.width, source.height] : source.analysis.overview.original_size;
    const annotations = source.kind !== "audit" ? source.annotations.filter(annotation => annotation.geometry_status !== "INVALID") : [];
    const masks = source.kind === "sample"
        ? source.annotations.filter(annotation => annotation.geometry_status !== 'INVALID' && annotation.annotation_type === "mask").map(annotation => ({
            id: annotation.annotation_id, bbox: [0, 0, width, height],
            url: source.maskUrls?.[annotation.annotation_id] || `${mediaUrl(source.sample, "mask")}?${new URLSearchParams({ annotation_id: annotation.annotation_id, sha256: annotation.mask_sha256 || "" })}`,
        }))
        : source.kind === 'audit' ? source.analysis.auxiliary_evidence.filter(image => image.representation === "annotation_mask").map(image => ({
            id: image.evidence_id, bbox: image.crop_bbox, url: auditEvidenceUrl(source.suggestionId, image),
        })) : [];
    const [x1, y1, x2, y2] = viewport || [0, 0, width, height];
    const layer = useRef(null);
    const [labelSize, setLabelSize] = useState(12);
    useLayoutEffect(() => {
        const svg = layer.current;
        const measure = () => { const scale = Math.abs(svg.getScreenCTM()?.a || 0); if (scale)
            setLabelSize(12 / scale); };
        const observer = new ResizeObserver(measure);
        observer.observe(svg);
        measure();
        return () => observer.disconnect();
    }, [x1, y1, x2, y2, fit]);
    return _jsxs("svg", { ref: layer, className: "iad-annotation-layer", viewBox: `${x1} ${y1} ${x2 - x1} ${y2 - y1}`, preserveAspectRatio: fit === "contain" ? "xMidYMid meet" : "none", "aria-label": "Labelme \u6807\u6CE8", children: [!!masks.length && _jsx("g", { className: "iad-annotation-mask", children: masks.map((mask, index) => {
                    const maskId = `${namespace}-mask-${index}`;
                    const [x1, y1, x2, y2] = mask.bbox;
                    return _jsxs("g", { children: [_jsx("defs", { children: _jsx("mask", { id: maskId, x: 0, y: 0, width: width, height: height, maskUnits: "userSpaceOnUse", maskContentUnits: "userSpaceOnUse", style: { maskType: "luminance" }, children: _jsx(MediaMask, { href: mask.url, x: x1, y: y1, width: x2 - x1, height: y2 - y1, preserveAspectRatio: "none", style: { imageRendering: "pixelated" } }) }) }), _jsx("rect", { x: 0, y: 0, width: width, height: height, mask: `url(#${maskId})` })] }, mask.id);
                }) }), annotations.map((annotation, index) => _jsxs("g", { children: [annotation.annotation_type !== "mask" && (annotation.polygon ? _jsx("polygon", { points: annotation.polygon.map(point => point.join(",")).join(" ") })
                        : annotation.bbox && _jsx("rect", { x: annotation.bbox[0], y: annotation.bbox[1], width: annotation.bbox[2] - annotation.bbox[0], height: annotation.bbox[3] - annotation.bbox[1] })), annotation.bbox && _jsx("text", { style: { fontSize: labelSize }, x: annotation.bbox[0], y: Math.max(labelSize, annotation.bbox[1] - 4), children: annotation.raw_label })] }, annotation.annotation_id || index))] });
}
